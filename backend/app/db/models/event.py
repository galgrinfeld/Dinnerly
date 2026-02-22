"""
Event database model.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    target_servings = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    
    # Relationships
    recipes = relationship("EventRecipe", back_populates="event", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Event(id={self.id}, name={self.name})>"
