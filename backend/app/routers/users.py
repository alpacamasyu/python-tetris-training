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
    """ニックネームでユーザーを新規登録する。
    詳細設計書 A-01: 既に同じnicknameが登録済みの場合は409を返すこと。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


@router.post("/api/login", response_model=schemas.LoginResponse)
def login(login_in: schemas.LoginRequest, db: Session = Depends(get_db)):
    """既存ユーザーをニックネームで確認する。
    詳細設計書 A-02: 該当ユーザーが存在しない場合は404を返すこと。
    """
    # TODO: ここに実装する
    raise NotImplementedError()


@router.get(
    "/api/users/{user_id}/history",
    response_model=List[schemas.HistoryItem],
)
def get_history(
    user_id: int,
    limit: int = Query(default=20, ge=1, description="取得件数（既定20）"),
    db: Session = Depends(get_db),
):
    """指定ユーザーのプレイ履歴を、プレイ日時の新しい順に取得する。
    詳細設計書 A-07: user_idに該当するユーザーが存在しない場合は404を返すこと。
    """
    # TODO: ここに実装する
    raise NotImplementedError()
