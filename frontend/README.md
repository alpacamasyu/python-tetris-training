# frontend

落ちものパズルゲームのフロントエンド（HTML/CSS/Vanilla JavaScript）です。
詳細な仕様は [../docs/03_詳細設計書.md](../docs/03_詳細設計書.md) の「3. 画面詳細仕様」
「4. テトリミノ回転仕様」「5. 得点計算仕様」を参照してください。

## 起動方法

バックエンド（`http://localhost:8000`）を起動した状態で、以下のいずれかの方法で開いてください。

- `frontend/index.html` をブラウザで直接開く
- 簡易HTTPサーバーで配信する
  ```bash
  cd frontend
  python3 -m http.server 8080
  ```
  その後ブラウザで `http://localhost:8080` を開く

## ファイル構成

```
frontend/
├── index.html   # S-01〜S-06 全画面のHTML
├── css/style.css
└── js/
    ├── api.js      # バックエンドAPI（A-01〜A-07）を呼び出すラッパー関数群
    ├── game.js     # テトリスのゲームロジック（盤面・落下・回転・衝突判定・得点計算）
    └── screens.js  # 画面遷移・イベントハンドラ・API連携
```

## 研修生向けの案内

このブランチでは `js/api.js` と `js/game.js` の各関数の中身が
`// TODO: ここに実装する` / `throw new Error("Not implemented")` の状態になっています。
`index.html`・`css/`・`js/screens.js` はそのまま使えるので変更不要です。

以下の流れで実装を進めてください。

1. `docs/01_要件定義書.md`・`docs/02_基本設計書.md`・`docs/03_詳細設計書.md` を読み、
   システム全体の要件・API仕様・画面仕様・回転仕様・得点計算仕様を理解する
2. `js/api.js` から着手する（各関数のdocstringコメントに対応するAPI仕様（A-01〜A-07）が
   書かれているので、`fetch` でバックエンドを呼び出す処理を実装する）
3. `js/game.js` の `TetrisGame` クラス各メソッドを、docstringコメントと
   詳細設計書4章（回転仕様）・5章（得点計算仕様）に従って実装する
   （`TETROMINO_SHAPES` などのテトリミノ形状データ、および描画系メソッド
   `_render`/`_renderBoard`/`_renderNext`/`_drawCell` は実装済みなのでそのまま使える）
4. バックエンドを起動した状態でブラウザから動作確認する
   （ログイン→メニュー→ゲームプレイ→リザルト→ランキング／履歴の一連の流れが動くこと）
