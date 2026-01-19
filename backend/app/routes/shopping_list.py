"""
Shopping list routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.shopping_list import ShoppingList

router = APIRouter(tags=["shopping-list"])


@router.get("/events/{event_id}/shopping-list", response_model=ShoppingList)
def get_shopping_list(event_id: int, db: Session = Depends(get_db)):
    """Get shopping list for an event."""
    return {"event_id": event_id, "items": []}
