import pytest
from app.schemas import FormField
from app.sensitive import get_sensitive_prompt, is_sensitive_field, mask_sensitive_value


def test_password_field_flagged():
    f1 = FormField(id="pwd", label="Account Password", input_type="password")
    assert is_sensitive_field(f1) is True

    f2 = FormField(id="f2", label="Code", semantic_type="password")
    assert is_sensitive_field(f2) is True


def test_otp_and_captcha_flagged():
    f_otp = FormField(id="otp1", label="Enter OTP", semantic_type="otp")
    assert is_sensitive_field(f_otp) is True

    f_captcha = FormField(id="c1", label="Captcha Text", semantic_type="captcha")
    assert is_sensitive_field(f_captcha) is True


def test_autocomplete_sensitive_flagged():
    f_card = FormField(id="card", label="Payment Card", autocomplete="cc-number")
    assert is_sensitive_field(f_card) is True

    f_cvv = FormField(id="cvv", label="Security Code", autocomplete="cc-csc")
    assert is_sensitive_field(f_cvv) is True


def test_explicit_sensitive_flagged():
    f = FormField(id="custom", label="Family Secret", sensitive=True)
    assert is_sensitive_field(f) is True


def test_indian_id_keywords_flagged():
    # Aadhaar variations
    assert is_sensitive_field(FormField(id="a1", label="Aadhaar Card Number")) is True
    assert is_sensitive_field(FormField(id="a2", label="Aadhar No")) is True
    assert is_sensitive_field(FormField(id="a3", label="UIDAI Identity")) is True

    # PAN Card
    assert is_sensitive_field(FormField(id="p1", label="PAN Number")) is True
    assert is_sensitive_field(FormField(id="p2", label="Permanent Account Number (PAN Card)")) is True

    # Passport & DL
    assert is_sensitive_field(FormField(id="pass1", label="Passport Number")) is True
    assert is_sensitive_field(FormField(id="dl1", label="Driving Licence Number")) is True
    assert is_sensitive_field(FormField(id="dl2", label="Driving License No")) is True

    # Bank Account & PINs
    assert is_sensitive_field(FormField(id="b1", label="Bank Account Number")) is True
    assert is_sensitive_field(FormField(id="pin1", label="UPI PIN")) is True
    assert is_sensitive_field(FormField(id="cvv1", label="Card CVV")) is True


def test_non_sensitive_fields_not_flagged():
    assert is_sensitive_field(FormField(id="name", label="Full Name", semantic_type="name")) is False
    assert is_sensitive_field(FormField(id="email", label="Email Address", semantic_type="email")) is False
    assert is_sensitive_field(FormField(id="phone", label="Mobile Number", semantic_type="phone")) is False
    assert is_sensitive_field(FormField(id="state", label="State of Residence", options=["Karnataka", "Delhi"])) is False
    assert is_sensitive_field(FormField(id="course", label="Selected Course")) is False


def test_safe_manual_prompts():
    field = FormField(id="aadhaar", label="Aadhaar Number")
    prompt_en = get_sensitive_prompt(field, "en-IN")
    assert "private" in prompt_en.lower()

    prompt_hi = get_sensitive_prompt(field, "hi-IN")
    assert "निजी" in prompt_hi

    prompt_kn = get_sensitive_prompt(field, "kn-IN")
    assert "ಖಾಸಗಿ" in prompt_kn


def test_mask_sensitive_value():
    assert mask_sensitive_value("123456789012") == "********9012"
    assert mask_sensitive_value("1234") == "****"
    assert mask_sensitive_value("") == ""
