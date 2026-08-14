"""A-01 ユーザー登録 / A-02 ログイン / A-07 プレイ履歴取得。"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(tags=["users"])


@router.post(
    "/api/users",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """ニックネームでユーザーを新規登録する。既に同じニックネームがあれば409。"""
    if crud.get_user_by_nickname(db, user_in.nickname) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="このニックネームは既に登録されています",
        )
    user = crud.create_user(db, user_in.nickname)
    return schemas.UserResponse(
        user_id=user.id, nickname=user.nickname, created_at=user.created_at
    )


@router.post("/api/login", response_model=schemas.LoginResponse)
def login(login_in: schemas.LoginRequest, db: Session = Depends(get_db)):
    """既存ユーザーをニックネームで確認する。存在しない場合は404。"""
    user = crud.get_user_by_nickname(db, login_in.nickname)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="該当するユーザーが存在しません",
        )
    return schemas.LoginResponse(user_id=user.id, nickname=user.nickname)


@router.get(
    "/api/users/{user_id}/history",
    response_model=List[schemas.HistoryItem],
)
def get_history(
    user_id: int,
    limit: int = Query(default=20, ge=1, description="取得件数（既定20）"),
    db: Session = Depends(get_db),
):
    """指定ユーザーのプレイ履歴を、プレイ日時の新しい順に取得する。"""
    user = crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="該当するユーザーが存在しません",
        )
    scores = crud.get_user_history(db, user_id, limit)
    return [
        schemas.HistoryItem(
            score_id=score.id,
            score=score.score,
            level_reached=score.level_reached,
            lines_cleared=score.lines_cleared,
            difficulty=score.difficulty,
            played_at=score.played_at,
        )
        for score in scores
    ]
