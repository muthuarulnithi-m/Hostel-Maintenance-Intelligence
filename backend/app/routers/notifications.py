from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.dependencies.auth import require_roles

from app.models.notification import (
    Notification,
)

from app.models.user import (
    User,
    UserRole,
)

from app.schemas.notification import (
    NotificationResponse,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)
@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STAFF,
            UserRole.STUDENT,
        )
    ),
):

    return db.scalars(
        select(Notification)
        .where(
            Notification.user_id
            == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
    ).all()
@router.get(
    "/unread",
    response_model=list[NotificationResponse],
)
def get_unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STAFF,
            UserRole.STUDENT,
        )
    ),
):

    return db.scalars(
        select(Notification)
        .where(
            Notification.user_id
            == current_user.id,
            Notification.is_read.is_(False),
        )
        .order_by(
            Notification.created_at.desc()
        )
    ).all()
@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STAFF,
            UserRole.STUDENT,
        )
    ),
):

    notification = db.get(
        Notification,
        notification_id,
    )

    if not notification:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if notification.user_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot modify this notification",
        )

    notification.is_read = True

    notification.read_at = (
        datetime.now(timezone.utc)
    )

    db.commit()
    db.refresh(notification)

    return notification
