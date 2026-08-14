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
    """difficulty_settings が空の場合のみ、初期データ（easy/normal/hard、DIFFICULTY_SEED）を投入する。
    詳細設計書 2.4「初期データ（difficulty_settings）」に対応。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


# --- users ---


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """user_idに一致するユーザーを1件取得する。存在しない場合はNoneを返す。
    詳細設計書 A-02/A-05/A-07 のユーザー存在チェックで使用する。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


def get_user_by_nickname(db: Session, nickname: str) -> Optional[models.User]:
    """nicknameに一致するユーザーを1件取得する。存在しない場合はNoneを返す。
    詳細設計書 A-01（重複チェック）/ A-02（ログイン）で使用する。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


def create_user(db: Session, nickname: str) -> models.User:
    """新規ユーザーを1件作成してDBに登録し、作成したUserを返す。
    詳細設計書 A-01 ユーザー登録に対応。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


# --- difficulty_settings ---


def get_difficulty_settings(db: Session) -> Sequence[models.DifficultySetting]:
    """difficulty_settingsを全件、id昇順で取得する。
    詳細設計書 A-04 難易度設定の取得に対応。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


# --- scores ---


def create_score(db: Session, score_in: schemas.ScoreCreate) -> models.Score:
    """スコアを1件登録し、作成したScoreを返す。
    詳細設計書 A-05 スコア登録に対応。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


def get_rankings(
    db: Session, limit: int, difficulty: Optional[str] = None
) -> List[Tuple[models.Score, models.User]]:
    """スコア降順（同点の場合はplayed_atが早い方を上位）で上位limit件を、
    紐づくユーザー情報とあわせて取得する。difficultyが指定された場合はその難易度で絞り込む。
    詳細設計書 A-06 ランキング取得に対応。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


def get_user_history(db: Session, user_id: int, limit: int) -> Sequence[models.Score]:
    """指定ユーザーのスコアを、played_atの降順（新しい順）でlimit件取得する。
    詳細設計書 A-07 プレイ履歴取得に対応。
    """
    # TODO: ここに実装する
    raise NotImplementedError()
