# backend

落ちものパズルゲームのバックエンドAPI（FastAPI + SQLAlchemy + SQLite）です。
詳細な仕様は [../docs/03_詳細設計書.md](../docs/03_詳細設計書.md) の「1. API詳細仕様」「2. データベース詳細設計」を参照してください。

## セットアップ

Python 3.11以上を使用してください。

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate    # Windowsの場合: .venv\Scripts\activate
pip install -r requirements.txt
```

## 起動方法

```bash
uvicorn app.main:app --reload
```

- APIのベースURL: `http://localhost:8000`
- Swagger UI（API仕様確認・動作確認）: `http://localhost:8000/docs`

起動時にSQLiteデータベース（`backend/tetris.db`）とテーブルが自動作成され、
`difficulty_settings`（easy / normal / hard）の初期データも自動投入されます。

## テスト実行方法

```bash
pytest
```

`tests/` 配下に、主要API（ユーザー登録・ログイン・テトリミノ出現順序・難易度設定・
スコア登録・ランキング・履歴）に対する正常系・異常系のテストがあります。

## API一覧

| No | Method | エンドポイント | 概要 |
|---|---|---|---|
| A-01 | POST | /api/users | ユーザー登録 |
| A-02 | POST | /api/login | ログイン |
| A-03 | GET | /api/tetromino-sequence | テトリミノ出現順序の取得（7-bag） |
| A-04 | GET | /api/difficulty-settings | 難易度設定の取得 |
| A-05 | POST | /api/scores | スコア登録 |
| A-06 | GET | /api/rankings | ランキング取得 |
| A-07 | GET | /api/users/{user_id}/history | プレイ履歴取得 |
