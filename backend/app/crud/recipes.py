"""
CRUD operations for Recipes.
"""
from sqlalchemy.orm import Session
from app.db.models.recipe import Recipe
from app.db.models.recipe_ingredient import RecipeIngredient
from app.schemas.recipe import RecipeCreate
from app.crud.ingredients import create_ingredient


def create_recipe(db: Session, payload: RecipeCreate) -> Recipe:
    """Create a new recipe with ingredients."""
    # Create the recipe
    db_recipe = Recipe(
        name=payload.name,
        description=payload.description,
        base_servings=payload.baseServings,
        instructions_html=payload.instructionsHtml,
    )
    db.add(db_recipe)
    db.flush()  # Flush to get the recipe ID without committing
    
    # Create recipe ingredients
    for ing_payload in payload.ingredients:
        # Get or create ingredient
        ingredient = create_ingredient(db, ing_payload.name)
        
        # Create RecipeIngredient junction record
        recipe_ingredient = RecipeIngredient(
            recipe_id=db_recipe.id,
            ingredient_id=ingredient.id,
            quantity=ing_payload.quantity,
            unit=ing_payload.unit,
            note=ing_payload.note,
            optional=ing_payload.optional,
        )
        db.add(recipe_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def list_recipes(db: Session, limit: int = 50) -> list[Recipe]:
    """List all recipes."""
    return db.query(Recipe).limit(limit).all()

