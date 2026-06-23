"""
Main API router that combines all route modules.
"""
from fastapi import APIRouter
from app.routes import auth, ingredients, recipes, events, friends, notifications

router = APIRouter(prefix="/api")

# Include all route modules
router.include_router(auth.router)
router.include_router(ingredients.router)
router.include_router(recipes.router)
router.include_router(events.router)
router.include_router(friends.router)
router.include_router(notifications.router)
