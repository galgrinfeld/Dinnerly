"""
CRUD operations for Events.
"""
from sqlalchemy.orm import Session
from app.db.models.event import Event
from app.schemas.event import EventCreate


def get_events(db: Session, skip: int = 0, limit: int = 100):
    """Get all events."""
    return db.query(Event).offset(skip).limit(limit).all()


def get_event(db: Session, event_id: int):
    """Get a specific event by ID."""
    return db.query(Event).filter(Event.id == event_id).first()


def create_event(db: Session, event: EventCreate):
    """Create a new event."""
    db_event = Event(name=event.name)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event
