import pytest
from app.match import clean_option_text, match_option


def test_clean_option_text():
    assert clean_option_text("01. Karnataka") == "Karnataka"
    assert clean_option_text("KARNATAKA - 29") == "KARNATAKA"
    assert clean_option_text("A) Male") == "Male"
    assert clean_option_text("Delhi (DL)") == "Delhi"


def test_exact_and_cleaned_match():
    options = ["Karnataka", "Maharashtra", "Tamil Nadu", "Delhi"]
    val, disp, conf, _ = match_option("Karnataka", options)
    assert val == "Karnataka"
    assert conf == 1.0

    val, disp, conf, _ = match_option("karnataka", options)
    assert val == "Karnataka"
    assert conf >= 0.98


def test_alias_and_synonym_match():
    options = ["Karnataka", "Maharashtra", "Tamil Nadu"]
    val, _, conf, _ = match_option("kar", options)
    assert val == "Karnataka"
    assert conf >= 0.9

    val, _, conf, _ = match_option("mh", options)
    assert val == "Maharashtra"
    assert conf >= 0.9


def test_rapidfuzz_fuzzy_match():
    options = ["Computer Science Engineering", "Electronics and Communication", "Mechanical Engineering"]
    val, _, conf, _ = match_option("comp sci engineering", options)
    assert val == "Computer Science Engineering"
    assert conf >= 0.75

    val, _, conf, _ = match_option("mechanical", options)
    assert val == "Mechanical Engineering"
    assert conf >= 0.80


def test_multiple_close_candidates_disambiguation():
    options = ["North Delhi", "South Delhi", "West Delhi", "Karnataka"]
    # Ambiguous input "Delhi" should surface close options in issues
    val, _, conf, issues = match_option("Delhi", options)
    assert val is None or len(issues) > 0
