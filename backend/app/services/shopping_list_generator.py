"""
Shopping list generator service.
Generates unified shopping lists from multiple event recipes with smart merging.
"""
from decimal import Decimal
from typing import DefaultDict
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.models.event_recipe import EventRecipe
from app.db.models.recipe import Recipe
from app.db.models.recipe_ingredient import RecipeIngredient
from app.db.models.ingredient import Ingredient
from app.db.models.event_member import EventMember
from app.schemas.shopping_list import ShoppingListItem, ShoppingListSource, ShoppingListResponse
from app.crud import event_ingredient_assignments


def generate_shopping_list_for_event(db: Session, event_id: int) -> ShoppingListResponse:
    """
    Generate a shopping list based on recipes for a given event.
    
    Merges ingredients from all recipes attached to the event, applying scaling based on
    desired_servings vs recipe base_servings. Uses deterministic merging by
    (ingredient_id, unit, optional) key.
    
    Args:
        db: Database session
        event_id: The ID of the event
    
    Returns:
        ShoppingListResponse with merged items and source traceability
    """
    # Get all event recipes with their recipes
    event_recipes = (
        db.query(EventRecipe, Recipe)
        .filter(EventRecipe.event_id == event_id)
        .join(Recipe, EventRecipe.recipe_id == Recipe.id)
        .all()
    )

    # Merge map: (ingredient_id, unit, optional) -> {quantity_sum, sources}
    merge_map: DefaultDict[tuple, dict] = defaultdict(
        lambda: {"quantity": Decimal(0), "sources": []}
    )

    # Track ingredient metadata
    ingredient_meta: dict[int, dict] = {}

    for event_recipe, recipe in event_recipes:
        # Calculate scaling factor
        scaling_factor = Decimal(event_recipe.desired_servings) / Decimal(recipe.base_servings)

        # Get recipe ingredients
        recipe_ingredients = (
            db.query(RecipeIngredient, Ingredient)
            .filter(RecipeIngredient.recipe_id == recipe.id)
            .join(Ingredient, RecipeIngredient.ingredient_id == Ingredient.id)
            .all()
        )

        for recipe_ingredient, ingredient in recipe_ingredients:
            # Store ingredient metadata
            if ingredient.id not in ingredient_meta:
                ingredient_meta[ingredient.id] = {
                    "id": ingredient.id,
                    "name": ingredient.name,
                }

            # Merge key
            merge_key = (
                ingredient.id,
                recipe_ingredient.unit,
                recipe_ingredient.optional or False,
            )

            # Calculate scaled quantity
            original_qty = None
            if recipe_ingredient.quantity is not None:
                original_qty = Decimal(str(recipe_ingredient.quantity))
                scaled_qty = original_qty * scaling_factor
                # Round to 2 decimal places
                scaled_qty = Decimal(str(round(float(scaled_qty), 2)))
            else:
                scaled_qty = None

            # Update merge map
            if scaled_qty is not None:
                merge_map[merge_key]["quantity"] += scaled_qty

            # Add source tracking
            merge_map[merge_key]["sources"].append(
                {
                    "recipe_id": recipe.id,
                    "recipe_name": recipe.name,
                    "original_quantity": float(original_qty) if original_qty is not None else None,
                    "scaled_quantity": float(scaled_qty) if scaled_qty is not None else None,
                    "scale_factor": float(scaling_factor),
                    "desired_servings": event_recipe.desired_servings,
                    "base_servings": recipe.base_servings,
                }
            )


    # Get all assignments for this event
    assignments = event_ingredient_assignments.get_assignments_for_event(db, event_id)
    # Build assignment lookup: ingredient_id -> EventMember
    assignment_map = {}
    for assignment in assignments:
        member = db.query(EventMember).filter(
            EventMember.id == assignment.event_member_id
        ).first()
        if member:
            assignment_map[assignment.ingredient_id] = member

    # Convert merge map to shopping list items
    items: list[ShoppingListItem] = []
    for (ingredient_id, unit, optional), merge_data in merge_map.items():
        ingredient_info = ingredient_meta[ingredient_id]
        sources = [ShoppingListSource(**source) for source in merge_data["sources"]]

        # Get assignment info if it exists
        assigned_member = assignment_map.get(ingredient_id)
        
        item = ShoppingListItem(
            ingredient_id=ingredient_id,
            ingredient_name=ingredient_info["name"],
            unit=unit,
            quantity=float(merge_data["quantity"]) if merge_data["quantity"] else None,
            optional=optional,
            sources=sources,
            assigned_member_id=assigned_member.id if assigned_member else None,
            assigned_member_email=assigned_member.email if assigned_member else None,
        )
        items.append(item)

    # Sort by ingredient name, then unit
    items.sort(key=lambda x: (x.ingredient_name, x.unit or ""))

    return ShoppingListResponse(items=items)
