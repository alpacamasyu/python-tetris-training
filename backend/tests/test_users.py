"""A-01 ユーザー登録 / A-02 ログイン のテスト。"""


def test_register_user_success(client):
    response = client.post("/api/users", json={"nickname": "たろう"})
    assert response.status_code == 201
    body = response.json()
    assert body["nickname"] == "たろう"
    assert isinstance(body["user_id"], int)
    assert "created_at" in body


def test_register_user_duplicate_nickname_returns_409(client):
    client.post("/api/users", json={"nickname": "たろう"})
    response = client.post("/api/users", json={"nickname": "たろう"})
    assert response.status_code == 409
    assert "detail" in response.json()


def test_register_user_empty_nickname_returns_400(client):
    response = client.post("/api/users", json={"nickname": ""})
    assert response.status_code == 400
    assert "detail" in response.json()


def test_register_user_too_long_nickname_returns_400(client):
    response = client.post("/api/users", json={"nickname": "あ" * 21})
    assert response.status_code == 400


def test_login_success(client):
    client.post("/api/users", json={"nickname": "はなこ"})
    response = client.post("/api/login", json={"nickname": "はなこ"})
    assert response.status_code == 200
    body = response.json()
    assert body["nickname"] == "はなこ"
    assert isinstance(body["user_id"], int)


def test_login_unknown_user_returns_404(client):
    response = client.post("/api/login", json={"nickname": "存在しない"})
    assert response.status_code == 404


def test_login_missing_nickname_returns_400(client):
    response = client.post("/api/login", json={})
    assert response.status_code == 400
