from app.services.email_service import (
    send_email,
)


def send_repeat_complaint_email(
    recipient: str,
    room_id: int,
    category: str,
    repeat_count: int,
    title: str,
    description: str,
):

    try:

        send_email(
            recipient=recipient,
            subject=(
                "Repeated Complaint Detected"
            ),
            body=(
                "Hostel Maintenance System\n"
                "\n"
                "A repeated complaint has been detected.\n"
                "\n"
                f"Room ID: {room_id}\n"
                f"Category: {category}\n"
                f"Repeated complaints: {repeat_count}\n"
                "\n"
                f"Latest complaint:\n"
                f"{title}\n"
                "\n"
                f"{description}\n"
                "\n"
                "Please review this issue in the "
                "Hostel Maintenance System."
            ),
        )

    except Exception as exc:

        print(
            "Email notification failed:",
            exc,
        )