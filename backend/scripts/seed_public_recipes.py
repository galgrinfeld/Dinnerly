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


def steps(*items: str) -> str:
    return "".join(f"<p>{index}. {item}</p>" for index, item in enumerate(items, start=1))


PUBLIC_RECIPES = [
    {
        "name": "Garlic Butter Pasta",
        "description": "A simple Italian pasta with garlic, olive oil, basil, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 20,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600",
        "ingredients": [
            {"name": "Pasta", "quantity": 400, "unit": "g"},
            {"name": "Garlic", "quantity": 6, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "chopped"},
            {"name": "Parmesan Cheese", "quantity": 90, "unit": "g", "note": "grated"},
        ],
        "instructions_html": steps(
            "Cook the pasta in salted boiling water until al dente, then reserve a cup of pasta water.",
            "Warm olive oil in a large pan and gently cook the garlic until fragrant.",
            "Add the drained pasta and a splash of pasta water, tossing until glossy.",
            "Fold in basil and parmesan, then season and serve warm.",
        ),
    },
    {
        "name": "Classic Tomato Pasta",
        "description": "Traditional pasta with tomato sauce, garlic, onion, and fresh basil.",
        "base_servings": 3,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=600",
        "ingredients": [
            {"name": "Pasta", "quantity": 300, "unit": "g"},
            {"name": "Tomato", "quantity": 600, "unit": "g", "note": "chopped"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "torn"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "diced"},
        ],
        "instructions_html": steps(
            "Cook the pasta in salted boiling water until al dente.",
            "Saute onion in olive oil until soft, then add garlic for 1 minute.",
            "Add tomatoes and simmer until the sauce thickens.",
            "Toss the pasta through the sauce with basil.",
            "Adjust seasoning and serve immediately.",
        ),
    },
    {
        "name": "Mushroom Spinach Pasta",
        "description": "Creamy pasta with mushrooms, spinach, garlic, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600",
        "ingredients": [
            {"name": "Pasta", "quantity": 350, "unit": "g"},
            {"name": "Mushroom", "quantity": 300, "unit": "g", "note": "sliced"},
            {"name": "Spinach", "quantity": 180, "unit": "g"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Parmesan Cheese", "quantity": 90, "unit": "g", "note": "grated"},
            {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
        ],
        "instructions_html": steps(
            "Cook the pasta until al dente and reserve some cooking water.",
            "Brown mushrooms in olive oil until their moisture evaporates.",
            "Add garlic and spinach, cooking until the spinach wilts.",
            "Toss in pasta, parmesan, and enough pasta water to coat.",
            "Serve while creamy and hot.",
        ),
    },
    {
        "name": "Caprese Pasta Bake",
        "description": "Baked pasta with tomato, mozzarella, basil, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600",
        "ingredients": [
            {"name": "Pasta", "quantity": 350, "unit": "g"},
            {"name": "Tomato", "quantity": 500, "unit": "g", "note": "chopped"},
            {"name": "Mozzarella", "quantity": 220, "unit": "g", "note": "torn"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "chopped"},
            {"name": "Parmesan Cheese", "quantity": 70, "unit": "g", "note": "grated"},
            {"name": "Garlic", "quantity": 2, "unit": "unit", "note": "minced"},
        ],
        "instructions_html": steps(
            "Heat the oven to 200 C and cook the pasta until just tender.",
            "Mix pasta with tomatoes, garlic, basil, and half the mozzarella.",
            "Transfer to a baking dish and top with remaining mozzarella and parmesan.",
            "Bake until bubbling and golden on top.",
            "Rest for 5 minutes before serving.",
        ),
    },
    {
        "name": "Grilled Salmon with Lemon",
        "description": "Fresh salmon grilled with lemon, olive oil, garlic, salt, and pepper.",
        "base_servings": 2,
        "cooking_time_minutes": 15,
        "image_url": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600",
        "ingredients": [
            {"name": "Salmon Fillet", "quantity": 300, "unit": "g"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
            {"name": "Olive Oil", "quantity": 1, "unit": "tbsp"},
            {"name": "Garlic", "quantity": 2, "unit": "unit", "note": "minced"},
            {"name": "Salt", "quantity": None, "unit": "to_taste"},
            {"name": "Black Pepper", "quantity": None, "unit": "to_taste"},
        ],
        "instructions_html": steps(
            "Pat the salmon dry and season with salt, pepper, garlic, olive oil, and lemon zest.",
            "Heat a grill pan or skillet over medium-high heat.",
            "Cook the salmon skin-side down until browned and mostly cooked through.",
            "Turn briefly to finish the top side.",
            "Squeeze lemon juice over the fish and serve.",
        ),
    },
    {
        "name": "Lemon Chicken Rice",
        "description": "One-pan chicken and rice with lemon, garlic, onion, and olive oil.",
        "base_servings": 5,
        "cooking_time_minutes": 50,
        "image_url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
        "ingredients": [
            {"name": "Chicken Thighs", "quantity": 800, "unit": "g"},
            {"name": "Rice", "quantity": 375, "unit": "g"},
            {"name": "Lemon", "quantity": 2, "unit": "unit"},
            {"name": "Garlic", "quantity": 5, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "diced"},
        ],
        "instructions_html": steps(
            "Season the chicken and brown it in olive oil in a deep pan.",
            "Add onion and garlic, cooking until softened.",
            "Stir in rice, lemon zest, lemon juice, and enough water or stock to cook the rice.",
            "Cover and simmer until the rice is tender and chicken is cooked through.",
            "Rest covered for 5 minutes, then fluff the rice and serve.",
        ),
    },
    {
        "name": "Chicken Fajita Rice",
        "description": "Chicken, bell pepper, onion, garlic, cilantro, and rice skillet.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600",
        "ingredients": [
            {"name": "Chicken Breast", "quantity": 600, "unit": "g", "note": "sliced"},
            {"name": "Bell Pepper", "quantity": 3, "unit": "unit", "note": "sliced"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "sliced"},
            {"name": "Rice", "quantity": 300, "unit": "g"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Cilantro", "quantity": 15, "unit": "g", "note": "chopped"},
        ],
        "instructions_html": steps(
            "Cook the rice according to package directions and keep warm.",
            "Sear chicken strips in a hot skillet until browned.",
            "Add bell peppers, onion, and garlic, then cook until tender-crisp.",
            "Fold in the rice and cilantro.",
            "Season to taste and serve from the skillet.",
        ),
    },
    {
        "name": "Beef Stir Fry",
        "description": "Quick beef stir fry with bell pepper, mushrooms, soy sauce, ginger, and rice.",
        "base_servings": 4,
        "cooking_time_minutes": 20,
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
        "ingredients": [
            {"name": "Ground Beef", "quantity": 500, "unit": "g"},
            {"name": "Bell Pepper", "quantity": 2, "unit": "unit", "note": "sliced"},
            {"name": "Mushroom", "quantity": 250, "unit": "g", "note": "sliced"},
            {"name": "Soy Sauce", "quantity": 3, "unit": "tbsp"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Ginger", "quantity": 2, "unit": "tsp", "note": "grated"},
            {"name": "Rice", "quantity": 300, "unit": "g"},
        ],
        "instructions_html": steps(
            "Cook the rice and keep it warm.",
            "Brown the beef in a hot pan, breaking it into small pieces.",
            "Add bell pepper, mushrooms, garlic, and ginger.",
            "Stir in soy sauce and cook until the vegetables are tender.",
            "Serve the stir fry over rice.",
        ),
    },
    {
        "name": "Spinach and Mushroom Risotto",
        "description": "Creamy risotto with spinach, mushrooms, onion, garlic, and parmesan.",
        "base_servings": 3,
        "cooking_time_minutes": 40,
        "image_url": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600",
        "ingredients": [
            {"name": "Rice", "quantity": 300, "unit": "g"},
            {"name": "Spinach", "quantity": 160, "unit": "g"},
            {"name": "Mushroom", "quantity": 300, "unit": "g", "note": "sliced"},
            {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "finely diced"},
            {"name": "Garlic", "quantity": 2, "unit": "unit", "note": "minced"},
            {"name": "Parmesan Cheese", "quantity": 80, "unit": "g", "note": "grated"},
        ],
        "instructions_html": steps(
            "Saute onion and garlic in olive oil until translucent.",
            "Add rice and toast for 2 minutes, stirring often.",
            "Add hot water or stock a little at a time, stirring until absorbed.",
            "Fold in mushrooms and spinach when the rice is nearly tender.",
            "Finish with parmesan and serve creamy.",
        ),
    },
    {
        "name": "Greek Salad Bowl",
        "description": "Fresh cucumber, tomato, feta, chickpeas, lemon, and olive oil.",
        "base_servings": 4,
        "cooking_time_minutes": 15,
        "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600",
        "ingredients": [
            {"name": "Cucumber", "quantity": 2, "unit": "unit", "note": "chopped"},
            {"name": "Tomato", "quantity": 400, "unit": "g", "note": "chopped"},
            {"name": "Feta Cheese", "quantity": 150, "unit": "g", "note": "crumbled"},
            {"name": "Chickpeas", "quantity": 300, "unit": "g", "note": "drained"},
            {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
        ],
        "instructions_html": steps(
            "Chop the cucumber and tomato into bite-size pieces.",
            "Combine vegetables with chickpeas in a large bowl.",
            "Whisk olive oil with lemon juice and a pinch of seasoning.",
            "Toss the salad with the dressing.",
            "Top with feta and serve chilled or at room temperature.",
        ),
    },
    {
        "name": "Roasted Vegetable Tray",
        "description": "Roasted potato, carrot, bell pepper, onion, olive oil, and garlic.",
        "base_servings": 6,
        "cooking_time_minutes": 40,
        "image_url": "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600",
        "ingredients": [
            {"name": "Potato", "quantity": 800, "unit": "g", "note": "cubed"},
            {"name": "Carrot", "quantity": 500, "unit": "g", "note": "sliced"},
            {"name": "Bell Pepper", "quantity": 2, "unit": "unit", "note": "chopped"},
            {"name": "Onion", "quantity": 2, "unit": "unit", "note": "wedged"},
            {"name": "Olive Oil", "quantity": 4, "unit": "tbsp"},
            {"name": "Garlic", "quantity": 4, "unit": "unit", "note": "minced"},
        ],
        "instructions_html": steps(
            "Heat the oven to 220 C and line a large tray.",
            "Cut vegetables into even pieces so they roast at the same pace.",
            "Toss vegetables with olive oil, garlic, and seasoning.",
            "Spread in one layer and roast until browned and tender.",
            "Turn once halfway through and serve hot.",
        ),
    },
    {
        "name": "Chocolate Butter Cake",
        "description": "Simple chocolate cake with flour, sugar, cocoa, butter, and eggs.",
        "base_servings": 8,
        "cooking_time_minutes": 55,
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
        "ingredients": [
            {"name": "Flour", "quantity": 250, "unit": "g"},
            {"name": "Sugar", "quantity": 200, "unit": "g"},
            {"name": "Cocoa Powder", "quantity": 60, "unit": "g"},
            {"name": "Butter", "quantity": 150, "unit": "g", "note": "melted"},
            {"name": "Eggs", "quantity": 3, "unit": "unit"},
        ],
        "instructions_html": steps(
            "Heat the oven to 180 C and grease a cake pan.",
            "Whisk flour, sugar, and cocoa powder in a bowl.",
            "Mix in melted butter and eggs until smooth.",
            "Pour into the pan and level the top.",
            "Bake until a skewer inserted in the center comes out clean.",
            "Cool before slicing.",
        ),
    },
    {
        "name": "Tomato Mozzarella Salad",
        "description": "Light tomato, mozzarella, basil, olive oil, and lemon salad.",
        "base_servings": 3,
        "cooking_time_minutes": 10,
        "image_url": "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600",
        "ingredients": [
            {"name": "Tomato", "quantity": 450, "unit": "g", "note": "sliced"},
            {"name": "Mozzarella", "quantity": 200, "unit": "g", "note": "sliced"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "torn"},
            {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
        ],
        "instructions_html": steps(
            "Slice the tomatoes and mozzarella into even pieces.",
            "Arrange them on a platter in alternating layers.",
            "Scatter basil over the top.",
            "Drizzle with olive oil and lemon juice.",
            "Season to taste and serve immediately.",
        ),
    },
    {
        "name": "Chickpea Spinach Stew",
        "description": "Warm chickpea stew with spinach, tomato, onion, garlic, and rice.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600",
        "ingredients": [
            {"name": "Chickpeas", "quantity": 400, "unit": "g", "note": "drained"},
            {"name": "Spinach", "quantity": 180, "unit": "g"},
            {"name": "Tomato", "quantity": 500, "unit": "g", "note": "chopped"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "diced"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Rice", "quantity": 250, "unit": "g"},
        ],
        "instructions_html": steps(
            "Cook the rice separately and keep warm.",
            "Saute onion and garlic until soft.",
            "Add tomatoes and chickpeas, then simmer until thickened.",
            "Stir in spinach until wilted.",
            "Serve the stew over rice.",
        ),
    },
    {
        "name": "Garlic Parmesan Potatoes",
        "description": "Crispy potatoes with garlic, parmesan, olive oil, salt, and pepper.",
        "base_servings": 5,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600",
        "ingredients": [
            {"name": "Potato", "quantity": 900, "unit": "g", "note": "cubed"},
            {"name": "Garlic", "quantity": 4, "unit": "unit", "note": "minced"},
            {"name": "Parmesan Cheese", "quantity": 80, "unit": "g", "note": "grated"},
            {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
            {"name": "Salt", "quantity": None, "unit": "to_taste"},
            {"name": "Black Pepper", "quantity": None, "unit": "to_taste"},
        ],
        "instructions_html": steps(
            "Heat the oven to 220 C and line a tray.",
            "Toss potatoes with olive oil, garlic, salt, and pepper.",
            "Roast until the edges are crisp and the centers are tender.",
            "Sprinkle parmesan over the hot potatoes.",
            "Return to the oven briefly until the cheese melts.",
        ),
    },
    {
        "name": "Soy Ginger Salmon Rice",
        "description": "Salmon rice bowl with soy sauce, ginger, garlic, and lemon.",
        "base_servings": 3,
        "cooking_time_minutes": 25,
        "image_url": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
        "ingredients": [
            {"name": "Salmon Fillet", "quantity": 450, "unit": "g"},
            {"name": "Rice", "quantity": 250, "unit": "g"},
            {"name": "Soy Sauce", "quantity": 3, "unit": "tbsp"},
            {"name": "Ginger", "quantity": 2, "unit": "tsp", "note": "grated"},
            {"name": "Garlic", "quantity": 2, "unit": "unit", "note": "minced"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
        ],
        "instructions_html": steps(
            "Cook the rice and keep it covered.",
            "Mix soy sauce, ginger, garlic, and lemon juice.",
            "Sear salmon until browned and just cooked through.",
            "Spoon the soy ginger sauce over the salmon.",
            "Serve salmon over rice with extra sauce.",
        ),
    },
    {
        "name": "Beef Rice Skillet",
        "description": "Ground beef, rice, tomato, onion, bell pepper, and garlic in one skillet.",
        "base_servings": 4,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1604908177522-4028d9c424b7?w=600",
        "ingredients": [
            {"name": "Ground Beef", "quantity": 500, "unit": "g"},
            {"name": "Rice", "quantity": 300, "unit": "g"},
            {"name": "Tomato", "quantity": 400, "unit": "g", "note": "chopped"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "diced"},
            {"name": "Bell Pepper", "quantity": 2, "unit": "unit", "note": "diced"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
        ],
        "instructions_html": steps(
            "Brown the beef in a wide skillet and drain excess fat if needed.",
            "Add onion, bell pepper, and garlic, then cook until softened.",
            "Stir in rice, tomato, and enough water or stock to cook the rice.",
            "Cover and simmer until the rice is tender.",
            "Fluff and serve hot.",
        ),
    },
    {
        "name": "Creamy Mushroom Rice",
        "description": "Creamy rice with mushrooms, spinach, onion, garlic, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600",
        "ingredients": [
            {"name": "Rice", "quantity": 320, "unit": "g"},
            {"name": "Mushroom", "quantity": 350, "unit": "g", "note": "sliced"},
            {"name": "Spinach", "quantity": 150, "unit": "g"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "diced"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Parmesan Cheese", "quantity": 90, "unit": "g", "note": "grated"},
        ],
        "instructions_html": steps(
            "Saute onion, garlic, and mushrooms until browned.",
            "Add rice and stir to coat it in the pan juices.",
            "Add water or stock gradually and cook until tender.",
            "Fold in spinach until wilted.",
            "Finish with parmesan and serve creamy.",
        ),
    },
    {
        "name": "Chicken Tomato Pasta",
        "description": "Chicken breast pasta with tomato, garlic, basil, and parmesan.",
        "base_servings": 4,
        "cooking_time_minutes": 35,
        "image_url": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600",
        "ingredients": [
            {"name": "Chicken Breast", "quantity": 500, "unit": "g", "note": "sliced"},
            {"name": "Pasta", "quantity": 350, "unit": "g"},
            {"name": "Tomato", "quantity": 500, "unit": "g", "note": "chopped"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "chopped"},
            {"name": "Parmesan Cheese", "quantity": 80, "unit": "g", "note": "grated"},
        ],
        "instructions_html": steps(
            "Cook pasta until al dente and reserve some pasta water.",
            "Sear chicken pieces until browned and cooked through.",
            "Add garlic and tomato, then simmer into a quick sauce.",
            "Toss pasta with the sauce, chicken, basil, and parmesan.",
            "Loosen with pasta water if needed and serve.",
        ),
    },
    {
        "name": "Lemon Yogurt Chicken",
        "description": "Tender chicken thighs with yogurt, lemon, garlic, and olive oil.",
        "base_servings": 4,
        "cooking_time_minutes": 40,
        "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600",
        "ingredients": [
            {"name": "Chicken Thighs", "quantity": 700, "unit": "g"},
            {"name": "Yogurt", "quantity": 200, "unit": "g"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
            {"name": "Garlic", "quantity": 4, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
            {"name": "Salt", "quantity": None, "unit": "to_taste"},
        ],
        "instructions_html": steps(
            "Mix yogurt, lemon juice, garlic, olive oil, and salt.",
            "Coat chicken thighs in the marinade.",
            "Let the chicken rest for at least 15 minutes.",
            "Bake or pan-roast until browned and cooked through.",
            "Rest briefly before serving.",
        ),
    },
    {
        "name": "Cucumber Yogurt Salad",
        "description": "Cool cucumber salad with yogurt, lemon, garlic, and cilantro.",
        "base_servings": 4,
        "cooking_time_minutes": 12,
        "image_url": "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600",
        "ingredients": [
            {"name": "Cucumber", "quantity": 2, "unit": "unit", "note": "diced"},
            {"name": "Yogurt", "quantity": 250, "unit": "g"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
            {"name": "Garlic", "quantity": 1, "unit": "unit", "note": "grated"},
            {"name": "Cilantro", "quantity": 15, "unit": "g", "note": "chopped"},
            {"name": "Salt", "quantity": None, "unit": "to_taste"},
        ],
        "instructions_html": steps(
            "Dice the cucumber and pat dry if very watery.",
            "Mix yogurt with lemon juice, garlic, and salt.",
            "Fold cucumber and cilantro into the yogurt.",
            "Chill briefly so the flavors settle.",
            "Serve cold as a side dish.",
        ),
    },
    {
        "name": "Carrot Potato Soup",
        "description": "Simple soup with carrot, potato, onion, garlic, and olive oil.",
        "base_servings": 5,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600",
        "ingredients": [
            {"name": "Carrot", "quantity": 600, "unit": "g", "note": "sliced"},
            {"name": "Potato", "quantity": 500, "unit": "g", "note": "cubed"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "diced"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
            {"name": "Black Pepper", "quantity": None, "unit": "to_taste"},
        ],
        "instructions_html": steps(
            "Saute onion and garlic in olive oil until fragrant.",
            "Add carrots and potatoes, then cover with water or stock.",
            "Simmer until the vegetables are very tender.",
            "Blend until smooth or leave chunky if preferred.",
            "Season with black pepper and serve warm.",
        ),
    },
    {
        "name": "Mozzarella Stuffed Chicken",
        "description": "Chicken breast stuffed with mozzarella, tomato, basil, and garlic.",
        "base_servings": 4,
        "cooking_time_minutes": 45,
        "image_url": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600",
        "ingredients": [
            {"name": "Chicken Breast", "quantity": 700, "unit": "g"},
            {"name": "Mozzarella", "quantity": 200, "unit": "g", "note": "sliced"},
            {"name": "Tomato", "quantity": 250, "unit": "g", "note": "sliced"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "chopped"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
        ],
        "instructions_html": steps(
            "Heat the oven to 200 C.",
            "Cut a pocket into each chicken breast without slicing all the way through.",
            "Fill with mozzarella, tomato, basil, and garlic.",
            "Sear the chicken in olive oil until golden.",
            "Bake until the chicken is cooked through and cheese is melted.",
        ),
    },
    {
        "name": "Vegetable Fried Rice",
        "description": "Rice with carrot, bell pepper, mushroom, soy sauce, ginger, and garlic.",
        "base_servings": 4,
        "cooking_time_minutes": 25,
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
        "ingredients": [
            {"name": "Rice", "quantity": 350, "unit": "g", "note": "cooked and cooled"},
            {"name": "Carrot", "quantity": 200, "unit": "g", "note": "diced"},
            {"name": "Bell Pepper", "quantity": 2, "unit": "unit", "note": "diced"},
            {"name": "Mushroom", "quantity": 200, "unit": "g", "note": "sliced"},
            {"name": "Soy Sauce", "quantity": 3, "unit": "tbsp"},
            {"name": "Ginger", "quantity": 2, "unit": "tsp", "note": "grated"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
        ],
        "instructions_html": steps(
            "Use cooked, cooled rice so the grains stay separate.",
            "Stir fry carrot, bell pepper, and mushrooms in a hot pan.",
            "Add garlic and ginger and cook until fragrant.",
            "Add rice and soy sauce, tossing until hot throughout.",
            "Serve immediately.",
        ),
    },
    {
        "name": "Spinach Feta Pasta",
        "description": "Pasta with spinach, feta, garlic, lemon, and olive oil.",
        "base_servings": 4,
        "cooking_time_minutes": 25,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600",
        "ingredients": [
            {"name": "Pasta", "quantity": 350, "unit": "g"},
            {"name": "Spinach", "quantity": 200, "unit": "g"},
            {"name": "Feta Cheese", "quantity": 150, "unit": "g", "note": "crumbled"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
            {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
        ],
        "instructions_html": steps(
            "Cook pasta until al dente and reserve pasta water.",
            "Warm olive oil and cook garlic until fragrant.",
            "Add spinach and cook until wilted.",
            "Toss pasta with spinach, feta, lemon juice, and zest.",
            "Use pasta water to loosen the sauce and serve.",
        ),
    },
    {
        "name": "Tomato Chickpea Pasta",
        "description": "Hearty pasta with chickpeas, tomato, onion, garlic, and basil.",
        "base_servings": 4,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600",
        "ingredients": [
            {"name": "Pasta", "quantity": 350, "unit": "g"},
            {"name": "Chickpeas", "quantity": 300, "unit": "g", "note": "drained"},
            {"name": "Tomato", "quantity": 500, "unit": "g", "note": "chopped"},
            {"name": "Onion", "quantity": 1, "unit": "unit", "note": "diced"},
            {"name": "Garlic", "quantity": 3, "unit": "unit", "note": "minced"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "chopped"},
        ],
        "instructions_html": steps(
            "Cook pasta in salted water until al dente.",
            "Saute onion and garlic until softened.",
            "Add tomatoes and chickpeas, then simmer into a chunky sauce.",
            "Toss the pasta with the sauce and basil.",
            "Season and serve warm.",
        ),
    },
    {
        "name": "Butter Garlic Mushrooms",
        "description": "Quick mushrooms cooked with butter, garlic, parmesan, and black pepper.",
        "base_servings": 3,
        "cooking_time_minutes": 15,
        "image_url": "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600",
        "ingredients": [
            {"name": "Mushroom", "quantity": 500, "unit": "g", "note": "halved"},
            {"name": "Butter", "quantity": 50, "unit": "g"},
            {"name": "Garlic", "quantity": 4, "unit": "unit", "note": "minced"},
            {"name": "Parmesan Cheese", "quantity": 50, "unit": "g", "note": "grated"},
            {"name": "Black Pepper", "quantity": None, "unit": "to_taste"},
        ],
        "instructions_html": steps(
            "Heat a wide pan until hot.",
            "Cook mushrooms until browned and their moisture evaporates.",
            "Add butter and garlic, tossing to coat.",
            "Finish with parmesan and black pepper.",
            "Serve immediately while glossy.",
        ),
    },
    {
        "name": "Cocoa Butter Cookies",
        "description": "Small cocoa cookies made with flour, sugar, butter, eggs, and cocoa.",
        "base_servings": 10,
        "cooking_time_minutes": 30,
        "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600",
        "ingredients": [
            {"name": "Flour", "quantity": 220, "unit": "g"},
            {"name": "Sugar", "quantity": 160, "unit": "g"},
            {"name": "Butter", "quantity": 120, "unit": "g", "note": "softened"},
            {"name": "Eggs", "quantity": 1, "unit": "unit"},
            {"name": "Cocoa Powder", "quantity": 40, "unit": "g"},
        ],
        "instructions_html": steps(
            "Heat the oven to 180 C and line a baking tray.",
            "Cream butter and sugar until smooth.",
            "Beat in the egg, then mix in flour and cocoa.",
            "Shape small portions of dough onto the tray.",
            "Bake until set at the edges.",
            "Cool on the tray before serving.",
        ),
    },
    {
        "name": "Lemon Butter Salmon",
        "description": "Salmon with butter, lemon, garlic, salt, and black pepper.",
        "base_servings": 2,
        "cooking_time_minutes": 18,
        "image_url": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
        "ingredients": [
            {"name": "Salmon Fillet", "quantity": 320, "unit": "g"},
            {"name": "Butter", "quantity": 40, "unit": "g"},
            {"name": "Lemon", "quantity": 1, "unit": "unit"},
            {"name": "Garlic", "quantity": 2, "unit": "unit", "note": "minced"},
            {"name": "Salt", "quantity": None, "unit": "to_taste"},
            {"name": "Black Pepper", "quantity": None, "unit": "to_taste"},
        ],
        "instructions_html": steps(
            "Season the salmon with salt and pepper.",
            "Melt butter in a skillet and add garlic.",
            "Cook salmon until browned on one side.",
            "Turn and baste with garlic butter until cooked through.",
            "Finish with lemon juice and serve.",
        ),
    },
    {
        "name": "Chicken Potato Roast",
        "description": "Roasted chicken thighs with potato, carrot, onion, garlic, and olive oil.",
        "base_servings": 6,
        "cooking_time_minutes": 60,
        "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600",
        "ingredients": [
            {"name": "Chicken Thighs", "quantity": 900, "unit": "g"},
            {"name": "Potato", "quantity": 900, "unit": "g", "note": "cubed"},
            {"name": "Carrot", "quantity": 500, "unit": "g", "note": "sliced"},
            {"name": "Onion", "quantity": 2, "unit": "unit", "note": "wedged"},
            {"name": "Garlic", "quantity": 5, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 4, "unit": "tbsp"},
        ],
        "instructions_html": steps(
            "Heat the oven to 210 C.",
            "Toss potatoes, carrots, onion, and garlic with olive oil.",
            "Arrange vegetables on a tray and nestle chicken thighs on top.",
            "Roast until the vegetables are tender and chicken is browned.",
            "Rest for 5 minutes before serving.",
        ),
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
                    instructions_html=item["instructions_html"],
                    is_public=True,
                )
                db.add(recipe)
                db.flush()

            recipe.description = item["description"]
            recipe.base_servings = item["base_servings"]
            recipe.cooking_time_minutes = item["cooking_time_minutes"]
            recipe.image_url = item["image_url"]
            recipe.instructions_html = item["instructions_html"]
            recipe.is_public = True
            recipe.source_recipe_id = None

            db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
            for ingredient_data in item["ingredients"]:
                ingredient = get_or_create_ingredient(db, ingredient_data["name"])
                quantity = ingredient_data.get("quantity")
                db.add(
                    RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=ingredient.id,
                        quantity=Decimal(str(quantity)) if quantity is not None else None,
                        unit=ingredient_data["unit"],
                        note=ingredient_data.get("note"),
                        optional=ingredient_data.get("optional", False),
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
