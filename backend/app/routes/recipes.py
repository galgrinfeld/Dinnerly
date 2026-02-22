"""
Recipes routes.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeRead, RecipeListItem, RecipeIngredientRead
from app.crud import recipes as recipes_crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("", response_model=RecipeRead, status_code=201)
def create_recipe(
    payload: RecipeCreate,
    db: Session = Depends(get_db),
):
    """Create a new recipe with ingredients."""
    try:
        recipe = recipes_crud.create_recipe(db, payload)
        
        # Reload to get relationships
        recipe = recipes_crud.get_recipe_with_ingredients(db, recipe.id)
        
        # Convert to RecipeRead with proper ingredient serialization
        ingredients = [
            RecipeIngredientRead.from_orm(ing) for ing in recipe.ingredients
        ]
        return RecipeRead(
            id=recipe.id,
            name=recipe.name,
            description=recipe.description,
            base_servings=recipe.base_servings,
            instructions_html=recipe.instructions_html or "",
            ingredients=ingredients,
        )
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating recipe: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating recipe: {str(e)}")


@router.get("", response_model=List[RecipeListItem])
def list_recipes(
    db: Session = Depends(get_db),
):
    """List all recipes."""
    return recipes_crud.list_recipes(db)


@router.get("/{recipe_id}", response_model=RecipeRead)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific recipe by ID."""
    recipe = recipes_crud.get_recipe_with_ingredients(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Convert Recipe ORM object to RecipeRead with proper nested ingredient conversion
    ingredients = [
        RecipeIngredientRead.from_orm(ing) for ing in recipe.ingredients
    ]
    return RecipeRead(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description,
        base_servings=recipe.base_servings,
        instructions_html=recipe.instructions_html or "",
        ingredients=ingredients,
    )


@router.put("/{recipe_id}", response_model=RecipeRead)
def update_recipe(
    recipe_id: int,
    payload: RecipeUpdate,
    db: Session = Depends(get_db),
):
    """Update a recipe and its ingredients."""
    try:
        recipe = recipes_crud.update_recipe(db, recipe_id, payload)
        
        # Reload to get relationships
        recipe = recipes_crud.get_recipe_with_ingredients(db, recipe.id)
        
        # Convert to RecipeRead with proper ingredient serialization
        ingredients = [
            RecipeIngredientRead.from_orm(ing) for ing in recipe.ingredients
        ]
        return RecipeRead(
            id=recipe.id,
            name=recipe.name,
            description=recipe.description,
            base_servings=recipe.base_servings,
            instructions_html=recipe.instructions_html or "",
            ingredients=ingredients,
        )
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating recipe: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating recipe: {str(e)}")


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
):
    """Delete a recipe."""
    try:
        recipes_crud.delete_recipe(db, recipe_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        if "attached" in str(e).lower():
            raise HTTPException(status_code=409, detail=str(e))
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting recipe: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting recipe: {str(e)}")

