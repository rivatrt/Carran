import json
import logging
import traceback

class BrowserTool:
    def __init__(self):
        # We don't need node paths anymore since we use python playwright natively
        pass

    def run_command(self, action, url, selector=None, text=None, cookies=None, screenshot_path=None):
        try:
            # Import dynamically to avoid loading it entirely during initialization
            # and to cleanly catch if playwright isn't installed.
            from playwright.sync_api import sync_playwright
        except ImportError:
            return {"error": "Playwright is not installed. Please run `pip install playwright`."}

        try:
            with sync_playwright() as p:
                # MANDATORY Termux Android Kernel Stability Flags
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--single-process"
                    ]
                )

                # Use a short default timeout (15s) for low RAM devices
                context = browser.new_context()
                context.set_default_timeout(15000)
                page = context.new_page()

                # Set cookies if provided
                if cookies and isinstance(cookies, list):
                    context.add_cookies(cookies)

                result = {}

                try:
                    if action == 'goto':
                        page.goto(url, wait_until='networkidle')
                        result["content"] = page.content()
                    elif action == 'click':
                        page.goto(url, wait_until='networkidle')
                        if selector:
                            page.locator(selector).click()
                            page.wait_for_load_state('networkidle')
                        result["content"] = page.content()
                    elif action == 'type':
                        page.goto(url, wait_until='networkidle')
                        if selector and text:
                            page.locator(selector).fill(text)
                            page.keyboard.press("Enter")
                            page.wait_for_load_state('networkidle')
                        result["content"] = page.content()
                    elif action == 'screenshot':
                        page.goto(url, wait_until='networkidle')
                        path_to_save = screenshot_path or "screenshot.png"
                        page.screenshot(path=path_to_save, full_page=True)
                        result["message"] = f"Screenshot saved to {path_to_save}"
                    else:
                        return {"error": f"Unknown action: {action}"}
                except Exception as e:
                     logging.error(f"BrowserTool Action Error: {str(e)}")
                     return {"error": f"Action failed: {str(e)}"}
                finally:
                     browser.close()

                return result

        except Exception as e:
            error_msg = f"Browser launch or critical execution failed: {str(e)}\n{traceback.format_exc()}"
            logging.error(error_msg)
            return {"error": str(e)}

if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Carran Browser Tool (Termux Python Playwright)")
    parser.add_argument("action", choices=["goto", "click", "type", "screenshot"], help="Action to perform")
    parser.add_argument("url", help="Target URL")
    parser.add_argument("--selector", help="CSS selector for click/type")
    parser.add_argument("--text", help="Text to type")
    parser.add_argument("--screenshot_path", help="Path to save screenshot")

    args = parser.parse_args()

    tool = BrowserTool()
    result = tool.run_command(
        args.action,
        args.url,
        selector=args.selector,
        text=args.text,
        screenshot_path=args.screenshot_path
    )
    print(json.dumps(result, indent=2))
