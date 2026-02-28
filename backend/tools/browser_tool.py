import subprocess
import json
import os
import logging

class BrowserTool:
    def __init__(self, node_path="node", bridge_path="backend/browser_bridge.js"):
        self.node_path = node_path
        self.bridge_path = bridge_path

    def run_command(self, action, url, selector=None, text=None, cookies=None, screenshot_path=None):
        command = {
            "action": action,
            "url": url,
            "selector": selector,
            "text": text,
            "cookies": cookies,
            "screenshotPath": screenshot_path
        }

        try:
            cmd = [self.node_path, self.bridge_path, json.dumps(command)]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            if result.returncode != 0:
                logging.error(f"BrowserTool Error: {result.stderr}")
                return {"error": result.stderr}

            return json.loads(result.stdout)
        except Exception as e:
            logging.error(f"BrowserTool Exception: {str(e)}")
            return {"error": str(e)}

if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Carran Browser Tool")
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
