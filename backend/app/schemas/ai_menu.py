"""Schemas for the AI menu assistant."""
from typing import List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

from app.schemas.recipe import ALLOWED_UNITS, RecipeRead


class AiRecipeSuggestion(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    reason: str = Field(..., min_length=1, max_length=500)

    @field_validator("name", "category", "reason")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value cannot be empty")
        return value


class AiSuggestionsResponse(BaseModel):
    suggestions: List[AiRecipeSuggestion] = Field(..., min_length=3, max_length=5)


class AiCreateRecipeRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)

    @field_validator("name", "category")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value cannot be empty")
        return value


class GeneratedIngredient(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=50)
    note: str = Field(default="", max_length=255, validation_alias="notes")
    optional: bool = False

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("name", "unit")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, value: str) -> str:
        value = value.lower().strip()
        aliases = {
            "gram": "g",
            "grams": "g",
            "kilogram": "kg",
            "kilograms": "kg",
            "milliliter": "ml",
            "milliliters": "ml",
            "millilitre": "ml",
            "millilitres": "ml",
            "liter": "l",
            "liters": "l",
            "litre": "l",
            "litres": "l",
            "teaspoon": "tsp",
            "teaspoons": "tsp",
            "tablespoon": "tbsp",
            "tablespoons": "tbsp",
            "cups": "cup",
            "slices": "slice",
            "clove": "unit",
            "cloves": "unit",
            "piece": "unit",
            "pieces": "unit",
            "item": "unit",
            "items": "unit",
            "can": "unit",
            "cans": "unit",
            "bunch": "unit",
            "bunches": "unit",
            "head": "unit",
            "heads": "unit",
            "stalk": "unit",
            "stalks": "unit",
            "pinch": "to_taste",
            "pinches": "to_taste",
        }
        value = aliases.get(value, value)
        if value not in ALLOWED_UNITS:
            raise ValueError(f"Unit must be one of {sorted(ALLOWED_UNITS)}")
        return value


class GeneratedRecipe(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="A delicious addition to your dinner menu.", max_length=2000)
    base_servings: int = Field(..., alias="baseServings", gt=0, le=100)
    cooking_time_minutes: int = Field(..., alias="cookingTimeMinutes", gt=0, le=1440)
    instructions_html: str = Field(
        ...,
        alias="instructionsHtml",
        validation_alias=AliasChoices("instructionsHtml", "instructions"),
        min_length=1,
        max_length=5000,
    )
    image_url: Optional[str] = Field(default=None, alias="imageUrl", max_length=2000)
    image_search_query: Optional[str] = Field(default=None, alias="imageSearchQuery", max_length=255)
    ingredients: List[GeneratedIngredient] = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("name", "instructions_html")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value cannot be empty")
        return value

    @field_validator("description")
    @classmethod
    def description_fallback(cls, value: str) -> str:
        return value.strip() or "A delicious addition to your dinner menu."


class AiCreateRecipeResponse(BaseModel):
    recipe_id: int = Field(alias="recipeId")
    event_id: int = Field(alias="eventId")
    message: str
    recipe: RecipeRead

    model_config = ConfigDict(populate_by_name=True)
