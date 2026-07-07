from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Event, EventMember, EventRecipe, Recipe, RecipeIngredient, User
from app.routes.events import create_ai_recipe, remove_recipe_from_event, suggest_ai_recipes
from app.schemas.ai_menu import AiCreateRecipeRequest, AiSuggestionsRequest, GeneratedIngredient
from app.services import ai_menu_service


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def scenario(db):
    owner = User(email="owner-ai@example.com", password_hash="hash")
    participant = User(email="participant-ai@example.com", password_hash="hash")
    outsider = User(email="outsider-ai@example.com", password_hash="hash")
    db.add_all([owner, participant, outsider])
    db.flush()
    event = Event(name="AI Dinner", event_date=date.today(), target_servings=6, owner_user_id=owner.id)
    existing = Recipe(name="Pasta", description="", base_servings=4, owner_user_id=owner.id)
    db.add_all([event, existing])
    db.flush()
    db.add_all([
        EventMember(event_id=event.id, user_id=owner.id, email=owner.email, role="owner", status="active"),
        EventMember(event_id=event.id, user_id=participant.id, email=participant.email, role="participant", status="active"),
        EventRecipe(event_id=event.id, recipe_id=existing.id, desired_servings=6),
    ])
    db.commit()
    return owner, participant, outsider, event


def test_user_with_access_gets_mock_suggestions(db, scenario, monkeypatch):
    owner, _, _, event = scenario
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_API_KEY", raising=False)
    result = suggest_ai_recipes(event.id, db, owner)
    assert 3 <= len(result.suggestions) <= 5
    assert all(item.name.casefold() != "pasta" for item in result.suggestions)


def test_suggestions_exclude_names_from_refresh_payload(db, scenario, monkeypatch):
    owner, _, _, event = scenario
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_API_KEY", raising=False)

    initial = suggest_ai_recipes(event.id, db, owner)
    shown_names = [suggestion.name for suggestion in initial.suggestions]
    refreshed = suggest_ai_recipes(
        event.id,
        db,
        owner,
        AiSuggestionsRequest(excludeNames=shown_names),
    )

    refreshed_names = {suggestion.name.casefold() for suggestion in refreshed.suggestions}
    assert refreshed_names.isdisjoint({name.casefold() for name in shown_names})
    assert all(name != "pasta" for name in refreshed_names)


def test_user_without_access_cannot_suggest(db, scenario):
    _, _, outsider, event = scenario
    with pytest.raises(HTTPException) as exc:
        suggest_ai_recipes(event.id, db, outsider)
    assert exc.value.status_code == 403


def test_create_saves_recipe_ingredients_and_attachment(db, scenario, monkeypatch):
    _, participant, _, event = scenario
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_API_KEY", raising=False)
    result = create_ai_recipe(
        event.id,
        AiCreateRecipeRequest(name="Garlic Bread", category="Side Dish"),
        db,
        participant,
    )
    recipe = db.query(Recipe).filter_by(id=result.recipe_id).one()
    assert recipe.owner_user_id == participant.id
    assert recipe.image_url.startswith("https://image.pollinations.ai/prompt/")
    assert "Garlic%20Bread" in recipe.image_url
    assert db.query(RecipeIngredient).filter_by(recipe_id=recipe.id).count() == 4
    attached = db.query(EventRecipe).filter_by(event_id=event.id, recipe_id=recipe.id).one()
    assert attached.desired_servings == event.target_servings


def test_create_reuses_existing_owned_recipe_by_name(db, scenario, monkeypatch):
    _, participant, _, _ = scenario
    second_event = Event(
        name="Second AI Dinner",
        event_date=date.today(),
        target_servings=8,
        owner_user_id=participant.id,
    )
    existing_recipe = Recipe(
        name="Garlic Bread",
        description="Already saved",
        base_servings=4,
        cooking_time_minutes=20,
        image_url="https://example.com/garlic-bread.jpg",
        owner_user_id=participant.id,
    )
    db.add_all([second_event, existing_recipe])
    db.flush()
    db.add(EventMember(
        event_id=second_event.id,
        user_id=participant.id,
        email=participant.email,
        role="owner",
        status="active",
    ))
    db.commit()

    def should_not_generate(*args, **kwargs):
        raise AssertionError("Existing recipe should be reused without generating a duplicate")

    monkeypatch.setattr(ai_menu_service, "generate_recipe", should_not_generate)

    result = create_ai_recipe(
        second_event.id,
        AiCreateRecipeRequest(name=" garlic bread ", category="Side Dish"),
        db,
        participant,
    )

    assert result.recipe_id == existing_recipe.id
    assert result.message == "Existing recipe attached to event"
    assert db.query(Recipe).filter(Recipe.owner_user_id == participant.id, Recipe.name == "Garlic Bread").count() == 1
    attached = db.query(EventRecipe).filter_by(event_id=second_event.id, recipe_id=existing_recipe.id).one()
    assert attached.desired_servings == second_event.target_servings


def test_invalid_provider_response_creates_nothing(db, scenario, monkeypatch):
    owner, _, _, event = scenario
    before_recipes = db.query(Recipe).count()
    before_links = db.query(EventRecipe).count()

    def invalid_recipe(*args, **kwargs):
        raise ai_menu_service.AiServiceError("AI recipe failed validation")

    monkeypatch.setattr(ai_menu_service, "generate_recipe", invalid_recipe)
    with pytest.raises(HTTPException) as exc:
        create_ai_recipe(
            event.id,
            AiCreateRecipeRequest(name="Broken Dish", category="Side"),
            db,
            owner,
        )
    assert exc.value.status_code == 502
    assert db.query(Recipe).count() == before_recipes
    assert db.query(EventRecipe).count() == before_links


def test_participant_can_detach_recipe_without_deleting_it(db, scenario):
    _, participant, _, event = scenario
    link = db.query(EventRecipe).filter_by(event_id=event.id).one()
    recipe_id = link.recipe_id

    remove_recipe_from_event(event.id, recipe_id, db, participant)

    assert db.query(EventRecipe).filter_by(event_id=event.id, recipe_id=recipe_id).count() == 0
    assert db.query(Recipe).filter_by(id=recipe_id).count() == 1


def test_generated_ingredient_normalizes_common_ai_units():
    ingredient = GeneratedIngredient(
        name="Garlic",
        quantity=3,
        unit="cloves",
        notes="minced",
        optional=False,
    )
    assert ingredient.unit == "unit"
    assert ingredient.note == "minced"
