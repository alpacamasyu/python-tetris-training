"""テスト共通のfixture。テストごとに独立したインメモリSQLiteでDBを差し替える。"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import crud
from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture()
def client():
    """テーブル作成＋難易度設定の初期データ投入を行った状態のTestClientを返す。"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        crud.seed_difficulty_settings(db)
    finally:
        db.close()

    yield TestClient(app)

    Base.metadata.drop_all(bind=engine)
