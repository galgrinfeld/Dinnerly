"""
CRUD operations for Ingredients.
"""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models.ingredient import Ingredient


def normalize_name(name: str) -> str:
    """Normalize ingredient name: strip, collapse spaces, lowercase for comparison."""
    return " ".join(name.strip().split()).lower()


def get_ingredients(db: Session, q: Optional[str] = None, limit: int = 50) -> list[Ingredient]:
    """Get all ingredients, optionally filtered by search query (case-insensitive contains)."""
    query = db.query(Ingredient)
    if q:
        query = query.filter(func.lower(Ingredient.name).contains(func.lower(q.strip())))
    return query.limit(limit).all()


def get_by_name(db: Session, name: str) -> Optional[Ingredient]:
    """Get ingredient by name (case-insensitive)."""
    normalized = normalize_name(name)
    return db.query(Ingredient).filter(
        func.lower(Ingredient.name) == normalized
    ).first()


def create_ingredient(db: Session, name: str) -> Ingredient:
    """Create a new ingredient or return existing one with same name (case-insensitive)."""
    # Check if ingredient already exists (case-insensitive)
    existing = get_by_name(db, name)
    if existing:
        return existing
    
    # Normalize: store trimmed name with original casing
    trimmed_name = name.strip()
    
    db_ingredient = Ingredient(name=trimmed_name)
    db.add(db_ingredient)
    db.flush()  # Flush to get the ID without committing
    return db_ingredient

