"""
CRUD operations for Recipes.
"""
from sqlalchemy.orm import Session, selectinload
from app.db.models.recipe import Recipe
from app.db.models.recipe_ingredient import RecipeIngredient
from app.schemas.recipe import RecipeCreate, RecipeUpdate
from app.crud.ingredients import create_ingredient


def create_recipe(db: Session, payload: RecipeCreate) -> Recipe:
    """Create a new recipe with ingredients."""
    # Create the recipe
    db_recipe = Recipe(
        name=payload.name,
        description=payload.description,
        base_servings=payload.baseServings,
        instructions_html=payload.instructionsHtml,
        image_url=payload.imageUrl or None,
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
    """Get a recipe with all its ingredients and ingredient details loaded."""
    recipe = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient))
        .filter(Recipe.id == recipe_id)
        .first()
    )
    return recipe


def update_recipe(db: Session, recipe_id: int, payload: RecipeUpdate) -> Recipe:
    """Update a recipe and its ingredients atomically."""
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise ValueError(f"Recipe {recipe_id} not found")
    
    # Update basic fields
    recipe.name = payload.name
    recipe.description = payload.description
    recipe.base_servings = payload.baseServings
    recipe.instructions_html = payload.instructionsHtml
    recipe.image_url = payload.imageUrl or None
    
    # Remove existing ingredients
    db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
    db.flush()
    
    # Add new ingredients
    for ing_payload in payload.ingredients:
        ingredient = create_ingredient(db, ing_payload.name)
        recipe_ingredient = RecipeIngredient(
            recipe_id=recipe_id,
            ingredient_id=ingredient.id,
            quantity=ing_payload.quantity,
            unit=ing_payload.unit,
            note=ing_payload.note,
            optional=ing_payload.optional,
        )
        db.add(recipe_ingredient)
    
    db.commit()
    db.refresh(recipe)
    return recipe


def delete_recipe(db: Session, recipe_id: int) -> None:
    """Delete a recipe. Raises ValueError if recipe is attached to events."""
    from app.db.models.event_recipe import EventRecipe
    
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise ValueError(f"Recipe {recipe_id} not found")
    
    # Check if recipe is attached to any events
    event_count = db.query(EventRecipe).filter(EventRecipe.recipe_id == recipe_id).count()
    if event_count > 0:
        raise ValueError(
            f"Recipe is attached to {event_count} event(s). Remove it from events first."
        )
    
    # Delete recipe ingredients first (cascade should handle this, but be explicit)
    db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
    
    # Delete the recipe
    db.delete(recipe)
    db.commit()

