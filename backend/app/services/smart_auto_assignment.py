"""Deterministic, load-balanced shopping-list assignment service."""
import heapq
from collections import defaultdict

from sqlalchemy.orm import Session

from app.db.models.event_ingredient_assignment import EventIngredientAssignment
from app.db.models.event_member import EventMember
from app.schemas.shopping_list import AutoAssignShoppingListResponse
from app.services.shopping_list_generator import generate_shopping_list_for_event


def _item_weight(optional: bool) -> float:
    return 0.5 if optional else 1.0


def auto_assign_shopping_items(
    db: Session,
    event_id: int,
) -> AutoAssignShoppingListResponse:
    """
    Assign currently unassigned shopping-list ingredients to eligible members.

    Existing assignments are preserved. Loads include existing assignments and
    use required=1.0 and optional=0.5. A min heap keeps participant selection
    efficient while resolving ties by assigned-item count, normalized email,
    user id, and member id for complete determinism.
    """
    eligible_members = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == event_id,
            EventMember.status == "active",
            EventMember.user_id.is_not(None),
        )
        .all()
    )
    eligible_members.sort(
        key=lambda member: (
            member.email.lower(),
            member.user_id,
            member.id,
        )
    )

    if not eligible_members:
        raise ValueError("No eligible participants are available for auto-assignment")

    shopping_list = generate_shopping_list_for_event(db, event_id)
    existing_assignments = {
        assignment.ingredient_id: assignment
        for assignment in db.query(EventIngredientAssignment)
        .filter(EventIngredientAssignment.event_id == event_id)
        .all()
    }
    eligible_by_id = {member.id: member for member in eligible_members}

    loads = {member.id: 0.0 for member in eligible_members}
    item_counts = {member.id: 0 for member in eligible_members}

    # The current schema persists one assignment per ingredient. If an
    # ingredient appears with multiple units/options, treat those rows as one
    # assignment while summing their load contribution.
    weights_by_ingredient: dict[int, float] = defaultdict(float)
    items_by_ingredient = {}
    for item in shopping_list.items:
        weights_by_ingredient[item.ingredient_id] += _item_weight(item.optional)
        items_by_ingredient.setdefault(item.ingredient_id, item)

    for ingredient_id, assignment in existing_assignments.items():
        if assignment.event_member_id not in eligible_by_id:
            continue
        if ingredient_id not in weights_by_ingredient:
            continue
        loads[assignment.event_member_id] += weights_by_ingredient[ingredient_id]
        item_counts[assignment.event_member_id] += 1

    participant_heap = [
        (
            loads[member.id],
            item_counts[member.id],
            member.email.lower(),
            member.user_id,
            member.id,
        )
        for member in eligible_members
    ]
    heapq.heapify(participant_heap)

    unassigned_ingredient_ids = sorted(
        (
            ingredient_id
            for ingredient_id in items_by_ingredient
            if ingredient_id not in existing_assignments
        ),
        key=lambda ingredient_id: (
            items_by_ingredient[ingredient_id].ingredient_name.lower(),
            items_by_ingredient[ingredient_id].unit or "",
            ingredient_id,
        ),
    )

    for ingredient_id in unassigned_ingredient_ids:
        _, _, _, _, selected_member_id = heapq.heappop(participant_heap)
        db.add(
            EventIngredientAssignment(
                event_id=event_id,
                ingredient_id=ingredient_id,
                event_member_id=selected_member_id,
            )
        )
        loads[selected_member_id] += weights_by_ingredient[ingredient_id]
        item_counts[selected_member_id] += 1
        selected_member = eligible_by_id[selected_member_id]
        heapq.heappush(
            participant_heap,
            (
                loads[selected_member_id],
                item_counts[selected_member_id],
                selected_member.email.lower(),
                selected_member.user_id,
                selected_member.id,
            ),
        )

    if unassigned_ingredient_ids:
        db.commit()

    return AutoAssignShoppingListResponse(
        assigned_count=len(unassigned_ingredient_ids),
        shopping_list=generate_shopping_list_for_event(db, event_id),
    )
