
from contextlib                import asynccontextmanager
import logging

from fastapi                   import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from urllib.parse import urlsplit
from app.core.config           import settings
from app.core.database         import Base, engine, get_readiness_db
from app.models.user           import User
from app.routers.complaints    import router as complaints_router
from app.routers.auth          import router as auth_router
from app.routers.users         import router as users_router
from app.routers.hostels       import router as hostels_router
from app.routers.blocks        import router as blocks_router
from app.routers.rooms         import router as rooms_router
from app.routers.assignments   import router as assignments_router
from app.routers.staff         import router as staff_router
from app.routers.notifications import router as notifications_router
from app.routers.dashboard import router as dashboard_router
from app.routers.ratings import router as ratings_router

logger = logging.getLogger(__name__)

# @asynccontextmanager
# async def lifespan(app: FastAPI):

#     Base.metadata.create_all(
#         bind=engine,
#     )

#     yield

is_production = settings.APP_ENV.lower() == "production"
if settings.CORS_ALLOWED_ORIGINS:
    cors_origins = [
        origin.strip().rstrip("/")
        for origin in settings.CORS_ALLOWED_ORIGINS.split(",")
        if origin.strip()
    ]
elif is_production:
    raise RuntimeError("CORS_ALLOWED_ORIGINS must be configured in production")
else:
    cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

if not cors_origins or "*" in cors_origins:
    raise RuntimeError("CORS_ALLOWED_ORIGINS must contain explicit origins")

if is_production:
    for origin in cors_origins:
        parsed_origin = urlsplit(origin)
        if (
            parsed_origin.scheme != "https"
            or not parsed_origin.netloc
            or parsed_origin.hostname in {"localhost", "127.0.0.1", "::1"}
        ):
            raise RuntimeError(
                "Production CORS origins must be explicit HTTPS origins"
            )

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Backend API for Hostel Maintenance Intelligence System"
    ),
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(hostels_router)
app.include_router(blocks_router)
app.include_router(rooms_router)
app.include_router(assignments_router)
app.include_router(staff_router)
app.include_router(complaints_router)
app.include_router(ratings_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)

@app.get(
    "/",
    tags=["Health"],
)
def root():
    return {
        "message": "Hostel Maintenance Intelligence API Running",
        "environment": settings.APP_ENV,
    }


@app.get(
    "/health",
    tags=["Health"],
)
def health():
    return {
        "status": "healthy",
    }


@app.get(
    "/health/ready",
    tags=["Health"],
)
def health_ready(db: Session = Depends(get_readiness_db)):
    try:
        result = db.execute(text("SELECT 1"))
        if result.scalar_one() != 1:
            raise SQLAlchemyError("Readiness query returned an unexpected result")
    except SQLAlchemyError:
        _rollback_readiness_session(db)
        logger.warning("Database readiness check failed")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready"},
        )

    try:
        db.rollback()
    except SQLAlchemyError:
        logger.warning("Database readiness session cleanup failed")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready"},
        )

    return {"status": "ready"}


def _rollback_readiness_session(db: Session) -> None:
    try:
        db.rollback()
    except SQLAlchemyError:
        # Preserve the sanitized response; the readiness dependency closes it.
        logger.warning("Database readiness session cleanup failed")


if __name__ == "__main__":
    import os
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT", "9000")),
    )
