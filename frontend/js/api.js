const API_BASE_URL = "http://localhost:8000";

/**
 * バックエンドAPIを呼び出す共通関数。
 * fetch(`${API_BASE_URL}${path}`, options) でリクエストを送り、JSONレスポンスを返す。
 * レスポンスが !response.ok の場合は、レスポンスボディの { "detail": "..." } を
 * メッセージとしたErrorをthrowすること（Errorオブジェクトにstatusプロパティを
 * 持たせておくと、呼び出し側で404/409等の分岐がしやすい）。
 * ネットワークエラー（fetch自体が失敗した場合）もErrorをthrowすること。
 */
async function apiRequest(path, options = {}) {
  // TODO: ここに実装する
  throw new Error("Not implemented");
}

const api = {
  /**
   * A-02 ログイン（POST /api/login）
   * 詳細設計書1章 A-02。該当ユーザーが存在しない場合は404エラーになる。
   */
  login(nickname) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  },

  /**
   * A-01 ユーザー登録（POST /api/users）
   * 詳細設計書1章 A-01。既に同じnicknameが登録済みの場合は409エラーになる。
   */
  registerUser(nickname) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  },

  /**
   * A-03 テトリミノ出現順序の取得（GET /api/tetromino-sequence?bags=）
   * 詳細設計書1章 A-03。戻り値は { sequence: [...] } 形式。
   */
  getTetrominoSequence(bags = 1) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  },

  /**
   * A-04 難易度設定の取得（GET /api/difficulty-settings）
   * 詳細設計書1章 A-04。
   */
  getDifficultySettings() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  },

  /**
   * A-05 スコア登録（POST /api/scores）
   * 詳細設計書1章 A-05。リクエストボディはuser_id/score/level_reached/
   * lines_cleared/difficultyのスネークケースで送ること。
   */
  registerScore({ userId, score, levelReached, linesCleared, difficulty }) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  },

  /**
   * A-06 ランキング取得（GET /api/rankings?limit=&difficulty=）
   * 詳細設計書1章 A-06。difficultyが空文字の場合はクエリに含めない。
   */
  getRankings(limit = 10, difficulty = "") {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  },

  /**
   * A-07 プレイ履歴取得（GET /api/users/{user_id}/history?limit=）
   * 詳細設計書1章 A-07。
   */
  getHistory(userId, limit = 20) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  },
};
