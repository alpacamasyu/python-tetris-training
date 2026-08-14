"""A-05 スコア登録 / A-06 ランキング取得のテスト。"""


def _register_user(client, nickname: str) -> int:
    response = client.post("/api/users", json={"nickname": nickname})
    return response.json()["user_id"]


def test_register_score_success(client):
    user_id = _register_user(client, "たろう")
    response = client.post(
        "/api/scores",
        json={
            "user_id": user_id,
            "score": 4500,
            "level_reached": 5,
            "lines_cleared": 42,
            "difficulty": "normal",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nickname"] == "たろう"
    assert body["score"] == 4500
    assert body["difficulty"] == "normal"
    assert isinstance(body["score_id"], int)


def test_register_score_unknown_user_returns_404(client):
    response = client.post(
        "/api/scores",
        json={
            "user_id": 9999,
            "score": 100,
            "level_reached": 1,
            "lines_cleared": 1,
            "difficulty": "easy",
        },
    )
    assert response.status_code == 404


def test_register_score_invalid_difficulty_returns_400(client):
    user_id = _register_user(client, "はなこ")
    response = client.post(
        "/api/scores",
        json={
            "user_id": user_id,
            "score": 100,
            "level_reached": 1,
            "lines_cleared": 1,
            "difficulty": "very-hard",
        },
    )
    assert response.status_code == 400


def test_register_score_negative_score_returns_400(client):
    user_id = _register_user(client, "じろう")
    response = client.post(
        "/api/scores",
        json={
            "user_id": user_id,
            "score": -1,
            "level_reached": 1,
            "lines_cleared": 1,
            "difficulty": "easy",
        },
    )
    assert response.status_code == 400


def test_rankings_ordered_by_score_desc(client):
    user_a = _register_user(client, "Aさん")
    user_b = _register_user(client, "Bさん")

    client.post(
        "/api/scores",
        json={
            "user_id": user_a,
            "score": 1000,
            "level_reached": 2,
            "lines_cleared": 5,
            "difficulty": "easy",
        },
    )
    client.post(
        "/api/scores",
        json={
            "user_id": user_b,
            "score": 5000,
            "level_reached": 5,
            "lines_cleared": 30,
            "difficulty": "hard",
        },
    )

    response = client.get("/api/rankings")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["rank"] == 1
    assert body[0]["nickname"] == "Bさん"
    assert body[0]["score"] == 5000
    assert body[1]["rank"] == 2
    assert body[1]["nickname"] == "Aさん"


def test_rankings_filtered_by_difficulty(client):
    user_a = _register_user(client, "Cさん")
    user_b = _register_user(client, "Dさん")

    client.post(
        "/api/scores",
        json={
            "user_id": user_a,
            "score": 2000,
            "level_reached": 3,
            "lines_cleared": 10,
            "difficulty": "easy",
        },
    )
    client.post(
        "/api/scores",
        json={
            "user_id": user_b,
            "score": 3000,
            "level_reached": 4,
            "lines_cleared": 15,
            "difficulty": "hard",
        },
    )

    response = client.get("/api/rankings", params={"difficulty": "easy"})
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["nickname"] == "Cさん"
    assert body[0]["difficulty"] == "easy"
