import re
from typing import Optional
from app.schemas import FormField

SENSITIVE_SEMANTIC_TYPES = {"password", "otp", "captcha"}
SENSITIVE_AUTOCOMPLETE_VALUES = {"cc-number", "cc-csc", "one-time-code", "current-password", "new-password"}

# Keywords matching sensitive Indian IDs, credentials, or financial numbers
SENSITIVE_KEYWORD_PATTERN = re.compile(
    r"\b(aadhaar|aadhar|uidai|pan|pancard|passport|driving\s*licen[sc]e|dl\s*no|voter\s*id|"
    r"bank\s*account|bank\s*acc|account\s*no|account\s*number|card\s*number|credit\s*card|debit\s*card|cvv|cvc|pin|upi\s*pin|otp|password|secret|ssn)\b",
    re.IGNORECASE
)

# Safe manual prompts by language
SAFE_MANUAL_PROMPTS = {
    "en-IN": "This one is private. Please type it yourself, then press Next.",
    "hi-IN": "यह जानकारी निजी है। कृपया इसे स्वयं टाइप करें, फिर आगे बढ़ें।",
    "kn-IN": "ಇದು ಖಾಸಗಿ ಮಾಹಿತಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ನೀವೇ ಟೈಪ್ ಮಾಡಿ, ನಂತರ ಮುಂದಕ್ಕೆ ಹೋಗಿ.",
}


def is_sensitive_field(field: FormField) -> bool:
    """
    Checks if a given field is sensitive and must not be processed via speech/LLM.
    Strictly flags:
    1. input_type == 'password'
    2. semantic_type in {'password', 'otp', 'captcha'}
    3. autocomplete in {'cc-number', 'cc-csc', 'one-time-code', ...}
    4. explicit sensitive == True
    5. label, name, or id matching IDs/secrets (Aadhaar, PAN, Passport, Bank, Card, CVV, PIN, OTP, Password)
    """
    if field.sensitive is True:
        return True

    if field.input_type and field.input_type.strip().lower() == "password":
        return True

    if field.semantic_type and field.semantic_type.strip().lower() in SENSITIVE_SEMANTIC_TYPES:
        return True

    if field.autocomplete and field.autocomplete.strip().lower() in SENSITIVE_AUTOCOMPLETE_VALUES:
        return True

    # Check text fields: label, name, id, help_text
    search_target = " ".join(
        filter(
            None,
            [
                field.label or "",
                field.name or "",
                field.id or "",
                field.help_text or "",
                field.placeholder or "",
            ],
        )
    )

    if SENSITIVE_KEYWORD_PATTERN.search(search_target):
        return True

    return False


def get_sensitive_prompt(field: FormField, language: str = "en-IN") -> str:
    """Returns a privacy-safe prompt instructing the user to manually enter the value."""
    base_lang = language.split("-")[0].lower() if language else "en"
    if base_lang == "hi":
        return SAFE_MANUAL_PROMPTS["hi-IN"]
    if base_lang == "kn":
        return SAFE_MANUAL_PROMPTS["kn-IN"]
    return SAFE_MANUAL_PROMPTS["en-IN"]


def mask_sensitive_value(val: Optional[str]) -> str:
    """Masks sensitive values for safe logging/display if ever needed."""
    if not val:
        return ""
    val_str = str(val)
    if len(val_str) <= 4:
        return "****"
    return "*" * (len(val_str) - 4) + val_str[-4:]
