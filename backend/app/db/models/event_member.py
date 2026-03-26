"""
EventMember database model for event sharing and participants.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class EventMember(Base):
    __tablename__ = "event_members"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # nullable for invited users
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)  # "owner" or "participant"
    status = Column(String, nullable=False)  # "active" or "invited"
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    
    # Unique constraint on event_id + email
    __table_args__ = (
        UniqueConstraint("event_id", "email", name="uq_event_member_event_email"),
    )
    
    # Relationships
    event = relationship("Event", back_populates="members")
    
    def __repr__(self) -> str:
        return f"<EventMember(id={self.id}, event_id={self.event_id}, email={self.email}, role={self.role})>"
