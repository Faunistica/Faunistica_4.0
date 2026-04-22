from fastapi import Request, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# NOTE: also use user_id as key_func param?
limiter = Limiter(key_func=get_remote_address)


# https://github.com/muhannad-hash/slowapi/blob/fix/issue-188/slowapi/extension.py
def rate_limit_handler(request: Request, exc: Exception) -> Response:
    if isinstance(exc, RateLimitExceeded):
        return _rate_limit_exceeded_handler(request, exc)
    raise exc
