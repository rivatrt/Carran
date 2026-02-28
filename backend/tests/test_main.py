import pytest
import os
import json
from unittest.mock import patch, mock_open

from backend.main import load_config, CONFIG_FILE

def test_load_config_file_exists():
    mock_config = {"telegram_token": "test_token", "ai_provider": "TestProvider"}
    mock_file = mock_open(read_data=json.dumps(mock_config))

    with patch("os.path.exists", return_value=True):
        with patch("builtins.open", mock_file):
            config = load_config()
            assert config == mock_config

def test_load_config_file_not_exists():
    with patch("os.path.exists", return_value=False):
        config = load_config()
        assert config["telegram_token"] == ""
        assert config["ai_provider"] == "PollinationsAI"
        assert config["allowed_user_ids"] == []
        assert config["proxy"] == ""
        assert config["browser_cookies"] == "[]"

def test_load_config_json_error():
    mock_file = mock_open(read_data="invalid json")

    with patch("os.path.exists", return_value=True):
        with patch("builtins.open", mock_file):
            config = load_config()
            assert config["telegram_token"] == ""
            assert config["ai_provider"] == "PollinationsAI"
            assert config["allowed_user_ids"] == []
            assert config["proxy"] == ""
            assert config["browser_cookies"] == "[]"

def test_load_config_io_error():
    with patch("os.path.exists", return_value=True):
        with patch("builtins.open", side_effect=IOError("Mock IO Error")):
            config = load_config()
            assert config["telegram_token"] == ""
            assert config["ai_provider"] == "PollinationsAI"
            assert config["allowed_user_ids"] == []
            assert config["proxy"] == ""
            assert config["browser_cookies"] == "[]"
