#!/usr/bin/env -S uv run --script

import asyncio
import logging
import os
import sys
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from core.database import get_session, init_db
from core.model import EventRecord, Publication, User
from core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed() -> None:
    logger.info("Starting database seed...")

    await init_db()

    async for session in get_session():
        # Publications
        publ_data = [
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

        for p in publ_data:
            stmt = (
                insert(Publication)
                .values(**p)
                .on_conflict_do_nothing(index_elements=["publ_id"])
            )
            await session.execute(stmt)
        logger.info("Publications inserted")

        # Users
        dev_tg_id = int(os.environ.get("DEV_TG_ID", "351318551"))
        logger.info(f"Using DEV_TG_ID: {dev_tg_id}")

        user_data = [
            {
                "user_id": dev_tg_id,
                "name": "DEV",
                "tlg_username": "dev_user",
                "tlg_name": "Dev User",
                "hash": get_password_hash("dev"),
                "hash_date": datetime.now(),
                "reg_stat": 1,
                "age": 30,
                "lng": "ru",
                "rating": 5,
                "items": "2|3",
                "reg_run": datetime.now(),
                "reg_end": datetime.now(),
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
                "hash": get_password_hash("test"),
                "hash_date": datetime.now(),
                "reg_stat": 1,
                "age": 25,
                "lng": "en",
                "rating": 3,
                "items": "1",
                "reg_run": datetime.now(),
                "reg_end": datetime.now(),
                "sex": "F",
                "email": "test@example.com",
                "region": "Москва",
                "comm": "Второй тестовый пользователь",
            },
        ]

        for u in user_data:
            stmt = (
                insert(User)
                .values(**u)
                .on_conflict_do_nothing(index_elements=["user_id"])
            )
            await session.execute(stmt)
        logger.info("Users inserted")

        # Check if records already exist
        existing = await session.execute(select(EventRecord).limit(1))
        if existing.scalar_one_or_none():
            logger.info("Records already exist, skipping")
        else:
            now = datetime.now()
            records = [
                # User 1, Publication 2 - Carabidae
                EventRecord(
                    id=uuid4(),
                    user_id=dev_tg_id,
                    publ_id=2,
                    type="rec_ok",
                    family="Carabidae",
                    genus="Carabus",
                    species="violaceus",
                    latitude="56.83",
                    longitude="60.61",
                    country="RU",
                    region="Свердловская обл.",
                    district="г. Екатеринбург",
                    locality="лесопарк УУПИ",
                    is_manual_location=False,
                    habitat="Смешанный лес, под корой",
                    verbatim_date="2023-05-15",
                    date_precision="day",
                    is_interval=False,
                    quantity=3.0,
                    quantity_type="individuals",
                    sex="2 male | 1 female",
                    life_stage="3 adult",
                    occurrence_remarks="Собран под корой сосны",
                    created_at=now,
                    updated_at=now,
                ),
                # User 1, Publication 2 - Coccinellidae
                EventRecord(
                    id=uuid4(),
                    user_id=dev_tg_id,
                    publ_id=2,
                    type="rec_ok",
                    family="Coccinellidae",
                    genus="Coccinella",
                    species="septempunctata",
                    latitude="55.45",
                    longitude="65.34",
                    country="RU",
                    region="Челябинская обл.",
                    district="г. Челябинск",
                    locality="парк Гагарина",
                    is_manual_location=False,
                    habitat="Городской парк, лиственные деревья",
                    verbatim_date="2023-06-20",
                    date_precision="day",
                    is_interval=False,
                    quantity=5.0,
                    quantity_type="individuals",
                    sex=None,
                    life_stage="5 adult",
                    occurrence_remarks="На липе",
                    created_at=now,
                    updated_at=now,
                ),
                # User 1, Publication 2 - Silphidae
                EventRecord(
                    id=uuid4(),
                    user_id=dev_tg_id,
                    publ_id=2,
                    type="rec_ok",
                    family="Silphidae",
                    genus="Necrodes",
                    species="littoralis",
                    latitude="58.12",
                    longitude="59.34",
                    country="RU",
                    region="Пермский край",
                    district="г. Пермь",
                    locality="окр. г. Перми",
                    is_manual_location=False,
                    habitat="Труп животного",
                    verbatim_date="2023-07-10",
                    date_precision="day",
                    is_interval=False,
                    quantity=3.0,
                    quantity_type="individuals",
                    sex="1 adult male | 1 adult female | 1 juvenile male",
                    life_stage="2 adult | 1 juvenile",
                    occurrence_remarks="На падали",
                    created_at=now,
                    updated_at=now,
                ),
                # User 1, Publication 2 - Staphylinidae
                EventRecord(
                    id=uuid4(),
                    user_id=dev_tg_id,
                    publ_id=2,
                    type="rec_ok",
                    family="Staphylinidae",
                    genus="Staphylinus",
                    species="caesareus",
                    latitude="56.50",
                    longitude="61.12",
                    country="RU",
                    region="Свердловская обл.",
                    district="г. Нижний Тагил",
                    locality="окр. Нижнего Тагила",
                    is_manual_location=False,
                    habitat="Лиственный лес, под камнями",
                    verbatim_date="2023-08-05",
                    date_precision="day",
                    is_interval=False,
                    quantity=3.0,
                    quantity_type="individuals",
                    sex="3 female",
                    life_stage="3 adult",
                    occurrence_remarks="Под камнями у ручья",
                    created_at=now,
                    updated_at=now,
                ),
                # User 1, Publication 2 - Cerambycidae
                EventRecord(
                    id=uuid4(),
                    user_id=dev_tg_id,
                    publ_id=2,
                    type="rec_ok",
                    family="Cerambycidae",
                    genus="Monochamus",
                    species="galloprovincialis",
                    latitude="57.23",
                    longitude="58.89",
                    country="RU",
                    region="Свердловская обл.",
                    district="Пригородный р-н",
                    locality="вблизи пос. Изоплит",
                    is_manual_location=False,
                    habitat="Сосновый лес, на стволах",
                    verbatim_date="2023-09-12",
                    date_precision="day",
                    is_interval=False,
                    quantity=2.0,
                    quantity_type="individuals",
                    sex=None,
                    life_stage="2 adult",
                    occurrence_remarks="На свежеспиленных соснах",
                    created_at=now,
                    updated_at=now,
                ),
                # User 2, Publication 1 - Lycosidae
                EventRecord(
                    id=uuid4(),
                    user_id=1,
                    publ_id=1,
                    type="rec_ok",
                    family="Lycosidae",
                    genus="Lycosa",
                    species="singoriensis",
                    latitude="55.75",
                    longitude="37.61",
                    country="RU",
                    region="Московская обл.",
                    district="г. Москва",
                    locality="Измайловский парк",
                    is_manual_location=False,
                    habitat="Травянистые биотопы",
                    verbatim_date="2023-06-18",
                    date_precision="day",
                    is_interval=False,
                    quantity=1.0,
                    quantity_type="individuals",
                    sex="1 female",
                    life_stage="1 adult",
                    occurrence_remarks="В траве",
                    created_at=now,
                    updated_at=now,
                ),
                # User 2, Publication 1 - Salticidae
                EventRecord(
                    id=uuid4(),
                    user_id=1,
                    publ_id=1,
                    type="rec_ok",
                    family="Salticidae",
                    genus="Salticus",
                    species="scenicus",
                    latitude="55.76",
                    longitude="37.62",
                    country="RU",
                    region="Московская обл.",
                    district="г. Москва",
                    locality="Коломенское",
                    is_manual_location=False,
                    habitat="Стены зданий, заборы",
                    verbatim_date="2023-07-25",
                    date_precision="day",
                    is_interval=False,
                    quantity=4.0,
                    quantity_type="individuals",
                    sex=None,
                    life_stage="4 adult",
                    occurrence_remarks="На каменной кладке",
                    created_at=now,
                    updated_at=now,
                ),
                # User 1, Publication 2 - Scarabaeidae (failed record)
                EventRecord(
                    id=uuid4(),
                    user_id=dev_tg_id,
                    publ_id=2,
                    type="rec_fail",
                    family="Scarabaeidae",
                    genus="Cetonia",
                    species="aurata",
                    latitude="56.90",
                    longitude="60.70",
                    country="RU",
                    region="Свердловская обл.",
                    district="г. Екатеринбург",
                    locality="Шарташ",
                    is_manual_location=False,
                    habitat="Луг, цветы",
                    verbatim_date="2023-10-05",
                    date_precision="day",
                    is_interval=False,
                    quantity=1.0,
                    quantity_type="individuals",
                    sex=None,
                    life_stage="1 adult",
                    occurrence_remarks="На цветах бодяка",
                    created_at=now,
                    updated_at=now,
                ),
                # User 2, Publication 1 - Thomisidae
                EventRecord(
                    id=uuid4(),
                    user_id=1,
                    publ_id=1,
                    type="rec_ok",
                    family="Thomisidae",
                    genus="Xysticus",
                    species="kochi",
                    latitude="55.70",
                    longitude="37.58",
                    country="RU",
                    region="Московская обл.",
                    district="г. Москва",
                    locality="Битцевский лес",
                    is_manual_location=False,
                    habitat="Кустарники, травянистые растения",
                    verbatim_date="2023-08-30",
                    date_precision="day",
                    is_interval=False,
                    quantity=2.0,
                    quantity_type="individuals",
                    sex="2 male",
                    life_stage="2 adult",
                    occurrence_remarks="На кустах шиповника",
                    created_at=now,
                    updated_at=now,
                ),
                # User 1, Publication 2 - Geotrupidae
                EventRecord(
                    id=uuid4(),
                    user_id=dev_tg_id,
                    publ_id=2,
                    type="rec_ok",
                    family="Geotrupidae",
                    genus="Geotrupes",
                    species="stercorarius",
                    latitude="57.50",
                    longitude="59.80",
                    country="RU",
                    region="Свердловская обл.",
                    district="Асбестовский р-н",
                    locality="окр. г. Асбест",
                    is_manual_location=False,
                    habitat="Пастбище, навоз",
                    verbatim_date="2023-09-28",
                    date_precision="day",
                    is_interval=False,
                    quantity=6.0,
                    quantity_type="individuals",
                    sex=None,
                    life_stage="6 adult",
                    created_at=now,
                    updated_at=now,
                ),
            ]

            session.add_all(records)
            logger.info(f"Inserted {len(records)} event records")

        await session.commit()
        logger.info("Seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
