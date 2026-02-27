import os
import json
import secrets
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import List, Dict, Optional
import threading
from contextlib import asynccontextmanager

from backend.ai_engine import AIEngine
from backend.executor import CommandExecutor
from backend.telegram_bot import TelegramBot

CONFIG_FILE = "data/config.json"
API_KEY_FILE = "data/api_key.txt"

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {
        "telegram_token": "",
        "ai_provider": "PollinationsAI",
        "allowed_user_ids": [],
        "proxy": ""
    }

def save_config(config: dict):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f)

def get_or_create_api_key():
    if os.path.exists(API_KEY_FILE):
        with open(API_KEY_FILE, "r") as f:
            return f.read().strip()
    key = secrets.token_urlsafe(32)
    with open(API_KEY_FILE, "w") as f:
        f.write(key)
    return key

API_KEY = get_or_create_api_key()
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

class Config(BaseModel):
    telegram_token: Optional[str] = ""
    ai_provider: Optional[str] = "PollinationsAI"
    allowed_user_ids: List[int] = []
    proxy: Optional[str] = ""

class ChatMessage(BaseModel):
    role: str
    content: str

@app.get("/api/config", dependencies=[Depends(verify_api_key)])
async def get_config():
    return load_config()

@app.post("/api/config", dependencies=[Depends(verify_api_key)])
async def update_config(config: Config):
    save_config(config.dict())
    ai_engine.set_provider(config.ai_provider)
    return {"message": "Config updated. Restart required for bot changes."}

@app.post("/api/chat", dependencies=[Depends(verify_api_key)])
async def chat(messages: List[ChatMessage]):
    config = load_config()
    msgs = [m.dict() for m in messages]

    final_output = ""
    last_action = None

    for _ in range(3):
        response = ai_engine.generate_response(msgs, proxy=config.get("proxy"))
        command = executor.parse_action(response)

        if command:
            last_action = command
            result = executor.execute(command)
            output = f"Output:\n{result['stdout']}"
            if result['stderr']:
                output += f"\nError:\n{result['stderr']}"

            final_output += f"\nExecuted: {command}\n{output}"
            msgs.append({"role": "assistant", "content": response})
            msgs.append({"role": "system", "content": f"Command Output: {output}"})
        else:
            return {"response": response, "action": last_action, "output": final_output}

    return {"response": response, "action": last_action, "output": final_output}

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

if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    print(f"Your API Key is: {API_KEY}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
