"""
Notification Pydantic schemas with camelCase.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class NotificationRead(BaseModel):
    """Schema for reading a notification."""
    id: int
    user_id: int = Field(..., alias="userId")
    type: str
    title: str
    message: str
    is_read: bool = Field(..., alias="isRead")
    created_at: datetime = Field(..., alias="createdAt")
    related_event_id: Optional[int] = Field(None, alias="relatedEventId")
    related_recipe_id: Optional[int] = Field(None, alias="relatedRecipeId")
    related_user_id: Optional[int] = Field(None, alias="relatedUserId")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class NotificationMarkRead(BaseModel):
    """Schema for marking a notification as read."""
    is_read: bool = Field(..., alias="isRead")
    
    class Config:
        populate_by_name = True


class UnreadCountResponse(BaseModel):
    """Schema for unread notification count response."""
    count: int
