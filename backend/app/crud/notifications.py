"""
CRUD operations for Notifications.
"""
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    related_event_id: int | None = None,
    related_recipe_id: int | None = None,
    related_user_id: int | None = None,
) -> Notification:
    """Create a new notification."""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_event_id=related_event_id,
        related_recipe_id=related_recipe_id,
        related_user_id=related_user_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_notification(db: Session, notification_id: int) -> Notification | None:
    """Get a notification by ID."""
    return db.query(Notification).filter(Notification.id == notification_id).first()


def get_notifications_for_user(
    db: Session,
    user_id: int,
    limit: int = 50,
    offset: int = 0,
) -> list[Notification]:
    """Get notifications for a user, ordered by creation date (most recent first)."""
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()


def get_unread_count_for_user(db: Session, user_id: int) -> int:
    """Get count of unread notifications for a user."""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()


def mark_notification_as_read(db: Session, notification_id: int) -> Notification | None:
    """Mark a single notification as read."""
    notification = get_notification(db, notification_id)
    if not notification:
        return None
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_notifications_as_read(db: Session, user_id: int) -> int:
    """Mark all notifications as read for a user. Returns count of updated notifications."""
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({Notification.is_read: True})
    db.commit()
    return count
