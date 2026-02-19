"""
Recipes routes.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.recipe import RecipeCreate, RecipeRead, RecipeListItem
from app.crud import recipes as recipes_crud

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("", response_model=RecipeRead, status_code=201)
def create_recipe(
    payload: RecipeCreate,
    db: Session = Depends(get_db),
):
    """Create a new recipe with ingredients."""
    try:
        return recipes_crud.create_recipe(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("", response_model=List[RecipeListItem])
def list_recipes(
    db: Session = Depends(get_db),
):
    """List all recipes."""
    return recipes_crud.list_recipes(db)

