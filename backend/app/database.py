"""DB接続設定。SQLAlchemyのエンジン・セッション・Baseクラスを定義する。"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# backend/ ディレクトリ直下に tetris.db を作成する（起動時のカレントディレクトリに依存しないよう絶対パスで指定）
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BACKEND_DIR, 'tetris.db')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """リクエストごとにDBセッションを払い出し、処理後にクローズするDI用の関数。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
