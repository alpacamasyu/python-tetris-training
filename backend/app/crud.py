"""DB操作関数。SQLAlchemyセッションを用いたCRUD処理をまとめる。"""
from typing import List, Optional, Sequence, Tuple

from sqlalchemy import desc
from sqlalchemy.orm import Session

from . import models, schemas

# 難易度設定の初期データ（詳細設計書 2.4）
DIFFICULTY_SEED = [
    {"name": "easy", "initial_fall_speed_ms": 1000, "score_multiplier": 1.0},
    {"name": "normal", "initial_fall_speed_ms": 700, "score_multiplier": 1.5},
    {"name": "hard", "initial_fall_speed_ms": 400, "score_multiplier": 2.0},
]


def seed_difficulty_settings(db: Session) -> None:
    """difficulty_settings が空の場合のみ、初期データ（easy/normal/hard）を投入する。"""
    if db.query(models.DifficultySetting).count() > 0:
        return
    for item in DIFFICULTY_SEED:
        db.add(models.DifficultySetting(**item))
    db.commit()


# --- users ---


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_nickname(db: Session, nickname: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.nickname == nickname).first()


def create_user(db: Session, nickname: str) -> models.User:
    user = models.User(nickname=nickname)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# --- difficulty_settings ---


def get_difficulty_settings(db: Session) -> Sequence[models.DifficultySetting]:
    return (
        db.query(models.DifficultySetting)
        .order_by(models.DifficultySetting.id)
        .all()
    )


# --- scores ---


def create_score(db: Session, score_in: schemas.ScoreCreate) -> models.Score:
    score = models.Score(
        user_id=score_in.user_id,
        score=score_in.score,
        level_reached=score_in.level_reached,
        lines_cleared=score_in.lines_cleared,
        difficulty=score_in.difficulty,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


def get_rankings(
    db: Session, limit: int, difficulty: Optional[str] = None
) -> List[Tuple[models.Score, models.User]]:
    query = db.query(models.Score, models.User).join(
        models.User, models.Score.user_id == models.User.id
    )
    if difficulty is not None:
        query = query.filter(models.Score.difficulty == difficulty)
    query = query.order_by(desc(models.Score.score), models.Score.played_at.asc())
    return query.limit(limit).all()


def get_user_history(db: Session, user_id: int, limit: int) -> Sequence[models.Score]:
    return (
        db.query(models.Score)
        .filter(models.Score.user_id == user_id)
        .order_by(desc(models.Score.played_at))
        .limit(limit)
        .all()
    )
