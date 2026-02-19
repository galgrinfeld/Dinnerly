"""
Events routes.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.event import EventCreate, EventRead
from app.crud import events as events_crud

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

