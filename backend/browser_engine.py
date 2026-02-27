import asyncio
import logging
import json
from playwright.async_api import async_playwright
from typing import Optional, Dict

class BrowserEngine:
    def __init__(self, cookies_path: str = "data/cookies.json"):
        self.cookies_path = cookies_path
        self.browser = None
        self.context = None
        self.page = None

    async def _init_browser(self):
        if self.browser is None:
            self.pw = await async_playwright().start()

            # Attempt to find system chromium (common in Termux)
            import shutil
            executable_path = shutil.which("chromium") or shutil.which("chromium-browser")

            launch_kwargs = {"headless": True}
            if executable_path:
                logging.info(f"BrowserEngine: Using system chromium at {executable_path}")
                launch_kwargs["executable_path"] = executable_path

            self.browser = await self.pw.chromium.launch(**launch_kwargs)

            # Load cookies if they exist
            try:
                with open(self.cookies_path, "r") as f:
                    cookies = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                cookies = []

            self.context = await self.browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            if cookies:
                await self.context.add_cookies(cookies)
            self.page = await self.context.new_page()

    async def fetch_gemini(self, prompt: str) -> str:
        await self._init_browser()
        try:
            # This is a simplified interaction and may need updates if Gemini's UI changes.
            await self.page.goto("https://gemini.google.com/app", wait_until="networkidle")

            # Look for the input field
            # In Gemini, it often has the role "textbox" or a specific placeholder.
            textarea = await self.page.wait_for_selector('div[role="textbox"]', timeout=10000)
            await textarea.fill(prompt)
            await self.page.keyboard.press("Enter")

            # Wait for the response to start and finish
            # This is tricky because Gemini streams. We'll look for the last response message.
            await asyncio.sleep(10) # Simple wait for now, can be improved with smarter selectors

            responses = await self.page.query_selector_all(".model-response-text")
            if responses:
                last_response = await responses[-1].inner_text()
                return last_response
            return "Failed to extract response from Gemini."
        except Exception as e:
            logging.error(f"BrowserEngine: Gemini fetch failed: {e}")
            return f"Error: {e}"

    async def fetch_chatgpt(self, prompt: str) -> str:
        await self._init_browser()
        try:
            await self.page.goto("https://chatgpt.com", wait_until="networkidle")

            # ChatGPT's prompt area
            textarea = await self.page.wait_for_selector("#prompt-textarea", timeout=10000)
            await textarea.fill(prompt)
            await self.page.keyboard.press("Enter")

            # Wait for the stop button to disappear or a certain time
            await asyncio.sleep(10)

            # Extract content from the last assistant message
            # Selector may vary, often [data-testid="conversation-turn-3"] etc or .markdown
            responses = await self.page.query_selector_all(".markdown")
            if responses:
                last_response = await responses[-1].inner_text()
                return last_response
            return "Failed to extract response from ChatGPT."
        except Exception as e:
            logging.error(f"BrowserEngine: ChatGPT fetch failed: {e}")
            return f"Error: {e}"

    async def close(self):
        if self.browser:
            await self.browser.close()
            await self.pw.stop()
            self.browser = None

if __name__ == "__main__":
    # Test script
    logging.basicConfig(level=logging.INFO)
    async def main():
        engine = BrowserEngine()
        # print(await engine.fetch_gemini("Hello, who are you?"))
        await engine.close()
    # asyncio.run(main())
