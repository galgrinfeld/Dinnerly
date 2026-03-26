"""
CRUD operations for Events.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.models.event import Event
from app.db.models.event_recipe import EventRecipe
from app.schemas.event import EventCreate, EventUpdate, EventRecipeAttach


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


def get_event(db: Session, event_id: int) -> Event | None:
    """Get a specific event by ID."""
    return db.query(Event).filter(Event.id == event_id).first()


def attach_recipe_to_event(
    db: Session, event_id: int, recipe_attach: EventRecipeAttach
) -> Event:
    """Attach a recipe to an event or update desired servings if already attached."""
    event = get_event(db, event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")

    # Check if recipe already attached
    existing = (
        db.query(EventRecipe)
        .filter(EventRecipe.event_id == event_id, EventRecipe.recipe_id == recipe_attach.recipe_id)
        .first()
    )

    if existing:
        # Update desired servings
        existing.desired_servings = recipe_attach.desired_servings
    else:
        # Create new event-recipe link
        event_recipe = EventRecipe(
            event_id=event_id,
            recipe_id=recipe_attach.recipe_id,
            desired_servings=recipe_attach.desired_servings,
        )
        db.add(event_recipe)

    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event_id: int, data: EventUpdate) -> Event:
    """Update an event's name and target servings."""
    event = get_event(db, event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    event.name = data.name
    event.target_servings = data.target_servings
    
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: int) -> None:
    """Delete an event and its associated event-recipe records."""
    event = get_event(db, event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    # EventRecipe rows will be cascade-deleted by the database
    # because Event.recipes has cascade="all, delete-orphan"
    db.delete(event)
    db.commit()
