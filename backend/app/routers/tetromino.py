"""A-03 テトリミノ出現順序の取得（7-bagアルゴリズム）。"""
import random

from fastapi import APIRouter, HTTPException, Query, status

from .. import schemas

router = APIRouter(tags=["tetromino"])

TETROMINO_TYPES = ["I", "O", "T", "S", "Z", "J", "L"]


def _generate_sequence(bags: int) -> list[str]:
    """7種類のテトリミノをセットごとにシャッフルし、bags個ぶん連結して返す。
    詳細設計書 A-03: 各セット内で7種類(I, O, T, S, Z, J, L)をランダムな順に
    1回ずつ含む(7-bagアルゴリズム)こと。
    """
    sequence: list[str] = []
    for _ in range(bags):
        bag = list(TETROMINO_TYPES)
        random.shuffle(bag)
        sequence.extend(bag)
    return sequence

@router.get(
    "/api/tetromino-sequence",
    response_model=schemas.TetrominoSequenceResponse,
)

def get_tetromino_sequence(
    bags: int = Query(default=1, description="取得する7種セットの数(1〜5)"),
):
    """テトリミノの出現順序を返す。
    詳細設計書 A-03: bagsが1〜5の範囲外の場合は400を返すこと。
    """
    if bags < 1 or bags > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="bagsは1から5の範囲で指定してください")

    sequence = _generate_sequence(bags)
    return schemas.TetrominoSequenceResponse(sequence=sequence)
