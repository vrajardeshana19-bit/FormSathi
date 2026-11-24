import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from app.schemas import FormField

# Word-to-digit mappings across English, Hindi (transliterated), and Kannada (transliterated)
DIGIT_WORDS = {
    # English
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    # Hindi
    "shunya": "0", "soonya": "0", "ek": "1", "do": "2", "teen": "3", "char": "4", "chaar": "4",
    "paanch": "5", "panch": "5", "chhah": "6", "che": "6", "saat": "7", "aath": "8", "nau": "9",
    # Kannada
    "sonne": "0", "ondu": "1", "eradu": "2", "mooru": "3", "muru": "3",
    "naalku": "4", "nalku": "4", "aidu": "5", "aydu": "5", "aaru": "6", "aru": "6",
    "eelu": "7", "elu": "7", "entu": "8", "ombattu": "9"
}

# Unicode numerals for Hindi (Devanagari) and Kannada
UNICODE_DIGITS = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9'
}

MONTH_MAP = {
    # English
    "january": 1, "jan": 1, "february": 2, "feb": 2, "march": 3, "mar": 3,
    "april": 4, "apr": 4, "may": 5, "june": 6, "jun": 6, "july": 7, "jul": 7,
    "august": 8, "aug": 8, "september": 9, "sep": 9, "sept": 9, "october": 10, "oct": 10,
    "november": 11, "nov": 11, "december": 12, "dec": 12,
    # Hindi transliterated
    "janavari": 1, "farvari": 2, "februari": 2, "aprail": 4, "mai": 5, "joon": 6, "julaai": 7,
    "agast": 8, "sitambar": 9, "aktoobar": 10, "navambar": 11, "disambar": 12,
    # Kannada transliterated
    "maarch": 3, "epril": 4, "me": 5, "aagast": 8, "sepatembar": 9, "aktobar": 10, "disembar": 12
}


def convert_spoken_digits_to_string(text: str) -> str:
    """Replaces words like 'double 9', 'triple 5', and individual digit words with numerals."""
    cleaned = text.lower()
    for u_char, d_char in UNICODE_DIGITS.items():
        cleaned = cleaned.replace(u_char, d_char)

    # Handle multipliers like "double nine" -> "9 9", "triple five" -> "5 5 5"
    multiplier_pattern = re.compile(r"\b(double|triple)\s+([a-z0-9]+)\b", re.IGNORECASE)

    def replace_multiplier(m):
        count = 2 if m.group(1).lower() == "double" else 3
        word = m.group(2).lower()
        digit = DIGIT_WORDS.get(word, word)
        return (digit + " ") * count

    cleaned = multiplier_pattern.sub(replace_multiplier, cleaned)

    tokens = cleaned.split()
    converted_tokens = []
    for token in tokens:
        sub = DIGIT_WORDS.get(token, token)
        converted_tokens.append(sub)

    return " ".join(converted_tokens)


# --- 1. Phone Normalisation ---
def normalise_phone(transcript: str) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    """Normalises Indian phone numbers."""
    expanded = convert_spoken_digits_to_string(transcript)
    # Extract all digits
    digits = re.sub(r"\D", "", expanded)

    if not digits:
        return None, None, 0.0, ["No digits found in phone input."]

    # If starts with 91 and is 12 digits, strip 91
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    # If starts with 0 and is 11 digits, strip 0
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    # Check length
    if len(digits) == 10:
        if digits[0] in "6789":
            display = f"+91 {digits[:5]} {digits[5:]}"
            return digits, display, 0.98, []
        else:
            return digits, digits, 0.70, ["Indian mobile numbers usually start with 6, 7, 8, or 9."]

    return None, None, 0.2, [f"Phone number must be 10 digits. Found {len(digits)} digits ({digits})."]


# --- 2. Pincode Normalisation ---
def normalise_pincode(transcript: str) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    """Normalises 6-digit Indian postal PIN codes."""
    expanded = convert_spoken_digits_to_string(transcript)
    digits = re.sub(r"\D", "", expanded)

    if len(digits) == 6:
        if digits[0] != "0":
            return digits, digits, 0.98, []
        else:
            return None, None, 0.4, ["Indian postal PIN codes cannot start with 0."]

    # Check if a 6-digit PIN is embedded in text
    match = re.search(r"\b[1-9][0-9]{5}\b", expanded)
    if match:
        val = match.group(0)
        return val, val, 0.95, []

    return None, None, 0.2, [f"Pincode must be 6 digits. Found {len(digits)} digits ({digits})."]


# --- 3. Email Normalisation ---
def normalise_email(transcript: str) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    """Converts spoken email cues ('at the rate', 'dot') into clean email addresses."""
    text = transcript.lower().strip()
    # Strip common conversational starters
    text = re.sub(r"^(my\s+email\s+is|it\s+is|email\s+is)\s+", "", text)

    # Conversions
    text = re.sub(r"\b(at\s+the\s+rate\s+of|at\s+the\s+rate|at\s+sign)\b", "@", text)
    text = re.sub(r"\s+at\s+", "@", text)
    text = re.sub(r"\b(dot|point)\b", ".", text)

    # Remove all spaces around dots and @
    text = re.sub(r"\s*([@.])\s*", r"\1", text)
    # Remove remaining spaces within email
    text = re.sub(r"\s+", "", text)

    # Common email domain typo fixes
    text = re.sub(r"@(gmail|yahoo)\.co$", r"@\1.com", text)
    text = re.sub(r"@(gmail|yahoo)co$", r"@\1.com", text)
    text = re.sub(r"@(gmail|yahoo)com$", r"@\1.com", text)

    email_regex = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    if email_regex.match(text):
        return text, text, 0.96, []

    return None, None, 0.3, [f"Could not parse a valid email from '{transcript}'."]


# --- 4. Date Normalisation ---
def normalise_date(transcript: str, field: Optional[FormField] = None) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    """Normalises spoken and written dates across English, Hindi, and Kannada cues."""
    text = convert_spoken_digits_to_string(transcript.lower())

    # Determine desired format
    prefers_iso = False
    if field:
        if field.input_type == "date":
            prefers_iso = True
        elif field.placeholder and "yyyy-mm-dd" in field.placeholder.lower():
            prefers_iso = True
        elif field.pattern and "yyyy" in field.pattern.lower():
            prefers_iso = True

    # 1. Match numeric patterns like 15/08/1995 or 15-08-1995 or 1995-08-15
    numeric_m1 = re.search(r"\b(\d{1,2})[\/\-\.\s]+(\d{1,2})[\/\-\.\s]+(\d{4})\b", text)
    if numeric_m1:
        d, m, y = int(numeric_m1.group(1)), int(numeric_m1.group(2)), int(numeric_m1.group(3))
        # Handle swap if month > 12 or standard DD/MM/YYYY
        if d > 12 and m <= 12:
            day, month, year = d, m, y
        elif m > 12 and d <= 12:
            day, month, year = m, d, y
        else:
            day, month, year = d, m, y

        try:
            dt = datetime(year, month, day)
            val = dt.strftime("%Y-%m-%d") if prefers_iso else dt.strftime("%d/%m/%Y")
            display = dt.strftime("%d %B %Y")
            return val, display, 0.95, []
        except ValueError:
            pass

    # Match ISO: 1995-08-15
    iso_m = re.search(r"\b(\d{4})[\/\-\.\s]+(\d{1,2})[\/\-\.\s]+(\d{1,2})\b", text)
    if iso_m:
        y, m, d = int(iso_m.group(1)), int(iso_m.group(2)), int(iso_m.group(3))
        try:
            dt = datetime(y, m, d)
            val = dt.strftime("%Y-%m-%d") if prefers_iso else dt.strftime("%d/%m/%Y")
            display = dt.strftime("%d %B %Y")
            return val, display, 0.95, []
        except ValueError:
            pass

    # 2. Match spoken months: "15th August 1995", "August 15 1995", "15 aug 1995"
    for month_name, m_num in MONTH_MAP.items():
        if month_name in text:
            # Look for day and year
            day_m = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\b", text)
            year_m = re.search(r"\b(19\d{2}|20\d{2})\b", text)
            if day_m and year_m:
                d = int(day_m.group(1))
                y = int(year_m.group(1))
                try:
                    dt = datetime(y, m_num, d)
                    val = dt.strftime("%Y-%m-%d") if prefers_iso else dt.strftime("%d/%m/%Y")
                    display = dt.strftime("%d %B %Y")
                    return val, display, 0.97, []
                except ValueError:
                    pass

    return None, None, 0.3, [f"Could not parse valid date from '{transcript}'."]


# --- 5. Numbers / Percentage / Amount Normalisation ---
WORD_NUMBERS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
    "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
    "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
    # Hindi
    "shunya": 0, "ek": 1, "do": 2, "teen": 3, "char": 4, "chaar": 4, "paanch": 5, "panch": 5, "chhah": 6, "che": 6,
    "saat": 7, "aath": 8, "nau": 9, "das": 10, "gyarah": 11, "barah": 12, "terah": 13, "chaudah": 14,
    "pandrah": 15, "solah": 16, "satrah": 17, "atharah": 18, "unnis": 19, "bees": 20, "tees": 30, "chaalis": 40,
    "pachaas": 50, "saath": 60, "sattar": 70, "assi": 80, "nabbe": 90,
    # Kannada
    "sonne": 0, "ondu": 1, "eradu": 2, "mooru": 3, "muru": 3, "naalku": 4, "nalku": 4, "aidu": 5, "aydu": 5,
    "aaru": 6, "aru": 6, "eelu": 7, "elu": 7, "entu": 8, "ombattu": 9, "hattu": 10, "ippattu": 20
}

MULTIPLIERS = {
    "hundred": 100, "sau": 100, "nooru": 100,
    "thousand": 1000, "hazaar": 1000, "hazar": 1000, "saavira": 1000,
    "lakh": 100000, "lac": 100000, "laksh": 100000, "laksha": 100000,
    "crore": 10000000, "karod": 10000000, "koti": 10000000
}


def normalise_number_or_amount(transcript: str, is_percentage: bool = False) -> Tuple[Optional[Any], Optional[str], float, List[str]]:
    """Parses spoken numbers, amounts (lakh, crore), and percentages."""
    text = transcript.lower().strip()

    # Check for direct decimal or integer
    num_match = re.search(r"(\d+(\.\d+)?)", text)
    base_val = float(num_match.group(1)) if num_match else None
    multiplier_already_applied = False

    # Handle multipliers like "2.5 lakh" or "5 crore"
    multiplier_val = 1
    for mult_word, mult_num in MULTIPLIERS.items():
        if mult_word in text:
            multiplier_val = mult_num
            break

    # If base_val not found via digits, try word parsing
    if base_val is None:
        tokens = text.replace("-", " ").split()
        current_sum = 0
        total = 0
        point_encountered = False
        decimal_str = ""

        for token in tokens:
            if token in ("point", "dashamlav"):
                point_encountered = True
                continue
            if point_encountered:
                if token in WORD_NUMBERS:
                    decimal_str += str(WORD_NUMBERS[token])
                elif token.isdigit():
                    decimal_str += token
                continue

            if token in WORD_NUMBERS:
                current_sum += WORD_NUMBERS[token]
            elif token in MULTIPLIERS:
                factor = MULTIPLIERS[token]
                if current_sum == 0:
                    current_sum = 1
                total += current_sum * factor
                current_sum = 0
                multiplier_already_applied = True

        final_num = total + current_sum
        if decimal_str:
            final_num = float(f"{final_num}.{decimal_str}")

        if final_num != 0 or "zero" in text or "0" in text or "shunya" in text:
            base_val = final_num

    if base_val is not None:
        if multiplier_val > 1 and not multiplier_already_applied:
            total_val = base_val * multiplier_val
        else:
            total_val = base_val

        # Format output
        if is_percentage or "percent" in text or "%" in text or "pratishat" in text:
            pct_val = f"{int(total_val) if total_val.is_integer() else total_val}%"
            display = f"{pct_val}"
            # return both clean number or with % depending on field
            return pct_val, display, 0.95, []

        val_result = int(total_val) if isinstance(total_val, float) and total_val.is_integer() else total_val
        display = f"{val_result:,}" if isinstance(val_result, (int, float)) else str(val_result)
        return val_result, display, 0.95, []

    return None, None, 0.3, [f"Could not parse numeric value from '{transcript}'."]


# --- 6. Name Normalisation ---
def normalise_name(transcript: str) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    """Cleans fillers and title-cases name while preserving spelling for spell-back."""
    text = transcript.strip()
    # Strip common spoken fillers
    filler_pattern = re.compile(
        r"^(my\s+name\s+is|it\s+is|name\s+is|this\s+is|mera\s+naam|nanna\s+hesaru)\s+",
        re.IGNORECASE
    )
    cleaned = filler_pattern.sub("", text).strip()
    # Remove trailing periods
    cleaned = re.sub(r"\.+$", "", cleaned)

    if not cleaned:
        return None, None, 0.0, ["Name cannot be empty."]

    # Title-case cleanly, handling initials like "A. K. Sharma" or "Prakash"
    words = cleaned.split()
    titled_words = []
    for w in words:
        if "." in w:
            titled_words.append(w.upper())
        else:
            titled_words.append(w.capitalize())

    final_name = " ".join(titled_words)
    # Spell-back display for confirmation: "Rahul Sharma (R-A-H-U-L S-H-A-R-M-A)"
    spell_back = " ".join("-".join(list(w.upper())) for w in titled_words)
    display = f"{final_name} ({spell_back})"

    return final_name, display, 0.95, []


# --- 7. Gender / Yes-No Normalisation ---
GENDER_MAP = {
    "male": "Male", "purush": "Male", "gandu": "Male", "man": "Male", "boy": "Male",
    "female": "Female", "mahila": "Female", "hennu": "Female", "woman": "Female", "girl": "Female",
    "other": "Other", "others": "Other", "transgender": "Transgender"
}

YES_NO_MAP = {
    "yes": "Yes", "haan": "Yes", "ha": "Yes", "houdu": "Yes", "correct": "Yes", "true": "Yes", "sure": "Yes", "yep": "Yes", "yeah": "Yes",
    "no": "No", "nahi": "No", "na": "No", "illa": "No", "false": "No", "nope": "No"
}


def normalise_gender(transcript: str) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    text = transcript.lower().strip()
    for key, val in GENDER_MAP.items():
        if re.search(rf"\b{key}\b", text):
            return val, val, 0.98, []
    return None, None, 0.3, [f"Could not determine gender from '{transcript}'."]


def normalise_yes_no(transcript: str) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    text = transcript.lower().strip()
    for key, val in YES_NO_MAP.items():
        if re.search(rf"\b{key}\b", text):
            return val, val, 0.98, []
    return None, None, 0.3, [f"Could not determine yes/no choice from '{transcript}'."]
