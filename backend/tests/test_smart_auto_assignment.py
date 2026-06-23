from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import (
    Event,
    EventIngredientAssignment,
    EventMember,
    EventRecipe,
    Ingredient,
    Recipe,
    RecipeIngredient,
    User,
)
from app.routes.events import auto_assign_event_shopping_list
from app.services.smart_auto_assignment import auto_assign_shopping_items


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


def create_scenario(
    db,
    *,
    required_names=("Bread", "Cheese"),
    optional_names=("Olives",),
    include_participant=True,
    include_invited=True,
):
    owner = User(email="a-owner@example.com", password_hash="hash", display_name="Owner")
    participant = User(email="z-participant@example.com", password_hash="hash", display_name="Participant")
    db.add_all([owner, participant])
    db.flush()

    event = Event(
        name="Test Dinner",
        event_date=date.today(),
        target_servings=4,
        owner_user_id=owner.id,
    )
    recipe = Recipe(
        name="Test Recipe",
        description="",
        base_servings=4,
        owner_user_id=owner.id,
    )
    db.add_all([event, recipe])
    db.flush()

    owner_member = EventMember(
        event_id=event.id,
        user_id=owner.id,
        email=owner.email,
        role="owner",
        status="active",
    )
    db.add(owner_member)
    participant_member = None
    if include_participant:
        participant_member = EventMember(
            event_id=event.id,
            user_id=participant.id,
            email=participant.email,
            role="participant",
            status="active",
        )
        db.add(participant_member)
    if include_invited:
        db.add(
            EventMember(
                event_id=event.id,
                user_id=None,
                email="pending@example.com",
                role="participant",
                status="invited",
            )
        )
    db.flush()

    ingredients = {}
    for name, optional in [
        *((name, False) for name in required_names),
        *((name, True) for name in optional_names),
    ]:
        ingredient = Ingredient(name=name)
        db.add(ingredient)
        db.flush()
        db.add(
            RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
                quantity=1,
                unit="item",
                optional=optional,
            )
        )
        ingredients[name] = ingredient

    db.add(EventRecipe(event_id=event.id, recipe_id=recipe.id, desired_servings=4))
    db.commit()
    return {
        "owner": owner,
        "participant": participant,
        "event": event,
        "owner_member": owner_member,
        "participant_member": participant_member,
        "ingredients": ingredients,
    }


def assignments_for(db, event_id):
    return db.query(EventIngredientAssignment).filter_by(event_id=event_id).all()


def test_owner_can_auto_assign_items(db):
    data = create_scenario(db)

    result = auto_assign_event_shopping_list(data["event"].id, db, data["owner"])

    assert result.assigned_count == 3
    assert all(item.assigned_member_id for item in result.shopping_list.items)


def test_non_owner_cannot_auto_assign(db):
    data = create_scenario(db)

    with pytest.raises(HTTPException) as exc_info:
        auto_assign_event_shopping_list(data["event"].id, db, data["participant"])

    assert exc_info.value.status_code == 403


def test_existing_manual_assignments_are_preserved(db):
    data = create_scenario(db)
    bread = data["ingredients"]["Bread"]
    manual = EventIngredientAssignment(
        event_id=data["event"].id,
        ingredient_id=bread.id,
        event_member_id=data["owner_member"].id,
    )
    db.add(manual)
    db.commit()

    result = auto_assign_shopping_items(db, data["event"].id)
    db.refresh(manual)

    assert result.assigned_count == 2
    assert manual.event_member_id == data["owner_member"].id


def test_unassigned_items_are_distributed_between_participants(db):
    data = create_scenario(db, required_names=("A", "B", "C", "D"), optional_names=())

    auto_assign_shopping_items(db, data["event"].id)
    member_ids = {assignment.event_member_id for assignment in assignments_for(db, data["event"].id)}

    assert member_ids == {data["owner_member"].id, data["participant_member"].id}


def test_optional_items_use_lower_weight(db):
    data = create_scenario(
        db,
        required_names=("Existing", "B Required"),
        optional_names=("A Optional",),
    )
    db.add(
        EventIngredientAssignment(
            event_id=data["event"].id,
            ingredient_id=data["ingredients"]["Existing"].id,
            event_member_id=data["owner_member"].id,
        )
    )
    db.commit()

    auto_assign_shopping_items(db, data["event"].id)
    assignment_map = {
        assignment.ingredient_id: assignment.event_member_id
        for assignment in assignments_for(db, data["event"].id)
    }

    # The participant has load 0.5 after A Optional, still below the owner's
    # load of 1.0, so the participant also receives B Required.
    assert assignment_map[data["ingredients"]["A Optional"].id] == data["participant_member"].id
    assert assignment_map[data["ingredients"]["B Required"].id] == data["participant_member"].id


def test_pending_unregistered_participants_are_excluded(db):
    data = create_scenario(db, include_participant=False, include_invited=True)

    auto_assign_shopping_items(db, data["event"].id)

    assert {a.event_member_id for a in assignments_for(db, data["event"].id)} == {
        data["owner_member"].id
    }


def test_assigned_count_is_zero_when_every_item_is_assigned(db):
    data = create_scenario(db)
    for ingredient in data["ingredients"].values():
        db.add(
            EventIngredientAssignment(
                event_id=data["event"].id,
                ingredient_id=ingredient.id,
                event_member_id=data["owner_member"].id,
            )
        )
    db.commit()

    result = auto_assign_shopping_items(db, data["event"].id)

    assert result.assigned_count == 0
    assert len(assignments_for(db, data["event"].id)) == 3
