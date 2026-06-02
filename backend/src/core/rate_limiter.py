import jwt
from fastapi import Request, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.config import settings


def _rate_limit_key(request: Request) -> str:
    token_str = request.cookies.get("access_token")
    if token_str:
        try:
            payload = jwt.decode(
                token_str,
                settings.JWT_SECRET.get_secret_value(),
                algorithms=["HS256"],
            )
            return f"user:{payload['sub']}"
        except jwt.PyJWTError:
            pass

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    if request.client and request.client.host:
        return f"ip:{request.client.host}"
    return "ip:unknown"


limiter = Limiter(
    key_func=_rate_limit_key,
    enabled=not settings.DEV_MODE,
    # Global rate limit: 100/minute for all /api/ routes
    default_limits=[settings.GLOBAL_RATE_LIMIT],
)


# https://github.com/muhannad-hash/slowapi/blob/fix/issue-188/slowapi/extension.py
def rate_limit_handler(request: Request, exc: Exception) -> Response:
    if isinstance(exc, RateLimitExceeded):
        return _rate_limit_exceeded_handler(request, exc)
    raise exc
