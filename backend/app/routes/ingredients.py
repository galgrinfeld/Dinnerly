"""
Ingredients routes.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.ingredient import IngredientCreate, IngredientRead
from app.crud import ingredients as ingredients_crud

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("", response_model=List[IngredientRead])
def get_ingredients(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all ingredients, optionally filtered by search query."""
    return ingredients_crud.get_ingredients(db, q=q)


@router.post("", response_model=IngredientRead, status_code=201)
def create_ingredient(
    payload: IngredientCreate,
    db: Session = Depends(get_db),
):
    """Create a new ingredient. Returns 409 if ingredient already exists."""
    existing = ingredients_crud.get_by_name(db, payload.name)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Ingredient with name '{payload.name}' already exists",
        )
    return ingredients_crud.create_ingredient(db, payload.name)

