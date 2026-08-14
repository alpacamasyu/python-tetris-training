# python-tetris-training

落ちものパズルゲーム（Webアプリケーション）の実装研修用リポジトリです。

## 概要

FastAPI（バックエンド）と HTML/CSS/Vanilla JavaScript（フロントエンド）で構成される、
落ちものパズルゲームを題材にした実装研修プロジェクトです。
プレイヤーはブラウザ上でゲームをプレイし、スコアやランキングをバックエンドAPI経由で
記録・参照できます。

詳細な要件・設計は `docs/` 配下のドキュメントを参照してください。

- [docs/00_研修概要.md](docs/00_研修概要.md) — 研修の目的・進め方
- [docs/01_要件定義書.md](docs/01_要件定義書.md) — システムの要件定義
- [docs/02_基本設計書.md](docs/02_基本設計書.md) — アーキテクチャ・API・DB・ディレクトリ構成の骨子
- [docs/03_詳細設計書.md](docs/03_詳細設計書.md) — API詳細仕様・画面詳細仕様・ロジック詳細

## ディレクトリ構成

```
python-tetris-training/
├── backend/    # FastAPIによるバックエンドAPI
├── frontend/   # HTML/CSS/Vanilla JavaScriptによるフロントエンド
├── docs/       # 本研修の設計ドキュメント一式
└── README.md
```

## セットアップ

詳細なセットアップ手順・起動手順は今後のコミットで追記予定です。
