import json
import logging
from pathlib import Path

from fastapi import APIRouter

from core.rate_limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])

_BUILD_INFO_PATH = Path(__file__).resolve().parent.parent.parent / "build_info.json"

_version_info = None
if _BUILD_INFO_PATH.exists():
    try:
        _version_info = json.loads(_BUILD_INFO_PATH.read_text())
    except (json.JSONDecodeError, OSError):
        logger.warning("failed to parse build_info.json")


@router.get("/health")
@limiter.exempt
async def health() -> dict:
    if _version_info:
        return {"status": "ok", "version": _version_info}
    return {"status": "ok"}
