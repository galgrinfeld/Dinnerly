"""
Ingredient Pydantic schemas.
"""
from pydantic import BaseModel, Field


class IngredientCreate(BaseModel):
    """Schema for creating an ingredient."""
    name: str = Field(..., min_length=1, max_length=255)


class IngredientRead(BaseModel):
    """Schema for reading an ingredient."""
    id: int
    name: str

    class Config:
        from_attributes = True

