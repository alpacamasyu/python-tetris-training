const API_BASE_URL = "http://localhost:8000";

/**
 * バックエンドAPIを呼び出す共通関数。
 * エラー時は { status, detail } を持つErrorをthrowする。
 */
async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkError) {
    const error = new Error("サーバーに接続できませんでした");
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    let detail = `エラーが発生しました（status: ${response.status}）`;
    try {
      const body = await response.json();
      if (body && body.detail) detail = body.detail;
    } catch (_) {
      // レスポンスボディがJSONでない場合はデフォルトメッセージを使う
    }
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

const api = {
  login(nickname) {
    return apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    });
  },

  registerUser(nickname) {
    return apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    });
  },

  getTetrominoSequence(bags = 1) {
    return apiRequest(`/api/tetromino-sequence?bags=${bags}`);
  },

  getDifficultySettings() {
    return apiRequest("/api/difficulty-settings");
  },

  registerScore({ userId, score, levelReached, linesCleared, difficulty }) {
    return apiRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        score,
        level_reached: levelReached,
        lines_cleared: linesCleared,
        difficulty,
      }),
    });
  },

  getRankings(limit = 10, difficulty = "") {
    const params = new URLSearchParams({ limit });
    if (difficulty) params.set("difficulty", difficulty);
    return apiRequest(`/api/rankings?${params.toString()}`);
  },

  getHistory(userId, limit = 20) {
    return apiRequest(`/api/users/${userId}/history?limit=${limit}`);
  },
};
