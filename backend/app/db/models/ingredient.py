"""
Ingredient database model.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, func, UniqueConstraint
from app.db.base import Base


class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True, unique=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    
    def __repr__(self) -> str:
        return f"<Ingredient(id={self.id}, name={self.name})>"
