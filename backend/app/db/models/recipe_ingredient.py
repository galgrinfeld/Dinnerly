"""
RecipeIngredient database model - junction table between Recipe and Ingredient.
"""
from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False, index=True)
    quantity = Column(Numeric(10, 2), nullable=True)
    unit = Column(String, nullable=False)
    note = Column(String, nullable=True)
    optional = Column(Boolean, default=False, nullable=False)
    
    # Relationship back to Recipe
    recipe = relationship("Recipe", back_populates="ingredients")
    
    # Relationship to Ingredient
    ingredient = relationship("Ingredient")
    
    def __repr__(self) -> str:
        return f"<RecipeIngredient(id={self.id}, recipe_id={self.recipe_id}, ingredient_id={self.ingredient_id})>"
