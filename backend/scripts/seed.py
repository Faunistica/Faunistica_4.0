#!/usr/bin/env -S uv run --script

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from core.database import get_session, init_db
from core.model import EventRecord, Publication, User
from core.security import get_password_hash
from schema.records import RecordData, Specimen
from service.records.util import _create_record_metadata, _flatten_for_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED_DT = datetime(2024, 6, 1, 12, 0, 0)

_SEED_UUIDS: list[UUID] = [
    UUID("6f53928a-ecff-42e0-bf58-1e16bdfd63b2"),
    UUID("20358368-7c29-4b30-9de3-94ae849a87f7"),
    UUID("24e3c13e-dd60-4668-99e6-bb91ed3a728f"),
    UUID("216ad40d-236a-48b7-9f92-a4e85f28b62c"),
    UUID("84ed3c6d-2f57-4ee5-a74c-d4b612343c7c"),
    UUID("cca913fb-6960-4e1f-bb60-a1058e5bed63"),
    UUID("5d512f23-9af7-4ed1-b6c7-4aba615dca56"),
    UUID("77203fce-a3af-434b-a3dc-b78faf455159"),
    UUID("0cee6c03-eaff-4d81-bb61-7815c5b27023"),
    UUID("64c6ca7a-7d3f-468b-a857-17d29bf8f034"),
    UUID("04c01ad6-8239-4e65-84b3-9fab334a845e"),
    UUID("37e30d2f-4b5b-4de9-a6ff-1ab2fd94b02c"),
    UUID("036f7a63-3fb3-4b59-8e58-9caf016c32e4"),
    UUID("0320d654-f788-4419-9b20-5e7f918a81fe"),
    UUID("c146e55f-62df-49ee-8b3f-5e6fe57e2c4e"),
    UUID("cad599b0-2cd6-4847-b78b-aab46ffd1706"),
    UUID("1aa72d13-1546-4375-bed8-b49a4ae1b366"),
    UUID("c2717d20-4acb-4370-a93c-0aa7e0ace5dd"),
    UUID("b3aeead7-c7e1-472d-b9e0-6c07ec601273"),
    UUID("45a703c1-193c-41ff-8863-27bc647e9b6c"),
    UUID("99fd10ff-04cd-4b0c-9299-575f3efe9ee2"),
    UUID("b9190e68-7433-4891-b1eb-f9cbb0745c4a"),
    UUID("0bdab6a0-7e54-4bd4-8f09-7f67b0d530ee"),
    UUID("812452bb-092d-45a9-bd8f-05d8c4de439e"),
    UUID("c9749c0f-b319-47df-bcbf-c6dc90533595"),
    UUID("3ba32bdc-6a1e-4992-b7f6-848945bdc571"),
    UUID("048b101e-3126-4261-a7bd-248ba28eaadb"),
    UUID("c2491762-1e8d-4453-9543-65561f31aad3"),
    UUID("1ecc4f28-93e7-4109-83a1-4ec133005469"),
    UUID("7544d4cf-98b3-4057-9d69-c455d75904c0"),
]


def build_record(i: int, data: dict) -> EventRecord:
    record_data = RecordData.model_validate(data)
    metadata, _ = _create_record_metadata(
        record_data,
        data["user_id"],
        data["publ_id"],
        language=data.get("language", "rus"),
        submission_type="submit",
    )
    metadata.id = _SEED_UUIDS[i]
    metadata.created_at = SEED_DT - timedelta(minutes=i)
    metadata.updated_at = SEED_DT - timedelta(minutes=i)

    flat = _flatten_for_db(record_data)
    return EventRecord(**flat, **metadata.model_dump())


PUBL_DATA: list[dict] = [
    {
        "publ_id": 1,
        "type": "A",
        "author": "Сидоров И.И.",
        "year": 2000,
        "name": "Сидоров о паукообразных",
        "external": "Альтернативное название",
        "language": "rus",
        "resume": "eng",
        "ural": True,
        "coords": True,
        "occs": True,
        "spec": True,
        "pdf_file": "sidorov.pdf",
    },
    {
        "publ_id": 2,
        "type": "B",
        "author": "Петров П.П.",
        "year": 2015,
        "name": "Фауна Урала: жесткокрылые",
        "external": None,
        "language": "rus",
        "resume": None,
        "ural": True,
        "coords": True,
        "occs": False,
        "spec": True,
        "pdf_file": "petrov.pdf",
    },
    {
        "publ_id": 3,
        "type": "A",
        "author": "Иванов И.И.",
        "year": 2020,
        "name": "Насекомые Южного Урала",
        "external": None,
        "language": "rus",
        "resume": None,
        "ural": True,
        "coords": True,
        "occs": True,
        "spec": False,
        "pdf_file": "ivanov.pdf",
    },
]

PASSWORDS = ["password", "test"]

USER_DATA: list[dict] = [
    {
        "user_id": 0,
        "name": "DEV_USERNAME",
        "tlg_username": "dev_user",
        "tlg_name": "Dev User",
        "reg_stat": 1,
        "age": 30,
        "lng": "rus",
        "rating": 5,
        "items": "2|3",
        "reg_run": SEED_DT,
        "reg_end": SEED_DT,
        "sex": "M",
        "email": "dev@example.com",
        "region": "Екатеринбург",
        "comm": "Основной тестовый пользователь",
    },
    {
        "user_id": 1,
        "name": "TEST",
        "tlg_username": "test_user",
        "tlg_name": "Test User",
        "reg_stat": 1,
        "age": 25,
        "lng": "eng",
        "rating": 3,
        "items": "1",
        "reg_run": SEED_DT,
        "reg_end": SEED_DT,
        "sex": "F",
        "email": "test@example.com",
        "region": "Москва",
        "comm": "Второй тестовый пользователь",
    },
]


def build_user(data: dict, password: str, dev_tg_id: int = 1) -> dict:
    user = {**data}
    if user.get("user_id") is None or user["user_id"] == 0:
        user["user_id"] = dev_tg_id
    user["hash"] = get_password_hash(password)
    user["hash_date"] = datetime.now()
    return user


RECORDS_DATA: list[dict] = [
    # User DEV_TG, Publication 2 — Carabidae
    {
        "user_id": 0,  # placeholder, filled at runtime
        "publ_id": 2,
        "language": "rus",
        "family": "Carabidae",
        "genus": "Carabus",
        "species": "violaceus",
        "latitude": "56.83",
        "longitude": "60.61",
        "country": "RU",
        "region": "Свердловская обл.",
        "district": "г. Екатеринбург",
        "locality": "лесопарк УУПИ",
        "is_manual_location": False,
        "habitat": "Смешанный лес, под корой",
        "verbatim_date": "2023-05-15",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "Собран под корой сосны",
        "specimens": [Specimen(sex="male", life_stage="adult", count=3)],
    },
    # User DEV_TG, Publication 2 — Coccinellidae
    {
        "user_id": 0,
        "publ_id": 2,
        "language": "rus",
        "family": "Coccinellidae",
        "genus": "Coccinella",
        "species": "septempunctata",
        "latitude": "55.45",
        "longitude": "65.34",
        "country": "RU",
        "region": "Челябинская обл.",
        "district": "г. Челябинск",
        "locality": "парк Гагарина",
        "is_manual_location": False,
        "habitat": "Городской парк, лиственные деревья",
        "verbatim_date": "2023-06-20",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "На липе",
        "specimens": [Specimen(sex="male", life_stage="adult", count=5)],
    },
    # User DEV_TG, Publication 2 — Silphidae
    {
        "user_id": 0,
        "publ_id": 2,
        "language": "rus",
        "family": "Silphidae",
        "genus": "Necrodes",
        "species": "littoralis",
        "latitude": "58.12",
        "longitude": "59.34",
        "country": "RU",
        "region": "Пермский край",
        "district": "г. Пермь",
        "locality": "окр. г. Перми",
        "is_manual_location": False,
        "habitat": "Труп животного",
        "verbatim_date": "2023-07-10",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "На падали",
        "specimens": [
            Specimen(sex="male", life_stage="adult", count=1),
            Specimen(sex="female", life_stage="adult", count=1),
            Specimen(sex="male", life_stage="subadult", count=1),
        ],
    },
    # User DEV_TG, Publication 2 — Staphylinidae
    {
        "user_id": 0,
        "publ_id": 2,
        "language": "rus",
        "family": "Staphylinidae",
        "genus": "Staphylinus",
        "species": "caesareus",
        "latitude": "56.50",
        "longitude": "61.12",
        "country": "RU",
        "region": "Свердловская обл.",
        "district": "г. Нижний Тагил",
        "locality": "окр. Нижнего Тагила",
        "is_manual_location": False,
        "habitat": "Лиственный лес, под камнями",
        "verbatim_date": "2023-08-05",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "Под камнями у ручья",
        "specimens": [Specimen(sex="female", life_stage="adult", count=3)],
    },
    # User DEV_TG, Publication 2 — Cerambycidae
    {
        "user_id": 0,
        "publ_id": 2,
        "language": "rus",
        "family": "Cerambycidae",
        "genus": "Monochamus",
        "species": "galloprovincialis",
        "latitude": "57.23",
        "longitude": "58.89",
        "country": "RU",
        "region": "Свердловская обл.",
        "district": "Пригородный р-н",
        "locality": "вблизи пос. Изоплит",
        "is_manual_location": False,
        "habitat": "Сосновый лес, на стволах",
        "verbatim_date": "2023-09-12",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "На свежеспиленных соснах",
        "specimens": [Specimen(sex="male", life_stage="adult", count=2)],
    },
    # User 2, Publication 1 — Lycosidae
    {
        "user_id": 1,
        "publ_id": 1,
        "language": "rus",
        "family": "Lycosidae",
        "genus": "Lycosa",
        "species": "singoriensis",
        "latitude": "55.75",
        "longitude": "37.61",
        "country": "RU",
        "region": "Московская обл.",
        "district": "г. Москва",
        "locality": "Измайловский парк",
        "is_manual_location": False,
        "habitat": "Травянистые биотопы",
        "verbatim_date": "2023-06-18",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "В траве",
        "specimens": [Specimen(sex="female", life_stage="adult", count=1)],
    },
    # User 2, Publication 1 — Salticidae
    {
        "user_id": 1,
        "publ_id": 1,
        "language": "rus",
        "family": "Salticidae",
        "genus": "Salticus",
        "species": "scenicus",
        "latitude": "55.76",
        "longitude": "37.62",
        "country": "RU",
        "region": "Московская обл.",
        "district": "г. Москва",
        "locality": "Коломенское",
        "is_manual_location": False,
        "habitat": "Стены зданий, заборы",
        "verbatim_date": "2023-07-25",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "На каменной кладке",
        "specimens": [Specimen(sex="male", life_stage="adult", count=4)],
    },
    # User DEV_TG, Publication 2 — Scarabaeidae (failed record)
    {
        "user_id": 0,
        "publ_id": 2,
        "language": "rus",
        "family": "Scarabaeidae",
        "genus": "Cetonia",
        "species": "aurata",
        "latitude": "56.90",
        "longitude": "60.70",
        "country": "RU",
        "region": "Свердловская обл.",
        "district": "г. Екатеринбург",
        "locality": "Шарташ",
        "is_manual_location": False,
        "habitat": "Луг, цветы",
        "verbatim_date": "2023-10-05",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "На цветах бодяка",
        "specimens": [Specimen(sex="male", life_stage="adult", count=1)],
    },
    # User 2, Publication 1 — Thomisidae
    {
        "user_id": 1,
        "publ_id": 1,
        "language": "rus",
        "family": "Thomisidae",
        "genus": "Xysticus",
        "species": "kochi",
        "latitude": "55.70",
        "longitude": "37.58",
        "country": "RU",
        "region": "Московская обл.",
        "district": "г. Москва",
        "locality": "Битцевский лес",
        "is_manual_location": False,
        "habitat": "Кустарники, травянистые растения",
        "verbatim_date": "2023-08-30",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "На кустах шиповника",
        "specimens": [Specimen(sex="male", life_stage="adult", count=2)],
    },
    # User DEV_TG, Publication 2 — Geotrupidae
    {
        "user_id": 0,
        "publ_id": 2,
        "language": "rus",
        "family": "Geotrupidae",
        "genus": "Geotrupes",
        "species": "stercorarius",
        "latitude": "57.50",
        "longitude": "59.80",
        "country": "RU",
        "region": "Свердловская обл.",
        "district": "Асбестовский р-н",
        "locality": "окр. г. Асбест",
        "is_manual_location": False,
        "habitat": "Пастбище, навоз",
        "verbatim_date": "2023-09-28",
        "date_precision": "day",
        "is_interval": False,
        "quantity_type": "individuals",
        "occurrence_remarks": "На пастбище",
        "specimens": [Specimen(sex="male", life_stage="adult", count=6)],
    },
]


async def seed() -> None:
    logger.info("Starting database seed...")

    await init_db()

    async for session in get_session():
        dev_tg_id = int(os.environ.get("DEV_TG_ID", "1"))
        logger.info(f"Using DEV_TG_ID: {dev_tg_id}")

        # Fill in runtime user_id
        for data in RECORDS_DATA:
            if data["user_id"] == 0:
                data["user_id"] = dev_tg_id

        # Publications
        for p in PUBL_DATA:
            stmt = (
                insert(Publication)
                .values(**p)
                .on_conflict_do_nothing(index_elements=["publ_id"])
            )
            await session.execute(stmt)
        logger.info("Publications inserted")

        # Users
        for i, u in enumerate(USER_DATA):
            user_dict = build_user(u, PASSWORDS[i], dev_tg_id=dev_tg_id)
            stmt = (
                insert(User)
                .values(**user_dict)
                .on_conflict_do_nothing(index_elements=["user_id"])
            )
            await session.execute(stmt)
            logger.info(
                "User inserted: name: %s; password: %s; publications: %s",
                user_dict["name"],
                # NOTE: THIS IS OK, THIS PASSWORD IS FOR DEVELOPMENT ONLY
                PASSWORDS[i],
                user_dict["items"],
            )

        # Check if records already exist
        existing = await session.execute(select(EventRecord).limit(1))
        if existing.scalar_one_or_none():
            logger.info("Records already exist, skipping")
        else:
            records = [
                build_record(i, RECORDS_DATA[i % len(RECORDS_DATA)])
                for i in range(len(_SEED_UUIDS))
            ]
            session.add_all(records)
            logger.info(f"Inserted {len(records)} event records")

        await session.commit()
        logger.info("Seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
