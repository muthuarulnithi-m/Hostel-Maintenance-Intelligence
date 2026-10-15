"""
Complaint priority calculation.

Priority levels supported by the application:

LOW
MEDIUM
HIGH
URGENT

The calculation is rule-based and deterministic.
"""

from __future__ import annotations

import re

from app.models.complaint import ComplaintPriority
from app.intelligence.entity_extractor import (
    extract_entities,
)


# ---------------------------------------------------------------------------
# PRIORITY SIGNALS
# ---------------------------------------------------------------------------

URGENT_TERMS: tuple[str, ...] = (
    "fire",
    "smoke",
    "electric shock",
    "shock",
    "sparking",
    "short circuit",
    "flooding",
    "major flood",
    "security breach",
    "theft",
    "dangerous",
    "emergency",
)

HIGH_TERMS: tuple[str, ...] = (
    "major leakage",
    "water flooding",
    "no water",
    "no electricity",
    "power failure",
    "door cannot lock",
    "door lock broken",
    "security issue",
    "internet completely down",
    "toilet blocked",
    "bathroom blocked",
    "ceiling falling",
    "broken glass",
)

MEDIUM_TERMS: tuple[str, ...] = (
    "leak",
    "leakage",
    "broken",
    "not working",
    "damaged",
    "blocked",
    "no internet",
    "wifi not working",
    "fan not working",
    "light not working",
    "dirty toilet",
    "bad smell",
    "noise",
)


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def _contains_any(
    text: str,
    terms: tuple[str, ...],
) -> bool:

    for term in terms:

        if term in text:
            return True

    return False


def calculate_priority(
    title: str,
    description: str,
) -> ComplaintPriority:
    """
    Calculate complaint priority.

    Priority precedence:

        URGENT
          ↓
        HIGH
          ↓
        MEDIUM
          ↓
        LOW
    """

    text = _normalize(
        f"{title} {description}"
    )

    # ---------------------------------------------------------
    # URGENT
    # ---------------------------------------------------------

    if _contains_any(
        text,
        URGENT_TERMS,
    ):
        return ComplaintPriority.URGENT

    entities = extract_entities(
        title,
        description,
    )

    if entities.urgency_indicators:
        return ComplaintPriority.URGENT

    # ---------------------------------------------------------
    # HIGH
    # ---------------------------------------------------------

    if _contains_any(
        text,
        HIGH_TERMS,
    ):
        return ComplaintPriority.HIGH

    # ---------------------------------------------------------
    # MEDIUM
    # ---------------------------------------------------------

    if _contains_any(
        text,
        MEDIUM_TERMS,
    ):
        return ComplaintPriority.MEDIUM

    # ---------------------------------------------------------
    # LOW
    # ---------------------------------------------------------

    return ComplaintPriority.LOW