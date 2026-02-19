"""
Recipe Pydantic schemas.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator

# Allowed units for ingredients
ALLOWED_UNITS = {"g", "kg", "ml", "l", "tsp", "tbsp", "cup", "unit", "slice", "to_taste"}


class RecipeIngredientCreate(BaseModel):
    """Schema for creating a recipe ingredient."""
    name: str = Field(..., min_length=1, max_length=255)
    quantity: Optional[float] = Field(None, gt=0)
    unit: str = Field(..., min_length=1, max_length=50)
    note: str = Field(default="", max_length=255)
    optional: bool = Field(default=False)
    
    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        """Validate unit is in allowed list."""
        v_lower = v.lower()
        if v_lower not in ALLOWED_UNITS:
            raise ValueError(f"Unit must be one of {ALLOWED_UNITS}")
        return v_lower
    
    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: Optional[float], info) -> Optional[float]:
        """Ensure quantity is provided unless unit is 'to_taste'."""
        unit = info.data.get("unit", "").lower()
        if unit != "to_taste" and v is None:
            raise ValueError("Quantity is required unless unit is 'to_taste'")
        return v


class RecipeIngredientRead(BaseModel):
    """Schema for reading a recipe ingredient."""
    id: int
    name: str
    quantity: Optional[float]
    unit: str
    note: str
    optional: bool
    ingredient_id: int

    class Config:
        from_attributes = True


class RecipeCreate(BaseModel):
    """Schema for creating a recipe."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="", max_length=2000)
    baseServings: int = Field(..., alias="baseServings", gt=0)
    instructionsHtml: str = Field(default="", alias="instructionsHtml", max_length=5000)
    ingredients: List[RecipeIngredientCreate] = Field(min_length=1)
    
    @field_validator("ingredients")
    @classmethod
    def validate_ingredients(cls, v: List[RecipeIngredientCreate]) -> List[RecipeIngredientCreate]:
        """Ensure at least one ingredient with non-empty name."""
        if not v or not any(ing.name.strip() for ing in v):
            raise ValueError("At least one ingredient with non-empty name is required")
        return v

    class Config:
        populate_by_name = True


class RecipeRead(BaseModel):
    """Schema for reading a recipe with ingredients."""
    id: int
    name: str
    description: str
    baseServings: int = Field(alias="base_servings")
    instructionsHtml: str = Field(alias="instructions_html")
    ingredients: List[RecipeIngredientRead]

    class Config:
        from_attributes = True
        populate_by_name = True


class RecipeListItem(BaseModel):
    """Schema for listing recipes without ingredients."""
    id: int
    name: str
    description: str
    baseServings: int = Field(alias="base_servings")

    class Config:
        from_attributes = True
        populate_by_name = True

