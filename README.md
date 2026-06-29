# Dinnerly

Dinnerly is a local meal-planning app for managing recipes, events, guests, and shopping-list assignments.

The project is split into:

- `backend/` - FastAPI API, SQLAlchemy models, seed scripts, and tests
- `frontend/` - React + Vite client
- `docker-compose.yml` - local Postgres and backend services

## Prerequisites

- Docker Desktop
- Node.js and npm
- Git Bash, PowerShell, or another terminal

## Environment Setup

Create a backend environment file before starting Docker:

```powershell
Copy-Item backend\.env.example backend\.env
```

The backend reads `backend/.env` through Docker Compose. Set these values as needed:

```env
OPENAI_API_KEY=your_api_key_here
AI_MODEL=gpt-4o-mini
```

`DATABASE_URL` is provided by `docker-compose.yml` for the backend container:

```env
postgresql+psycopg://app:app@db:5432/appdb
```

The frontend does not currently require a `.env` file. Vite proxies `/api` requests to `http://localhost:8000`.

## Run the App

Start Postgres and the FastAPI backend:

```powershell
docker compose up --build
```

The backend will be available at:

- API: `http://localhost:8000`
- Health check: `http://localhost:8000/api/health`
- FastAPI docs: `http://localhost:8000/docs`

In a second terminal, install frontend dependencies and start Vite:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will usually be available at:

```text
http://localhost:5173
```

## Seed the Database

The backend creates tables automatically on startup in local development. To add demo data, run the seed command inside the backend container after `docker compose up` is running:

```powershell
docker compose exec backend python -m scripts.seed_db
```

This creates:

- Demo users
- Ingredients
- Recipes
- Events
- Event members
- Friend requests
- Shopping-list ingredient assignments

Demo login credentials:

```text
Password for all demo users: demo1234

Gal@example.com
Noga@example.com
Adi@example.com
Libi@example.com
Ran@example.com
```

## Reseed the Database

To reset the local demo data and seed from scratch, run the same full seed command again:

```powershell
docker compose exec backend python -m scripts.seed_db
```

`seed_db.py` clears the app tables first, then recreates the full demo dataset. Use this when you want to discard local test data and return to the known demo state.

If you only want to seed or refresh the public recipe pool without clearing existing app data, use:

```powershell
docker compose exec backend python -m scripts.seed_public_recipes
```

`seed_public_recipes.py` is idempotent. It updates the public recipe records owned by `public-recipes@dinnerly.local` and does not wipe users, events, or personal recipes. Docker Compose mounts `backend/scripts` into the backend container, so edits to seed scripts are available without copying files into the container.

For a deeper local reset, remove the Postgres Docker volume and rebuild:

```powershell
docker compose down -v
docker compose up --build
docker compose exec backend python -m scripts.seed_db
```

This deletes the local database volume, recreates the containers, and seeds a fresh database.

## Useful Commands

Run backend tests:

```powershell
docker compose exec backend pytest
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Stop the local services:

```powershell
docker compose down
```

View backend logs:

```powershell
docker compose logs -f backend
```

## Development Notes

- The backend uses SQLAlchemy table creation directly instead of Alembic migrations.
- If model columns change and the existing local database is stale, use `docker compose down -v` and reseed.
- The backend container mounts `./backend/app` into `/app/app`, so changes under `backend/app` reload while the container is running.
- The frontend is not part of Docker Compose; run it separately with `npm run dev`.
