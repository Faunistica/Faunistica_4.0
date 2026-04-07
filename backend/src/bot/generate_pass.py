import secrets
import string
from random import randint


def generate_secure_password() -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(randint(14, 20)))
