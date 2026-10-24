from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

# Keep readiness probes off the application pool so they cannot wait behind
# request traffic or reuse a stale pooled connection.
readiness_engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
    connect_args={
        "connect_timeout": 3,
        "options": "-c statement_timeout=2000",
    },
)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


ReadinessSessionLocal = sessionmaker(
    bind=readiness_engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_readiness_db():
    db = ReadinessSessionLocal()

    try:
        yield db
    finally:
        db.close()
        
