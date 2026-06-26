"""Idempotently seed the public recipe pool without clearing existing data."""

import os
import sys
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.base import Base
from app.db.models import Ingredient, Recipe, RecipeIngredient, User
from app.db.session import SessionLocal, engine
from app.services.security import hash_password


PUBLIC_OWNER_EMAIL = "public-recipes@dinnerly.local"


PUBLIC_RECIPES = [
    {
        "name": "Garlic Butter Pasta",
        "description": "A simple Italian pasta with garlic, olive oil, basil, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 20,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600",
        "ingredients": ["Pasta", "Garlic", "Olive Oil", "Basil", "Parmesan Cheese"],
    },
    {
        "name": "Classic Tomato Pasta",
        "description": "Traditional pasta with tomato sauce, garlic, onion, and fresh basil.",
        "base_servings": 3,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=600",
        "ingredients": ["Pasta", "Tomato", "Garlic", "Olive Oil", "Basil", "Onion"],
    },
    {
        "name": "Mushroom Spinach Pasta",
        "description": "Creamy pasta with mushrooms, spinach, garlic, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600",
        "ingredients": ["Pasta", "Mushroom", "Spinach", "Garlic", "Parmesan Cheese", "Olive Oil"],
    },
    {
        "name": "Caprese Pasta Bake",
        "description": "Baked pasta with tomato, mozzarella, basil, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600",
        "ingredients": ["Pasta", "Tomato", "Mozzarella", "Basil", "Parmesan Cheese", "Garlic"],
    },
    {
        "name": "Grilled Salmon with Lemon",
        "description": "Fresh salmon grilled with lemon, olive oil, garlic, salt, and pepper.",
        "base_servings": 2,
        "cooking_time_minutes": 15,
        "image_url": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600",
        "ingredients": ["Salmon Fillet", "Lemon", "Olive Oil", "Garlic", "Salt", "Black Pepper"],
    },
    {
        "name": "Lemon Chicken Rice",
        "description": "One-pan chicken and rice with lemon, garlic, onion, and olive oil.",
        "base_servings": 5,
        "cooking_time_minutes": 50,
        "image_url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
        "ingredients": ["Chicken Thighs", "Rice", "Lemon", "Garlic", "Olive Oil", "Onion"],
    },
    {
        "name": "Chicken Fajita Rice",
        "description": "Chicken, bell pepper, onion, garlic, cilantro, and rice skillet.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600",
        "ingredients": ["Chicken Breast", "Bell Pepper", "Onion", "Rice", "Garlic", "Cilantro"],
    },
    {
        "name": "Beef Stir Fry",
        "description": "Quick beef stir fry with bell pepper, mushrooms, soy sauce, ginger, and rice.",
        "base_servings": 4,
        "cooking_time_minutes": 20,
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
        "ingredients": ["Ground Beef", "Bell Pepper", "Mushroom", "Soy Sauce", "Garlic", "Ginger", "Rice"],
    },
    {
        "name": "Spinach and Mushroom Risotto",
        "description": "Creamy risotto with spinach, mushrooms, onion, garlic, and parmesan.",
        "base_servings": 3,
        "cooking_time_minutes": 40,
        "image_url": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600",
        "ingredients": ["Rice", "Spinach", "Mushroom", "Olive Oil", "Onion", "Garlic", "Parmesan Cheese"],
    },
    {
        "name": "Greek Salad Bowl",
        "description": "Fresh cucumber, tomato, feta, chickpeas, lemon, and olive oil.",
        "base_servings": 4,
        "cooking_time_minutes": 15,
        "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600",
        "ingredients": ["Cucumber", "Tomato", "Feta Cheese", "Chickpeas", "Olive Oil", "Lemon"],
    },
    {
        "name": "Roasted Vegetable Tray",
        "description": "Roasted potato, carrot, bell pepper, onion, olive oil, and garlic.",
        "base_servings": 6,
        "cooking_time_minutes": 40,
        "image_url": "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600",
        "ingredients": ["Potato", "Carrot", "Bell Pepper", "Onion", "Olive Oil", "Garlic"],
    },
    {
        "name": "Chocolate Butter Cake",
        "description": "Simple chocolate cake with flour, sugar, cocoa, butter, and eggs.",
        "base_servings": 8,
        "cooking_time_minutes": 55,
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
        "ingredients": ["Flour", "Sugar", "Cocoa Powder", "Butter", "Eggs"],
    },
    {
        "name": "Tomato Mozzarella Salad",
        "description": "Light tomato, mozzarella, basil, olive oil, and lemon salad.",
        "base_servings": 3,
        "cooking_time_minutes": 10,
        "image_url": "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600",
        "ingredients": ["Tomato", "Mozzarella", "Basil", "Olive Oil", "Lemon"],
    },
    {
        "name": "Chickpea Spinach Stew",
        "description": "Warm chickpea stew with spinach, tomato, onion, garlic, and rice.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600",
        "ingredients": ["Chickpeas", "Spinach", "Tomato", "Onion", "Garlic", "Rice"],
    },
    {
        "name": "Garlic Parmesan Potatoes",
        "description": "Crispy potatoes with garlic, parmesan, olive oil, salt, and pepper.",
        "base_servings": 5,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600",
        "ingredients": ["Potato", "Garlic", "Parmesan Cheese", "Olive Oil", "Salt", "Black Pepper"],
    },
    {
        "name": "Soy Ginger Salmon Rice",
        "description": "Salmon rice bowl with soy sauce, ginger, garlic, and lemon.",
        "base_servings": 3,
        "cooking_time_minutes": 25,
        "image_url": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
        "ingredients": ["Salmon Fillet", "Rice", "Soy Sauce", "Ginger", "Garlic", "Lemon"],
    },
    {
        "name": "Beef Rice Skillet",
        "description": "Ground beef, rice, tomato, onion, bell pepper, and garlic in one skillet.",
        "base_servings": 4,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1604908177522-4028d9c424b7?w=600",
        "ingredients": ["Ground Beef", "Rice", "Tomato", "Onion", "Bell Pepper", "Garlic"],
    },
    {
        "name": "Creamy Mushroom Rice",
        "description": "Creamy rice with mushrooms, spinach, onion, garlic, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600",
        "ingredients": ["Rice", "Mushroom", "Spinach", "Onion", "Garlic", "Parmesan Cheese"],
    },
    {
        "name": "Chicken Tomato Pasta",
        "description": "Chicken breast pasta with tomato, garlic, basil, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600",
        "ingredients": ["Chicken Breast", "Pasta", "Tomato", "Garlic", "Basil", "Parmesan Cheese"],
    },
    {
        "name": "Lemon Yogurt Chicken",
        "description": "Tender chicken thighs with yogurt, lemon, garlic, and olive oil.",
        "base_servings": 4,
        "cooking_time_minutes": 40,
        "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600",
        "ingredients": ["Chicken Thighs", "Yogurt", "Lemon", "Garlic", "Olive Oil", "Salt"],
    },
    {
        "name": "Cucumber Yogurt Salad",
        "description": "Cool cucumber salad with yogurt, lemon, garlic, and cilantro.",
        "base_servings": 4,
        "cooking_time_minutes": 12,
        "image_url": "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600",
        "ingredients": ["Cucumber", "Yogurt", "Lemon", "Garlic", "Cilantro", "Salt"],
    },
    {
        "name": "Carrot Potato Soup",
        "description": "Simple soup with carrot, potato, onion, garlic, and olive oil.",
        "base_servings": 5,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600",
        "ingredients": ["Carrot", "Potato", "Onion", "Garlic", "Olive Oil", "Black Pepper"],
    },
    {
        "name": "Mozzarella Stuffed Chicken",
        "description": "Chicken breast stuffed with mozzarella, tomato, basil, and garlic.",
        "base_servings": 4,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600",
        "ingredients": ["Chicken Breast", "Mozzarella", "Tomato", "Basil", "Garlic", "Olive Oil"],
    },
    {
        "name": "Vegetable Fried Rice",
        "description": "Rice with carrot, bell pepper, mushroom, soy sauce, ginger, and garlic.",
        "base_servings": 4,
        "cooking_time_minutes": 25,
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
        "ingredients": ["Rice", "Carrot", "Bell Pepper", "Mushroom", "Soy Sauce", "Ginger", "Garlic"],
    },
    {
        "name": "Spinach Feta Pasta",
        "description": "Pasta with spinach, feta, garlic, lemon, and olive oil.",
        "base_servings": 4,
        "cooking_time_minutes": 25,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600",
        "ingredients": ["Pasta", "Spinach", "Feta Cheese", "Garlic", "Lemon", "Olive Oil"],
    },
    {
        "name": "Tomato Chickpea Pasta",
        "description": "Hearty pasta with chickpeas, tomato, onion, garlic, and basil.",
        "base_servings": 4,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600",
        "ingredients": ["Pasta", "Chickpeas", "Tomato", "Onion", "Garlic", "Basil"],
    },
    {
        "name": "Butter Garlic Mushrooms",
        "description": "Quick mushrooms cooked with butter, garlic, parmesan, and black pepper.",
        "base_servings": 3,
        "cooking_time_minutes": 15,
        "image_url": "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600",
        "ingredients": ["Mushroom", "Butter", "Garlic", "Parmesan Cheese", "Black Pepper"],
    },
    {
        "name": "Cocoa Butter Cookies",
        "description": "Small cocoa cookies made with flour, sugar, butter, eggs, and cocoa.",
        "base_servings": 10,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600",
        "ingredients": ["Flour", "Sugar", "Butter", "Eggs", "Cocoa Powder"],
    },
    {
        "name": "Lemon Butter Salmon",
        "description": "Salmon with butter, lemon, garlic, salt, and black pepper.",
        "base_servings": 2,
        "cooking_time_minutes": 18,
        "image_url": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
        "ingredients": ["Salmon Fillet", "Butter", "Lemon", "Garlic", "Salt", "Black Pepper"],
    },
    {
        "name": "Chicken Potato Roast",
        "description": "Roasted chicken thighs with potato, carrot, onion, garlic, and olive oil.",
        "base_servings": 6,
        "cooking_time_minutes": 60,
        "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600",
        "ingredients": ["Chicken Thighs", "Potato", "Carrot", "Onion", "Garlic", "Olive Oil"],
    },
]


def get_or_create_ingredient(db, name: str) -> Ingredient:
    ingredient = db.query(Ingredient).filter(Ingredient.name == name).first()
    if ingredient:
        return ingredient
    ingredient = Ingredient(name=name)
    db.add(ingredient)
    db.flush()
    return ingredient


def seed_public_recipes() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.email == PUBLIC_OWNER_EMAIL).first()
        if not owner:
            owner = User(
                email=PUBLIC_OWNER_EMAIL,
                display_name="Dinnerly Public",
                password_hash=hash_password("demo1234"),
            )
            db.add(owner)
            db.flush()

        for item in PUBLIC_RECIPES:
            recipe = (
                db.query(Recipe)
                .filter(Recipe.owner_user_id == owner.id, Recipe.name == item["name"])
                .first()
            )
            if not recipe:
                recipe = Recipe(
                    owner_user_id=owner.id,
                    name=item["name"],
                    description=item["description"],
                    base_servings=item["base_servings"],
                    cooking_time_minutes=item["cooking_time_minutes"],
                    image_url=item["image_url"],
                    instructions_html="<p>Prepare ingredients, cook, and serve warm.</p>",
                    is_public=True,
                )
                db.add(recipe)
                db.flush()

            recipe.description = item["description"]
            recipe.base_servings = item["base_servings"]
            recipe.cooking_time_minutes = item["cooking_time_minutes"]
            recipe.image_url = item["image_url"]
            recipe.instructions_html = "<p>Prepare ingredients, cook, and serve warm.</p>"
            recipe.is_public = True
            recipe.source_recipe_id = None

            db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
            for ingredient_name in item["ingredients"]:
                ingredient = get_or_create_ingredient(db, ingredient_name)
                db.add(
                    RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=ingredient.id,
                        quantity=Decimal("1"),
                        unit="unit",
                        optional=False,
                    )
                )

        db.commit()
        print(f"Seeded {len(PUBLIC_RECIPES)} public recipes")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_public_recipes()
