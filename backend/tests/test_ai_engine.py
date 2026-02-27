import pytest
from backend.ai_engine import AIEngine
import g4f

def test_ai_engine_initialization():
    engine = AIEngine()
    assert engine.provider == g4f.Provider.Gemini
    assert "Manus AI" in engine.system_prompt

@pytest.mark.asyncio
async def test_ai_engine_generate_response_mock(mocker):
    # We use mocker to avoid real API calls during tests
    mock_create = mocker.patch("g4f.ChatCompletion.create")
    mock_create.return_value = "Hello from AI"

    # Mock BrowserEngine to avoid launching playwright in tests
    mocker.patch("backend.browser_engine.BrowserEngine.fetch_gemini", return_value="Error: Not found")
    mocker.patch("backend.browser_engine.BrowserEngine.fetch_chatgpt", return_value="Error: Not found")

    engine = AIEngine()
    # Force g4f path for this test by choosing a provider that doesn't use browser
    engine.provider_name = "Blackbox"

    response = await engine.generate_response([{"role": "user", "content": "Hi"}])
    assert response == "Hello from AI"
