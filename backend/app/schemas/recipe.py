"""
Recipe Pydantic schemas.
"""
from pydantic import BaseModel


class RecipeBase(BaseModel):
    name: str


class RecipeCreate(RecipeBase):
    pass


class Recipe(RecipeBase):
    id: int

    class Config:
        from_attributes = True
