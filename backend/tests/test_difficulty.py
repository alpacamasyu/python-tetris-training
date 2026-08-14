"""A-04 難易度設定取得のテスト。"""


def test_get_difficulty_settings_returns_seeded_data(client):
    response = client.get("/api/difficulty-settings")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 3

    by_name = {item["name"]: item for item in body}
    assert by_name["easy"]["initial_fall_speed_ms"] == 1000
    assert by_name["easy"]["score_multiplier"] == 1.0
    assert by_name["normal"]["initial_fall_speed_ms"] == 700
    assert by_name["normal"]["score_multiplier"] == 1.5
    assert by_name["hard"]["initial_fall_speed_ms"] == 400
    assert by_name["hard"]["score_multiplier"] == 2.0
