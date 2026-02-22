"""
Shopping list routes.
Note: Shopping list endpoint is now integrated into events routes as GET /events/{event_id}/shopping-list
This module is kept for backward compatibility if needed.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.shopping_list import ShoppingListResponse
from app.crud import events as events_crud
from app.services.shopping_list_generator import generate_shopping_list_for_event

router = APIRouter(tags=["shopping-list"])


@router.get("/events/{event_id}/shopping-list", response_model=ShoppingListResponse)
def get_shopping_list(event_id: int, db: Session = Depends(get_db)):
    """Get shopping list for an event."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return generate_shopping_list_for_event(db, event_id)
