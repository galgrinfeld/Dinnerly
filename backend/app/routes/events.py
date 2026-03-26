"""
Events routes.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.event import EventCreate, EventUpdate, EventRead, EventRecipeAttach
from app.schemas.shopping_list import ShoppingListResponse
from app.crud import events as events_crud
from app.services.shopping_list_generator import generate_shopping_list_for_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventRead, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
):
    """Create a new event."""
    if payload.target_servings <= 0:
        raise HTTPException(status_code=422, detail="targetServings must be greater than 0")
    return events_crud.create_event(db, payload)


@router.get("", response_model=List[EventRead])
def list_events(
    db: Session = Depends(get_db),
):
    """List all events."""
    return events_crud.list_events(db)


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get a specific event by ID."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/{event_id}/recipes", response_model=EventRead)
def attach_recipe_to_event(
    event_id: int,
    payload: EventRecipeAttach,
    db: Session = Depends(get_db),
):
    """Attach a recipe to an event or update its desired servings."""
    if payload.desired_servings <= 0:
        raise HTTPException(status_code=422, detail="desiredServings must be greater than 0")
    
    try:
        return events_crud.attach_recipe_to_event(db, event_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{event_id}/shopping-list", response_model=ShoppingListResponse)
def get_shopping_list(event_id: int, db: Session = Depends(get_db)):
    """Get the shopping list for an event."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return generate_shopping_list_for_event(db, event_id)


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
):
    """Update an event's name and target servings."""
    if payload.target_servings <= 0:
        raise HTTPException(status_code=422, detail="targetServings must be greater than 0")
    
    try:
        return events_crud.update_event(db, event_id, payload)
    except ValueError as e:
        if "not found" in str(e).lower():
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
):
    """Delete an event."""
    try:
        events_crud.delete_event(db, event_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting event: {str(e)}")
