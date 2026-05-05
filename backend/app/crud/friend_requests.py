"""
CRUD operations for Friend Requests.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.db.models.friend_request import FriendRequest
from app.db.models.user import User


def send_friend_request(db: Session, sender_id: int, receiver_id: int) -> FriendRequest:
    """
    Create a new friend request.
    
    Raises: ValueError if request is invalid (same user, request already exists, etc.)
    """
    # Validate sender and receiver exist and are different
    if sender_id == receiver_id:
        raise ValueError("Cannot send friend request to yourself")
    
    sender = db.query(User).filter(User.id == sender_id).first()
    if not sender:
        raise ValueError("Sender user not found")
    
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise ValueError("Receiver user not found")
    
    # Check if already friends (accepted request in either direction)
    existing_accepted = db.query(FriendRequest).filter(
        and_(
            or_(
                and_(FriendRequest.sender_user_id == sender_id, FriendRequest.receiver_user_id == receiver_id),
                and_(FriendRequest.sender_user_id == receiver_id, FriendRequest.receiver_user_id == sender_id),
            ),
            FriendRequest.status == "accepted"
        )
    ).first()
    
    if existing_accepted:
        raise ValueError("Already friends with this user")
    
    # Check if pending request already exists in either direction
    existing_pending = db.query(FriendRequest).filter(
        and_(
            or_(
                and_(FriendRequest.sender_user_id == sender_id, FriendRequest.receiver_user_id == receiver_id),
                and_(FriendRequest.sender_user_id == receiver_id, FriendRequest.receiver_user_id == sender_id),
            ),
            FriendRequest.status == "pending"
        )
    ).first()
    
    if existing_pending:
        raise ValueError("A pending request already exists with this user")
    
    # Create new friend request
    request = FriendRequest(
        sender_user_id=sender_id,
        receiver_user_id=receiver_id,
        status="pending"
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def get_friend_request(db: Session, request_id: int) -> FriendRequest | None:
    """Get a friend request by ID."""
    return db.query(FriendRequest).filter(FriendRequest.id == request_id).first()


def get_incoming_requests(db: Session, user_id: int) -> list[FriendRequest]:
    """Get all incoming (pending) friend requests for a user."""
    return db.query(FriendRequest).filter(
        FriendRequest.receiver_user_id == user_id,
        FriendRequest.status == "pending"
    ).order_by(FriendRequest.created_at.desc()).all()


def get_outgoing_requests(db: Session, user_id: int) -> list[FriendRequest]:
    """Get all outgoing (pending) friend requests from a user."""
    return db.query(FriendRequest).filter(
        FriendRequest.sender_user_id == user_id,
        FriendRequest.status == "pending"
    ).order_by(FriendRequest.created_at.desc()).all()


def accept_friend_request(db: Session, request_id: int) -> FriendRequest:
    """Accept a friend request."""
    request = get_friend_request(db, request_id)
    if not request:
        raise ValueError("Friend request not found")
    
    if request.status != "pending":
        raise ValueError("Only pending requests can be accepted")
    
    request.status = "accepted"
    db.commit()
    db.refresh(request)
    return request


def reject_friend_request(db: Session, request_id: int) -> FriendRequest:
    """Reject a friend request."""
    request = get_friend_request(db, request_id)
    if not request:
        raise ValueError("Friend request not found")
    
    if request.status != "pending":
        raise ValueError("Only pending requests can be rejected")
    
    request.status = "rejected"
    db.commit()
    db.refresh(request)
    return request


def get_friends(db: Session, user_id: int) -> list[User]:
    """Get all accepted friends of a user."""
    # Get all accepted friend requests where user is sender or receiver
    friend_requests = db.query(FriendRequest).filter(
        or_(
            and_(FriendRequest.sender_user_id == user_id, FriendRequest.status == "accepted"),
            and_(FriendRequest.receiver_user_id == user_id, FriendRequest.status == "accepted"),
        )
    ).all()
    
    # Extract friend user IDs
    friend_ids = set()
    for freq in friend_requests:
        if freq.sender_user_id == user_id:
            friend_ids.add(freq.receiver_user_id)
        else:
            friend_ids.add(freq.sender_user_id)
    
    # Get friend users
    if not friend_ids:
        return []
    
    friends = db.query(User).filter(User.id.in_(friend_ids)).order_by(User.display_name).all()
    return friends


def is_friend(db: Session, user_id: int, other_user_id: int) -> bool:
    """Check if two users are friends."""
    request = db.query(FriendRequest).filter(
        or_(
            and_(FriendRequest.sender_user_id == user_id, FriendRequest.receiver_user_id == other_user_id),
            and_(FriendRequest.sender_user_id == other_user_id, FriendRequest.receiver_user_id == user_id),
        ),
        FriendRequest.status == "accepted"
    ).first()
    
    return request is not None
