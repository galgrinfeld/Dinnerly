import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Ingredient, Recipe, RecipeIngredient, User
from app.routes.public_recipes import (
    get_public_recipe,
    get_similar_public_recipes,
    list_public_recipes,
    save_public_recipe,
)
from app.routes.recipes import create_recipe, get_recipe
from app.schemas.recipe import RecipeCreate, RecipeIngredientCreate


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


def ingredient(db, name):
    item = Ingredient(name=name)
    db.add(item)
    db.flush()
    return item


def recipe(db, owner, name, ingredient_items, *, public=True, cooking_time=30, servings=4):
    item = Recipe(
        name=name,
        description=f"{name} description",
        base_servings=servings,
        cooking_time_minutes=cooking_time,
        instructions_html="<p>Cook it.</p>",
        image_url="https://example.com/recipe.jpg",
        owner_user_id=owner.id,
        is_public=public,
    )
    db.add(item)
    db.flush()
    for ing in ingredient_items:
        db.add(
            RecipeIngredient(
                recipe_id=item.id,
                ingredient_id=ing.id,
                quantity=1,
                unit="unit",
                optional=False,
            )
        )
    db.commit()
    return item


@pytest.fixture()
def scenario(db):
    owner = User(email="owner-public@example.com", password_hash="hash")
    viewer = User(email="viewer-public@example.com", password_hash="hash")
    outsider = User(email="outsider-public@example.com", password_hash="hash")
    db.add_all([owner, viewer, outsider])
    db.flush()

    pasta = ingredient(db, "Pasta")
    garlic = ingredient(db, "Garlic")
    tomato = ingredient(db, "Tomato")
    mushroom = ingredient(db, "Mushroom")
    sugar = ingredient(db, "Sugar")
    potato = ingredient(db, "Potato")
    salt = ingredient(db, "Salt")
    pepper = ingredient(db, "Pepper")

    public_source = recipe(db, owner, "Tomato Pasta", [pasta, garlic, tomato], public=True, cooking_time=30, servings=4)
    best_match = recipe(db, owner, "Tomato Garlic Pasta Bake", [pasta, garlic, tomato, mushroom], public=True, cooking_time=35, servings=4)
    close_match = recipe(db, owner, "Garlic Mushroom Pasta", [pasta, garlic, mushroom], public=True, cooking_time=32, servings=4)
    zero_overlap_match = recipe(db, owner, "Sugar Snack", [sugar], public=True, cooking_time=30, servings=4)
    weak_overlap_match = recipe(
        db,
        owner,
        "Pantry Potatoes",
        [pasta, potato, salt, pepper],
        public=True,
        cooking_time=30,
        servings=4,
    )
    private_recipe = recipe(db, owner, "Private Pasta", [pasta, tomato], public=False, cooking_time=30, servings=4)

    return owner, viewer, outsider, public_source, best_match, close_match, zero_overlap_match, weak_overlap_match, private_recipe


def test_public_list_returns_only_public_recipes(db, scenario):
    _, viewer, _, _, _, _, _, _, private_recipe = scenario

    result = list_public_recipes(db, viewer)

    ids = {item.id for item in result}
    assert private_recipe.id not in ids
    assert len(result) == 5


def test_created_public_recipe_appears_in_public_pool(db, scenario):
    _, viewer, _, _, _, _, _, _, _ = scenario

    created = create_recipe(
        RecipeCreate(
            name="Shared User Pasta",
            description="Created from the recipe form",
            baseServings=4,
            cookingTimeMinutes=25,
            isPublic=True,
            ingredients=[
                RecipeIngredientCreate(name="Pasta", quantity=250, unit="g"),
                RecipeIngredientCreate(name="Garlic", quantity=2, unit="unit"),
            ],
        ),
        db,
        viewer,
    )

    public_ids = {item.id for item in list_public_recipes(db, viewer)}
    assert created.id in public_ids


def test_private_recipe_is_not_accessible_through_public_endpoint(db, scenario):
    _, viewer, _, _, _, _, _, _, private_recipe = scenario

    with pytest.raises(HTTPException) as exc:
        get_public_recipe(private_recipe.id, db, viewer)

    assert exc.value.status_code == 404


def test_saving_public_recipe_clones_private_copy(db, scenario):
    _, viewer, _, public_source, _, _, _, _, _ = scenario

    result = save_public_recipe(public_source.id, db, viewer)

    assert result.id != public_source.id
    assert result.name == public_source.name
    assert result.is_public is False
    assert result.source_recipe_id == public_source.id
    clone = db.query(Recipe).filter_by(id=result.id).one()
    assert clone.owner_user_id == viewer.id
    assert db.query(RecipeIngredient).filter_by(recipe_id=clone.id).count() == 3


def test_saving_public_recipe_twice_reuses_existing_clone(db, scenario):
    _, viewer, _, public_source, _, _, _, _, _ = scenario

    first = save_public_recipe(public_source.id, db, viewer)
    second = save_public_recipe(public_source.id, db, viewer)

    assert second.id == first.id
    assert db.query(Recipe).filter_by(owner_user_id=viewer.id, source_recipe_id=public_source.id).count() == 1


def test_similar_public_recipes_use_weighted_knn_order(db, scenario):
    _, viewer, _, public_source, best_match, close_match, zero_overlap_match, weak_overlap_match, _ = scenario

    result = get_similar_public_recipes(public_source.id, 4, db, viewer)

    assert [item.id for item in result] == [best_match.id, close_match.id]
    assert result[0].similarity_score > result[1].similarity_score
    assert zero_overlap_match.id not in {item.id for item in result}
    assert weak_overlap_match.id not in {item.id for item in result}


def test_owner_only_recipe_api_rejects_non_owned_private_recipe(db, scenario):
    _, viewer, _, _, _, _, _, _, private_recipe = scenario

    with pytest.raises(HTTPException) as exc:
        get_recipe(private_recipe.id, db, viewer)

    assert exc.value.status_code == 404
