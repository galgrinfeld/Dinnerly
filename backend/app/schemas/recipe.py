"""
Recipe Pydantic schemas.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict

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
    ingredient_id: int = Field(alias="ingredientId")
    quantity: Optional[float] = None
    unit: str
    note: str = ""
    optional: bool = False
    ingredient_name: str = Field(alias="ingredientName", default="")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @classmethod
    def from_orm(cls, obj):
        """Custom ORM conversion to get ingredient name from relationship."""
        data = {
            "id": obj.id,
            "ingredient_id": obj.ingredient_id,
            "quantity": float(obj.quantity) if obj.quantity else None,
            "unit": obj.unit,
            "note": obj.note or "",
            "optional": bool(obj.optional),
            "ingredient_name": obj.ingredient.name if obj.ingredient else "",
        }
        return cls(**data)


class RecipeCreate(BaseModel):
    """Schema for creating a recipe."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="", max_length=2000)
    baseServings: int = Field(..., gt=0, alias="baseServings")
    instructionsHtml: str = Field(default="", max_length=5000, alias="instructionsHtml")
    imageUrl: Optional[str] = Field(None, max_length=2000, alias="imageUrl")
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


class RecipeUpdate(BaseModel):
    """Schema for updating a recipe."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="", max_length=2000)
    baseServings: int = Field(..., gt=0, alias="baseServings")
    instructionsHtml: str = Field(default="", max_length=5000, alias="instructionsHtml")
    imageUrl: Optional[str] = Field(None, max_length=2000, alias="imageUrl")
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
    base_servings: int = Field(alias="baseServings")
    instructions_html: str = Field(alias="instructionsHtml", default="")
    image_url: Optional[str] = Field(alias="imageUrl", default=None)
    ingredients: List[RecipeIngredientRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_priority=True)


class RecipeListItem(BaseModel):
    """Schema for listing recipes without ingredients."""
    id: int
    name: str
    description: str
    base_servings: int = Field(alias="baseServings")
    image_url: Optional[str] = Field(alias="imageUrl", default=None)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_priority=True)

