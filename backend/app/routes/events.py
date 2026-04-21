"""
Events routes.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventRead, EventRecipeAttach
from app.schemas.auth import ParticipantAddRequest, EventMemberRead
from app.schemas.shopping_list import ShoppingListResponse
from app.crud import events as events_crud
from app.crud import event_members as event_members_crud
from app.services.shopping_list_generator import generate_shopping_list_for_event
from app.api.deps import get_current_user, is_event_owner, is_event_member

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventRead, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new event."""
    if payload.target_servings <= 0:
        raise HTTPException(status_code=422, detail="targetServings must be greater than 0")
    event = events_crud.create_event(db, payload, owner_user_id=current_user.id)
    return events_crud.serialize_event(db, event)


@router.get("", response_model=List[EventRead])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List events accessible to current user (owned or participant in)."""
    events = events_crud.list_events_for_user(db, user_id=current_user.id)
    return [events_crud.serialize_event(db, event) for event in events]


@router.get("/{event_id}", response_model=EventRead)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific event by ID (must be owner or participant)."""
    event = events_crud.get_event_for_user(db, event_id, current_user.id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or access denied")
    return events_crud.serialize_event(db, event)


@router.post("/{event_id}/recipes", response_model=EventRead)
def attach_recipe_to_event(
    event_id: int,
    payload: EventRecipeAttach,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Attach a recipe to an event (owner or participant only)."""
    if payload.desired_servings <= 0:
        raise HTTPException(status_code=422, detail="desiredServings must be greater than 0")
    
    # Check access
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        event = events_crud.attach_recipe_to_event(db, event_id, payload)
        return events_crud.serialize_event(db, event)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{event_id}/shopping-list", response_model=ShoppingListResponse)
def get_shopping_list(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the shopping list for an event (owner or participant only)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return generate_shopping_list_for_event(db, event_id)


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an event's name and target servings (owner only)."""
    if payload.target_servings <= 0:
        raise HTTPException(status_code=422, detail="targetServings must be greater than 0")
    
    try:
        event = events_crud.update_event(db, event_id, payload, owner_user_id=current_user.id)
        return events_crud.serialize_event(db, event)
    except ValueError as e:
        if "not found" in str(e).lower() or "owner" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating event: {str(e)}")


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an event (owner only)."""
    try:
        events_crud.delete_event(db, event_id, owner_user_id=current_user.id)
    except ValueError as e:
        if "not found" in str(e).lower() or "owner" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting event: {str(e)}")


@router.post("/{event_id}/participants", response_model=EventMemberRead, status_code=201)
def add_participant(
    event_id: int,
    payload: ParticipantAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a participant to an event (owner only)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not is_event_owner(event, current_user):
        raise HTTPException(status_code=403, detail="Only event owner can add participants")
    
    try:
        # Normalize email to lowercase
        email = payload.email.lower()
        member = event_members_crud.add_participant(db, event_id, email)
        return EventMemberRead.from_orm(member)
    except Exception as e:
        logger.error(f"Error adding participant: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error adding participant: {str(e)}")


@router.get("/{event_id}/participants", response_model=List[EventMemberRead])
def list_participants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List participants of an event (owner or participant can view)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    members = event_members_crud.list_members(db, event_id)
    return [EventMemberRead.from_orm(m) for m in members]


@router.delete("/{event_id}/participants/{member_id}", status_code=204)
def remove_participant(
    event_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a participant from an event (owner only)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not is_event_owner(event, current_user):
        raise HTTPException(status_code=403, detail="Only event owner can remove participants")
    
    success = event_members_crud.remove_member(db, event_id, member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Participant not found")
