import secrets
import string


def generate_secure_password() -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(14 + secrets.randbelow(7)))
