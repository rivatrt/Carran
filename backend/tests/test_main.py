import os
import json
import pytest
from unittest.mock import patch, mock_open

from backend.main import load_config, save_config, CONFIG_FILE

DEFAULT_CONFIG = {
    "telegram_token": "",
    "ai_provider": "PollinationsAI",
    "allowed_user_ids": [],
    "proxy": "",
    "browser_cookies": "[]"
}

def test_load_config_not_exists(mocker):
    mocker.patch("os.path.exists", return_value=False)
    config = load_config()
    assert config == DEFAULT_CONFIG

def test_load_config_invalid_json(mocker):
    mocker.patch("os.path.exists", return_value=True)
    mocker.patch("builtins.open", mock_open(read_data="invalid json"))
    # mock json.load to raise an exception since mock_open might not be enough if it parses empty string
    mocker.patch("json.load", side_effect=Exception("Invalid JSON"))

    config = load_config()
    assert config == DEFAULT_CONFIG

def test_load_config_success(mocker):
    expected_config = {
        "telegram_token": "test_token",
        "ai_provider": "TestProvider",
        "allowed_user_ids": [123],
        "proxy": "http://proxy",
        "browser_cookies": "[{}]"
    }
    mocker.patch("os.path.exists", return_value=True)
    mocker.patch("builtins.open", mock_open(read_data=json.dumps(expected_config)))

    config = load_config()
    assert config == expected_config

def test_save_config(mocker):
    mock_makedirs = mocker.patch("os.makedirs")
    m_open = mock_open()
    mocker.patch("builtins.open", m_open)
    mock_json_dump = mocker.patch("json.dump")

    config_to_save = {"test": "data"}
    save_config(config_to_save)

    mock_makedirs.assert_called_once_with("data", exist_ok=True)
    m_open.assert_called_once_with(CONFIG_FILE, "w")
    mock_json_dump.assert_called_once_with(config_to_save, m_open())
