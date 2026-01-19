"""
CRUD operations for Ingredients.
"""
from sqlalchemy.orm import Session
from app.db.models.ingredient import Ingredient
from app.schemas.ingredient import IngredientCreate


def get_ingredients(db: Session, skip: int = 0, limit: int = 100):
    """Get all ingredients."""
    return db.query(Ingredient).offset(skip).limit(limit).all()


def get_ingredient(db: Session, ingredient_id: int):
    """Get a specific ingredient by ID."""
    return db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()


def create_ingredient(db: Session, ingredient: IngredientCreate):
    """Create a new ingredient."""
    db_ingredient = Ingredient(name=ingredient.name)
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient
