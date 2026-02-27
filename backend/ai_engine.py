import g4f
from typing import List, Dict, Optional, Any
import logging

class AIEngine:
    def __init__(self, provider_name: str = "PollinationsAI"):
        self.set_provider(provider_name)
        self.system_prompt = (
            "You are Manus AI, an advanced autonomous AI agent. "
            "You can think, analyze, and execute shell commands to accomplish tasks. "
            "Your goal is to be helpful, efficient, and precise.\n\n"
            "When you need to perform an action, follow this structure:\n"
            "Thought: [Explain your reasoning and what you plan to do]\n"
            "Action: [The exact shell command to run]\n\n"
            "After you get the output of the command, continue your thought process. "
            "If you have completed the task, provide a final summary without an Action."
        )

    def set_provider(self, name: str):
        self.provider_name = name
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
        # Prepare messages
        full_messages = [{"role": "system", "content": self.system_prompt}]

        # Filter and add messages to avoid too large history
        # We keep the last 10 messages for context
        history = messages[-10:]
        full_messages.extend(history)

        # List of providers to try as fallback if the selected one fails
        providers_to_try = [self.provider]

        # Common reliable free providers
        # Using providers that are commonly available in g4f
        fallbacks = [
            g4f.Provider.PollinationsAI,
            g4f.Provider.BlackboxPro,
            g4f.Provider.OpenaiChat
        ]

        for f in fallbacks:
            if f != self.provider:
                providers_to_try.append(f)

        for provider in providers_to_try:
            try:
                logging.info(f"Trying provider: {provider.__name__ if hasattr(provider, '__name__') else provider}")
                response = g4f.ChatCompletion.create(
                    model=g4f.models.default,
                    provider=provider,
                    messages=full_messages,
                    proxy=proxy,
                    timeout=60
                )
                if response and isinstance(response, str) and len(response.strip()) > 0:
                    return response
            except Exception as e:
                logging.error(f"Provider {provider.__name__ if hasattr(provider, '__name__') else provider} failed: {e}")
                continue

        return "Error: All free AI providers are currently unavailable. Please try again in a few moments or check your internet connection."

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    engine = AIEngine()
    print(engine.generate_response([{"role": "user", "content": "Hello, who are you?"}]))
