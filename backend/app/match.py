import re
from typing import List, Optional, Tuple
from rapidfuzz import fuzz, process

# Common state/category transliteration or alias synonyms
OPTION_SYNONYMS = {
    # Indian states / UTs
    "karnataka": ["kar", "kn", "karnatak", "ka"],
    "maharashtra": ["mh", "maha"],
    "delhi": ["new delhi", "ncr", "dl"],
    "tamil nadu": ["tn", "tamilnadu", "madras"],
    "andhra pradesh": ["ap", "andhra"],
    "telangana": ["ts", "tg"],
    "kerala": ["kl", "ker"],
    "gujarat": ["gj", "guj"],
    "rajasthan": ["rj", "raj"],
    "uttar pradesh": ["up"],
    "madhya pradesh": ["mp"],
    "west bengal": ["wb", "bengal"],
    "punjab": ["pb"],
    "haryana": ["hr"],
    # Categories / Quotas
    "general": ["gen", "open", "ur", "unreserved"],
    "obc": ["other backward class", "other backward classes", "obc-ncl", "ncl"],
    "sc": ["scheduled caste", "scheduled castes"],
    "st": ["scheduled tribe", "scheduled tribes"],
    "ews": ["economically weaker section", "economically weaker sections"],
    # Binary
    "yes": ["haan", "ha", "houdu", "correct", "true", "sure", "yep", "yeah"],
    "no": ["nahi", "na", "illa", "false", "nope"],
    # Gender
    "male": ["purush", "gandu", "man", "boy"],
    "female": ["mahila", "hennu", "woman", "girl"],
    "other": ["transgender", "others"]
}


def clean_option_text(text: str) -> str:
    """Strips leading/trailing numbers, bullets, state codes, and special chars."""
    t = text.strip()
    # Strip patterns like '01. ', '1) ', 'A. '
    t = re.sub(r"^([0-9]+|[a-zA-Z])[\.\)\-\:]\s*", "", t)
    # Strip state codes or trailing hyphen/bracket codes: 'KARNATAKA - 29' -> 'KARNATAKA', 'Karnataka (KA)' -> 'Karnataka'
    t = re.sub(r"\s*-\s*[0-9A-Za-z]+$", "", t)
    t = re.sub(r"\s*\([^\)]*\)$", "", t)
    # Remove excessive punctuation
    t = re.sub(r"[,:;]+$", "", t)
    return t.strip()


def match_option(
    transcript: str,
    options: List[str]
) -> Tuple[Optional[str], Optional[str], float, List[str]]:
    """
    Matches user transcript against a list of dropdown/radio/checkbox options.
    Returns: (matched_option_value, display_text, confidence, issues)
    """
    if not options:
        return None, None, 0.0, ["No options available to match against."]

    query = transcript.strip().lower()
    if not query:
        return None, None, 0.0, ["Empty query provided."]

    # Map cleaned options to original options
    cleaned_to_orig = {}
    for opt in options:
        cleaned = clean_option_text(opt).lower()
        cleaned_to_orig[cleaned] = opt
        # Also map verbatim lowercased
        cleaned_to_orig[opt.strip().lower()] = opt

    cleaned_keys = list(cleaned_to_orig.keys())

    # 1. Exact match on verbatim or cleaned
    if query in cleaned_to_orig:
        matched = cleaned_to_orig[query]
        return matched, matched, 1.0, []

    # 2. Check synonyms & aliases
    synonym_candidates = []
    for canonical, aliases in OPTION_SYNONYMS.items():
        if query == canonical or query in aliases:
            for key, orig in cleaned_to_orig.items():
                if key == canonical or any(a == key for a in aliases):
                    synonym_candidates.append(orig)

    synonym_candidates = list(dict.fromkeys(synonym_candidates))
    if len(synonym_candidates) == 1:
        matched = synonym_candidates[0]
        return matched, matched, 0.95, []
    elif len(synonym_candidates) > 1:
        issues = [f"Multiple close matches found: {', '.join(synonym_candidates[:3])}. Please choose one."]
        return None, None, 0.5, issues

    # 3. Check prefix / substring match
    substring_candidates = []
    for key, orig in cleaned_to_orig.items():
        if query == key:
            return orig, orig, 0.98, []
        if key.startswith(query) or query.startswith(key):
            substring_candidates.append(orig)
        elif query in key or key in query:
            substring_candidates.append(orig)

    # De-duplicate candidate list
    substring_candidates = list(dict.fromkeys(substring_candidates))
    if len(substring_candidates) == 1:
        matched = substring_candidates[0]
        return matched, matched, 0.92, []
    elif len(substring_candidates) > 1:
        # Multiple candidates from substring
        issues = [f"Multiple close matches found: {', '.join(substring_candidates[:3])}. Please choose one."]
        return None, None, 0.5, issues

    # 4. RapidFuzz matching using token_sort_ratio and partial_ratio
    scored_candidates = []
    for opt in options:
        cleaned = clean_option_text(opt).lower()
        score_sort = fuzz.token_sort_ratio(query, cleaned)
        score_partial = fuzz.partial_ratio(query, cleaned)
        score_weighted = fuzz.WRatio(query, cleaned)
        best_score = max(score_sort, score_partial, score_weighted)
        scored_candidates.append((opt, best_score))

    # Sort descending by score
    scored_candidates.sort(key=lambda x: x[1], reverse=True)
    best_opt, best_score = scored_candidates[0]

    if best_score >= 80:
        # High confidence match
        return best_opt, best_opt, round(best_score / 100.0, 2), []
    elif best_score >= 60:
        # Check if the runner-up is very close (disambiguation needed)
        if len(scored_candidates) > 1:
            second_opt, second_score = scored_candidates[1]
            if abs(best_score - second_score) <= 8 and second_score >= 55:
                close_opts = [best_opt, second_opt]
                if len(scored_candidates) > 2 and abs(best_score - scored_candidates[2][1]) <= 10:
                    close_opts.append(scored_candidates[2][0])
                issues = [f"Did you mean '{best_opt}' or '{second_opt}'?"]
                return None, None, 0.5, issues

        # Moderate match, requires confirmation
        return best_opt, best_opt, round(best_score / 100.0, 2), [f"Matched '{best_opt}' with moderate confidence ({best_score}%)."]

    return None, None, round(best_score / 100.0, 2), [f"Could not find a matching option for '{transcript}' among available options."]
