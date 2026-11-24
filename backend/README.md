# FormSaathi – Backend & AI Voice Services

FastAPI backend, AI conversational planner, deterministic normalisers, ElevenLabs multilingual TTS, and privacy guards powering **FormSaathi – A Voice-First Browser Form Agent** for **wHACKiest 2026 (Track 2: Beyond the Browser)**.

---

## 🏛️ Architecture & Component Overview

```text
Chrome Extension (Member 1)
        │
        ▼ (HTTP / JSON)
 FastAPI Application (app/main.py)
 ├── Config & Settings (app/config.py)
 ├── Schemas & Data Contracts (app/schemas.py)
 ├── Privacy Guard (app/sensitive.py) ──> Excludes sensitive IDs, secrets, passwords
 ├── Conversation Planner (app/planner.py) ──> Preserves DOM flow, resolves dependencies
 ├── Deterministic Normalisers (app/normalise.py) ──> Phone, PIN, email, date, amount, names
 ├── Fuzzy Option Matcher (app/match.py) ──> RapidFuzz, alias resolution, dropdown cleanup
 ├── LLM Extraction (app/llm.py) ──> Google Gemini with structured JSON output & delimiters
 ├── Voice Output (app/tts.py) ──> ElevenLabs multilingual v2 + SHA-256 local & S3 caching
 └── Session Store (app/session_store.py) ──> In-memory default + optional DynamoDB backing
```

### Key Engineering Principles
1. **Privacy Guard**: Sensitive fields (Aadhaar, PAN, passport, passwords, OTPs, CVV, bank account numbers) are never processed via speech recognition or sent to LLMs. They are automatically routed to a safe manual prompt.
2. **Deterministic-First Normalisation**: Runs phone, pincode, email, date, name, and option matching through fast, deterministic rules before LLM invocation to achieve low latency (< 2.5s turnaround) and prevent hallucinations.
3. **Prompt Injection Defense**: All webpage-derived strings (`label`, `help_text`, `options`) are enclosed inside strict XML delimiters (`<form_field_label>...</form_field_label>`).
4. **User Confirmation & Manual Control**: The backend never submits forms; all responses require user confirmation, and final submission is always left manually to the user.
5. **Pluggable Cloud Services**: AWS S3 and DynamoDB are optional and disabled by default for local development.

---

## ⚙️ Environment Variables (`.env`)

Create or update `backend/.env` with your credentials:

```dotenv
APP_ENV=development
HOST=0.0.0.0
PORT=8000
BASE_URL=http://localhost:8000

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# ElevenLabs Voice Synthesis
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
DEFAULT_LANGUAGE=en-IN

# Local Audio Cache
AUDIO_CACHE_DIR=.audio_cache

# AWS Integrations (Optional)
ENABLE_S3_CACHE=false
AWS_REGION=ap-south-1
S3_AUDIO_BUCKET=
DYNAMODB_SESSION_TABLE=

# CORS
CORS_ORIGINS=*
```

---

## 🚀 Local Development Setup

### 1. Create and Activate Virtual Environment
```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will be reachable at `http://localhost:8000`.  
Interactive API Docs (Swagger UI): `http://localhost:8000/docs`

### 4. Run Test Suite
```bash
python -m pytest -v
```

---

## 📡 API Endpoints & Request/Response Contracts

### 1. `GET /health`
Returns system status and readiness of AI/Voice services.

**Response:**
```json
{
  "status": "ok",
  "app": "FormSaathi Backend",
  "version": "0.1.0",
  "gemini_configured": true,
  "elevenlabs_configured": true,
  "s3_cache_enabled": false,
  "dynamodb_enabled": false
}
```

---

### 2. `POST /v1/session/start`
Initializes a session with scanned form fields and returns an ordered sequence plan with the first question.

**Request:**
```json
{
  "url": "https://scholarships.gov.in/apply",
  "title": "National Merit Scholarship 2026",
  "language": "en-IN",
  "fields": [
    {
      "id": "f_name",
      "label": "Applicant Full Name",
      "semantic_type": "name",
      "required": true
    },
    {
      "id": "f_phone",
      "label": "Mobile Number",
      "semantic_type": "phone",
      "required": true
    },
    {
      "id": "f_aadhaar",
      "label": "Aadhaar Card Number",
      "required": true
    }
  ]
}
```

**Response:**
```json
{
  "session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "total_fields": 3,
  "fields_plan": ["f_name", "f_phone", "f_aadhaar"],
  "message": "Started session for 3 fields.",
  "first_question": {
    "field_id": "f_name",
    "text": "What is your full name?",
    "audio_url": "http://localhost:8000/v1/audio/a4b8...mp3",
    "expects": "name",
    "sensitive": false,
    "group_id": null,
    "options": null
  }
}
```

---

### 3. `POST /v1/session/{session_id}/next-question`
Generates the natural spoken question in the requested language (`en-IN`, `hi-IN`, `kn-IN`). If the field is sensitive, provides a safe manual-entry prompt.

**Request:**
```json
{
  "field": {
    "id": "f_dob",
    "label": "Date of Birth",
    "semantic_type": "date",
    "input_type": "date"
  },
  "language": "kn-IN",
  "history_summary": "Name and phone filled."
}
```

**Response:**
```json
{
  "field_id": "f_dob",
  "text": "ನಿಮ್ಮ ಹುಟ್ಟಿದ ದಿನಾಂಕ ಯಾವುದು?",
  "audio_url": "http://localhost:8000/v1/audio/9c1a...mp3",
  "expects": "date",
  "sensitive": false,
  "group_id": null,
  "options": null
}
```

---

### 4. `POST /v1/session/{session_id}/answer`
Interprets spoken voice transcripts or typed responses.

**Request (Spoken Date):**
```json
{
  "field_id": "f_dob",
  "transcript": "15th August 1995",
  "language": "en-IN",
  "field": {
    "id": "f_dob",
    "label": "Date of Birth",
    "semantic_type": "date",
    "input_type": "date"
  }
}
```

**Response:**
```json
{
  "field_id": "f_dob",
  "value": "1995-08-15",
  "display": "15 August 1995",
  "confidence": 0.97,
  "needs_confirmation": true,
  "issues": [],
  "action": "fill"
}
```

**Request (Voice Command):**
```json
{
  "field_id": "f_alt_phone",
  "transcript": "skip this question",
  "language": "en-IN",
  "field": {
    "id": "f_alt_phone",
    "label": "Alternative Phone"
  }
}
```

**Response:**
```json
{
  "field_id": "f_alt_phone",
  "value": null,
  "display": "Skipped",
  "confidence": 1.0,
  "needs_confirmation": false,
  "issues": [],
  "action": "skip"
}
```

**Request (Sensitive Protection Triggered):**
```json
{
  "field_id": "f_aadhaar",
  "transcript": "1234 5678 9012",
  "language": "en-IN",
  "field": {
    "id": "f_aadhaar",
    "label": "Aadhaar Card Number"
  }
}
```

**Response:**
```json
{
  "field_id": "f_aadhaar",
  "value": null,
  "display": null,
  "confidence": 1.0,
  "needs_confirmation": false,
  "issues": ["Field is private. Please enter it manually in the webpage."],
  "action": "manual"
}
```

---

### 5. `POST /v1/session/{session_id}/explain-error`
Explains client-side DOM validation errors in simple spoken language.

**Request:**
```json
{
  "field_id": "f_email",
  "error_message": "Please enter a valid email address.",
  "language": "en-IN",
  "current_value": "rahul.gmail.com",
  "field": {
    "id": "f_email",
    "label": "Email Address",
    "semantic_type": "email"
  }
}
```

**Response:**
```json
{
  "field_id": "f_email",
  "explanation": "The value 'rahul.gmail.com' does not match the expected format for Email Address.",
  "text": "The value 'rahul.gmail.com' does not match the expected format for Email Address.",
  "audio_url": "http://localhost:8000/v1/audio/f712...mp3",
  "suggested_action": "Please speak or type the full value again, such as user@example.com."
}
```

---

### 6. `POST /v1/session/{session_id}/review-summary`
Generates a complete pre-submission summary before the user manually submits the form.

**Request:**
```json
{
  "language": "en-IN",
  "fields": [
    { "id": "f1", "label": "Full Name", "value": "Yuktha Prakash", "required": true },
    { "id": "f2", "label": "Alternative Phone", "value": null, "required": false },
    { "id": "f3", "label": "Aadhaar Number", "value": null, "required": true }
  ]
}
```

**Response:**
```json
{
  "total_fields": 3,
  "filled_count": 1,
  "skipped_count": 1,
  "sensitive_count": 1,
  "summary_text": "We have completed 1 out of 3 fields. 1 were skipped, and 1 private field requires your manual entry. Please review the form carefully and click Submit yourself when ready.",
  "audio_url": "http://localhost:8000/v1/audio/3c1e...mp3",
  "fields_summary": [
    { "field_id": "f1", "label": "Full Name", "value": "Yuktha Prakash", "display": "Yuktha Prakash", "status": "filled", "required": true },
    { "field_id": "f2", "label": "Alternative Phone", "value": null, "display": "Skipped", "status": "skipped", "required": false },
    { "field_id": "f3", "label": "Aadhaar Number", "value": null, "display": "Private (Manual)", "status": "sensitive_manual", "required": true }
  ]
}
```

---

### 7. `GET /v1/audio/{filename}`
Streams cached ElevenLabs `.mp3` audio files with `Content-Type: audio/mpeg`.
