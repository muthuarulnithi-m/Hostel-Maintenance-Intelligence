"""
Staff recommendation engine.

This module recommends suitable staff members for a complaint.

Recommendation factors:

1. Matching maintenance skill
2. Staff availability
3. Complaint priority

This module does NOT assign the complaint automatically.

The final assignment remains a Warden/Admin decision through the existing
complaint assignment workflow.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.models.complaint import (
    ComplaintCategory,
    ComplaintPriority,
)
from app.models.staff import (
    AvailabilityStatus,
    StaffProfile,
)


@dataclass
class StaffRecommendation:
    """
    Recommendation result for one staff member.
    """

    staff_id: int
    score: int
    reasons: list[str]


# ---------------------------------------------------------------------------
# CATEGORY → STAFF SKILL
# ---------------------------------------------------------------------------

CATEGORY_SKILL_MAP: dict[
    ComplaintCategory,
    str,
] = {
    ComplaintCategory.ELECTRICAL: "ELECTRICAL",
    ComplaintCategory.PLUMBING: "PLUMBING",
    ComplaintCategory.CIVIL: "CIVIL",
    ComplaintCategory.FURNITURE: "FURNITURE",
    ComplaintCategory.SANITATION: "SANITATION",
    ComplaintCategory.NETWORK: "NETWORK",
    ComplaintCategory.CLEANING: "CLEANING",
    ComplaintCategory.SECURITY: "SECURITY",
    ComplaintCategory.GENERAL: "GENERAL",
}


def _skill_names(
    staff: StaffProfile,
) -> set[str]:
    """
    Extract normalized skill names from a StaffProfile.
    """

    return {
        str(skill.skill.value)
        if hasattr(skill.skill, "value")
        else str(skill.skill)
        for skill in staff.skills
    }


def _availability_score(
    status: AvailabilityStatus,
) -> tuple[int, str]:

    if status == AvailabilityStatus.AVAILABLE:
        return 30, "Staff is available"

    if status == AvailabilityStatus.BUSY:
        return 10, "Staff is currently busy"

    if status == AvailabilityStatus.ON_LEAVE:
        return -100, "Staff is on leave"

    if status == AvailabilityStatus.INACTIVE:
        return -100, "Staff is inactive"

    return 0, "Availability status unknown"


def _priority_bonus(
    priority: ComplaintPriority,
    availability: AvailabilityStatus,
) -> tuple[int, str | None]:

    if priority == ComplaintPriority.URGENT:

        if availability == AvailabilityStatus.AVAILABLE:
            return 20, "Available for urgent complaint"

        return 0, None

    if priority == ComplaintPriority.HIGH:

        if availability == AvailabilityStatus.AVAILABLE:
            return 10, "Available for high-priority complaint"

        return 0, None

    return 0, None


def score_staff(
    staff: StaffProfile,
    category: ComplaintCategory,
    priority: ComplaintPriority,
) -> StaffRecommendation:

    reasons: list[str] = []

    score = 0

    # ---------------------------------------------------------
    # AVAILABILITY
    # ---------------------------------------------------------

    availability_points, availability_reason = (
        _availability_score(
            staff.availability_status
        )
    )

    score += availability_points

    if availability_reason:
        reasons.append(
            availability_reason
        )

    # ---------------------------------------------------------
    # INACTIVE / ON LEAVE
    # ---------------------------------------------------------

    if staff.availability_status in {
        AvailabilityStatus.ON_LEAVE,
        AvailabilityStatus.INACTIVE,
    }:

        return StaffRecommendation(
            staff_id=staff.id,
            score=-100,
            reasons=reasons,
        )

    # ---------------------------------------------------------
    # SKILL MATCH
    # ---------------------------------------------------------

    required_skill = CATEGORY_SKILL_MAP.get(
        category,
        "GENERAL",
    )

    skills = _skill_names(staff)

    if required_skill in skills:

        score += 50

        reasons.append(
            f"Skill matches {required_skill}"
        )

    elif "GENERAL" in skills:

        score += 15

        reasons.append(
            "General maintenance skill available"
        )

    else:

        reasons.append(
            f"No direct {required_skill} skill match"
        )

    # ---------------------------------------------------------
    # PRIORITY
    # ---------------------------------------------------------

    priority_points, priority_reason = (
        _priority_bonus(
            priority,
            staff.availability_status,
        )
    )

    score += priority_points

    if priority_reason:
        reasons.append(
            priority_reason
        )

    return StaffRecommendation(
        staff_id=staff.id,
        score=score,
        reasons=reasons,
    )


def recommend_staff(
    staff_members: list[StaffProfile],
    category: ComplaintCategory,
    priority: ComplaintPriority,
    limit: int = 5,
) -> list[StaffRecommendation]:
    """
    Return ranked staff recommendations.

    This function does not modify the database and does not assign anyone.

    The caller can display the recommendations to the Warden/Admin.
    """

    if limit <= 0:
        return []

    recommendations = [
        score_staff(
            staff=staff,
            category=category,
            priority=priority,
        )
        for staff in staff_members
    ]

    # Remove staff who are not eligible for assignment.
    eligible = [
        recommendation
        for recommendation in recommendations
        if recommendation.score >= 0
    ]

    eligible.sort(
        key=lambda item: (
            item.score,
            -item.staff_id,
        ),
        reverse=True,
    )

    return eligible[:limit]


def recommend_staff_ids(
    staff_members: list[StaffProfile],
    category: ComplaintCategory,
    priority: ComplaintPriority,
    limit: int = 5,
) -> list[int]:
    """
    Convenience function returning only staff IDs.
    """

    recommendations = recommend_staff(
        staff_members=staff_members,
        category=category,
        priority=priority,
        limit=limit,
    )

    return [
        recommendation.staff_id
        for recommendation in recommendations
    ]