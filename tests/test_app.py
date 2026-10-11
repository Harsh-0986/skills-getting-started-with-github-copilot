import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture
def client():
    original_activities = copy.deepcopy(activities)
    with TestClient(app) as test_client:
        yield test_client
    activities.clear()
    activities.update(original_activities)


def test_get_activities_returns_activity_list(client):
    response = client.get("/activities")

    assert response.status_code == 200
    payload = response.json()
    assert "Chess Club" in payload
    assert payload["Chess Club"]["participants"]


def test_signup_for_activity_success(client):
    email = "newstudent@mergington.edu"

    response = client.post("/activities/Basketball Club/signup?email=" + email)

    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for Basketball Club"
    assert email in activities["Basketball Club"]["participants"]


def test_signup_for_unknown_activity_returns_404(client):
    response = client.post("/activities/Unknown Club/signup?email=test@mergington.edu")

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_for_duplicate_email_returns_400(client):
    email = "michael@mergington.edu"

    response = client.post("/activities/Chess Club/signup?email=" + email)

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity not found"


def test_unregister_participant_success(client):
    email = "michael@mergington.edu"

    response = client.request(
        "DELETE",
        "/activities/Chess Club/participants",
        params={"email": email},
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from Chess Club"
    assert email not in activities["Chess Club"]["participants"]


def test_unregister_missing_participant_returns_404(client):
    response = client.request(
        "DELETE",
        "/activities/Chess Club/participants",
        params={"email": "missing@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"


def test_unregister_unknown_activity_returns_404(client):
    response = client.request(
        "DELETE",
        "/activities/Unknown Club/participants",
        params={"email": "someone@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
