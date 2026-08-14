"""A-03 テトリミノ出現順序取得のテスト。"""

TETROMINO_TYPES = {"I", "O", "T", "S", "Z", "J", "L"}


def test_default_bags_returns_one_full_set(client):
    response = client.get("/api/tetromino-sequence")
    assert response.status_code == 200
    sequence = response.json()["sequence"]
    assert len(sequence) == 7
    assert set(sequence) == TETROMINO_TYPES


def test_multiple_bags_returns_independent_sets(client):
    response = client.get("/api/tetromino-sequence", params={"bags": 2})
    assert response.status_code == 200
    sequence = response.json()["sequence"]
    assert len(sequence) == 14
    assert set(sequence[0:7]) == TETROMINO_TYPES
    assert set(sequence[7:14]) == TETROMINO_TYPES


def test_bags_out_of_range_returns_400(client):
    response = client.get("/api/tetromino-sequence", params={"bags": 6})
    assert response.status_code == 400

    response = client.get("/api/tetromino-sequence", params={"bags": 0})
    assert response.status_code == 400
