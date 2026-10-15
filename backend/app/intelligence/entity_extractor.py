"""
Entity extraction for hostel maintenance complaints.

This module extracts useful maintenance-related entities from free text.

Examples:

    "Fan in room 204 is making noise"
    
    ->
    {
        "asset": "fan",
        "location": "room 204",
        "symptoms": ["noise"]
    }

The extracted information can later be used by:
- priority calculation
- staff recommendation
- dashboard analytics
- NLP/ML models
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class ComplaintEntities:
    """
    Structured information extracted from complaint text.
    """

    assets: list[str] = field(default_factory=list)
    locations: list[str] = field(default_factory=list)
    symptoms: list[str] = field(default_factory=list)
    urgency_indicators: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# KNOWN MAINTENANCE ENTITIES
# ---------------------------------------------------------------------------

ASSET_KEYWORDS: tuple[str, ...] = (
    "fan",
    "light",
    "bulb",
    "switch",
    "socket",
    "plug",
    "ac",
    "air conditioner",
    "tap",
    "pipe",
    "sink",
    "wash basin",
    "toilet",
    "shower",
    "drain",
    "door",
    "window",
    "lock",
    "bed",
    "chair",
    "table",
    "desk",
    "cupboard",
    "wardrobe",
    "mattress",
    "wifi",
    "router",
    "internet",
    "cctv",
    "camera",
    "floor",
    "wall",
    "ceiling",
)


LOCATION_PATTERNS: tuple[str, ...] = (
    r"\broom\s*[a-z]?\s*[-]?\s*\d+\b",
    r"\bblock\s*[a-z]?\b",
    r"\bground floor\b",
    r"\bfirst floor\b",
    r"\bsecond floor\b",
    r"\bthird floor\b",
    r"\bfourth floor\b",
    r"\bbathroom\b",
    r"\btoilet\b",
    r"\bcorridor\b",
    r"\bstaircase\b",
    r"\bstairs\b",
    r"\bterrace\b",
    r"\bcommon room\b",
    r"\bstudy room\b",
    r"\bentrance\b",
    r"\bgate\b",
)


SYMPTOM_KEYWORDS: tuple[str, ...] = (
    "not working",
    "broken",
    "damaged",
    "leaking",
    "leakage",
    "blocked",
    "clogged",
    "noisy",
    "noise",
    "smell",
    "bad smell",
    "slow",
    "disconnected",
    "no connection",
    "flickering",
    "sparking",
    "overheating",
    "cracked",
    "dirty",
    "loose",
    "missing",
    "stuck",
    "overflowing",
    "short circuit",
)


URGENCY_KEYWORDS: tuple[str, ...] = (
    "urgent",
    "emergency",
    "immediately",
    "danger",
    "dangerous",
    "fire",
    "smoke",
    "spark",
    "sparking",
    "electric shock",
    "shock",
    "flood",
    "flooding",
    "major leakage",
    "security breach",
    "theft",
)


def _normalize(text: str) -> str:
    """
    Normalize text for extraction.
    """

    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text


def _find_keywords(
    text: str,
    keywords: tuple[str, ...],
) -> list[str]:
    """
    Find keyword/phrase matches while avoiding duplicates.
    """

    matches: list[str] = []

    for keyword in keywords:

        pattern = (
            rf"\b{re.escape(keyword.lower())}\b"
        )

        if re.search(pattern, text):

            if keyword.lower() not in matches:
                matches.append(
                    keyword.lower()
                )

    return matches


def _find_locations(text: str) -> list[str]:
    """
    Extract known hostel locations and room/block references.
    """

    locations: list[str] = []

    for pattern in LOCATION_PATTERNS:

        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:

            normalized = " ".join(
                match.split()
            ).lower()

            if normalized not in locations:
                locations.append(
                    normalized
                )

    return locations


def extract_entities(
    title: str,
    description: str,
) -> ComplaintEntities:
    """
    Extract maintenance entities from complaint title and description.
    """

    text = _normalize(
        f"{title} {description}"
    )

    return ComplaintEntities(
        assets=_find_keywords(
            text,
            ASSET_KEYWORDS,
        ),
        locations=_find_locations(text),
        symptoms=_find_keywords(
            text,
            SYMPTOM_KEYWORDS,
        ),
        urgency_indicators=_find_keywords(
            text,
            URGENCY_KEYWORDS,
        ),
    )