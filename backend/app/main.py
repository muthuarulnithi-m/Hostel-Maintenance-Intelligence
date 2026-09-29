
from contextlib                import asynccontextmanager
from fastapi                   import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config           import settings
from app.core.database         import Base, engine
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

# @asynccontextmanager
# async def lifespan(app: FastAPI):

#     Base.metadata.create_all(
#         bind=engine,
#     )

#     yield

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Backend API for Hostel Maintenance Intelligence System"
    )
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
app.include_router(notifications_router)

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
