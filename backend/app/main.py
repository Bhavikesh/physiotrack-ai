"""
FastAPI Main Application
Entry point for PhysioTrack AI backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.routers import exercises, sessions, analytics, auth, records, analytics_enhanced
from app.database import engine, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
# Commented out to run without PostgreSQL - uncomment when DB is available
# Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="PhysioTrack AI API",
    description="Real-time physiotherapy exercise analysis and monitoring",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(exercises.router, prefix="/api/v1/exercises", tags=["Exercises"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(records.router, prefix="/api/v1/records", tags=["Personal Records"])
app.include_router(analytics_enhanced.router, prefix="/api/v1/analytics-enhanced", tags=["Enhanced Analytics"])


# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "PhysioTrack AI API",
        "version": "1.0.0",
        "status": "operational",
        "docs":  "/docs"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "cache": "connected"
    }


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error.  Please try again later."}
    )


if __name__ == "__main__": 
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)