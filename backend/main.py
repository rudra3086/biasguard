from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

from app.routes.analysis import router as analysis_router

# Initialize FastAPI app
app = FastAPI(
    title="Universal AI Bias Detection Tool",
    description="Backend service for detecting bias across any dataset",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"  # Allow all for development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis_router)


@app.get("/")
async def root():
    """Root endpoint with API documentation."""
    return {
        "message": "Universal AI Bias Detection Tool API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/upload",
            "analyze": "/api/analyze",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "bias-detection-api"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    
    # Run server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )
