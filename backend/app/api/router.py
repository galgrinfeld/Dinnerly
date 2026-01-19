"""
Main API router that combines all route modules.
"""
from fastapi import APIRouter
from app.routes import ingredients, recipes, events, shopping_list

router = APIRouter(prefix="/api")

# Include all route modules
router.include_router(ingredients.router)
router.include_router(recipes.router)
router.include_router(events.router)
router.include_router(shopping_list.router)
