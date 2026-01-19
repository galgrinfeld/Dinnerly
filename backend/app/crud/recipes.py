"""
CRUD operations for Recipes.
"""
from sqlalchemy.orm import Session
from app.db.models.recipe import Recipe
from app.schemas.recipe import RecipeCreate


def get_recipes(db: Session, skip: int = 0, limit: int = 100):
    """Get all recipes."""
    return db.query(Recipe).offset(skip).limit(limit).all()


def get_recipe(db: Session, recipe_id: int):
    """Get a specific recipe by ID."""
    return db.query(Recipe).filter(Recipe.id == recipe_id).first()


def create_recipe(db: Session, recipe: RecipeCreate):
    """Create a new recipe."""
    db_recipe = Recipe(name=recipe.name)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe
