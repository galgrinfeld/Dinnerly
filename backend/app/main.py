"""
FastAPI application initialization.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.db.session import engine
from app.db.base import Base
from app.db.models import User, EventMember, Ingredient, Recipe, RecipeIngredient, Event, EventRecipe, EventIngredientAssignment, FriendRequest, Notification
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
        ensure_recipe_public_columns()


def ensure_recipe_public_columns():
    """Apply the small development schema update needed without Alembic."""
    inspector = inspect(engine)
    if "recipes" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("recipes")}
    statements = []
    if "is_public" not in existing_columns:
        if engine.dialect.name == "postgresql":
            statements.append("ALTER TABLE recipes ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE")
        else:
            statements.append("ALTER TABLE recipes ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT 0")
    if "source_recipe_id" not in existing_columns:
        statements.append("ALTER TABLE recipes ADD COLUMN source_recipe_id INTEGER")

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))


app = FastAPI(title="Dinnerly")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, use specific origins like ["https://yourdomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
create_tables()

# Include main API router
app.include_router(api_router)


@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}


