import os
import pytest
from fastapi.testclient import TestClient

from backend.main import app, API_KEY, patch_pydantic
patch_pydantic()

client = TestClient(app)

def test_upload_file_success():
    test_filename = "test_upload_file.txt"
    test_content = b"This is a test file for the upload endpoint."
    file_path = f"data/uploads/{test_filename}"

    try:
        response = client.post(
            "/api/upload",
            headers={"X-API-Key": API_KEY},
            files={"file": (test_filename, test_content, "text/plain")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == test_filename
        assert "path" in data
        assert data["path"] == file_path

        assert os.path.exists(file_path)
        with open(file_path, "rb") as f:
            saved_content = f.read()
        assert saved_content == test_content
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

def test_upload_file_unauthorized():
    test_filename = "test_upload_unauth.txt"
    test_content = b"Content"

    response = client.post(
        "/api/upload",
        headers={"X-API-Key": "invalid_api_key"},
        files={"file": (test_filename, test_content, "text/plain")}
    )

    assert response.status_code == 401

    response_missing = client.post(
        "/api/upload",
        files={"file": (test_filename, test_content, "text/plain")}
    )
    assert response_missing.status_code == 403

def test_upload_missing_file():
    response = client.post(
        "/api/upload",
        headers={"X-API-Key": API_KEY},
    )

    assert response.status_code == 422
