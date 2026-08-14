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

## 研修生向けの案内

このブランチでは `app/crud.py` と `app/routers/` 配下の各関数の中身が
`# TODO: ここに実装する` / `raise NotImplementedError()` の状態になっています。
`app/models.py`・`app/schemas.py`・`app/database.py` はそのまま使えるので変更不要です。

以下の流れで実装を進めてください。

1. `docs/01_要件定義書.md`・`docs/02_基本設計書.md`・`docs/03_詳細設計書.md` を読み、
   システム全体の要件・API仕様・DB設計を理解する
2. 各ファイルの `# TODO: ここに実装する` コメント箇所を、各関数のdocstringに書かれた
   説明と詳細設計書の該当セクション（A-01〜A-07、2章）に従って実装する
3. `app/crud.py` から着手すると進めやすい（DB操作の土台になるため）
4. 実装が終わったら `pytest` を実行し、`tests/` 配下のテストがすべてパスすることを確認する
5. `uvicorn app.main:app --reload` でアプリを起動し、`/docs`（Swagger UI）で
   各APIが仕様通りに動作することを確認する
