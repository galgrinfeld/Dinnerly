"""
FastAPI dependencies for authentication and authorization.
"""
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.security import verify_token
from app.crud.users import get_user_by_id
from app.db.models.user import User
from app.db.models.event import Event
from app.db.models.event_member import EventMember


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT token from Authorization header, return current user."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token from "Bearer <token>" format
    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert sub (string) back to integer
    user_id_str = payload.get("sub")
    try:
        user_id: int = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def is_event_owner(event: Event, user: User) -> bool:
    """Check if user is the owner of the event."""
    return event.owner_user_id == user.id


def is_event_member(db: Session, event_id: int, user_id: int) -> bool:
    """Check if user is an active member/participant of the event."""
    member = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
            EventMember.status == "active",
        )
        .first()
    )
    return member is not None
