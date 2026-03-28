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

