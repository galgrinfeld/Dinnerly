"""
Shopping list routes.
Note: Shopping list endpoint is now integrated into events routes as GET /events/{event_id}/shopping-list
This module is kept for backward compatibility if needed.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.shopping_list import IngredientAssignmentRequest
from app.crud import events as events_crud, event_ingredient_assignments
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["shopping-list"])


@router.post("/events/{event_id}/ingredients/{ingredient_id}/assign", status_code=200)
def assign_ingredient(
    event_id: int,
    ingredient_id: int,
    payload: IngredientAssignmentRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Assign an ingredient to a participant in an event.
    Owner or participant can assign ingredients.
    """
    from app.api.deps import is_event_owner, is_event_member
    
    # Verify event exists and user is owner or participant
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only event participants can assign ingredients.",
        )
    
    try:
        assignment = event_ingredient_assignments.assign_ingredient(
            db,
            event_id=event_id,
            ingredient_id=ingredient_id,
            event_member_id=payload.event_member_id,
        )
        return {"status": "ok", "assignment_id": assignment.id}
    except Exception as e:
        logger.error(f"Error assigning ingredient: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error assigning ingredient",
        )


@router.delete("/events/{event_id}/ingredients/{ingredient_id}/assign", status_code=204)
def unassign_ingredient(
    event_id: int,
    ingredient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Unassign an ingredient from a participant in an event.
    Owner or participant can unassign ingredients.
    """
    from app.api.deps import is_event_owner, is_event_member
    
    # Verify event exists and user is owner or participant
    event = events_crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not (is_event_owner(event, current_user) or is_event_member(db, event_id, current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only event participants can unassign ingredients.",
        )
    
    try:
        event_ingredient_assignments.delete_assignment(
            db, event_id, ingredient_id
        )
        return None
    except Exception as e:
        logger.error(f"Error unassigning ingredient: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error unassigning ingredient",
        )
