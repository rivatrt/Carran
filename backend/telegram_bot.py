import asyncio
import logging
from telegram import Update, constants
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
            await update.message.reply_text(f"❌ Unauthorized. Your User ID: {update.effective_user.id}\nAdd it in the Web UI to use the bot.")
            logging.warning(f"Unauthorized access attempt from user ID: {update.effective_user.id}")
            return

        user_text = update.message.text or update.message.caption or ""

        # Handle files
        if update.message.document or update.message.photo:
            await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=constants.ChatAction.UPLOAD_DOCUMENT)
            file = await (update.message.document or update.message.photo[-1]).get_file()
            import os
            os.makedirs("data/uploads", exist_ok=True)
            file_name = update.message.document.file_name if update.message.document else f"photo_{file.file_id}.jpg"
            file_path = f"data/uploads/{file_name}"
            await file.download_to_drive(file_path)
            user_text += f"\n[File Received: {file_name} at {file_path}. I can now process this file.]"

        if not user_text:
            return

        messages = [{"role": "user", "content": user_text}]

        status_msg = await update.message.reply_text("🔍 Thinking...")

        # Multi-turn autonomous loop
        for _ in range(5):
            await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=constants.ChatAction.TYPING)

            response = await asyncio.to_thread(self.ai_engine.generate_response, messages)

            # Update thoughts
            try:
                await status_msg.edit_text(response)
            except Exception:
                status_msg = await update.message.reply_text(response)

            command = self.executor.parse_action(response)
            if command:
                exec_msg = await update.message.reply_text(f"⚙️ Executing: `{command}`", parse_mode=constants.ParseMode.MARKDOWN)

                result = await asyncio.to_thread(self.executor.execute, command)
                output = result['stdout']
                if result['stderr']:
                    output += f"\nError:\n{result['stderr']}"

                # Limit output size for telegram
                if len(output) > 3000:
                    output = output[:3000] + "... (truncated)"

                await exec_msg.edit_text(f"✅ Output:\n```\n{output}\n```", parse_mode=constants.ParseMode.MARKDOWN)

                messages.append({"role": "assistant", "content": response})
                messages.append({"role": "system", "content": f"Command Output: {output}"})

                # Re-post thinking message for next turn
                status_msg = await update.message.reply_text("🔍 Thinking about next step...")
            else:
                break

    def run(self):
        if not self.token:
            logging.error("No Telegram token provided.")
            return

        self.application = ApplicationBuilder().token(self.token).build()

        # Combined handler for text and files
        message_handler = MessageHandler((filters.TEXT | filters.PHOTO | filters.Document.ALL) & (~filters.COMMAND), self.handle_message)
        self.application.add_handler(message_handler)

        logging.info("Starting Telegram bot...")
        self.application.run_polling()
