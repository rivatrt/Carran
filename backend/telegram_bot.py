import asyncio
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters
from backend.ai_engine import AIEngine
from backend.executor import CommandExecutor

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

class TelegramBot:
    def __init__(self, token: str, ai_engine: AIEngine, executor: CommandExecutor, allowed_user_ids: list = None):
        self.token = token
        self.ai_engine = ai_engine
        self.executor = executor
        self.allowed_user_ids = allowed_user_ids or []
        self.application = None

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if self.allowed_user_ids and update.effective_user.id not in self.allowed_user_ids:
            await update.message.reply_text("Unauthorized. Please add your User ID to the allowed list in the Web UI.")
            logging.warning(f"Unauthorized access attempt from user ID: {update.effective_user.id}")
            return

        user_text = update.message.text
        messages = [{"role": "user", "content": user_text}]

        # Multi-turn autonomous loop
        for _ in range(3):
            response = self.ai_engine.generate_response(messages)
            await update.message.reply_text(response)

            command = self.executor.parse_action(response)
            if command:
                await update.message.reply_text(f"Executing: {command}")
                result = self.executor.execute(command)
                output = f"Output:\n{result['stdout']}"
                if result['stderr']:
                    output += f"\nError:\n{result['stderr']}"

                messages.append({"role": "assistant", "content": response})
                messages.append({"role": "system", "content": f"Command Output: {output}"})
            else:
                break

    def run(self):
        if not self.token:
            logging.error("No Telegram token provided.")
            return

        self.application = ApplicationBuilder().token(self.token).build()

        message_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), self.handle_message)
        self.application.add_handler(message_handler)

        logging.info("Starting Telegram bot...")
        self.application.run_polling()
