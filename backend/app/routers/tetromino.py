"""A-03 テトリミノ出現順序の取得（7-bagアルゴリズム）。"""
import random

from fastapi import APIRouter, HTTPException, Query, status

from .. import schemas

router = APIRouter(tags=["tetromino"])

TETROMINO_TYPES = ["I", "O", "T", "S", "Z", "J", "L"]


def _generate_sequence(bags: int) -> list[str]:
    """7種類のテトリミノをセットごとにシャッフルし、bags個ぶん連結して返す。"""
    sequence: list[str] = []
    for _ in range(bags):
        bag = TETROMINO_TYPES.copy()
        random.shuffle(bag)
        sequence.extend(bag)
    return sequence


@router.get(
    "/api/tetromino-sequence",
    response_model=schemas.TetrominoSequenceResponse,
)
def get_tetromino_sequence(
    bags: int = Query(default=1, description="取得する7種セットの数（1〜5）"),
):
    if not (1 <= bags <= 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="bagsは1〜5の範囲で指定してください",
        )
    return schemas.TetrominoSequenceResponse(sequence=_generate_sequence(bags))
