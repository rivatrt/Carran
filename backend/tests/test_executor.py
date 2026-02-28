from backend.executor import CommandExecutor

def test_parse_action():
    executor = CommandExecutor()
    response = "Thought: I should list files.\nAction: ls -l"
    command = executor.parse_action(response)
    assert command == "ls -l"

def test_parse_action_none():
    executor = CommandExecutor()
    response = "Hello there!"
    command = executor.parse_action(response)
    assert command is None

def test_execute_command():
    executor = CommandExecutor()
    result = executor.execute("echo 'hello world'")
    assert result["stdout"].strip() == "hello world"
    assert result["exit_code"] == 0

def test_execute_invalid_command():
    executor = CommandExecutor()
    result = executor.execute("nonexistent_command_12345")
    assert result["exit_code"] != 0
    assert "not found" in result["stderr"].lower() or "error" in result["stderr"].lower()
