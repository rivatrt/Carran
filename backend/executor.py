import subprocess
import re
from typing import Optional, Dict

class CommandExecutor:
    def __init__(self):
        pass

    def parse_action(self, response: str) -> Optional[str]:
        match = re.search(r"Action:\s*(.*)", response, re.MULTILINE)
        if match:
            return match.group(1).strip()
        return None

    def execute(self, command: str) -> Dict[str, str]:
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Error: Command timed out after 30 seconds.",
                "exit_code": -1
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Error executing command: {str(e)}",
                "exit_code": -1
            }

if __name__ == "__main__":
    executor = CommandExecutor()
    test_response = "Thought: I need to list files.\nAction: ls -l"
    cmd = executor.parse_action(test_response)
    if cmd:
        print(f"Executing: {cmd}")
        print(executor.execute(cmd))
