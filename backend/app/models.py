"""SQLAlchemyモデル定義（詳細設計書 2章 データベース詳細設計に対応）。"""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    """users テーブル：ユーザー情報（ニックネーム等）。"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nickname = Column(String(20), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    scores = relationship("Score", back_populates="user")


class Score(Base):
    """scores テーブル：プレイごとのスコア記録。"""

    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    level_reached = Column(Integer, nullable=False)
    lines_cleared = Column(Integer, nullable=False)
    difficulty = Column(String(10), nullable=False)
    played_at = Column(DateTime, nullable=False, default=_utcnow)

    user = relationship("User", back_populates="scores")


class DifficultySetting(Base):
    """difficulty_settings テーブル：難易度別のゲーム設定マスタ。"""

    __tablename__ = "difficulty_settings"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(10), unique=True, nullable=False)
    initial_fall_speed_ms = Column(Integer, nullable=False)
    score_multiplier = Column(Float, nullable=False)
