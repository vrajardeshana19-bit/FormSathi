import pytest
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
from app.schemas import FormField


def test_normalise_phone_valid():
    # Direct digits
    val, disp, conf, issues = normalise_phone("9876543210")
    assert val == "9876543210"
    assert "+91 98765 43210" in disp
    assert conf >= 0.9

    # Spoken English
    val, disp, conf, issues = normalise_phone("nine eight four five zero one two three four five")
    assert val == "9845012345"

    # Multipliers ("double nine", "triple five")
    val, disp, conf, issues = normalise_phone("double nine eight seven triple five four three two")
    assert val == "9987555432"

    # Leading +91 or 0
    val, _, _, _ = normalise_phone("+91 9876543210")
    assert val == "9876543210"
    val, _, _, _ = normalise_phone("09876543210")
    assert val == "9876543210"


def test_normalise_phone_invalid():
    # Less than 10 digits
    val, _, conf, issues = normalise_phone("98765")
    assert val is None
    assert conf < 0.5


def test_normalise_pincode_valid():
    val, disp, conf, issues = normalise_pincode("560001")
    assert val == "560001"
    assert conf >= 0.9

    # Spoken words
    val, _, _, _ = normalise_pincode("five six zero zero zero one")
    assert val == "560001"

    # Embedded in sentence
    val, _, _, _ = normalise_pincode("My pincode is 560034 in Koramangala")
    assert val == "560034"


def test_normalise_pincode_invalid():
    # Cannot start with 0
    val, _, _, issues = normalise_pincode("012345")
    assert val is None

    # Too short
    val, _, _, _ = normalise_pincode("5600")
    assert val is None


def test_normalise_email_valid():
    val, disp, conf, issues = normalise_email("rahul at the rate of gmail dot com")
    assert val == "rahul@gmail.com"

    val, _, _, _ = normalise_email("john.doe at yahoo dot co")
    assert val == "john.doe@yahoo.com"

    val, _, _, _ = normalise_email("my email is priya.sharma at gmail dot com")
    assert val == "priya.sharma@gmail.com"


def test_normalise_email_invalid():
    val, _, _, issues = normalise_email("just a random sentence without address")
    assert val is None


def test_normalise_date_spoken():
    # Spoken English
    val, disp, conf, _ = normalise_date("15th August 1995")
    assert val == "15/08/1995"
    assert "15 August 1995" in disp

    # ISO field preference
    field_date = FormField(id="dob", label="Date of Birth", input_type="date")
    val_iso, _, _, _ = normalise_date("15th August 1995", field=field_date)
    assert val_iso == "1995-08-15"

    # Numeric date 15/08/1995
    val, _, _, _ = normalise_date("15-08-1995")
    assert val == "15/08/1995"


def test_normalise_number_and_amount():
    # Lakh multiplier
    val, disp, conf, _ = normalise_number_or_amount("2.5 lakh")
    assert val == 250000

    # Words with crore
    val, _, _, _ = normalise_number_or_amount("five crore")
    assert val == 50000000

    # Percentage
    val, disp, _, _ = normalise_number_or_amount("75 percent")
    assert "75%" in str(val)

    # Word numbers
    val, _, _, _ = normalise_number_or_amount("twenty five thousand")
    assert val == 25000


def test_normalise_name():
    val, disp, conf, _ = normalise_name("my name is rahul sharma")
    assert val == "Rahul Sharma"
    assert "R-A-H-U-L S-H-A-R-M-A" in disp

    # Initials
    val, _, _, _ = normalise_name("a. k. raman")
    assert "A. K. Raman" in val


def test_normalise_gender_and_yes_no():
    assert normalise_gender("male")[0] == "Male"
    assert normalise_gender("purush")[0] == "Male"
    assert normalise_gender("female")[0] == "Female"
    assert normalise_gender("mahila")[0] == "Female"

    assert normalise_yes_no("yes")[0] == "Yes"
    assert normalise_yes_no("haan")[0] == "Yes"
    assert normalise_yes_no("houdu")[0] == "Yes"
    assert normalise_yes_no("no")[0] == "No"
    assert normalise_yes_no("nahi")[0] == "No"
    assert normalise_yes_no("illa")[0] == "No"
