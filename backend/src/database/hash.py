from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

pwd_hasher = PasswordHasher()


def get_password_hash(user_pass: str) -> str:
    return pwd_hasher.hash(user_pass)


def check_password_hash(user_pass: str, db_hash: str) -> bool:
    try:
        pwd_hasher.verify(db_hash, user_pass)
    except VerifyMismatchError:
        return False
    return True


# FIXME: remove this functions
def encrypt_id(some_id: int, user_id: int) -> str:
    return f"{user_id}|{some_id}"


def decrypt_id(token: str) -> int:
    return int(token.split("|")[1])
