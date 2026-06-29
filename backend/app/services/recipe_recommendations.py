"""KNN-style public recipe similarity recommendations."""

from sqlalchemy.orm import Session, selectinload

from app.db.models.recipe import Recipe
from app.db.models.recipe_ingredient import RecipeIngredient


MIN_INGREDIENT_OVERLAP = 0.20


def _ingredient_ids(recipe: Recipe) -> set[int]:
    return {item.ingredient_id for item in recipe.ingredients}


def _ingredient_jaccard(source: Recipe, candidate: Recipe) -> float:
    source_ids = _ingredient_ids(source)
    candidate_ids = _ingredient_ids(candidate)
    union = source_ids | candidate_ids
    if not union:
        return 0.0
    return len(source_ids & candidate_ids) / len(union)


def _numeric_similarity(source_value: int | None, candidate_value: int | None) -> float:
    if source_value is None or candidate_value is None:
        return 0.0
    maximum = max(source_value, candidate_value)
    if maximum <= 0:
        return 1.0
    return max(0.0, 1.0 - (abs(source_value - candidate_value) / maximum))


def recipe_similarity_score(source: Recipe, candidate: Recipe) -> float:
    """
    Compute weighted recipe similarity from existing recipe fields.

    The score is intentionally deterministic and explainable:
    75% ingredient overlap, 15% cooking-time closeness, 10% serving closeness.
    """
    ingredient_score = _ingredient_jaccard(source, candidate)
    time_score = _numeric_similarity(source.cooking_time_minutes, candidate.cooking_time_minutes)
    serving_score = _numeric_similarity(source.base_servings, candidate.base_servings)
    return round(
        (0.75 * ingredient_score) + (0.15 * time_score) + (0.10 * serving_score),
        6,
    )


def recommend_similar_public_recipes(
    db: Session,
    source_recipe: Recipe,
    *,
    limit: int = 4,
) -> list[tuple[Recipe, float]]:
    """Return the K nearest public recipes for a source public recipe."""
    candidates = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient))
        .filter(Recipe.is_public.is_(True), Recipe.id != source_recipe.id)
        .all()
    )
    scored = [
        (candidate, recipe_similarity_score(source_recipe, candidate))
        for candidate in candidates
        if _ingredient_jaccard(source_recipe, candidate) >= MIN_INGREDIENT_OVERLAP
    ]
    scored.sort(key=lambda item: (-item[1], item[0].name.lower(), item[0].id))
    return scored[:limit]
