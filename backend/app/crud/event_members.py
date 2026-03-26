"""
CRUD operations for EventMembers (event sharing and participants).
"""
from sqlalchemy.orm import Session
from app.db.models.event_member import EventMember
from app.db.models.user import User


def add_participant(db: Session, event_id: int, email: str, role: str = "participant") -> EventMember:
    """
    Add a participant to an event by email.
    If the email is already in the event, return existing member.
    If user exists with that email, set user_id and status="active".
    Otherwise, status="invited" (user_id=None).
    """
    # Check if already exists
    existing = (
        db.query(EventMember)
        .filter(EventMember.event_id == event_id, EventMember.email == email)
        .first()
    )
    if existing:
        return existing
    
    # Check if user with this email exists
    user = db.query(User).filter(User.email == email).first()
    
    member = EventMember(
        event_id=event_id,
        user_id=user.id if user else None,
        email=email,
        role=role,
        status="active" if user else "invited",
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def list_members(db: Session, event_id: int) -> list[EventMember]:
    """List all members of an event."""
    return db.query(EventMember).filter(EventMember.event_id == event_id).all()


def get_member(db: Session, member_id: int) -> EventMember | None:
    """Get a specific event member by ID."""
    return db.query(EventMember).filter(EventMember.id == member_id).first()


def remove_member(db: Session, event_id: int, member_id: int) -> bool:
    """Remove a member from an event. Returns True if successful."""
    member = (
        db.query(EventMember)
        .filter(EventMember.event_id == event_id, EventMember.id == member_id)
        .first()
    )
    if member:
        db.delete(member)
        db.commit()
        return True
    return False


def is_member(db: Session, event_id: int, user_id: int) -> bool:
    """Check if a user is an active member of an event."""
    return db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
        EventMember.status == "active",
    ).first() is not None


def claim_invites_for_user(db: Session, user: User) -> int:
    """
    Claim pending invites for a newly registered user.
    Find EventMember rows with matching email and user_id IS NULL,
    set user_id and status="active", and return count.
    """
    members = (
        db.query(EventMember)
        .filter(EventMember.email == user.email, EventMember.user_id.is_(None))
        .all()
    )
    
    count = 0
    for member in members:
        member.user_id = user.id
        member.status = "active"
        count += 1
    
    if count > 0:
        db.commit()
    
    return count


def get_member_by_id(db: Session, member_id: int) -> EventMember | None:
    """Get a member by ID."""
    return db.query(EventMember).filter(EventMember.id == member_id).first()
