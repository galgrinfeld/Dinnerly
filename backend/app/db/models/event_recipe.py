"""
EventRecipe database model - junction table between Event and Recipe.
"""
from sqlalchemy import Column, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class EventRecipe(Base):
    __tablename__ = "event_recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False, index=True)
    desired_servings = Column(Integer, nullable=False)
    
    # Relationships
    event = relationship("Event", back_populates="recipes")
    recipe = relationship("Recipe")
    
    # Composite index for faster lookups
    __table_args__ = (
        Index("ix_event_recipe_event_recipe", "event_id", "recipe_id", unique=True),
    )
    
    def __repr__(self) -> str:
        return f"<EventRecipe(id={self.id}, event_id={self.event_id}, recipe_id={self.recipe_id}, desired_servings={self.desired_servings})>"
