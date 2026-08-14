"""A-04 難易度設定の取得。"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(tags=["difficulty"])


@router.get(
    "/api/difficulty-settings",
    response_model=List[schemas.DifficultySettingResponse],
)
def get_difficulty_settings(db: Session = Depends(get_db)):
    """難易度（easy/normal/hard）ごとの初期落下速度・得点倍率の一覧を返す。
    詳細設計書 A-04 難易度設定の取得に対応。
    """
    # TODO: ここに実装する
    raise NotImplementedError()
