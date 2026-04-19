"""
FastAPI application initialization.
"""
import os
from fastapi import FastAPI
from app.db.session import engine
from app.db.base import Base
from app.db.models import User, EventMember, Ingredient, Recipe, RecipeIngredient, Event, EventRecipe, EventIngredientAssignment
from app.api.router import router as api_router

# Create database tables at startup (development only)
def create_tables():
    """
    Create all tables if AUTO_CREATE_TABLES is enabled (default: true).
    
    NOTE: Because we are not using migrations, the local database may need to be reset
    when adding new columns or tables to models. If you encounter schema conflicts,
    either drop and recreate your local database or manually apply ALTER TABLE commands.
    """
    auto_create = os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true"
    if auto_create:
        Base.metadata.create_all(bind=engine)


app = FastAPI(title="Dinnerly")

# Create tables on startup
create_tables()

# Include main API router
app.include_router(api_router)


@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}


