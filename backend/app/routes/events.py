"""
Events routes.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.event_member import EventMember
from app.db.models.event_ingredient_assignment import EventIngredientAssignment
from app.db.models.event_recipe import EventRecipe
from app.db.models.recipe import Recipe
from app.db.models.recipe_ingredient import RecipeIngredient
from app.schemas.event import EventCreate, EventUpdate, EventRead, EventRecipeAttach
from app.schemas.auth import ParticipantAddRequest, EventMemberRead
from app.schemas.shopping_list import ShoppingListResponse, AutoAssignShoppingListResponse
from app.schemas.ai_menu import AiCreateRecipeRequest, AiCreateRecipeResponse, AiSuggestionsResponse
from app.schemas.recipe import RecipeIngredientRead, RecipeRead
from app.crud import events as events_crud
from app.crud import event_members as event_members_crud
from app.crud import notifications as notifications_crud
from app.crud import recipes as recipes_crud
from app.services.shopping_list_generator import generate_shopping_list_for_event
from app.services.smart_auto_assignment import auto_assign_shopping_items
from app.services import ai_menu_service
from app.crud.ingredients import create_ingredient
from app.api.deps import get_current_user, is_event_owner, is_event_member

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])


def _require_event_access(db: Session, event_id: int, current_user: User):
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")
    return event


@router.post("/{event_id}/ai/suggest-recipes", response_model=AiSuggestionsResponse)
def suggest_ai_recipes(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Suggest complementary dishes without creating any database records."""
    _require_event_access(db, event_id, current_user)
    names = [
        row[0] for row in (
            db.query(Recipe.name)
            .join(EventRecipe, EventRecipe.recipe_id == Recipe.id)
            .filter(EventRecipe.event_id == event_id)
            .all()
        )
    ]
    try:
        return ai_menu_service.suggest_recipes(names)
    except ai_menu_service.AiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/{event_id}/ai/create-recipe", response_model=AiCreateRecipeResponse, status_code=201)
def create_ai_recipe(
    event_id: int,
    payload: AiCreateRecipeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate, validate, atomically save, and attach the selected recipe."""
    event = _require_event_access(db, event_id, current_user)
    requested_name = payload.name.strip()
    requested_category = payload.category.strip()

    existing_recipe = recipes_crud.get_recipe_by_name(db, requested_name, current_user.id)
    if existing_recipe:
        try:
            event_recipe = (
                db.query(EventRecipe)
                .filter(EventRecipe.event_id == event_id, EventRecipe.recipe_id == existing_recipe.id)
                .first()
            )
            if event_recipe:
                event_recipe.desired_servings = event.target_servings
            else:
                db.add(EventRecipe(
                    event_id=event_id,
                    recipe_id=existing_recipe.id,
                    desired_servings=event.target_servings,
                ))
            db.commit()
            recipe = recipes_crud.get_recipe_with_ingredients(db, existing_recipe.id, current_user.id)
        except Exception:
            db.rollback()
            logger.exception("Failed to attach existing AI recipe")
            raise HTTPException(status_code=500, detail="Failed to attach existing recipe")

        recipe_read = RecipeRead(
            id=recipe.id,
            name=recipe.name,
            description=recipe.description or "",
            base_servings=recipe.base_servings,
            cooking_time_minutes=recipe.cooking_time_minutes,
            instructions_html=recipe.instructions_html or "",
            image_url=recipe.image_url,
            ingredients=[RecipeIngredientRead.from_orm(item) for item in recipe.ingredients],
        )
        return AiCreateRecipeResponse(
            recipe_id=recipe.id,
            event_id=event_id,
            message="Existing recipe attached to event",
            recipe=recipe_read,
        )

    existing_names = [
        row[0] for row in (
            db.query(Recipe.name)
            .join(EventRecipe, EventRecipe.recipe_id == Recipe.id)
            .filter(EventRecipe.event_id == event_id)
            .all()
        )
    ]
    try:
        generated = ai_menu_service.generate_recipe(
            requested_name,
            requested_category,
            event.target_servings,
            existing_names,
        )
        image_url = ai_menu_service.resolve_image_url(
            generated.image_url,
            generated.name,
            generated.image_search_query,
        )
    except ai_menu_service.AiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        recipe = Recipe(
            name=generated.name,
            description=generated.description,
            base_servings=generated.base_servings,
            cooking_time_minutes=generated.cooking_time_minutes,
            instructions_html=generated.instructions_html,
            image_url=image_url,
            owner_user_id=current_user.id,
        )
        db.add(recipe)
        db.flush()
        for item in generated.ingredients:
            ingredient = create_ingredient(db, item.name)
            db.add(RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
                quantity=item.quantity,
                unit=item.unit,
                note=item.note,
                optional=item.optional,
            ))
        db.add(EventRecipe(event_id=event_id, recipe_id=recipe.id, desired_servings=event.target_servings))
        db.commit()
        recipe = recipes_crud.get_recipe_with_ingredients(db, recipe.id, current_user.id)
    except Exception:
        db.rollback()
        logger.exception("Failed to persist generated recipe")
        raise HTTPException(status_code=500, detail="Failed to save and attach generated recipe")

    recipe_read = RecipeRead(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description or "",
        base_servings=recipe.base_servings,
        cooking_time_minutes=recipe.cooking_time_minutes,
        instructions_html=recipe.instructions_html or "",
        image_url=recipe.image_url,
        ingredients=[RecipeIngredientRead.from_orm(item) for item in recipe.ingredients],
    )
    return AiCreateRecipeResponse(
        recipe_id=recipe.id,
        event_id=event_id,
        message="Recipe created and attached to event",
        recipe=recipe_read,
    )


@router.post("", response_model=EventRead, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new event."""
    if payload.target_servings <= 0:
        raise HTTPException(status_code=422, detail="targetServings must be greater than 0")
    event = events_crud.create_event(db, payload, owner_user_id=current_user.id)
    return events_crud.serialize_event(db, event)


@router.get("", response_model=List[EventRead])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List events accessible to current user (owned or participant in)."""
    events = events_crud.list_events_for_user(db, user_id=current_user.id)
    return [events_crud.serialize_event(db, event) for event in events]


@router.get("/{event_id}", response_model=EventRead)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific event by ID (must be owner or participant)."""
    event = events_crud.get_event_for_user(db, event_id, current_user.id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or access denied")
    return events_crud.serialize_event(db, event)


@router.post("/{event_id}/recipes", response_model=EventRead)
def attach_recipe_to_event(
    event_id: int,
    payload: EventRecipeAttach,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Attach a recipe to an event (owner or participant only)."""
    if payload.desired_servings <= 0:
        raise HTTPException(status_code=422, detail="desiredServings must be greater than 0")
    
    # Check access
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        event = events_crud.attach_recipe_to_event(db, event_id, payload)
        
        # Get recipe for notification message
        recipe = recipes_crud.get_recipe(db, payload.recipe_id)
        recipe_name = recipe.name if recipe else "Unknown Recipe"
        
        # Create notifications for all event members except the user who added the recipe
        members = event_members_crud.list_members(db, event_id)
        for member in members:
            if member.user_id != current_user.id:
                notifications_crud.create_notification(
                    db,
                    user_id=member.user_id,
                    notification_type="recipe_attached",
                    title="Recipe Added to Event",
                    message=f"{current_user.display_name or current_user.email} added {recipe_name} to {event.name}",
                    related_event_id=event_id,
                    related_recipe_id=payload.recipe_id,
                    related_user_id=current_user.id,
                )
        
        return events_crud.serialize_event(db, event)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{event_id}/recipes/{recipe_id}", status_code=204)
def remove_recipe_from_event(
    event_id: int,
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detach a recipe from an event (owner or active participant)."""
    _require_event_access(db, event_id, current_user)
    try:
        events_crud.remove_recipe_from_event(db, event_id, recipe_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{event_id}/shopping-list", response_model=ShoppingListResponse)
def get_shopping_list(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the shopping list for an event (owner or participant only)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return generate_shopping_list_for_event(db, event_id)


@router.post(
    "/{event_id}/shopping-list/auto-assign",
    response_model=AutoAssignShoppingListResponse,
)
def auto_assign_event_shopping_list(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Auto-assign unassigned shopping-list items (event owner only)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not is_event_owner(event, current_user):
        raise HTTPException(
            status_code=403,
            detail="Only the event owner can auto-assign shopping-list items",
        )

    try:
        return auto_assign_shopping_items(db, event_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an event's name and target servings (owner only)."""
    if payload.target_servings <= 0:
        raise HTTPException(status_code=422, detail="targetServings must be greater than 0")
    
    try:
        event = events_crud.update_event(db, event_id, payload, owner_user_id=current_user.id)
        return events_crud.serialize_event(db, event)
    except ValueError as e:
        if "not found" in str(e).lower() or "owner" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating event: {str(e)}")


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an event (owner only)."""
    try:
        events_crud.delete_event(db, event_id, owner_user_id=current_user.id)
    except ValueError as e:
        if "not found" in str(e).lower() or "owner" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting event: {str(e)}")


@router.post("/{event_id}/participants", response_model=EventMemberRead, status_code=201)
def add_participant(
    event_id: int,
    payload: ParticipantAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a participant to an event (owner only)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not is_event_owner(event, current_user):
        raise HTTPException(status_code=403, detail="Only event owner can add participants")
    
    try:
        # Normalize email to lowercase
        email = payload.email.lower()
        member = event_members_crud.add_participant(db, event_id, email)
        
        # Create notification if user already exists
        if member.user_id:
            notifications_crud.create_notification(
                db,
                user_id=member.user_id,
                notification_type="event_member_added",
                title="Added to Event",
                message=f"You were added to {event.name} by {current_user.display_name or current_user.email}",
                related_event_id=event_id,
                related_user_id=current_user.id,
            )
        
        return EventMemberRead.from_orm(member)
    except Exception as e:
        logger.error(f"Error adding participant: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error adding participant: {str(e)}")


@router.get("/{event_id}/participants", response_model=List[EventMemberRead])
def list_participants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List participants of an event (owner or participant can view)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    members = event_members_crud.list_members(db, event_id)
    return [EventMemberRead.from_orm(m) for m in members]


@router.delete("/{event_id}/participants/{member_id}", status_code=204)
def remove_participant(
    event_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a participant from an event (owner only)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not is_event_owner(event, current_user):
        raise HTTPException(status_code=403, detail="Only event owner can remove participants")
    
    success = event_members_crud.remove_member(db, event_id, member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Participant not found")


@router.post("/{event_id}/leave", status_code=204)
def leave_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Leave an event (participants only - owners cannot leave without transferring ownership)."""
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if current user is the owner
    if is_event_owner(event, current_user):
        raise HTTPException(status_code=400, detail="Event owner cannot leave without deleting the event")
    
    # Check if current user is a member
    if not is_event_member(db, event_id, current_user.id):
        raise HTTPException(status_code=404, detail="You are not a participant in this event")
    
    # Find the member record
    member = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == event_id,
            EventMember.user_id == current_user.id,
        )
        .first()
    )
    
    if not member:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Delete ingredient assignments for this member first
    db.query(EventIngredientAssignment).filter(
        EventIngredientAssignment.event_member_id == member.id
    ).delete()
    
    # Delete the member
    db.delete(member)
    db.commit()
