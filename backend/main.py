import sys
from typing import ForwardRef

def patch_pydantic():
    import pydantic.typing
    if sys.version_info >= (3, 12):
        original_evaluate_forwardref = pydantic.typing.evaluate_forwardref
        def patched_evaluate_forwardref(type_, globalns, localns):
            try:
                return type_._evaluate(globalns, localns, recursive_guard=set())
            except TypeError:
                return type_._evaluate(globalns, localns, set())
        pydantic.typing.evaluate_forwardref = patched_evaluate_forwardref

patch_pydantic()

import os
import json
import secrets
import threading
import asyncio
from contextlib import asynccontextmanager
from typing import List, Dict, Optional

from fastapi import FastAPI, HTTPException, Request, Depends, status, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from backend.ai_engine import AIEngine
from backend.executor import CommandExecutor
from backend.telegram_bot import TelegramBot

# Pydantic v1 models for Termux compatibility (avoiding pydantic-core)
class ConfigModel(BaseModel):
    telegram_token: str = ""
    ai_provider: str = "PollinationsAI"
    allowed_user_ids: List[int] = []
    proxy: str = ""

class ChatMessage(BaseModel):
    role: str
    content: str

CONFIG_FILE = "data/config.json"
API_KEY_FILE = "data/api_key.txt"

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "telegram_token": "",
        "ai_provider": "PollinationsAI",
        "allowed_user_ids": [],
        "proxy": ""
    }

def save_config(config: dict):
    os.makedirs("data", exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f)

def get_or_create_api_key():
    os.makedirs("data", exist_ok=True)
    if os.path.exists(API_KEY_FILE):
        with open(API_KEY_FILE, "r") as f:
            return f.read().strip()
    key = secrets.token_urlsafe(32)
    with open(API_KEY_FILE, "w") as f:
        f.write(key)
    return key

API_KEY = get_or_create_api_key()
print("=" * 50)
print(f"  YOUR API KEY IS: {API_KEY}")
print("  Save this key to log in to the Web UI.")
print("=" * 50)

api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return api_key

ai_engine = AIEngine()
executor = CommandExecutor()
bot_thread = None

def run_bot(token, allowed_ids, provider_name, proxy):
    bot_ai = AIEngine(provider_name)
    bot = TelegramBot(token, bot_ai, executor, allowed_ids)
    bot.run()

@asynccontextmanager
async def lifespan(app: FastAPI):
    config = load_config()
    ai_engine.set_provider(config.get("ai_provider", "PollinationsAI"))
    if config.get("telegram_token"):
        global bot_thread
        bot_thread = threading.Thread(
            target=run_bot,
            args=(
                config["telegram_token"],
                config.get("allowed_user_ids", []),
                config.get("ai_provider", "PollinationsAI"),
                config.get("proxy", "")
            ),
            daemon=True
        )
        bot_thread.start()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/config", dependencies=[Depends(verify_api_key)])
async def get_config():
    return load_config()

@app.post("/api/config", dependencies=[Depends(verify_api_key)])
async def update_config(config: ConfigModel):
    save_config(config.dict())
    ai_engine.set_provider(config.ai_provider)
    return {"message": "Config updated. Restart required for bot changes."}

@app.post("/api/chat", dependencies=[Depends(verify_api_key)])
async def chat(messages: List[ChatMessage]):
    config = load_config()
    msgs = [m.dict() for m in messages]

    async def event_generator():
        try:
            for i in range(5): # Allow up to 5 steps
                yield f"data: {json.dumps({'status': 'thinking'})}\n\n"

                response = await asyncio.to_thread(ai_engine.generate_response, msgs, config.get("proxy"))
                yield f"data: {json.dumps({'status': 'thought', 'content': response})}\n\n"

                command = executor.parse_action(response)
                if command:
                    yield f"data: {json.dumps({'status': 'executing', 'command': command})}\n\n"

                    result = await asyncio.to_thread(executor.execute, command)
                    output = f"Output:\n{result['stdout']}"
                    if result['stderr']:
                        output += f"\nError:\n{result['stderr']}"

                    yield f"data: {json.dumps({'status': 'result', 'output': output})}\n\n"

                    msgs.append({"role": "assistant", "content": response})
                    msgs.append({"role": "system", "content": f"Command Output: {output}"})
                else:
                    yield f"data: {json.dumps({'status': 'done'})}\n\n"
                    return

            yield f"data: {json.dumps({'status': 'done', 'message': 'Maximum steps reached'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/status")
async def get_status():
    return {
        "status": "running",
        "bot_active": bot_thread is not None and bot_thread.is_alive(),
        "api_key_required": True
    }

@app.get("/api/auth-check", dependencies=[Depends(verify_api_key)])
async def auth_check():
    return {"authenticated": True}

@app.post("/api/upload", dependencies=[Depends(verify_api_key)])
async def upload_file(file: UploadFile = File(...)):
    os.makedirs("data/uploads", exist_ok=True)
    file_path = f"data/uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"filename": file.filename, "path": file_path}

@app.post("/api/clear-history", dependencies=[Depends(verify_api_key)])
async def clear_history():
    # Frontend handles chat history in localStorage, but we can clear server-side cache if added later
    return {"message": "Chat history cleared"}

if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
