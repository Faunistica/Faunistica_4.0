import logging
import os
from pathlib import Path

import yaml
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

LOGS_DIR = Path("logs")

BOT_TOKEN = os.getenv("BOT_TOKEN")
if BOT_TOKEN is None:
    raise RuntimeError("cannot load BOT_TOKEN")

BOT_PROXY: str | None = os.getenv("BOT_PROXY")

_admin_chat_id_env = os.getenv("ADMIN_CHAT_ID")
if _admin_chat_id_env is None:
    logger.warning("ADMIN_CHAT_ID is not set")
    _admin_chat_id_env = "0"

ADMIN_CHAT_ID: int = int(_admin_chat_id_env)

DB_NAME: str = os.getenv("DB_NAME") or ""

DB_HOST: str = os.getenv("DB_HOST") or ""

DB_PORT: str = os.getenv("DB_PORT") or ""

DB_USER: str = os.getenv("DB_USER") or ""

DB_PASSWORD: str = os.getenv("DB_PASSWORD") or ""

JWT_SECRET: str = os.getenv("JWT_SECRET") or ""

ACCESS_TOKEN_EXPIRE: int = int(os.getenv("ACCESS_TOKEN_EXPIRE") or "30") * 60

REFRESH_TOKEN_EXPIRE: int = (
    int(os.getenv("REFRESH_TOKEN_EXPIRE") or "30") * 24 * 60 * 60
)

ENCRYPT_SECRET: str = os.getenv("ENCRYPT_SECRET") or ""

LOG_LEVEL: str = os.getenv("LOG_LEVEL") or "WARNING"

DB_ECHO: bool = os.getenv("DB_ECHO", "false").lower() in ("true", "1", "yes")

config_path = Path("config.yaml")
if config_path.exists():
    with open(config_path) as f:
        config = yaml.safe_load(f) or {}
else:
    raise RuntimeError("cannot load config")

DEV_MODE: bool = config.get("dev_mode", {}).get("enabled", False)

ALLOWED_ORIGINS: list[str] = (
    config.get("allowed_origins", ["*"])
    if DEV_MODE
    else config.get("allowed_origins", [])
)
