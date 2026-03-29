import os
from pathlib import Path

import yaml
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

LOGS_DIR = Path("logs")

BOT_TOKEN = os.getenv("BOT_TOKEN")

BOT_PROXY = os.getenv("BOT_PROXY")

ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID"))

DB_NAME = os.getenv("DB_NAME")

DB_HOST = os.getenv("DB_HOST")

DB_PORT = os.getenv("DB_PORT")

DB_USER = os.getenv("DB_USER")

DB_PASSWORD = os.getenv("DB_PASSWORD")

JWT_SECRET = os.getenv("JWT_SECRET")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE = int(os.getenv("ACCESS_TOKEN_EXPIRE")) * 60

REFRESH_TOKEN_EXPIRE = int(os.getenv("REFRESH_TOKEN_EXPIRE")) * 24 * 60 * 60

ENCRYPT_SECRET = os.getenv("ENCRYPT_SECRET")

LOG_LEVEL = os.getenv("LOG_LEVEL", "WARNING")

DB_ECHO = os.getenv("DB_ECHO", "false").lower() in ("true", "1", "yes")

config_path = Path("config.yaml")
if config_path.exists():
    with open(config_path) as f:
        config = yaml.safe_load(f)
else:
    raise RuntimeError("cannot load config")

DEV_MODE = config.get("dev_mode", {}).get("enabled", False)

if DEV_MODE:
    ALLOWED_ORIGINS = ["*"]
else:
    # NOTE: allowing no origns seems strange, but couldn't come up with any other sane defaults
    ALLOWED_ORIGINS = config.get("allowed_origins", [])
