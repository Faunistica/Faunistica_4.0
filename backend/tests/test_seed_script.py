import pytest

from core.model import EventRecord, Publication, User
from schema.common import Publication as PublicationSchema
from schema.user import UserFull
from scripts.seed import (
    PASSWORDS,
    PUBL_DATA,
    RECORDS_DATA,
    USER_DATA,
    build_record,
    build_user,
)

# ── Records ──────────────────────────────────────────────


@pytest.mark.parametrize("i, data", enumerate(RECORDS_DATA))
def test_seed_record_can_be_constructed(i, data):
    filled = {**data, "user_id": data["user_id"] or 1}
    record = build_record(i, filled)
    assert isinstance(record, EventRecord)
    assert record.id is not None


# ── Publications ─────────────────────────────────────────


@pytest.mark.parametrize("p", PUBL_DATA)
def test_seed_publication_schema(p):
    PublicationSchema(**p)


@pytest.mark.parametrize("p", PUBL_DATA)
def test_seed_publication_orm(p):
    Publication(**p)


# ── Users ────────────────────────────────────────────────


@pytest.mark.parametrize("i", range(len(USER_DATA)))
def test_seed_user_orm_and_schema(i):
    user_dict = build_user(USER_DATA[i], PASSWORDS[i], dev_tg_id=1)
    orm_user = User(**user_dict)
    UserFull.model_validate(orm_user)
