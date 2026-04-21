from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

pwd_hasher = PasswordHasher()


def get_password_hash(user_pass: str) -> str:
    return pwd_hasher.hash(user_pass)


def check_password_hash(user_pass: str, db_hash: str) -> bool:
    try:
        pwd_hasher.verify(db_hash, user_pass)
        return True
    except VerifyMismatchError:
        return False


# FIXME: remove this functions
def encrypt_id(some_id: int, user_id: int) -> str:
    return f"{user_id}|{some_id}"


def decrypt_id(token: str, _: int) -> int | None:
    try:
        return int(token.split("|")[1])
    except:
        return None
