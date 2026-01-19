"""
Ingredients routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.ingredient import Ingredient
from typing import List

router = APIRouter(tags=["ingredients"])


@router.get("/ingredients", response_model=List[Ingredient])
def get_ingredients(db: Session = Depends(get_db)):
    """Get all ingredients."""
    return []
