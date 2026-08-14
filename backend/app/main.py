"""FastAPIエントリポイント。

起動コマンド: uvicorn app.main:app --reload
API仕様確認: http://localhost:8000/docs (Swagger UI)
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import crud
from .database import Base, SessionLocal, engine
from .routers import difficulty, scores, tetromino, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時にテーブルを作成し、難易度設定の初期データ（easy/normal/hard）を投入する
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        crud.seed_difficulty_settings(db)
    finally:
        db.close()
    yield


app = FastAPI(title="落ちものパズルゲーム API", lifespan=lifespan)

# フロントエンドは別オリジン（file://や別ポートの簡易HTTPサーバー）から呼び出す想定のためCORSを許可する
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """入力値バリデーションエラーを、詳細設計書1章の規約（400 + {"detail": "..."}）に合わせて変換する。"""
    messages = "; ".join(
        f"{'.'.join(str(part) for part in error['loc'] if part != 'body')}: {error['msg']}"
        for error in exc.errors()
    )
    return JSONResponse(status_code=400, content={"detail": messages})


app.include_router(users.router)
app.include_router(tetromino.router)
app.include_router(difficulty.router)
app.include_router(scores.router)
