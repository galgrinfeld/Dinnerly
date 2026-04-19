"""
EventIngredientAssignment database model - tracks which participant is assigned to each ingredient.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime, func, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class EventIngredientAssignment(Base):
    __tablename__ = "event_ingredient_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False, index=True)
    event_member_id = Column(Integer, ForeignKey("event_members.id"), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    
    # Unique constraint: one participant per ingredient per event
    __table_args__ = (
        UniqueConstraint("event_id", "ingredient_id", name="uq_event_ingredient_assignment"),
    )
    
    # Relationships
    event = relationship("Event")
    ingredient = relationship("Ingredient")
    event_member = relationship("EventMember")
    
    def __repr__(self) -> str:
        return f"<EventIngredientAssignment(id={self.id}, event_id={self.event_id}, ingredient_id={self.ingredient_id}, event_member_id={self.event_member_id})>"
