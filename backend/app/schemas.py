from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class FormField(BaseModel):
    id: str = Field(..., description="Unique DOM/scanner field identifier")
    name: Optional[str] = Field(None, description="HTML name attribute")
    label: str = Field(..., description="Visible label or aria-label for the field")
    input_type: Optional[str] = Field("text", description="HTML input type or tag: text, email, tel, number, date, select, radio, checkbox, textarea, password")
    semantic_type: Optional[str] = Field("text", description="Semantic role: name, first_name, last_name, email, phone, date, dob, pincode, number, percentage, amount, gender, yes_no, select, radio, checkbox, password, otp, captcha, address, other")
    required: bool = Field(False, description="Whether field is required")
    placeholder: Optional[str] = Field(None, description="Placeholder text")
    help_text: Optional[str] = Field(None, description="Instructional or hint text nearby")
    options: Optional[List[str]] = Field(None, description="Dropdown/radio/checkbox options")
    autocomplete: Optional[str] = Field(None, description="HTML autocomplete attribute")
    pattern: Optional[str] = Field(None, description="Regex validation pattern")
    min: Optional[Union[str, float]] = Field(None, description="Min value or minlength")
    max: Optional[Union[str, float]] = Field(None, description="Max value or maxlength")
    sensitive: Optional[bool] = Field(None, description="Explicit sensitivity override")
    depends_on: Optional[str] = Field(None, description="Field id this field depends on")
    group_id: Optional[str] = Field(None, description="Visual/logical grouping identifier")
    value: Optional[Any] = Field(None, description="Current or filled value")


class SessionStartRequest(BaseModel):
    url: Optional[str] = Field(None, description="URL of the form page")
    title: Optional[str] = Field(None, description="Webpage or form title")
    language: str = Field("en-IN", description="Preferred spoken language (e.g. en-IN, hi-IN, kn-IN)")
    fields: List[FormField] = Field(default_factory=list, description="Scanned form fields")


class NextQuestionRequest(BaseModel):
    field: FormField = Field(..., description="Field to ask question for")
    language: str = Field("en-IN", description="Target language (e.g. en-IN, hi-IN, kn-IN)")
    history_summary: Optional[str] = Field(None, description="Summary of previously completed fields")
    plan: Optional[List[str]] = Field(None, description="Optional updated field sequence")


class NextQuestionResponse(BaseModel):
    field_id: str
    text: str = Field(..., description="Spoken question in target language")
    audio_url: Optional[str] = Field(None, description="URL to playable audio stream or file")
    expects: str = Field(..., description="Expected input type (text, number, date, option, manual_private, etc.)")
    sensitive: bool = Field(False, description="Whether field requires manual private entry")
    group_id: Optional[str] = Field(None, description="Grouping identifier if part of a group")
    options: Optional[List[str]] = Field(None, description="Sanitized options for choice fields")


class AnswerRequest(BaseModel):
    field_id: str = Field(..., description="Field identifier being answered")
    transcript: str = Field(..., description="Spoken transcript or typed input")
    language: str = Field("en-IN", description="Language used for transcription")
    field: FormField = Field(..., description="Field metadata")


class AnswerResponse(BaseModel):
    field_id: str
    value: Optional[Any] = Field(None, description="Cleaned/normalised value to inject into DOM")
    display: Optional[str] = Field(None, description="User-friendly text to read back for confirmation")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    needs_confirmation: bool = Field(True, description="Whether user must confirm before DOM filling")
    issues: List[str] = Field(default_factory=list, description="Validation warnings, ambiguity notes, or errors")
    action: Optional[str] = Field("fill", description="Next suggested action: fill, confirm, retry, manual, skip, back, repeat, stop")


class ExplainErrorRequest(BaseModel):
    field_id: str
    error_message: str = Field(..., description="Validation error from DOM or browser")
    field: FormField
    language: str = Field("en-IN", description="Target language")
    current_value: Optional[Any] = Field(None, description="Current value entered in field")


class ExplainErrorResponse(BaseModel):
    field_id: str
    explanation: str = Field(..., description="Friendly explanation of why the input was rejected")
    text: str = Field(..., description="Same friendly explanation for audio generation")
    audio_url: Optional[str] = None
    suggested_action: str = Field(..., description="What the user should say or do next")


class FieldSummaryItem(BaseModel):
    field_id: str
    label: str
    value: Optional[Any] = None
    display: Optional[str] = None
    status: str = Field("filled", description="filled, skipped, sensitive_manual, pending")
    required: bool = False


class ReviewSummaryRequest(BaseModel):
    language: str = Field("en-IN", description="Target language")
    fields: Optional[List[FormField]] = Field(None, description="Optional override list of form fields with current values")


class ReviewSummaryResponse(BaseModel):
    total_fields: int
    filled_count: int
    skipped_count: int
    sensitive_count: int
    summary_text: str
    audio_url: Optional[str] = None
    fields_summary: List[FieldSummaryItem] = Field(default_factory=list)


class SessionStartResponse(BaseModel):
    session_id: str
    total_fields: int
    fields_plan: List[str] = Field(default_factory=list, description="Ordered field IDs to complete")
    message: str
    first_question: Optional[NextQuestionResponse] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    app: str = "formsaathi-backend"
    version: str = "0.1.0"
    gemini_configured: bool = False
    elevenlabs_configured: bool = False
    s3_cache_enabled: bool = False
    dynamodb_enabled: bool = False
