"""
CRUD operations for Events.
"""
from sqlalchemy.orm import Session
from app.db.models.event import Event
from app.schemas.event import EventCreate


def list_events(db: Session, limit: int = 50) -> list[Event]:
    """List all events."""
    return db.query(Event).limit(limit).all()


def create_event(db: Session, data: EventCreate) -> Event:
    """Create a new event."""
    db_event = Event(name=data.name, target_servings=data.target_servings)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

