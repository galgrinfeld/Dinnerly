"""
CRUD operations for Events.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.models.event import Event
from app.db.models.event_recipe import EventRecipe
from app.db.models.event_member import EventMember
from app.db.models.user import User
from app.db.models.recipe import Recipe
from app.schemas.event import EventCreate, EventUpdate, EventRecipeAttach, EventRead, EventRecipeRead
from app.schemas.auth import EventMemberRead


def serialize_event(db: Session, event: Event) -> EventRead:
    """Convert Event model to EventRead schema with recipe details."""
    # Get all recipes for this event with their details
    event_recipes = (
        db.query(EventRecipe, Recipe)
        .filter(EventRecipe.event_id == event.id)
        .join(Recipe, EventRecipe.recipe_id == Recipe.id)
        .all()
    )
    
    # Build recipe list with details
    recipes = []
    for event_recipe, recipe in event_recipes:
        recipes.append(
            EventRecipeRead(
                recipe_id=recipe.id,
                recipe_name=recipe.name,
                base_servings=recipe.base_servings,
                desired_servings=event_recipe.desired_servings,
            )
        )
    
    # Get all members for this event
    members = db.query(EventMember).filter(EventMember.event_id == event.id).all()
    members_list = [
        EventMemberRead(
            id=member.id,
            email=member.email,
            role=member.role,
            status=member.status,
        )
        for member in members
    ]
    
    return EventRead(
        id=event.id,
        name=event.name,
        event_date=event.event_date,
        target_servings=event.target_servings,
        recipes=recipes,
        members=members_list,
    )


def list_events_for_user(db: Session, user_id: int, limit: int = 50) -> list[Event]:
    """List events accessible to a user (owned or participant in)."""
    # Events where user is owner
    owned = db.query(Event).filter(Event.owner_user_id == user_id).limit(limit).all()
    
    # Events where user is an active participant
    participating = (
        db.query(Event)
        .join(EventMember)
        .filter(
            EventMember.user_id == user_id,
            EventMember.status == "active",
        )
        .limit(limit)
        .all()
    )
    
    # Combine and deduplicate
    seen_ids = set()
    result = []
    for event in owned + participating:
        if event.id not in seen_ids:
            result.append(event)
            seen_ids.add(event.id)
    
    return result


def create_event(db: Session, data: EventCreate, owner_user_id: int) -> Event:
    """Create a new event owned by the user."""
    # Get owner email
    owner_user = db.query(User).filter(User.id == owner_user_id).first()
    if not owner_user:
        raise ValueError("Owner user not found")
    
    db_event = Event(
        name=data.name,
        event_date=data.event_date,
        target_servings=data.target_servings,
        owner_user_id=owner_user_id,
    )
    db.add(db_event)
    db.flush()
    
    # Automatically add owner as event member with role="owner"
    owner_member = EventMember(
        event_id=db_event.id,
        user_id=owner_user_id,
        email=owner_user.email,
        role="owner",
        status="active",
    )
    db.add(owner_member)
    
    db.commit()
    db.refresh(db_event)
    return db_event


def get_event(db: Session, event_id: int) -> Event | None:
    """Get a specific event by ID."""
    return db.query(Event).filter(Event.id == event_id).first()


def get_event_for_user(db: Session, event_id: int, user_id: int) -> Event | None:
    """Get an event if the user owns it or is an active participant."""
    event = get_event(db, event_id)
    if not event:
        return None
    
    # Check if owner
    if event.owner_user_id == user_id:
        return event
    
    # Check if active participant
    member = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
        EventMember.status == "active",
    ).first()
    if member:
        return event
    
    return None


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


def update_event(db: Session, event_id: int, data: EventUpdate, owner_user_id: int) -> Event:
    """Update an event (owner only)."""
    event = get_event(db, event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    if event.owner_user_id != owner_user_id:
        raise ValueError("Only event owner can update")
    
    event.name = data.name
    event.event_date = data.event_date
    event.target_servings = data.target_servings
    
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: int, owner_user_id: int) -> None:
    """Delete an event (owner only)."""
    event = get_event(db, event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    if event.owner_user_id != owner_user_id:
        raise ValueError("Only event owner can delete")
    
    # EventRecipe and EventMember rows will be cascade-deleted
    db.delete(event)
    db.commit()
