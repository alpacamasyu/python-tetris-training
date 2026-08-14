"""A-07 プレイ履歴取得のテスト。"""


def _register_user(client, nickname: str) -> int:
    response = client.post("/api/users", json={"nickname": nickname})
    return response.json()["user_id"]


def test_history_returns_scores_newest_first(client):
    user_id = _register_user(client, "たろう")

    client.post(
        "/api/scores",
        json={
            "user_id": user_id,
            "score": 1000,
            "level_reached": 1,
            "lines_cleared": 5,
            "difficulty": "easy",
        },
    )
    client.post(
        "/api/scores",
        json={
            "user_id": user_id,
            "score": 2000,
            "level_reached": 2,
            "lines_cleared": 10,
            "difficulty": "normal",
        },
    )

    response = client.get(f"/api/users/{user_id}/history")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    # 新しい順（後に登録した2000点が先頭）
    assert body[0]["score"] == 2000
    assert body[1]["score"] == 1000


def test_history_unknown_user_returns_404(client):
    response = client.get("/api/users/9999/history")
    assert response.status_code == 404


def test_history_empty_for_user_without_scores(client):
    user_id = _register_user(client, "はなこ")
    response = client.get(f"/api/users/{user_id}/history")
    assert response.status_code == 200
    assert response.json() == []
