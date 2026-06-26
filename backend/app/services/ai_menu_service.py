"""AI provider integration and deterministic development fallback."""
import json
import os
from hashlib import sha1
from html import escape
from pathlib import Path
from urllib import error, request
from urllib.parse import quote, urlencode, urlparse

from dotenv import load_dotenv
from pydantic import ValidationError

from app.schemas.ai_menu import AiRecipeSuggestion, AiSuggestionsResponse, GeneratedRecipe


# Load backend/.env independently of the directory used to launch FastAPI.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class AiServiceError(Exception):
    """Raised when an AI provider response cannot be used safely."""


SUGGESTION_PROMPT = """You are an AI menu assistant for a meal-planning app called Dinnerly.

The user is planning a shared dinner event.

Existing dishes in the event:
{existing_recipe_names}

Suggest 5 additional dishes that would complement the current dinner menu.

Requirements:

* Include different dish types when possible: side dish, salad, appetizer, dessert, or main dish.
* Do not suggest dishes that are already in the event.
* Prefer practical home-cooking recipes.
* Avoid overly complex restaurant-style dishes.
* Keep the suggestions suitable for a shared dinner.
* Return only valid JSON.
* Do not include markdown.

JSON format:
{{
  "suggestions": [
    {{
      "name": "Dish name",
      "category": "Side Dish | Salad | Appetizer | Dessert | Main Dish",
      "reason": "Short explanation of why this dish fits the existing menu"
    }}
  ]
}}
"""

RECIPE_PROMPT = """You are an AI recipe generator for a meal-planning app called Dinnerly.

Create a complete structured recipe for the following dish:
{dish_name}

Context:
The recipe should fit a shared dinner event with these existing dishes:
{existing_recipe_names}

Requirements:

* Return only valid JSON.
* Do not include markdown.
* Use practical home-cooking instructions.
* Use common ingredients.
* Use clear quantities and units.
* Set baseServings to 4 unless another serving count is provided. The provided serving count is {servings}.
* Include 5 to 10 ingredients.
* Include 4 to 8 cooking instructions.
* Keep cookingTimeMinutes realistic.
* Do not include unsafe food handling instructions.
* Include an imageUrl field and set it to an empty string.
* Do not invent image URLs.
* Always include imageSearchQuery with a short food-photo search query for this dish.
* Ingredient units must be one of: g, kg, ml, l, tsp, tbsp, cup, unit, slice, to_taste.

JSON format:
{{
  "name": "Recipe name",
  "description": "Short recipe description",
  "baseServings": {servings},
  "cookingTimeMinutes": 30,
  "imageUrl": "",
  "imageSearchQuery": "homemade recipe name food photo",
  "instructions": "Step 1...\\nStep 2...\\nStep 3...\\nStep 4...",
  "ingredients": [
    {{
      "name": "Ingredient name",
      "quantity": 1,
      "unit": "cup",
      "notes": "optional preparation note",
      "optional": false
    }}
  ]
}}
"""


def _call_provider(prompt: str) -> dict:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY")
    if not api_key:
        raise RuntimeError("AI key is not configured")
    payload = json.dumps({
        "model": os.getenv("AI_MODEL", "gpt-4o-mini"),
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.4,
    }).encode("utf-8")
    req = request.Request(
        os.getenv("AI_API_URL", "https://api.openai.com/v1/chat/completions"),
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=30) as response:
            body = json.loads(response.read().decode("utf-8"))
        content = body["choices"][0]["message"]["content"]
        return json.loads(content)
    except (error.URLError, TimeoutError, KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise AiServiceError("AI provider returned an unusable response") from exc


def _mock_suggestions(existing_names: list[str]) -> AiSuggestionsResponse:
    existing = {name.casefold() for name in existing_names}
    candidates = [
        ("Roasted Garlic Herb Potatoes", "Side Dish", "Adds a warm, shareable side with savory herbs."),
        ("Citrus Garden Salad", "Salad", "Brings freshness and acidity to balance the menu."),
        ("Honey Glazed Carrots", "Side Dish", "Adds color and gentle sweetness to the dinner."),
        ("Chocolate Berry Mousse", "Dessert", "Finishes the meal with a light, make-ahead dessert."),
        ("Herbed Focaccia", "Bread", "A crowd-friendly bread that complements the existing dishes."),
    ]
    menu_context = existing_names[0] if existing_names else "the planned menu"
    available = [AiRecipeSuggestion(name=n, category=c, reason=f"{r} It pairs well with {menu_context}.") for n, c, r in candidates if n.casefold() not in existing]
    suffix = 1
    while len(available) < 4:
        name = f"Chef's Seasonal Plate {suffix}"
        if name.casefold() not in existing:
            available.append(AiRecipeSuggestion(
                name=name,
                category="Side Dish",
                reason=f"A flexible seasonal accompaniment that balances {menu_context}.",
            ))
        suffix += 1
    return AiSuggestionsResponse(suggestions=available[:4])


def suggest_recipes(existing_names: list[str]) -> AiSuggestionsResponse:
    if not (os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY")):
        return _mock_suggestions(existing_names)
    try:
        result = AiSuggestionsResponse.model_validate(
            _call_provider(
                SUGGESTION_PROMPT.format(
                    existing_recipe_names=", ".join(existing_names) or "No dishes have been added yet."
                )
            )
        )
    except ValidationError as exc:
        raise AiServiceError("AI suggestions failed validation") from exc
    existing = {name.casefold() for name in existing_names}
    filtered = [item for item in result.suggestions if item.name.casefold() not in existing]
    if len(filtered) < 3:
        raise AiServiceError("AI did not return enough new dish suggestions")
    return AiSuggestionsResponse(suggestions=filtered[:5])


def _mock_recipe(name: str, category: str, servings: int) -> GeneratedRecipe:
    lowered = name.casefold()
    if "potato" in lowered:
        main_name, quantity, unit = "Baby potatoes", max(750, servings * 180), "g"
    elif "salad" in lowered:
        main_name, quantity, unit = "Mixed salad greens", max(250, servings * 60), "g"
    elif "carrot" in lowered:
        main_name, quantity, unit = "Carrots", max(600, servings * 150), "g"
    elif "focaccia" in lowered or "bread" in lowered:
        main_name, quantity, unit = "All-purpose flour", max(500, servings * 100), "g"
    elif "mousse" in lowered or category.casefold() == "dessert":
        main_name, quantity, unit = "Dark chocolate", max(250, servings * 50), "g"
    else:
        main_name, quantity, unit = f"Fresh ingredients for {name}", max(500, servings * 125), "g"
    return GeneratedRecipe.model_validate({
        "name": name,
        "description": f"A flavorful {category.lower()} designed to complement your dinner menu.",
        "baseServings": servings,
        "cookingTimeMinutes": 35,
        "imageSearchQuery": f"homemade {name} food photo",
        "instructionsHtml": "<ol><li>Prepare and measure all ingredients.</li><li>Combine the ingredients and season well.</li><li>Cook until golden and tender, then serve warm.</li></ol>",
        "ingredients": [
            {"name": main_name, "quantity": quantity, "unit": unit, "note": "prepared", "optional": False},
            {"name": "Olive oil", "quantity": 2, "unit": "tbsp", "note": "", "optional": False},
            {"name": "Fresh herbs", "quantity": 2, "unit": "tbsp", "note": "chopped", "optional": False},
            {"name": "Salt", "quantity": 1, "unit": "tsp", "note": "adjust to taste", "optional": False},
        ],
    })


def _instructions_to_html(recipe: GeneratedRecipe) -> GeneratedRecipe:
    """Convert the AI's newline-separated steps to Dinnerly's HTML representation."""
    instructions = recipe.instructions_html.strip()
    if "<" not in instructions:
        steps = [line.strip() for line in instructions.splitlines() if line.strip()]
        recipe.instructions_html = "<ol>" + "".join(f"<li>{escape(step)}</li>" for step in steps) + "</ol>"
    return recipe


def generate_recipe(
    name: str,
    category: str,
    servings: int,
    existing_names: list[str] | None = None,
) -> GeneratedRecipe:
    if not (os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY")):
        return _mock_recipe(name, category, servings)
    try:
        recipe = GeneratedRecipe.model_validate(
            _call_provider(
                RECIPE_PROMPT.format(
                    dish_name=name,
                    servings=servings,
                    existing_recipe_names=", ".join(existing_names or []) or "No dishes have been added yet.",
                )
            )
        )
        return _instructions_to_html(recipe)
    except ValidationError as exc:
        raise AiServiceError("AI recipe failed validation") from exc


def _is_probably_direct_image_url(image_url: str) -> bool:
    """Accept only URLs that are likely to render directly in an <img> tag."""
    try:
        parsed = urlparse(image_url)
    except (TypeError, ValueError):
        return False
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return False
    if parsed.netloc.endswith("images.unsplash.com"):
        return True
    return parsed.path.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"))


def _curated_food_image_url(recipe_name: str, image_search_query: str | None = None) -> str:
    """Return a dish-specific AI-generated food photo URL."""
    search_context = (image_search_query or "").strip()
    prompt = (
        f"appetizing realistic food photography of {recipe_name}, "
        f"{search_context}, plated home-cooked dinner, natural light, "
        "no text, no watermark"
    )
    seed = int(sha1(recipe_name.casefold().encode("utf-8")).hexdigest()[:8], 16)
    query = urlencode({
        "width": 800,
        "height": 600,
        "seed": seed,
        "model": "flux",
        "nologo": "true",
        "enhance": "true",
    })
    return f"https://image.pollinations.ai/prompt/{quote(prompt, safe='')}?{query}"


def resolve_image_url(
    image_url: str | None,
    recipe_name: str,
    image_search_query: str | None = None,
) -> str:
    # AI models often return article pages, thumbnails with expired transforms,
    # or hotlink-blocked URLs. For Dinnerly we need a URL that opens as a photo
    # and works in <img src="...">, so generated recipes use our deterministic
    # food-photo URL instead of trusting model-provided links.
    return _curated_food_image_url(recipe_name, image_search_query)
