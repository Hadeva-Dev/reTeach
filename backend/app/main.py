"""
FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import db

# Import routers
from app.routers import topics, questions, surveys, forms, textbooks

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI-powered diagnostic assessment generation for education",
    debug=settings.debug,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(topics.router)
app.include_router(questions.router)
app.include_router(surveys.router)
app.include_router(forms.router)
app.include_router(textbooks.router)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_healthy = await db.health_check()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "environment": settings.environment,
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EdTech Diagnostic API",
        "version": "0.1.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
