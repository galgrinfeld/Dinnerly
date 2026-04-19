"""
CRUD operations for event ingredient assignments.
"""
from sqlalchemy.orm import Session
from app.db.models.event_ingredient_assignment import EventIngredientAssignment


def assign_ingredient(
    db: Session,
    event_id: int,
    ingredient_id: int,
    event_member_id: int,
) -> EventIngredientAssignment:
    """
    Assign an ingredient to a participant in an event.
    If an assignment already exists for this ingredient, it will be replaced.
    """
    # Check if assignment already exists
    existing = db.query(EventIngredientAssignment).filter(
        EventIngredientAssignment.event_id == event_id,
        EventIngredientAssignment.ingredient_id == ingredient_id,
    ).first()
    
    if existing:
        # Update existing assignment
        existing.event_member_id = event_member_id
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new assignment
    assignment = EventIngredientAssignment(
        event_id=event_id,
        ingredient_id=ingredient_id,
        event_member_id=event_member_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def get_assignment(
    db: Session,
    event_id: int,
    ingredient_id: int,
) -> EventIngredientAssignment | None:
    """Get assignment for a specific ingredient in an event."""
    return db.query(EventIngredientAssignment).filter(
        EventIngredientAssignment.event_id == event_id,
        EventIngredientAssignment.ingredient_id == ingredient_id,
    ).first()


def get_assignments_for_event(
    db: Session,
    event_id: int,
) -> list[EventIngredientAssignment]:
    """Get all ingredient assignments for an event."""
    return db.query(EventIngredientAssignment).filter(
        EventIngredientAssignment.event_id == event_id,
    ).all()


def delete_assignment(
    db: Session,
    event_id: int,
    ingredient_id: int,
) -> bool:
    """Delete an ingredient assignment (unassign)."""
    assignment = db.query(EventIngredientAssignment).filter(
        EventIngredientAssignment.event_id == event_id,
        EventIngredientAssignment.ingredient_id == ingredient_id,
    ).first()
    
    if assignment:
        db.delete(assignment)
        db.commit()
        return True
    return False
