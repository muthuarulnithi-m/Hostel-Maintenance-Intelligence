"""
Complaint category classifier.

This module provides a deterministic, rule-based classifier for hostel
maintenance complaints.

The classifier does not use an external ML model or require internet access.
It can later be replaced by an ML/NLP model without changing the rest of
the application significantly.
"""

from __future__ import annotations

import re

from app.models.complaint import ComplaintCategory


# ---------------------------------------------------------------------------
# CATEGORY KEYWORDS
# ---------------------------------------------------------------------------

CATEGORY_KEYWORDS: dict[ComplaintCategory, tuple[str, ...]] = {
    ComplaintCategory.ELECTRICAL: (
        "fan",
        "light",
        "bulb",
        "tube light",
        "switch",
        "socket",
        "plug",
        "wire",
        "wiring",
        "electric",
        "electrical",
        "power",
        "current",
        "voltage",
        "charger",
        "ac",
        "air conditioner",
        "electricity",
        "mcb",
        "fuse",
    ),

    ComplaintCategory.PLUMBING: (
        "tap",
        "faucet",
        "pipe",
        "pipeline",
        "leak",
        "leakage",
        "water leak",
        "water",
        "wash basin",
        "sink",
        "toilet flush",
        "flush",
        "drain",
        "drainage",
        "shower",
        "bathroom water",
        "sewage",
    ),

    ComplaintCategory.CIVIL: (
        "wall",
        "ceiling",
        "floor",
        "tile",
        "tiles",
        "crack",
        "cracked",
        "paint",
        "painting",
        "cement",
        "concrete",
        "door frame",
        "window frame",
        "construction",
        "roof",
    ),

    ComplaintCategory.FURNITURE: (
        "chair",
        "table",
        "bed",
        "cot",
        "desk",
        "cupboard",
        "wardrobe",
        "shelf",
        "furniture",
        "mattress",
        "drawer",
        "locker",
    ),

    ComplaintCategory.SANITATION: (
        "toilet",
        "urinal",
        "sanitation",
        "sewer",
        "sewage",
        "bad smell",
        "dirty toilet",
        "hygiene",
        "waste",
        "garbage",
        "mosquito",
        "pest",
        "cockroach",
        "insects",
    ),

    ComplaintCategory.NETWORK: (
        "wifi",
        "wi-fi",
        "internet",
        "network",
        "router",
        "ethernet",
        "lan",
        "connection",
        "connectivity",
        "no signal",
        "slow internet",
        "login network",
    ),

    ComplaintCategory.CLEANING: (
        "clean",
        "cleaning",
        "dirty",
        "dust",
        "mop",
        "sweep",
        "sweeping",
        "room cleaning",
        "corridor",
        "floor cleaning",
        "garbage collection",
        "trash",
    ),

    ComplaintCategory.SECURITY: (
        "security",
        "lock",
        "locked",
        "door lock",
        "key",
        "cctv",
        "camera",
        "security camera",
        "gate",
        "unauthorized",
        "theft",
        "safety",
    ),
}


def _normalize(text: str) -> str:
    """
    Normalize complaint text before classification.
    """

    text = text.lower().strip()

    # Keep useful word boundaries while removing punctuation.
    text = re.sub(r"[^a-z0-9\s-]", " ", text)

    # Collapse repeated whitespace.
    text = re.sub(r"\s+", " ", text)

    return text


def _keyword_score(text: str, keyword: str) -> int:
    """
    Calculate a simple keyword match score.

    Exact phrase matches receive a higher score than partial matches.
    """

    keyword = keyword.lower().strip()

    if not keyword:
        return 0

    # Multi-word phrase.
    if " " in keyword:
        return 3 if keyword in text else 0

    # Whole-word match.
    pattern = rf"\b{re.escape(keyword)}\b"

    if re.search(pattern, text):
        return 2

    return 0


def classify_complaint(
    title: str,
    description: str,
) -> ComplaintCategory:
    """
    Classify a complaint into one of the supported maintenance categories.

    The title is given slightly more importance because it usually contains
    the user's direct problem statement.

    Returns GENERAL when no category has enough evidence.
    """

    normalized_title = _normalize(title)
    normalized_description = _normalize(description)

    combined_text = (
        f"{normalized_title} {normalized_description}"
    ).strip()

    scores: dict[ComplaintCategory, int] = {
        category: 0
        for category in CATEGORY_KEYWORDS
    }

    for category, keywords in CATEGORY_KEYWORDS.items():

        for keyword in keywords:

            title_score = _keyword_score(
                normalized_title,
                keyword,
            )

            description_score = _keyword_score(
                normalized_description,
                keyword,
            )

            # Title evidence is stronger.
            scores[category] += (
                title_score * 2
                + description_score
            )

    # Additional phrase-level checks.
    special_phrases = {
        ComplaintCategory.ELECTRICAL: (
            "not working",
            "power failure",
            "no electricity",
        ),
        ComplaintCategory.PLUMBING: (
            "water leakage",
            "water is leaking",
            "water overflowing",
        ),
        ComplaintCategory.NETWORK: (
            "internet not working",
            "wifi not working",
            "wifi is slow",
        ),
        ComplaintCategory.SANITATION: (
            "toilet is dirty",
            "toilet is blocked",
            "bad smell",
        ),
    }

    for category, phrases in special_phrases.items():

        for phrase in phrases:

            if phrase in combined_text:
                scores[category] += 4

    best_category = max(
        scores,
        key=scores.get,
    )

    best_score = scores[best_category]

    if best_score <= 0:
        return ComplaintCategory.GENERAL

    return best_category


def classify_with_confidence(
    title: str,
    description: str,
) -> tuple[ComplaintCategory, float]:
    """
    Return category together with an approximate rule-based confidence.

    This is NOT an ML probability. It is a normalized confidence indicator
    useful for application logic and UI explanations.
    """

    normalized_title = _normalize(title)
    normalized_description = _normalize(description)

    scores: dict[ComplaintCategory, int] = {
        category: 0
        for category in CATEGORY_KEYWORDS
    }

    for category, keywords in CATEGORY_KEYWORDS.items():

        for keyword in keywords:

            scores[category] += (
                _keyword_score(
                    normalized_title,
                    keyword,
                )
                * 2
            )

            scores[category] += _keyword_score(
                normalized_description,
                keyword,
            )

    if not scores:
        return ComplaintCategory.GENERAL, 0.0

    sorted_scores = sorted(
        scores.values(),
        reverse=True,
    )

    highest = sorted_scores[0]

    if highest <= 0:
        return ComplaintCategory.GENERAL, 0.0

    total = sum(scores.values())

    confidence = highest / total if total else 0.0

    return (
        max(
            scores,
            key=scores.get,
        ),
        round(
            min(confidence, 1.0),
            2,
        ),
    )