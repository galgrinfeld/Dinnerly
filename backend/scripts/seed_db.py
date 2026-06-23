"""
Development Database Seed Script

This script populates the Dinnerly database with realistic demo data for development and testing.

Usage:
    python -m scripts.seed_db

Environment:
    - Only runs if DATABASE_URL or AUTO_SEED_DB is configured
    - Set SKIP_SEED=true to disable auto-seeding
    - Safe to run multiple times (will prompt before clearing)

Demo Users:
    All demo users use password: demo1234
    - Gal@example.com
    - Noga@example.com
    - Adi@example.com
    - Libi@example.com
    - Ran@example.com
"""

import os
import sys
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Tuple
from sqlalchemy import text

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models import (
    User, Ingredient, Recipe, RecipeIngredient, Event, EventRecipe,
    EventMember, EventIngredientAssignment, FriendRequest, Notification
)
from app.services.security import hash_password


# Demo users configuration
DEMO_USERS = [
    {"email": "Gal@example.com", "display_name": "Gal"},
    {"email": "Noga@example.com", "display_name": "Noga"},
    {"email": "Adi@example.com", "display_name": "Adi"},
    {"email": "Libi@example.com", "display_name": "Libi"},
    {"email": "Ran@example.com", "display_name": "Ran"},
]

DEMO_PASSWORD = "demo1234"


def clear_all_data(db: Session) -> None:
    """Clear all data from tables for a fresh seed."""
    print("\n🧹 Clearing existing data...")
    
    # Delete in reverse order of dependencies using raw SQL
    # This handles cases where tables don't exist yet
    tables_to_clear = [
        "notifications",
        "event_ingredient_assignments",
        "event_members",
        "event_recipes",
        "recipe_ingredients",
        "recipes",
        "events",
        "friend_requests",
        "ingredients",
        "users"
    ]
    
    for table in tables_to_clear:
        try:
            db.execute(text(f"DELETE FROM {table}"))
        except Exception:
            pass  # Table doesn't exist or delete failed, that's fine
    
    try:
        db.commit()
        print("✓ Existing data cleared")
    except Exception as e:
        db.rollback()
        # If commit fails, just continue - tables might not exist yet
        print(f"✓ Cleared what could be cleared")


def create_ingredients(db: Session) -> dict:
    """Create demo ingredients. Returns map of ingredient name -> id."""
    print("\n🥕 Creating ingredients...")
    
    ingredients_list = [
        "Chicken Breast", "Salmon Fillet", "Ground Beef", "Pasta",
        "Olive Oil", "Garlic", "Onion", "Tomato", "Bell Pepper",
        "Basil", "Parmesan Cheese", "Mozzarella", "Salt",
        "Black Pepper", "Lemon", "Spinach", "Mushroom", "Rice",
        "Soy Sauce", "Ginger"
    ]
    
    ingredients_map = {}
    for name in ingredients_list:
        existing = db.query(Ingredient).filter(Ingredient.name == name).first()
        if not existing:
            ingredient = Ingredient(name=name)
            db.add(ingredient)
            db.flush()
            ingredients_map[name] = ingredient.id
        else:
            ingredients_map[name] = existing.id
    
    db.commit()
    print(f"✓ Created {len(ingredients_map)} ingredients")
    return ingredients_map


def create_users(db: Session) -> dict:
    """Create demo users. Returns map of email -> User object."""
    print("\n👥 Creating demo users...")
    
    users_map = {}
    password_hash = hash_password(DEMO_PASSWORD)
    
    for user_data in DEMO_USERS:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            users_map[user_data["email"]] = existing
        else:
            user = User(
                email=user_data["email"],
                display_name=user_data["display_name"],
                password_hash=password_hash
            )
            db.add(user)
            db.flush()
            users_map[user_data["email"]] = user
    
    db.commit()
    print(f"✓ Created {len(users_map)} demo users")
    return users_map


def create_recipes(db: Session, users_map: dict, ingredients_map: dict) -> List[Recipe]:
    """Create demo recipes with ingredients."""
    print("\n📖 Creating recipes...")
    
    gal = users_map["Gal@example.com"]
    
    recipes_data = [
        {
            "name": "Garlic Butter Pasta",
            "description": "A simple and delicious Italian pasta with garlic, olive oil, and fresh basil.",
            "base_servings": 4,
            "cooking_time_minutes": 20,
            "image_url": "https://images.food52.com/yUFovEV5knQubgZ5C6EFhePQK5k=/905edca3-b58c-45be-b588-c4a5983e7e48--2020-1215_pasta-garlic-butter-sauce_3x2_rocky-luten_023.jpg?w=400",
            "ingredients": [
                {"name": "Pasta", "quantity": 400, "unit": "g"},
                {"name": "Garlic", "quantity": 6, "unit": "cloves"},
                {"name": "Olive Oil", "quantity": 4, "unit": "tbsp"},
                {"name": "Salt", "quantity": None, "unit": "to taste"},
                {"name": "Black Pepper", "quantity": None, "unit": "to taste"},
                {"name": "Basil", "quantity": 10, "unit": "leaves"},
                {"name": "Parmesan Cheese", "quantity": 100, "unit": "g"},
            ],
            "instructions": (
                "<p>1. Cook pasta in salted boiling water until al dente</p>"
                "<p>2. Finely chop garlic and heat with olive oil</p>"
                "<p>3. Toss pasta with garlic oil mixture</p>"
                "<p>4. Top with fresh basil and parmesan</p>"
            )
        },
        {
            "name": "Grilled Salmon with Lemon",
            "description": "Fresh salmon fillet grilled to perfection with lemon and herbs.",
            "base_servings": 2,
            "cooking_time_minutes": 15,
            "image_url": "https://hips.hearstapps.com/vidthumb/images/delish-grilled-lemon-butter-salmon-wide-1-1528898035.jpg?crop=0.75xw:1xh;center,top&resize=1200:*",
            "ingredients": [
                {"name": "Salmon Fillet", "quantity": 2, "unit": "fillets"},
                {"name": "Lemon", "quantity": 1, "unit": "whole"},
                {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
                {"name": "Salt", "quantity": None, "unit": "to taste"},
                {"name": "Black Pepper", "quantity": None, "unit": "to taste"},
                {"name": "Garlic", "quantity": 2, "unit": "cloves"},
            ],
            "instructions": (
                "<p>1. Preheat grill to medium-high</p>"
                "<p>2. Season salmon with salt, pepper, and minced garlic</p>"
                "<p>3. Grill salmon 4-5 minutes per side</p>"
                "<p>4. Squeeze fresh lemon juice before serving</p>"
            )
        },
        {
            "name": "Classic Tomato Pasta",
            "description": "Traditional pasta with homemade tomato sauce and fresh herbs.",
            "base_servings": 3,
            "cooking_time_minutes": 35,
            "image_url": "https://www.servingdumplings.com/wp-content/uploads/2024/02/garlic-butter-tomato-spaghetti-tn-3478fd2e.jpg",
            "ingredients": [
                {"name": "Pasta", "quantity": 300, "unit": "g"},
                {"name": "Tomato", "quantity": 5, "unit": "whole"},
                {"name": "Garlic", "quantity": 3, "unit": "cloves"},
                {"name": "Olive Oil", "quantity": 3, "unit": "tbsp"},
                {"name": "Basil", "quantity": 15, "unit": "leaves"},
                {"name": "Onion", "quantity": 1, "unit": "whole"},
                {"name": "Salt", "quantity": None, "unit": "to taste"},
            ],
            "instructions": (
                "<p>1. Sauté diced onion and garlic in olive oil</p>"
                "<p>2. Add chopped tomatoes and simmer 20 minutes</p>"
                "<p>3. Cook pasta in salted water</p>"
                "<p>4. Combine sauce and pasta, garnish with fresh basil</p>"
            )
        },
        {
            "name": "Beef Stir Fry",
            "description": "Quick and delicious beef stir fry with peppers and mushrooms.",
            "base_servings": 4,
            "cooking_time_minutes": 20,
            "image_url": "https://www.cubesnjuliennes.com/wp-content/uploads/2021/01/Chinese-Beef-Stir-Fry-Recipe.jpg?w=400",
            "ingredients": [
                {"name": "Ground Beef", "quantity": 500, "unit": "g"},
                {"name": "Bell Pepper", "quantity": 2, "unit": "whole"},
                {"name": "Mushroom", "quantity": 250, "unit": "g"},
                {"name": "Soy Sauce", "quantity": 3, "unit": "tbsp"},
                {"name": "Garlic", "quantity": 4, "unit": "cloves"},
                {"name": "Ginger", "quantity": 1, "unit": "tbsp"},
                {"name": "Rice", "quantity": 400, "unit": "g"},
            ],
            "instructions": (
                "<p>1. Cook rice according to package instructions</p>"
                "<p>2. Heat oil in a wok or large pan</p>"
                "<p>3. Cook beef until browned, set aside</p>"
                "<p>4. Stir fry vegetables and return beef</p>"
                "<p>5. Add soy sauce and serve over rice</p>"
            )
        },
        {
            "name": "Spinach and Mushroom Risotto",
            "description": "Creamy risotto with fresh spinach and sautéed mushrooms.",
            "base_servings": 3,
            "cooking_time_minutes": 40,
            "image_url": "https://loveandgoodstuff.com/wp-content/uploads/2020/11/mushroom-spinach-risotto-1200x1200-1.jpg?w=400",
            "ingredients": [
                {"name": "Rice", "quantity": 300, "unit": "g"},
                {"name": "Spinach", "quantity": 200, "unit": "g"},
                {"name": "Mushroom", "quantity": 300, "unit": "g"},
                {"name": "Olive Oil", "quantity": 4, "unit": "tbsp"},
                {"name": "Onion", "quantity": 1, "unit": "whole"},
                {"name": "Garlic", "quantity": 2, "unit": "cloves"},
                {"name": "Parmesan Cheese", "quantity": 100, "unit": "g"},
            ],
            "instructions": (
                "<p>1. Sauté onion and garlic in olive oil</p>"
                "<p>2. Add rice and toast for 2 minutes</p>"
                "<p>3. Gradually add hot broth while stirring</p>"
                "<p>4. Fold in spinach and mushrooms halfway through</p>"
                "<p>5. Finish with parmesan cheese</p>"
            )
        },
    ]
    
    recipes = []
    for recipe_data in recipes_data:
        recipe = Recipe(
            name=recipe_data["name"],
            description=recipe_data["description"],
            base_servings=recipe_data["base_servings"],
            image_url=recipe_data["image_url"],
            cooking_time_minutes=recipe_data.get("cooking_time_minutes"),
            instructions_html=recipe_data["instructions"],
            owner_user_id=gal.id
        )
        db.add(recipe)
        db.flush()
        
        # Add ingredients
        for ing_data in recipe_data["ingredients"]:
            ing_id = ingredients_map[ing_data["name"]]
            recipe_ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ing_id,
                quantity=Decimal(str(ing_data["quantity"])) if ing_data["quantity"] else None,
                unit=ing_data["unit"],
                note=ing_data.get("note"),
                optional=False
            )
            db.add(recipe_ingredient)
        
        recipes.append(recipe)
    
    db.commit()
    print(f"✓ Created {len(recipes)} recipes with ingredients")
    return recipes


def create_events(db: Session, users_map: dict, recipes: List[Recipe]) -> dict:
    """Create demo events with recipes and participants."""
    print("\n📅 Creating events...")
    
    gal = users_map["Gal@example.com"]
    noga = users_map["Noga@example.com"]
    adi = users_map["Adi@example.com"]
    libi = users_map["Libi@example.com"]
    ran = users_map["Ran@example.com"]
    
    today = date.today()
    
    events_data = [
        {
            "name": "Family Dinner",
            "event_date": today + timedelta(days=7),
            "target_servings": 6,
            "owner": gal,
            "participants": [gal, noga, adi],
            "recipe_indices": [0, 2],  # Garlic Butter Pasta, Classic Tomato Pasta
        },
        {
            "name": "Game Night Dinner",
            "event_date": today + timedelta(days=14),
            "target_servings": 8,
            "owner": noga,
            "participants": [noga, gal, libi, ran],
            "recipe_indices": [1, 3],  # Grilled Salmon, Beef Stir Fry
        },
        {
            "name": "Italian Night",
            "event_date": today + timedelta(days=21),
            "target_servings": 4,
            "owner": adi,
            "participants": [adi, gal],
            "recipe_indices": [0, 4],  # Garlic Butter Pasta, Spinach and Mushroom Risotto
        },
        {
            "name": "Team Lunch",
            "event_date": today + timedelta(days=10),
            "target_servings": 5,
            "owner": gal,
            "participants": [gal, noga, adi, libi],
            "recipe_indices": [2, 3],  # Classic Tomato Pasta, Beef Stir Fry
        },
    ]
    
    events_map = {}
    for event_data in events_data:
        event = Event(
            name=event_data["name"],
            event_date=event_data["event_date"],
            target_servings=event_data["target_servings"],
            owner_user_id=event_data["owner"].id
        )
        db.add(event)
        db.flush()
        
        # Add event owner as member
        owner_member = EventMember(
            event_id=event.id,
            user_id=event_data["owner"].id,
            email=event_data["owner"].email,
            role="owner",
            status="active"
        )
        db.add(owner_member)
        db.flush()
        
        # Add other participants
        for participant in event_data["participants"]:
            if participant.id != event_data["owner"].id:
                participant_member = EventMember(
                    event_id=event.id,
                    user_id=participant.id,
                    email=participant.email,
                    role="participant",
                    status="active"
                )
                db.add(participant_member)
        
        db.flush()
        
        # Add recipes to event
        for recipe_idx in event_data["recipe_indices"]:
            recipe = recipes[recipe_idx]
            event_recipe = EventRecipe(
                event_id=event.id,
                recipe_id=recipe.id,
                desired_servings=event_data["target_servings"]
            )
            db.add(event_recipe)
        
        events_map[event.id] = {
            "event": event,
            "members": [event_data["owner"]] + [p for p in event_data["participants"] if p.id != event_data["owner"].id]
        }
    
    db.commit()
    print(f"✓ Created {len(events_data)} events with participants and recipes")
    return events_map


def create_friend_requests(db: Session, users_map: dict) -> None:
    """Create demo friend requests between users."""
    print("\n👫 Creating friend connections...")
    
    gal = users_map["Gal@example.com"]
    noga = users_map["Noga@example.com"]
    adi = users_map["Adi@example.com"]
    libi = users_map["Libi@example.com"]
    ran = users_map["Ran@example.com"]
    
    # Create some accepted friend connections
    # Gal <-> Noga (accepted)
    freq1 = FriendRequest(
        sender_user_id=gal.id,
        receiver_user_id=noga.id,
        status="accepted"
    )
    db.add(freq1)
    
    # Gal <-> Adi (accepted)
    freq2 = FriendRequest(
        sender_user_id=gal.id,
        receiver_user_id=adi.id,
        status="accepted"
    )
    db.add(freq2)
    
    # Noga <-> Libi (accepted)
    freq3 = FriendRequest(
        sender_user_id=noga.id,
        receiver_user_id=libi.id,
        status="accepted"
    )
    db.add(freq3)
    
    # Adi -> Ran (pending incoming for Ran)
    freq4 = FriendRequest(
        sender_user_id=adi.id,
        receiver_user_id=ran.id,
        status="pending"
    )
    db.add(freq4)
    
    # Libi -> Gal (pending incoming for Gal)
    freq5 = FriendRequest(
        sender_user_id=libi.id,
        receiver_user_id=gal.id,
        status="pending"
    )
    db.add(freq5)
    
    db.commit()
    print("✓ Created friend connections")


def assign_ingredients(db: Session, events_map: dict, ingredients_map: dict) -> None:
    """Assign shopping list ingredients to event participants."""
    print("\n🛒 Assigning ingredients to participants...")
    
    key_ingredients = [
        ingredients_map.get("Chicken Breast"),
        ingredients_map.get("Salmon Fillet"),
        ingredients_map.get("Olive Oil"),
        ingredients_map.get("Garlic"),
        ingredients_map.get("Tomato"),
    ]
    key_ingredients = [i for i in key_ingredients if i is not None]
    
    assignment_count = 0
    for event_id, event_info in events_map.items():
        members = db.query(EventMember).filter(EventMember.event_id == event_id).all()
        
        for idx, ingredient_id in enumerate(key_ingredients):
            if members:
                member = members[idx % len(members)]
                existing = db.query(EventIngredientAssignment).filter(
                    EventIngredientAssignment.event_id == event_id,
                    EventIngredientAssignment.ingredient_id == ingredient_id
                ).first()
                
                if not existing:
                    assignment = EventIngredientAssignment(
                        event_id=event_id,
                        ingredient_id=ingredient_id,
                        event_member_id=member.id
                    )
                    db.add(assignment)
                    assignment_count += 1
    
    db.commit()
    print(f"✓ Created {assignment_count} ingredient assignments")


def print_demo_credentials() -> None:
    """Print demo user credentials for easy reference."""
    print("\n" + "="*60)
    print("✓ DATABASE SEEDING COMPLETE!")
    print("="*60)
    print("\n📧 Demo User Credentials for Local Testing:\n")
    print(f"   All users use: Password = {DEMO_PASSWORD}\n")
    for user_data in DEMO_USERS:
        print(f"   Email: {user_data['email']}")
    print()
    print("="*60)
    print("\nKey Features to Test:")
    print("  • Login with any demo user account")
    print("  • Create and edit recipes")
    print("  • Send and manage friend requests")
    print("  • View your friends list")
    print("  • Create events and invite participants (including friends)")
    print("  • View event details with attached recipes")
    print("  • Generate shopping lists")
    print("  • Assign ingredients to participants")
    print("="*60 + "\n")


def seed_database() -> None:
    """Main function to seed the database."""
    print("\n" + "="*60)
    print("🌱 Dinnerly Development Database Seeding")
    print("="*60)
    
    # Create all tables first with a fresh connection
    print("\n📋 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables ready")
    
    db = SessionLocal()
    
    try:
        # Clear existing data safely
        clear_all_data(db)
        
        # Create demo data
        ingredients_map = create_ingredients(db)
        users_map = create_users(db)
        recipes = create_recipes(db, users_map, ingredients_map)
        events_map = create_events(db, users_map, recipes)
        create_friend_requests(db, users_map)
        assign_ingredients(db, events_map, ingredients_map)
        
        # Print credentials
        print_demo_credentials()
        
    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
