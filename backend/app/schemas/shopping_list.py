"""
Shopping list Pydantic schemas.
"""
from pydantic import BaseModel
from typing import List


class ShoppingListItem(BaseModel):
    name: str
    quantity: int = 1


class ShoppingList(BaseModel):
    event_id: int
    items: List[ShoppingListItem] = []

    class Config:
        from_attributes = True
