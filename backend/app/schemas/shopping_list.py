"""
Shopping list Pydantic schemas with camelCase.
"""
from pydantic import BaseModel, Field
from typing import Optional


class ShoppingListSource(BaseModel):
    """Source information for a shopping list item - which recipe(s) contributed."""
    recipe_id: int = Field(alias="recipeId")
    recipe_name: str = Field(alias="recipeName")
    original_quantity: Optional[float] = Field(alias="originalQuantity")
    scaled_quantity: Optional[float] = Field(alias="scaledQuantity")
    scale_factor: float = Field(alias="scaleFactor")
    desired_servings: int = Field(alias="desiredServings")
    base_servings: int = Field(alias="baseServings")
    
    class Config:
        populate_by_name = True
        from_attributes = True


class ShoppingListItem(BaseModel):
    """A single item in the shopping list."""
    ingredient_id: int = Field(alias="ingredientId")
    ingredient_name: str = Field(alias="ingredientName")
    unit: str
    quantity: Optional[float] = None
    optional: bool = False
    sources: list[ShoppingListSource] = []
    assigned_member_id: Optional[int] = Field(None, alias="assignedMemberId")
    assigned_member_email: Optional[str] = Field(None, alias="assignedMemberEmail")
    
    class Config:
        populate_by_name = True
        from_attributes = True


class ShoppingListResponse(BaseModel):
    """Complete shopping list response for an event."""
    items: list[ShoppingListItem] = []
    
    class Config:
        populate_by_name = True
        from_attributes = True

class IngredientAssignmentRequest(BaseModel):
    """Request to assign an ingredient to a participant."""
    event_member_id: int = Field(alias="eventMemberId")
    
    class Config:
        populate_by_name = True