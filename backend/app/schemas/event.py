"""
Event Pydantic schemas with camelCase.
"""
from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    """Schema for creating an event."""
    name: str = Field(..., min_length=1, max_length=255)
    target_servings: int = Field(alias="targetServings", gt=0)
    
    class Config:
        populate_by_name = True


class EventUpdate(BaseModel):
    """Schema for updating an event."""
    name: str = Field(..., min_length=1, max_length=255)
    target_servings: int = Field(alias="targetServings", gt=0)
    
    class Config:
        populate_by_name = True


class EventRecipeAttach(BaseModel):
    """Schema for attaching a recipe to an event."""
    recipe_id: int = Field(alias="recipeId")
    desired_servings: int = Field(alias="desiredServings", gt=0)
    
    class Config:
        populate_by_name = True


class EventRecipeRead(BaseModel):
    """Schema for reading an event-recipe relationship."""
    recipe_id: int = Field(alias="recipeId")
    desired_servings: int = Field(alias="desiredServings")
    
    class Config:
        populate_by_name = True
        from_attributes = True


class EventRead(BaseModel):
    """Schema for reading an event."""
    id: int
    name: str
    target_servings: int = Field(alias="targetServings")
    recipes: list[EventRecipeRead] = []
    
    class Config:
        from_attributes = True
        populate_by_name = True

