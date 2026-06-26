"""
CRUD operations for Recipes.
"""
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func
from app.db.models.recipe import Recipe
from app.db.models.recipe_ingredient import RecipeIngredient
from app.schemas.recipe import RecipeCreate, RecipeUpdate
from app.crud.ingredients import create_ingredient


def create_recipe(db: Session, payload: RecipeCreate, owner_user_id: int) -> Recipe:
    """Create a new recipe with ingredients."""
    # Create the recipe
    db_recipe = Recipe(
        name=payload.name,
        description=payload.description,
        base_servings=payload.baseServings,
        instructions_html=payload.instructionsHtml,
        image_url=payload.imageUrl or None,
        cooking_time_minutes=payload.cookingTimeMinutes,
        owner_user_id=owner_user_id,
        is_public=payload.isPublic,
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


def list_recipes(db: Session, owner_user_id: int, limit: int = 50) -> list[Recipe]:
    """List recipes owned by a specific user."""
    return db.query(Recipe).filter(Recipe.owner_user_id == owner_user_id).limit(limit).all()


def get_recipe_by_name(db: Session, name: str, owner_user_id: int) -> Recipe | None:
    """Get a user's recipe by name using case-insensitive exact matching."""
    normalized_name = name.strip().lower()
    if not normalized_name:
        return None
    return (
        db.query(Recipe)
        .filter(
            Recipe.owner_user_id == owner_user_id,
            func.lower(Recipe.name) == normalized_name,
        )
        .order_by(Recipe.id.asc())
        .first()
    )


def get_recipe_by_id(db: Session, recipe_id: int, owner_user_id: int = None) -> Recipe | None:
    """
    Get a recipe by ID.
    If owner_user_id is provided, only returns if the user owns it.
    """
    query = db.query(Recipe).filter(Recipe.id == recipe_id)
    if owner_user_id is not None:
        query = query.filter(Recipe.owner_user_id == owner_user_id)
    return query.first()


def get_recipe_with_ingredients(db: Session, recipe_id: int, owner_user_id: int = None) -> Recipe | None:
    """
    Get a recipe with all its ingredients and ingredient details loaded.
    If owner_user_id is provided, only returns if the user owns it.
    """
    query = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient))
        .filter(Recipe.id == recipe_id)
    )
    if owner_user_id is not None:
        query = query.filter(Recipe.owner_user_id == owner_user_id)
    return query.first()


def update_recipe(db: Session, recipe_id: int, payload: RecipeUpdate, owner_user_id: int) -> Recipe:
    """Update a recipe and its ingredients atomically. Enforces ownership."""
    recipe = get_recipe_by_id(db, recipe_id, owner_user_id)
    if not recipe:
        raise ValueError(f"Recipe {recipe_id} not found or access denied")
    
    # Update basic fields
    recipe.name = payload.name
    recipe.description = payload.description
    recipe.base_servings = payload.baseServings
    recipe.instructions_html = payload.instructionsHtml
    recipe.image_url = payload.imageUrl or None
    recipe.cooking_time_minutes = payload.cookingTimeMinutes
    recipe.is_public = payload.isPublic
    
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


def delete_recipe(db: Session, recipe_id: int, owner_user_id: int) -> None:
    """Delete a recipe. Enforces ownership. Raises ValueError if not owner or attached to events."""
    from app.db.models.event_recipe import EventRecipe
    
    recipe = get_recipe_by_id(db, recipe_id, owner_user_id)
    if not recipe:
        raise ValueError(f"Recipe {recipe_id} not found or access denied")
    
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


def list_public_recipes(db: Session, limit: int = 100) -> list[Recipe]:
    """List recipes shared to the public recipe pool."""
    return (
        db.query(Recipe)
        .filter(Recipe.is_public.is_(True))
        .order_by(Recipe.name.asc(), Recipe.id.asc())
        .limit(limit)
        .all()
    )


def get_public_recipe_with_ingredients(db: Session, recipe_id: int) -> Recipe | None:
    """Get a public recipe with ingredients loaded."""
    return (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient))
        .filter(Recipe.id == recipe_id, Recipe.is_public.is_(True))
        .first()
    )


def find_saved_clone(db: Session, source_recipe_id: int, owner_user_id: int) -> Recipe | None:
    """Find an existing private clone saved from a public recipe."""
    return (
        db.query(Recipe)
        .filter(
            Recipe.owner_user_id == owner_user_id,
            Recipe.source_recipe_id == source_recipe_id,
        )
        .order_by(Recipe.id.asc())
        .first()
    )


def clone_public_recipe(db: Session, source_recipe: Recipe, owner_user_id: int) -> Recipe:
    """Clone a public recipe into a user's private recipe collection."""
    existing = find_saved_clone(db, source_recipe.id, owner_user_id)
    if existing:
        return existing

    clone = Recipe(
        name=source_recipe.name,
        description=source_recipe.description,
        base_servings=source_recipe.base_servings,
        instructions_html=source_recipe.instructions_html,
        image_url=source_recipe.image_url,
        cooking_time_minutes=source_recipe.cooking_time_minutes,
        owner_user_id=owner_user_id,
        is_public=False,
        source_recipe_id=source_recipe.id,
    )
    db.add(clone)
    db.flush()

    for source_ingredient in source_recipe.ingredients:
        db.add(
            RecipeIngredient(
                recipe_id=clone.id,
                ingredient_id=source_ingredient.ingredient_id,
                quantity=source_ingredient.quantity,
                unit=source_ingredient.unit,
                note=source_ingredient.note,
                optional=source_ingredient.optional,
            )
        )

    db.commit()
    return get_recipe_with_ingredients(db, clone.id, owner_user_id) or clone

