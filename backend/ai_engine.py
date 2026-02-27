import g4f
from typing import List, Dict, Optional
import logging

class AIEngine:
    def __init__(self, provider_name: str = "PollinationsAI"):
        self.set_provider(provider_name)
        self.system_prompt = (
            "You are an autonomous AI agent similar to Manus AI. "
            "You can think and then take action by executing shell commands. "
            "When you need to run a command, use the following format:\n"
            "Thought: [Your reasoning]\n"
            "Action: [The shell command to run]\n"
            "If you don't need to run a command, just reply normally."
        )

    def set_provider(self, name: str):
        try:
            if name == "Gemini":
                self.provider = g4f.Provider.Gemini
            elif name == "ChatGPT":
                self.provider = g4f.Provider.OpenaiChat
            elif name == "Blackbox":
                self.provider = g4f.Provider.BlackboxPro
            else:
                self.provider = g4f.Provider.PollinationsAI
        except Exception:
            self.provider = g4f.Provider.PollinationsAI

    def generate_response(self, messages: List[Dict[str, str]], proxy: Optional[str] = None) -> str:
        full_messages = [{"role": "system", "content": self.system_prompt}] + messages

        # List of providers to try as fallback
        providers_to_try = [
            self.provider,
            g4f.Provider.PollinationsAI,
            g4f.Provider.BlackboxPro,
            g4f.Provider.DeepInfra,
            g4f.Provider.OpenaiChat
        ]

        # Remove duplicates while preserving order
        seen = set()
        providers_to_try = [x for x in providers_to_try if not (x in seen or seen.add(x))]

        for provider in providers_to_try:
            try:
                response = g4f.ChatCompletion.create(
                    model=g4f.models.default,
                    provider=provider,
                    messages=full_messages,
                    proxy=proxy
                )
                if response and isinstance(response, str) and len(response) > 0:
                    return response
            except Exception as e:
                logging.error(f"Provider {provider.__name__ if hasattr(provider, '__name__') else provider} failed: {e}")
                continue

        return "Error: All free AI providers failed. Please try again later or check your internet connection."

if __name__ == "__main__":
    engine = AIEngine()
    print(engine.generate_response([{"role": "user", "content": "Hello"}]))
