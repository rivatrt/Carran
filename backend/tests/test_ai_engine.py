import pytest
from backend.ai_engine import AIEngine
import g4f

def test_ai_engine_initialization():
    engine = AIEngine()
    assert engine.provider == g4f.Provider.Gemini
    assert "Carran AI" in engine.system_prompt

@pytest.mark.asyncio
async def test_ai_engine_generate_response_mock(mocker):
    # We use mocker to avoid real API calls during tests
    mock_create = mocker.patch("g4f.ChatCompletion.create")
    mock_create.return_value = "Hello from AI"

    engine = AIEngine()
    engine.provider_name = "Blackbox"

    response = await engine.generate_response([{"role": "user", "content": "Hi"}])
    assert response == "Hello from AI"
