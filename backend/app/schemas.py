"""Pydanticスキーマ定義（詳細設計書 1章 API詳細仕様のリクエスト／レスポンスに対応）。"""
from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, ConfigDict, Field


# --- A-01 / A-02 ユーザー登録・ログイン ---


class UserCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=20, description="ニックネーム（1〜20文字、一意）")


class UserResponse(BaseModel):
    user_id: int
    nickname: str
    created_at: datetime


class LoginRequest(BaseModel):
    nickname: str = Field(min_length=1, description="ニックネーム")


class LoginResponse(BaseModel):
    user_id: int
    nickname: str


# --- A-03 テトリミノ出現順序 ---


class TetrominoSequenceResponse(BaseModel):
    sequence: List[str]


# --- A-04 難易度設定 ---


class DifficultySettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    initial_fall_speed_ms: int
    score_multiplier: float


# --- A-05 スコア登録 ---


class ScoreCreate(BaseModel):
    user_id: int
    score: int = Field(ge=0)
    level_reached: int = Field(ge=0)
    lines_cleared: int = Field(ge=0)
    difficulty: Literal["easy", "normal", "hard"]


class ScoreResponse(BaseModel):
    score_id: int
    user_id: int
    nickname: str
    score: int
    level_reached: int
    lines_cleared: int
    difficulty: str
    played_at: datetime


# --- A-06 ランキング ---


class RankingItem(BaseModel):
    rank: int
    nickname: str
    score: int
    level_reached: int
    difficulty: str
    played_at: datetime


# --- A-07 プレイ履歴 ---


class HistoryItem(BaseModel):
    score_id: int
    score: int
    level_reached: int
    lines_cleared: int
    difficulty: str
    played_at: datetime
