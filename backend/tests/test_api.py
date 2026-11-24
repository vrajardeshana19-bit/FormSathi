import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["app"] == "FormSaathi Backend"
    assert "version" in data


def test_session_start_and_first_question():
    payload = {
        "url": "https://scholarships.gov.in/apply",
        "title": "National Merit Scholarship 2026",
        "language": "en-IN",
        "fields": [
            {
                "id": "f_name",
                "label": "Applicant Full Name",
                "semantic_type": "name",
                "required": True
            },
            {
                "id": "f_email",
                "label": "Email Address",
                "semantic_type": "email",
                "required": True
            },
            {
                "id": "f_aadhaar",
                "label": "Aadhaar Number",
                "required": True
            }
        ]
    }

    resp = client.post("/v1/session/start", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert data["total_fields"] == 3
    assert len(data["fields_plan"]) == 3
    assert data["first_question"] is not None
    assert data["first_question"]["field_id"] == "f_name"
    assert "name" in data["first_question"]["text"].lower()


def test_next_question_sensitive_handling():
    session_id = "test-session-123"
    payload = {
        "field": {
            "id": "aadhaar_field",
            "label": "Aadhaar Card Number",
            "required": True
        },
        "language": "en-IN"
    }

    resp = client.post(f"/v1/session/{session_id}/next-question", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["field_id"] == "aadhaar_field"
    assert data["sensitive"] is True
    assert data["expects"] == "manual_private"
    assert "private" in data["text"].lower()


def test_answer_endpoint_deterministic_normalisation():
    session_id = "test-session-123"

    # 1. Phone normalisation
    phone_payload = {
        "field_id": "f_phone",
        "transcript": "nine eight seven six five four three two one zero",
        "language": "en-IN",
        "field": {
            "id": "f_phone",
            "label": "Mobile Number",
            "semantic_type": "phone"
        }
    }
    resp = client.post(f"/v1/session/{session_id}/answer", json=phone_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["value"] == "9876543210"
    assert data["confidence"] >= 0.9

    # 2. Email normalisation
    email_payload = {
        "field_id": "f_email",
        "transcript": "yuktha dot prakash at gmail dot com",
        "language": "en-IN",
        "field": {
            "id": "f_email",
            "label": "Email Address",
            "semantic_type": "email"
        }
    }
    resp = client.post(f"/v1/session/{session_id}/answer", json=email_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["value"] == "yuktha.prakash@gmail.com"

    # 3. Option matching
    option_payload = {
        "field_id": "f_state",
        "transcript": "KARNATAKA - 29",
        "language": "en-IN",
        "field": {
            "id": "f_state",
            "label": "State",
            "options": ["Karnataka", "Maharashtra", "Delhi"]
        }
    }
    resp = client.post(f"/v1/session/{session_id}/answer", json=option_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["value"] == "Karnataka"


def test_answer_endpoint_command_handling():
    session_id = "test-session-123"

    # Skip command
    skip_payload = {
        "field_id": "f_optional",
        "transcript": "skip this question",
        "language": "en-IN",
        "field": {
            "id": "f_optional",
            "label": "Secondary Phone Number"
        }
    }
    resp = client.post(f"/v1/session/{session_id}/answer", json=skip_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "skip"
    assert data["needs_confirmation"] is False


def test_answer_endpoint_sensitive_rejection():
    session_id = "test-session-123"

    sensitive_payload = {
        "field_id": "f_aadhaar",
        "transcript": "my aadhaar is 1234 5678 9012",
        "language": "en-IN",
        "field": {
            "id": "f_aadhaar",
            "label": "Aadhaar Number"
        }
    }
    resp = client.post(f"/v1/session/{session_id}/answer", json=sensitive_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "manual"
    assert data["value"] is None
    assert "private" in data["issues"][0].lower()


def test_explain_error_endpoint():
    session_id = "test-session-123"
    payload = {
        "field_id": "f_email",
        "error_message": "Invalid email address format",
        "field": {
            "id": "f_email",
            "label": "Email Address",
            "semantic_type": "email"
        },
        "language": "en-IN",
        "current_value": "not_an_email"
    }

    resp = client.post(f"/v1/session/{session_id}/explain-error", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["field_id"] == "f_email"
    assert "explanation" in data
    assert "suggested_action" in data


def test_review_summary_endpoint():
    session_id = "test-session-123"
    payload = {
        "language": "en-IN",
        "fields": [
            {
                "id": "f1",
                "label": "Full Name",
                "value": "Yuktha Prakash",
                "required": True
            },
            {
                "id": "f2",
                "label": "Optional Alternate Email",
                "value": None,
                "required": False
            },
            {
                "id": "f3",
                "label": "Aadhaar Number",
                "value": None,
                "required": True
            }
        ]
    }

    resp = client.post(f"/v1/session/{session_id}/review-summary", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_fields"] == 3
    assert data["filled_count"] == 1
    assert data["skipped_count"] == 1
    assert data["sensitive_count"] == 1
    assert "summary_text" in data
    assert len(data["fields_summary"]) == 3
    assert data["fields_summary"][2]["status"] == "sensitive_manual"


def test_audio_endpoint_404():
    resp = client.get("/v1/audio/non_existent_file.mp3")
    assert resp.status_code == 404
