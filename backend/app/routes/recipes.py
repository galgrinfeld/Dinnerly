"""
Recipes routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.recipe import Recipe
from typing import List

router = APIRouter(tags=["recipes"])


@router.get("/recipes", response_model=List[Recipe])
def get_recipes(db: Session = Depends(get_db)):
    """Get all recipes."""
    return []
