"""A-05 スコア登録 / A-06 ランキング取得。"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(tags=["scores"])


@router.post(
    "/api/scores",
    response_model=schemas.ScoreResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_score(score_in: schemas.ScoreCreate, db: Session = Depends(get_db)):
    """ゲーム終了時のスコアを登録する。
    詳細設計書 A-05: 対象ユーザーが存在しない場合は404を返すこと。
    """
    user = crud.get_user(db, score_in.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ユーザーが見つかりません")

    db_score = crud.create_score(db, score_in)

    return schemas.ScoreResponse(
        score_id=db_score.id,
        user_id=db_score.user_id,
        nickname=user.nickname,
        score=db_score.score,
        level_reached=db_score.level_reached,
        lines_cleared=db_score.lines_cleared,
        difficulty=db_score.difficulty,
        played_at=db_score.played_at,
    )

@router.get("/api/rankings", response_model=List[schemas.RankingItem])
def get_rankings(
    limit: int = Query(default=10, ge=1, description="取得件数（既定10、最大100）"),
    difficulty: Optional[str] = Query(default=None, description="難易度による絞り込み（省略可）"),
    db: Session = Depends(get_db),
):


    """上位スコアをスコア降順（同点時はplayed_atが早い方を上位）で取得する。
    詳細設計書 A-06: limitは最大100件までに丸めること。
    """
    # TODO: ここに実装する
    if limit > 100:
        limit = 100
    rankings: list[schemas.RankingItem] = []
    for index, (score, user) in enumerate (crud.get_rankings(db,limit, difficulty)):
        rankings.append(
        schemas.RankingItem(
        rank=index + 1,
        nickname=user.nickname,
        score=score.score,
        level_reached=score.level_reached,
        difficulty=score.difficulty,
        played_at=score.played_at,
        )   
        )
    return rankings

