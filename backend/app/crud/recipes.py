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


def get_recipe_by_id(db: Session, recipe_id: int) -> Recipe | None:
    """Get a specific recipe by ID."""
    return db.query(Recipe).filter(Recipe.id == recipe_id).first()


def get_recipe_with_ingredients(db: Session, recipe_id: int) -> Recipe | None:
    """Get a recipe with all its ingredients loaded."""
    recipe = get_recipe_by_id(db, recipe_id)
    if recipe:
        # Ensure ingredients are loaded
        _ = recipe.ingredients
    return recipe

