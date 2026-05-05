"""
Friend Request Pydantic schemas with camelCase.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class FriendRequestCreate(BaseModel):
    """Schema for creating a friend request."""
    receiver_user_id: int = Field(..., alias="receiverUserId")
    
    class Config:
        populate_by_name = True


class FriendRequestAddByEmail(BaseModel):
    """Schema for creating a friend request by email."""
    email: str = Field(..., min_length=1)
    
    class Config:
        populate_by_name = True


class FriendRequestRead(BaseModel):
    """Schema for reading a friend request."""
    id: int
    sender_user_id: int = Field(..., alias="senderUserId")
    receiver_user_id: int = Field(..., alias="receiverUserId")
    status: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    # Include sender and receiver user info
    sender: Optional["UserBasic"] = None
    receiver: Optional["UserBasic"] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True


class UserBasic(BaseModel):
    """Basic user info."""
    id: int
    email: str
    display_name: Optional[str] = Field(None, alias="displayName")
    
    class Config:
        from_attributes = True
        populate_by_name = True


# Update forward references
FriendRequestRead.model_rebuild()


class FriendRequestResponse(BaseModel):
    """Generic response for friend request operations."""
    message: str
    request: Optional[FriendRequestRead] = None
    
    class Config:
        populate_by_name = True
        from_attributes = True


class FriendsListResponse(BaseModel):
    """Response for getting friends list."""
    friends: list[UserBasic]
    count: int
    
    class Config:
        populate_by_name = True
        from_attributes = True
