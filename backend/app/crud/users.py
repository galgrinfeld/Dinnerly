"""
CRUD operations for Users.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models.user import User
from app.db.models.event_member import EventMember
from app.services.security import hash_password


def create_user(db: Session, email: str, password: str, display_name: str = None) -> User:
    """Create a new user with hashed password."""
    hashed_password = hash_password(password)
    db_user = User(
        email=email.lower(),
        password_hash=hashed_password,
        display_name=display_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str) -> User | None:
    """Get a user by email (case-insensitive)."""
    return db.query(User).filter(func.lower(User.email) == email.lower()).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Get a user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def claim_invites_for_user(db: Session, user: User) -> int:
    """
    Claim pending event member invites for this user by email.
    
    Finds EventMember rows where email matches user.email and user_id is NULL,
    then sets user_id and marks as active.
    
    Returns count of invites claimed.
    """
    count = db.query(EventMember).filter(
        func.lower(EventMember.email) == user.email.lower(),
        EventMember.user_id.is_(None),
        EventMember.status == "invited",
    ).update({
        EventMember.user_id: user.id,
        EventMember.status: "active",
    })
    db.commit()
    return count
