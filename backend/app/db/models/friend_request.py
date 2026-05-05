"""
FriendRequest database model.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func, Index
from app.db.base import Base


class FriendRequest(Base):
    __tablename__ = "friend_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="pending", index=True)  # pending, accepted, rejected
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    
    # Ensure only one pending request can exist between two users in each direction
    __table_args__ = (
        UniqueConstraint("sender_user_id", "receiver_user_id", "status", name="uq_friend_request"),
        Index("idx_sender_user_id", "sender_user_id"),
        Index("idx_receiver_user_id", "receiver_user_id"),
    )
    
    def __repr__(self) -> str:
        return f"<FriendRequest(id={self.id}, sender={self.sender_user_id}, receiver={self.receiver_user_id}, status={self.status})>"
