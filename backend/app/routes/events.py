"""
Events routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.event import Event
from typing import List

router = APIRouter(tags=["events"])


@router.get("/events", response_model=List[Event])
def get_events(db: Session = Depends(get_db)):
    """Get all events."""
    return []
