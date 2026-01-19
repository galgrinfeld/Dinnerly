from fastapi import FastAPI
from app.api.router import router as api_router

app = FastAPI(title="Dinnerly")

# Include main API router
app.include_router(api_router)


@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}
