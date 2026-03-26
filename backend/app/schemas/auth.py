"""
Authentication Pydantic schemas with camelCase.
"""
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = Field(None, alias="displayName", max_length=255)
    
    class Config:
        populate_by_name = True


class LoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str = Field(..., min_length=1)
    
    class Config:
        populate_by_name = True


class UserRead(BaseModel):
    """Schema for reading user data."""
    id: int
    email: str
    display_name: Optional[str] = Field(None, alias="displayName")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class AuthResponse(BaseModel):
    """Schema for authentication response."""
    user: UserRead
    access_token: str = Field(..., alias="accessToken")
    
    class Config:
        populate_by_name = True
        from_attributes = True


class ParticipantAddRequest(BaseModel):
    """Schema for adding a participant to an event."""
    email: str = Field(..., min_length=1)
    
    class Config:
        populate_by_name = True


class EventMemberRead(BaseModel):
    """Schema for reading event member (participant)."""
    id: int
    email: str
    role: str  # "owner" or "participant"
    status: str  # "active" or "invited"
    
    class Config:
        from_attributes = True
        populate_by_name = True
