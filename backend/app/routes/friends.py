"""
Friends routes.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.friend_request import FriendRequest
from app.db.models.event import Event
from app.db.models.event_member import EventMember
from app.schemas.friend import (
    FriendRequestCreate,
    FriendRequestRead,
    FriendRequestResponse,
    FriendRequestAddByEmail,
    UserBasic,
    FriendsListResponse,
    UserProfileRead,
)
from app.crud import friend_requests as friend_requests_crud
from app.crud import notifications as notifications_crud
from app.crud.users import get_user_by_email
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/friends", tags=["friends"])


@router.post("/request", response_model=FriendRequestResponse, status_code=201)
def send_friend_request(
    payload: FriendRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a friend request to another user by ID."""
    try:
        request = friend_requests_crud.send_friend_request(
            db,
            sender_id=current_user.id,
            receiver_id=payload.receiver_user_id
        )
        
        # Create notification for receiver
        receiver = db.query(User).filter(User.id == payload.receiver_user_id).first()
        if receiver:
            notifications_crud.create_notification(
                db,
                user_id=payload.receiver_user_id,
                notification_type="friend_request_received",
                title="New Friend Request",
                message=f"{current_user.display_name or current_user.email} sent you a friend request",
                related_user_id=current_user.id,
            )
        
        return FriendRequestResponse(
            message="Friend request sent successfully",
            request=_serialize_friend_request(db, request)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/request-by-email", response_model=FriendRequestResponse, status_code=201)
def send_friend_request_by_email(
    payload: FriendRequestAddByEmail,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a friend request to another user by email."""
    receiver = get_user_by_email(db, payload.email)
    if not receiver:
        raise HTTPException(
            status_code=404,
            detail=f"User with email '{payload.email}' not found"
        )
    
    try:
        request = friend_requests_crud.send_friend_request(
            db,
            sender_id=current_user.id,
            receiver_id=receiver.id
        )
        
        # Create notification for receiver
        notifications_crud.create_notification(
            db,
            user_id=receiver.id,
            notification_type="friend_request_received",
            title="New Friend Request",
            message=f"{current_user.display_name or current_user.email} sent you a friend request",
            related_user_id=current_user.id,
        )
        
        return FriendRequestResponse(
            message="Friend request sent successfully",
            request=_serialize_friend_request(db, request)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/requests/incoming", response_model=List[FriendRequestRead])
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all incoming friend requests."""
    requests = friend_requests_crud.get_incoming_requests(db, current_user.id)
    return [_serialize_friend_request(db, req) for req in requests]


@router.get("/requests/outgoing", response_model=List[FriendRequestRead])
def get_outgoing_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all outgoing friend requests."""
    requests = friend_requests_crud.get_outgoing_requests(db, current_user.id)
    return [_serialize_friend_request(db, req) for req in requests]


@router.post("/requests/{request_id}/accept", response_model=FriendRequestResponse)
def accept_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a friend request."""
    try:
        request = friend_requests_crud.get_friend_request(db, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Friend request not found")
        
        # Verify current user is the receiver
        if request.receiver_user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the receiver can accept this request"
            )
        
        request = friend_requests_crud.accept_friend_request(db, request_id)
        
        # Create notification for sender
        sender = db.query(User).filter(User.id == request.sender_user_id).first()
        if sender:
            notifications_crud.create_notification(
                db,
                user_id=request.sender_user_id,
                notification_type="friend_request_accepted",
                title="Friend Request Accepted",
                message=f"{current_user.display_name or current_user.email} accepted your friend request",
                related_user_id=current_user.id,
            )
        
        return FriendRequestResponse(
            message="Friend request accepted",
            request=_serialize_friend_request(db, request)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{request_id}/reject", response_model=FriendRequestResponse)
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a friend request."""
    try:
        request = friend_requests_crud.get_friend_request(db, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Friend request not found")
        
        # Verify current user is the receiver
        if request.receiver_user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the receiver can reject this request"
            )
        
        request = friend_requests_crud.reject_friend_request(db, request_id)
        return FriendRequestResponse(
            message="Friend request rejected",
            request=_serialize_friend_request(db, request)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=FriendsListResponse)
def get_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all accepted friends."""
    friends = friend_requests_crud.get_friends(db, current_user.id)
    return FriendsListResponse(
        friends=[UserBasic.model_validate(f) for f in friends],
        count=len(friends)
    )


@router.get("/users/{user_id}", response_model=UserProfileRead)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user profile with friendship status and shared events count."""
    # Get target user
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Determine friendship status
    friendship_status = "none"
    
    # Check if they're friends (accepted friend request)
    friend_connection = db.query(FriendRequest).filter(
        or_(
            and_(
                FriendRequest.sender_user_id == current_user.id,
                FriendRequest.receiver_user_id == user_id,
                FriendRequest.status == "accepted"
            ),
            and_(
                FriendRequest.sender_user_id == user_id,
                FriendRequest.receiver_user_id == current_user.id,
                FriendRequest.status == "accepted"
            )
        )
    ).first()
    
    if friend_connection:
        friendship_status = "friend"
    else:
        # Check if there's a pending request
        pending_request = db.query(FriendRequest).filter(
            or_(
                and_(
                    FriendRequest.sender_user_id == current_user.id,
                    FriendRequest.receiver_user_id == user_id,
                    FriendRequest.status == "pending"
                ),
                and_(
                    FriendRequest.sender_user_id == user_id,
                    FriendRequest.receiver_user_id == current_user.id,
                    FriendRequest.status == "pending"
                )
            )
        ).first()
        
        if pending_request:
            friendship_status = "pending"
    
    # Count shared events
    # Find events where both users are members or participants
    shared_events = db.query(Event).join(
        EventMember, Event.id == EventMember.event_id
    ).filter(
        EventMember.user_id == current_user.id
    ).filter(
        Event.id.in_(
            db.query(Event.id).join(
                EventMember, Event.id == EventMember.event_id
            ).filter(EventMember.user_id == user_id)
        )
    ).count()
    
    return UserProfileRead(
        id=target_user.id,
        email=target_user.email,
        display_name=target_user.display_name,
        friendship_status=friendship_status,
        shared_event_count=shared_events,
    )


def _serialize_friend_request(db: Session, request) -> FriendRequestRead:
    """Helper to serialize a friend request with sender and receiver info."""
    sender = db.query(User).filter(User.id == request.sender_user_id).first()
    receiver = db.query(User).filter(User.id == request.receiver_user_id).first()
    
    return FriendRequestRead(
        id=request.id,
        sender_user_id=request.sender_user_id,
        receiver_user_id=request.receiver_user_id,
        status=request.status,
        created_at=request.created_at,
        updated_at=request.updated_at,
        sender=UserBasic.model_validate(sender) if sender else None,
        receiver=UserBasic.model_validate(receiver) if receiver else None,
    )
