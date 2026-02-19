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


class EventRead(BaseModel):
    """Schema for reading an event."""
    id: int
    name: str
    target_servings: int = Field(alias="target_servings")
    
    class Config:
        from_attributes = True
        populate_by_name = True

