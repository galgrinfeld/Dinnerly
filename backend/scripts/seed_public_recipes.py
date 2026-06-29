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
        "ingredients": [
            {"name": "Pasta", "quantity": 400, "unit": "g"},
            {"name": "Garlic", "quantity": 6, "unit": "unit", "note": "minced"},
            {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
            {"name": "Basil", "quantity": 2, "unit": "tbsp", "note": "chopped"},
            {"name": "Parmesan Cheese", "quantity": 90, "unit": "g", "note": "grated"},
        ],
        "instructions": (
            "<p>1. Cook the pasta in salted boiling water until al dente, then reserve a cup of pasta water.</p>"
            "<p>2. Warm olive oil in a large pan and gently cook the garlic until fragrant.</p>"
            "<p>3. Add the drained pasta and a splash of pasta water, tossing until glossy.</p>"
            "<p>4. Fold in basil and parmesan, then season and serve warm.</p>"
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
        "instructions": (
            "<p>1. Cook the pasta in salted boiling water until al dente.</p>"
            "<p>2. Saute onion in olive oil until soft, then add garlic for 1 minute.</p>"
            "<p>3. Add tomatoes and simmer until the sauce thickens.</p>"
            "<p>4. Toss the pasta through the sauce with basil.</p>"
            "<p>5. Adjust seasoning and serve immediately.</p>"
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
        "instructions": (
            "<p>1. Cook the pasta until al dente and reserve some cooking water.</p>"
            "<p>2. Brown mushrooms in olive oil until their moisture evaporates.</p>"
            "<p>3. Add garlic and spinach, cooking until the spinach wilts.</p>"
            "<p>4. Toss in pasta, parmesan, and enough pasta water to coat.</p>"
            "<p>5. Serve while creamy and hot.</p>"
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
        "instructions": (
            "<p>1. Heat the oven to 200 C and cook the pasta until just tender.</p>"
            "<p>2. Mix pasta with tomatoes, garlic, basil, and half the mozzarella.</p>"
            "<p>3. Transfer to a baking dish and top with remaining mozzarella and parmesan.</p>"
            "<p>4. Bake until bubbling and golden on top.</p>"
            "<p>5. Rest for 5 minutes before serving.</p>"
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
        "instructions": (
            "<p>1. Pat the salmon dry and season with salt, pepper, garlic, olive oil, and lemon zest.</p>"
            "<p>2. Heat a grill pan or skillet over medium-high heat.</p>"
            "<p>3. Cook the salmon skin-side down until browned and mostly cooked through.</p>"
            "<p>4. Turn briefly to finish the top side.</p>"
            "<p>5. Squeeze lemon juice over the fish and serve.</p>"
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
        "instructions": (
            "<p>1. Season the chicken and brown it in olive oil in a deep pan.</p>"
            "<p>2. Add onion and garlic, cooking until softened.</p>"
            "<p>3. Stir in rice, lemon zest, lemon juice, and enough water or stock to cook the rice.</p>"
            "<p>4. Cover and simmer until the rice is tender and chicken is cooked through.</p>"
            "<p>5. Rest covered for 5 minutes, then fluff the rice and serve.</p>"
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
        "instructions": (
            "<p>1. Cook the rice according to package directions and keep warm.</p>"
            "<p>2. Sear chicken strips in a hot skillet until browned.</p>"
            "<p>3. Add bell peppers, onion, and garlic, then cook until tender-crisp.</p>"
            "<p>4. Fold in the rice and cilantro.</p>"
            "<p>5. Season to taste and serve from the skillet.</p>"
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
        "instructions": (
            "<p>1. Cook the rice and keep it warm.</p>"
            "<p>2. Brown the beef in a hot pan, breaking it into small pieces.</p>"
            "<p>3. Add bell pepper, mushrooms, garlic, and ginger.</p>"
            "<p>4. Stir in soy sauce and cook until the vegetables are tender.</p>"
            "<p>5. Serve the stir fry over rice.</p>"
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
        "instructions": (
            "<p>1. Saute onion and garlic in olive oil until translucent.</p>"
            "<p>2. Add rice and toast for 2 minutes, stirring often.</p>"
            "<p>3. Add hot water or stock a little at a time, stirring until absorbed.</p>"
            "<p>4. Fold in mushrooms and spinach when the rice is nearly tender.</p>"
            "<p>5. Finish with parmesan and serve creamy.</p>"
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
        "instructions": (
            "<p>1. Chop the cucumber and tomato into bite-size pieces.</p>"
            "<p>2. Combine vegetables with chickpeas in a large bowl.</p>"
            "<p>3. Whisk olive oil with lemon juice and a pinch of seasoning.</p>"
            "<p>4. Toss the salad with the dressing.</p>"
            "<p>5. Top with feta and serve chilled or at room temperature.</p>"
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
        "instructions": (
            "<p>1. Heat the oven to 220 C and line a large tray.</p>"
            "<p>2. Cut vegetables into even pieces so they roast at the same pace.</p>"
            "<p>3. Toss vegetables with olive oil, garlic, and seasoning.</p>"
            "<p>4. Spread in one layer and roast until browned and tender.</p>"
            "<p>5. Turn once halfway through and serve hot.</p>"
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
        "instructions": (
            "<p>1. Heat the oven to 180 C and grease a cake pan.</p>"
            "<p>2. Whisk flour, sugar, and cocoa powder in a bowl.</p>"
            "<p>3. Mix in melted butter and eggs until smooth.</p>"
            "<p>4. Pour into the pan and level the top.</p>"
            "<p>5. Bake until a skewer inserted in the center comes out clean.</p>"
            "<p>6. Cool before slicing.</p>"
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
        "instructions": (
            "<p>1. Slice the tomatoes and mozzarella into even pieces.</p>"
            "<p>2. Arrange them on a platter in alternating layers.</p>"
            "<p>3. Scatter basil over the top.</p>"
            "<p>4. Drizzle with olive oil and lemon juice.</p>"
            "<p>5. Season to taste and serve immediately.</p>"
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
        "instructions": (
            "<p>1. Cook the rice separately and keep warm.</p>"
            "<p>2. Saute onion and garlic until soft.</p>"
            "<p>3. Add tomatoes and chickpeas, then simmer until thickened.</p>"
            "<p>4. Stir in spinach until wilted.</p>"
            "<p>5. Serve the stew over rice.</p>"
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
        "instructions": (
            "<p>1. Heat the oven to 220 C and line a tray.</p>"
            "<p>2. Toss potatoes with olive oil, garlic, salt, and pepper.</p>"
            "<p>3. Roast until the edges are crisp and the centers are tender.</p>"
            "<p>4. Sprinkle parmesan over the hot potatoes.</p>"
            "<p>5. Return to the oven briefly until the cheese melts.</p>"
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
        "instructions": (
            "<p>1. Cook the rice and keep it covered.</p>"
            "<p>2. Mix soy sauce, ginger, garlic, and lemon juice.</p>"
            "<p>3. Sear salmon until browned and just cooked through.</p>"
            "<p>4. Spoon the soy ginger sauce over the salmon.</p>"
            "<p>5. Serve salmon over rice with extra sauce.</p>"
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
        "instructions": (
            "<p>1. Brown the beef in a wide skillet and drain excess fat if needed.</p>"
            "<p>2. Add onion, bell pepper, and garlic, then cook until softened.</p>"
            "<p>3. Stir in rice, tomato, and enough water or stock to cook the rice.</p>"
            "<p>4. Cover and simmer until the rice is tender.</p>"
            "<p>5. Fluff and serve hot.</p>"
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
        "instructions": (
            "<p>1. Saute onion, garlic, and mushrooms until browned.</p>"
            "<p>2. Add rice and stir to coat it in the pan juices.</p>"
            "<p>3. Add water or stock gradually and cook until tender.</p>"
            "<p>4. Fold in spinach until wilted.</p>"
            "<p>5. Finish with parmesan and serve creamy.</p>"
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
        "instructions": (
            "<p>1. Cook pasta until al dente and reserve some pasta water.</p>"
            "<p>2. Sear chicken pieces until browned and cooked through.</p>"
            "<p>3. Add garlic and tomato, then simmer into a quick sauce.</p>"
            "<p>4. Toss pasta with the sauce, chicken, basil, and parmesan.</p>"
            "<p>5. Loosen with pasta water if needed and serve.</p>"
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
        "instructions": (
            "<p>1. Mix yogurt, lemon juice, garlic, olive oil, and salt.</p>"
            "<p>2. Coat chicken thighs in the marinade.</p>"
            "<p>3. Let the chicken rest for at least 15 minutes.</p>"
            "<p>4. Bake or pan-roast until browned and cooked through.</p>"
            "<p>5. Rest briefly before serving.</p>"
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
        "instructions": (
            "<p>1. Dice the cucumber and pat dry if very watery.</p>"
            "<p>2. Mix yogurt with lemon juice, garlic, and salt.</p>"
            "<p>3. Fold cucumber and cilantro into the yogurt.</p>"
            "<p>4. Chill briefly so the flavors settle.</p>"
            "<p>5. Serve cold as a side dish.</p>"
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
        "instructions": (
            "<p>1. Saute onion and garlic in olive oil until fragrant.</p>"
            "<p>2. Add carrots and potatoes, then cover with water or stock.</p>"
            "<p>3. Simmer until the vegetables are very tender.</p>"
            "<p>4. Blend until smooth or leave chunky if preferred.</p>"
            "<p>5. Season with black pepper and serve warm.</p>"
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
        "instructions": (
            "<p>1. Heat the oven to 200 C.</p>"
            "<p>2. Cut a pocket into each chicken breast without slicing all the way through.</p>"
            "<p>3. Fill with mozzarella, tomato, basil, and garlic.</p>"
            "<p>4. Sear the chicken in olive oil until golden.</p>"
            "<p>5. Bake until the chicken is cooked through and cheese is melted.</p>"
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
        "instructions": (
            "<p>1. Use cooked, cooled rice so the grains stay separate.</p>"
            "<p>2. Stir fry carrot, bell pepper, and mushrooms in a hot pan.</p>"
            "<p>3. Add garlic and ginger and cook until fragrant.</p>"
            "<p>4. Add rice and soy sauce, tossing until hot throughout.</p>"
            "<p>5. Serve immediately.</p>"
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
        "instructions": (
            "<p>1. Cook pasta until al dente and reserve pasta water.</p>"
            "<p>2. Warm olive oil and cook garlic until fragrant.</p>"
            "<p>3. Add spinach and cook until wilted.</p>"
            "<p>4. Toss pasta with spinach, feta, lemon juice, and zest.</p>"
            "<p>5. Use pasta water to loosen the sauce and serve.</p>"
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
        "instructions": (
            "<p>1. Cook pasta in salted water until al dente.</p>"
            "<p>2. Saute onion and garlic until softened.</p>"
            "<p>3. Add tomatoes and chickpeas, then simmer into a chunky sauce.</p>"
            "<p>4. Toss the pasta with the sauce and basil.</p>"
            "<p>5. Season and serve warm.</p>"
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
        "instructions": (
            "<p>1. Heat a wide pan until hot.</p>"
            "<p>2. Cook mushrooms until browned and their moisture evaporates.</p>"
            "<p>3. Add butter and garlic, tossing to coat.</p>"
            "<p>4. Finish with parmesan and black pepper.</p>"
            "<p>5. Serve immediately while glossy.</p>"
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
        "instructions": (
            "<p>1. Heat the oven to 180 C and line a baking tray.</p>"
            "<p>2. Cream butter and sugar until smooth.</p>"
            "<p>3. Beat in the egg, then mix in flour and cocoa.</p>"
            "<p>4. Shape small portions of dough onto the tray.</p>"
            "<p>5. Bake until set at the edges.</p>"
            "<p>6. Cool on the tray before serving.</p>"
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
        "instructions": (
            "<p>1. Season the salmon with salt and pepper.</p>"
            "<p>2. Melt butter in a skillet and add garlic.</p>"
            "<p>3. Cook salmon until browned on one side.</p>"
            "<p>4. Turn and baste with garlic butter until cooked through.</p>"
            "<p>5. Finish with lemon juice and serve.</p>"
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
        "instructions": (
            "<p>1. Heat the oven to 210 C.</p>"
            "<p>2. Toss potatoes, carrots, onion, and garlic with olive oil.</p>"
            "<p>3. Arrange vegetables on a tray and nestle chicken thighs on top.</p>"
            "<p>4. Roast until the vegetables are tender and chicken is browned.</p>"
            "<p>5. Rest for 5 minutes before serving.</p>"
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
                    instructions_html=item["instructions"],
                    is_public=True,
                )
                db.add(recipe)
                db.flush()

            recipe.description = item["description"]
            recipe.base_servings = item["base_servings"]
            recipe.cooking_time_minutes = item["cooking_time_minutes"]
            recipe.image_url = item["image_url"]
            recipe.instructions_html = item["instructions"]
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
