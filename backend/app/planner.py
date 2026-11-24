import re
from typing import Dict, List, Optional, Tuple
from app.schemas import FormField

# Command keywords recognition
COMMAND_PATTERNS = {
    "repeat": re.compile(r"\b(repeat|say\s+again|phir\s+se|once\s+more|innomme|kelalla)\b", re.IGNORECASE),
    "skip": re.compile(r"\b(skip|next|aage\s+badho|mundhe|chhod\s+do|leave\s+it)\b", re.IGNORECASE),
    "back": re.compile(r"\b(go\s+back|back|previous|peeche|hindhe)\b", re.IGNORECASE),
    "explain": re.compile(r"\b(explain\s+more|help|samjhao|vivarisi|what\s+does\s+this\s+mean|detail)\b", re.IGNORECASE),
    "stop": re.compile(r"\b(stop|cancel|exit|ruk\s+jao|nillisi|quit)\b", re.IGNORECASE),
    "change": re.compile(r"\b(change|modify|edit|badlo|badalisi)\s+(.+)", re.IGNORECASE)
}


def parse_user_command(transcript: str) -> Optional[Tuple[str, Optional[str]]]:
    """
    Detects if the user transcript is an interaction command rather than a form value.
    Returns: (command_name, target_argument) or None.
    Commands: 'repeat', 'skip', 'back', 'explain', 'stop', 'change'.
    """
    text = transcript.strip()

    # Check change command with argument (e.g., "change email", "badlo name")
    change_match = COMMAND_PATTERNS["change"].search(text)
    if change_match:
        target = change_match.group(2).strip()
        return "change", target

    for cmd, pattern in COMMAND_PATTERNS.items():
        if cmd == "change":
            continue
        if pattern.search(text):
            return cmd, None

    return None


def create_form_plan(fields: List[FormField]) -> List[str]:
    """
    Builds an optimal conversational question sequence:
    1. Keeps visual DOM sequence by default.
    2. Groups tightly related fields together (e.g. date-day, date-month, date-year or address fields).
    3. Handles depends_on dependencies (ensuring parent field comes before dependent field).
    4. Places required fields before purely optional trailing fields where appropriate, while preserving group integrity.
    """
    if not fields:
        return []

    field_map: Dict[str, FormField] = {f.id: f for f in fields}
    visited: set[str] = set()
    ordered_ids: List[str] = []

    # Identify dependent fields and their prerequisites
    prereqs: Dict[str, str] = {}
    for f in fields:
        if f.depends_on and f.depends_on in field_map:
            prereqs[f.id] = f.depends_on

    # Identify field groups
    groups: Dict[str, List[str]] = {}
    for f in fields:
        if f.group_id:
            groups.setdefault(f.group_id, []).append(f.id)

    def add_field(fid: str):
        if fid in visited or fid not in field_map:
            return

        # If has prerequisite, add prerequisite first
        if fid in prereqs:
            parent_id = prereqs[fid]
            if parent_id not in visited:
                add_field(parent_id)

        visited.add(fid)
        ordered_ids.append(fid)

        # If field belongs to a group, add remaining group members next to keep flow coherent
        f_obj = field_map[fid]
        if f_obj.group_id and f_obj.group_id in groups:
            for sibling_id in groups[f_obj.group_id]:
                if sibling_id not in visited:
                    add_field(sibling_id)

    # First pass: Required fields in natural DOM order
    for f in fields:
        if f.required and f.id not in visited:
            add_field(f.id)

    # Second pass: Optional and remaining fields
    for f in fields:
        if f.id not in visited:
            add_field(f.id)

    return ordered_ids


def find_target_field_by_query(query: str, fields: List[FormField]) -> Optional[str]:
    """Finds field ID when user says e.g. 'change email' or 'change phone'."""
    q = query.lower().strip()
    for f in fields:
        f_label = f.label.lower()
        f_name = (f.name or "").lower()
        f_sem = (f.semantic_type or "").lower()
        if q in f_label or q in f_name or q in f_sem or q == f.id.lower():
            return f.id
    return None
