"""
Recipe database model.
"""
from sqlalchemy import Column, Integer, String
from app.db.base import Base


class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
