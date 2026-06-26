"""Public recipe pool routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import recipes as recipes_crud
from app.db.models.recipe import Recipe
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.recipe import RecipeIngredientRead, RecipeListItem, RecipeRead, SimilarRecipeItem
from app.services.recipe_recommendations import recommend_similar_public_recipes


router = APIRouter(prefix="/public-recipes", tags=["public-recipes"])


def _recipe_to_read(recipe: Recipe) -> RecipeRead:
    return RecipeRead(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description or "",
        base_servings=recipe.base_servings,
        cooking_time_minutes=recipe.cooking_time_minutes,
        instructions_html=recipe.instructions_html or "",
        image_url=recipe.image_url,
        is_public=recipe.is_public,
        source_recipe_id=recipe.source_recipe_id,
        ingredients=[RecipeIngredientRead.from_orm(item) for item in recipe.ingredients],
    )


def _recipe_to_list_item(recipe: Recipe) -> RecipeListItem:
    return RecipeListItem(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description or "",
        cooking_time_minutes=recipe.cooking_time_minutes,
        base_servings=recipe.base_servings,
        image_url=recipe.image_url,
        is_public=recipe.is_public,
        source_recipe_id=recipe.source_recipe_id,
    )


@router.get("", response_model=list[RecipeListItem])
def list_public_recipes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List recipes shared to the public recipe pool."""
    return [_recipe_to_list_item(recipe) for recipe in recipes_crud.list_public_recipes(db)]


@router.get("/{recipe_id}", response_model=RecipeRead)
def get_public_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a public recipe by ID."""
    recipe = recipes_crud.get_public_recipe_with_ingredients(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Public recipe not found")
    return _recipe_to_read(recipe)


@router.post("/{recipe_id}/save", response_model=RecipeRead)
def save_public_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a private editable copy of a public recipe."""
    recipe = recipes_crud.get_public_recipe_with_ingredients(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Public recipe not found")
    clone = recipes_crud.clone_public_recipe(db, recipe, current_user.id)
    return _recipe_to_read(clone)


@router.get("/{recipe_id}/similar", response_model=list[SimilarRecipeItem])
def get_similar_public_recipes(
    recipe_id: int,
    limit: int = Query(4, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the K nearest public recipes for a public recipe."""
    recipe = recipes_crud.get_public_recipe_with_ingredients(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Public recipe not found")

    recommendations = recommend_similar_public_recipes(db, recipe, limit=limit)
    return [
        SimilarRecipeItem(
            **_recipe_to_list_item(candidate).model_dump(by_alias=False),
            similarity_score=score,
        )
        for candidate, score in recommendations
    ]
