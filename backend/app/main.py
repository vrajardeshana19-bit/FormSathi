import logging
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Path as FPath
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.llm import (
    explain_validation_error,
    generate_question_prompt,
    generate_review_summary_text,
    interpret_answer_with_llm,
)
from app.match import match_option
from app.normalise import (
    normalise_date,
    normalise_email,
    normalise_gender,
    normalise_name,
    normalise_number_or_amount,
    normalise_phone,
    normalise_pincode,
    normalise_yes_no,
)
from app.planner import create_form_plan, find_target_field_by_query, parse_user_command
from app.schemas import (
    AnswerRequest,
    AnswerResponse,
    ExplainErrorRequest,
    ExplainErrorResponse,
    FieldSummaryItem,
    FormField,
    HealthResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    ReviewSummaryRequest,
    ReviewSummaryResponse,
    SessionStartRequest,
    SessionStartResponse,
)
from app.sensitive import get_sensitive_prompt, is_sensitive_field
from app.session_store import SessionData, session_store
from app.tts import synthesize_speech

# Configure application logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("formsaathi.main")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FormSaathi Backend API – Voice-First Browser Form Assistant"
)

# CORS setup: allows Chrome extension requests and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^chrome-extension://[a-z]{32}$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Returns application health and configuration readiness."""
    gemini_ready = bool(settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_"))
    elevenlabs_ready = bool(settings.ELEVENLABS_API_KEY and not settings.ELEVENLABS_API_KEY.startswith("your_"))
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        gemini_configured=gemini_ready,
        elevenlabs_configured=elevenlabs_ready,
        s3_cache_enabled=bool(settings.ENABLE_S3_CACHE and settings.S3_AUDIO_BUCKET),
        dynamodb_enabled=bool(settings.DYNAMODB_SESSION_TABLE)
    )


@app.post("/v1/session/start", response_model=SessionStartResponse, tags=["Session"])
async def start_session(req: SessionStartRequest):
    """
    Initializes a new form-filling session:
    - Analyzes scanned fields and plans the conversational sequence.
    - Generates the first question and audio.
    - Handles sensitive initial fields safely.
    """
    session_id = str(uuid.uuid4())
    fields_plan = create_form_plan(req.fields)

    session_data = SessionData(
        session_id=session_id,
        url=req.url,
        title=req.title,
        language=req.language,
        fields=req.fields,
        fields_plan=fields_plan,
    )
    session_store.create(session_data)

    first_question: Optional[NextQuestionResponse] = None
    if fields_plan:
        first_fid = fields_plan[0]
        first_field = session_data.fields[first_fid]
        first_is_sensitive = is_sensitive_field(first_field)

        if first_is_sensitive:
            text = get_sensitive_prompt(first_field, req.language)
            expects = "manual_private"
        else:
            text, expects = await generate_question_prompt(first_field, req.language)

        audio_url = await synthesize_speech(text, req.language)
        first_question = NextQuestionResponse(
            field_id=first_fid,
            text=text,
            audio_url=audio_url,
            expects=expects,
            sensitive=first_is_sensitive,
            group_id=first_field.group_id,
            options=first_field.options
        )

    welcome_msg = f"Started session for {len(req.fields)} fields."
    return SessionStartResponse(
        session_id=session_id,
        total_fields=len(req.fields),
        fields_plan=fields_plan,
        message=welcome_msg,
        first_question=first_question
    )


@app.post("/v1/session/{session_id}/next-question", response_model=NextQuestionResponse, tags=["Session"])
async def next_question(
    session_id: str = FPath(..., description="Active session ID"),
    req: NextQuestionRequest = ...
):
    """
    Generates the spoken question for the requested or current form field.
    Includes privacy check and ElevenLabs speech synthesis.
    """
    field = req.field
    field_is_sensitive = is_sensitive_field(field)

    if field_is_sensitive:
        text = get_sensitive_prompt(field, req.language)
        expects = "manual_private"
    else:
        text, expects = await generate_question_prompt(
            field=field,
            language=req.language,
            history_summary=req.history_summary
        )

    audio_url = await synthesize_speech(text, req.language)

    return NextQuestionResponse(
        field_id=field.id,
        text=text,
        audio_url=audio_url,
        expects=expects,
        sensitive=field_is_sensitive,
        group_id=field.group_id,
        options=field.options
    )


@app.post("/v1/session/{session_id}/answer", response_model=AnswerResponse, tags=["Session"])
async def answer_field(
    session_id: str = FPath(..., description="Active session ID"),
    req: AnswerRequest = ...
):
    """
    Processes spoken or typed answers:
    1. Detects voice commands (repeat, skip, back, stop, explain, change).
    2. Enforces privacy guard (sensitive fields rejected from AI processing).
    3. Runs deterministic normalisers & rapidfuzz option matching first.
    4. Falls back to Gemini structured extraction for complex/open-ended fields.
    """
    field = req.field
    transcript = req.transcript.strip()

    # 1. Command detection
    command = parse_user_command(transcript)
    if command:
        cmd_name, cmd_arg = command
        if cmd_name == "skip":
            return AnswerResponse(
                field_id=field.id,
                value=None,
                display="Skipped",
                confidence=1.0,
                needs_confirmation=False,
                issues=[],
                action="skip"
            )
        elif cmd_name == "repeat":
            return AnswerResponse(
                field_id=field.id,
                value=None,
                display=None,
                confidence=1.0,
                needs_confirmation=False,
                issues=[],
                action="repeat"
            )
        elif cmd_name == "back":
            return AnswerResponse(
                field_id=field.id,
                value=None,
                display=None,
                confidence=1.0,
                needs_confirmation=False,
                issues=[],
                action="back"
            )
        elif cmd_name == "stop":
            return AnswerResponse(
                field_id=field.id,
                value=None,
                display=None,
                confidence=1.0,
                needs_confirmation=False,
                issues=[],
                action="stop"
            )
        elif cmd_name == "explain":
            return AnswerResponse(
                field_id=field.id,
                value=None,
                display=None,
                confidence=1.0,
                needs_confirmation=False,
                issues=[],
                action="explain"
            )
        elif cmd_name == "change":
            # Find target field
            target_id = None
            session = session_store.get(session_id)
            if session and cmd_arg:
                target_id = find_target_field_by_query(cmd_arg, list(session.fields.values()))
            return AnswerResponse(
                field_id=target_id or field.id,
                value=None,
                display=None,
                confidence=1.0,
                needs_confirmation=False,
                issues=[],
                action="change"
            )

    # 2. Privacy Guard: Sensitive field check
    if is_sensitive_field(field):
        return AnswerResponse(
            field_id=field.id,
            value=None,
            display=None,
            confidence=1.0,
            needs_confirmation=False,
            issues=["Field is private. Please enter it manually in the webpage."],
            action="manual"
        )

    # 3. Deterministic Normalisation (runs before LLM)
    sem = (field.semantic_type or "").lower()
    in_type = (field.input_type or "").lower()
    label_lower = field.label.lower()

    # Options (select, radio, checkbox, or options present)
    if field.options and len(field.options) > 0:
        val, disp, conf, issues = match_option(transcript, field.options)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Phone / Tel
    if sem in {"phone", "tel", "mobile"} or in_type == "tel" or "phone" in label_lower or "mobile" in label_lower:
        val, disp, conf, issues = normalise_phone(transcript)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Pincode / Postal
    if sem in {"pincode", "postal_code", "zip"} or "pincode" in label_lower or "pin code" in label_lower or "postal" in label_lower:
        val, disp, conf, issues = normalise_pincode(transcript)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Email
    if sem == "email" or in_type == "email" or "email" in label_lower:
        val, disp, conf, issues = normalise_email(transcript)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Date / DOB
    if sem in {"date", "dob"} or in_type == "date" or "birth" in label_lower or "date" in label_lower:
        val, disp, conf, issues = normalise_date(transcript, field)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Gender
    if sem == "gender" or "gender" in label_lower or "sex" in label_lower:
        val, disp, conf, issues = normalise_gender(transcript)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Yes / No
    if sem == "yes_no" or sem == "boolean":
        val, disp, conf, issues = normalise_yes_no(transcript)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Numbers / Amount / Percentage
    if sem in {"number", "amount", "percentage"} or in_type == "number" or "income" in label_lower or "marks" in label_lower:
        val, disp, conf, issues = normalise_number_or_amount(transcript, is_percentage=(sem == "percentage"))
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # Names
    if sem in {"name", "first_name", "last_name", "full_name"} or "name" in label_lower:
        val, disp, conf, issues = normalise_name(transcript)
        if val is not None:
            return AnswerResponse(
                field_id=field.id,
                value=val,
                display=disp,
                confidence=conf,
                needs_confirmation=True,
                issues=issues,
                action="fill"
            )

    # 4. LLM fallback for open-ended, address, or complex fields
    llm_result = await interpret_answer_with_llm(field, transcript, req.language)
    return AnswerResponse(
        field_id=field.id,
        value=llm_result.get("value"),
        display=llm_result.get("display"),
        confidence=llm_result.get("confidence", 0.7),
        needs_confirmation=llm_result.get("needs_confirmation", True),
        issues=llm_result.get("issues", []),
        action=llm_result.get("action", "fill")
    )


@app.post("/v1/session/{session_id}/explain-error", response_model=ExplainErrorResponse, tags=["Session"])
async def explain_error(
    session_id: str = FPath(..., description="Active session ID"),
    req: ExplainErrorRequest = ...
):
    """
    Explains client-side validation errors in simple spoken language
    and generates TTS audio to guide user correction.
    """
    res = await explain_validation_error(
        field=req.field,
        error_message=req.error_message,
        current_value=req.current_value,
        language=req.language
    )

    audio_url = await synthesize_speech(res["explanation"], req.language)

    return ExplainErrorResponse(
        field_id=req.field_id,
        explanation=res["explanation"],
        text=res["explanation"],
        audio_url=audio_url,
        suggested_action=res["suggested_action"]
    )


@app.post("/v1/session/{session_id}/review-summary", response_model=ReviewSummaryResponse, tags=["Session"])
async def review_summary(
    session_id: str = FPath(..., description="Active session ID"),
    req: ReviewSummaryRequest = ...
):
    """
    Provides a comprehensive pre-submission review:
    Tallies filled, skipped, and sensitive fields, generates an encouraging
    spoken summary, and leaves final form submission strictly to the user.
    """
    fields_list = req.fields
    session = session_store.get(session_id)

    if not fields_list and session:
        fields_list = list(session.fields.values())
    elif not fields_list:
        fields_list = []

    total_count = len(fields_list)
    filled_count = 0
    skipped_count = 0
    sensitive_count = 0
    items: List[FieldSummaryItem] = []

    for f in fields_list:
        is_sens = is_sensitive_field(f)
        status = "pending"
        val = f.value

        if is_sens:
            sensitive_count += 1
            status = "sensitive_manual"
        elif val is not None and str(val).strip() != "":
            filled_count += 1
            status = "filled"
        else:
            skipped_count += 1
            status = "skipped"

        items.append(
            FieldSummaryItem(
                field_id=f.id,
                label=f.label,
                value=val if not is_sens else None,
                display=str(val) if val is not None and not is_sens else ("Private (Manual)" if is_sens else "Skipped"),
                status=status,
                required=f.required
            )
        )

    summary_text = await generate_review_summary_text(
        total=total_count,
        filled=filled_count,
        skipped=skipped_count,
        sensitive=sensitive_count,
        language=req.language
    )

    audio_url = await synthesize_speech(summary_text, req.language)

    return ReviewSummaryResponse(
        total_fields=total_count,
        filled_count=filled_count,
        skipped_count=skipped_count,
        sensitive_count=sensitive_count,
        summary_text=summary_text,
        audio_url=audio_url,
        fields_summary=items
    )


@app.get("/v1/audio/{filename}", tags=["Audio"])
async def get_audio_file(filename: str):
    """Serves cached MP3 speech audio files."""
    # Sanitize filename
    safe_name = Path(filename).name
    file_path = Path(settings.AUDIO_CACHE_DIR) / safe_name

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(path=file_path, media_type="audio/mpeg", filename=safe_name)
