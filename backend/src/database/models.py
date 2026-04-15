from datetime import datetime

from sqlalchemy import (
    TIMESTAMP,
    BigInteger,
    Boolean,
    Double,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    publ_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("publs.id", ondelete="CASCADE")
    )
    tlg_name: Mapped[str | None] = mapped_column(String(255))
    tlg_username: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    reg_stat: Mapped[int | None] = mapped_column(Integer)
    hash: Mapped[str | None] = mapped_column(String(255))
    hash_date: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    items: Mapped[str] = mapped_column(Text)
    age: Mapped[int | None] = mapped_column(Integer)
    lng: Mapped[str | None] = mapped_column(String)
    comm: Mapped[str | None] = mapped_column(Text)
    reg_run: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    reg_end: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    sex: Mapped[str | None] = mapped_column(String(3))
    rating: Mapped[int | None] = mapped_column(Integer)
    email: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)


class Publ(Base):
    __tablename__ = "publs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[str | None] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column(Text)
    year: Mapped[int | None] = mapped_column(Integer)
    name: Mapped[str | None] = mapped_column(Text)
    external: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(Text)
    resume: Mapped[str | None] = mapped_column(Text)
    ural: Mapped[bool | None] = mapped_column(Boolean)
    coords: Mapped[bool | None] = mapped_column(Boolean)
    occs: Mapped[bool | None] = mapped_column(Boolean)
    spec: Mapped[bool | None] = mapped_column(Boolean)
    pdf_file: Mapped[str | None] = mapped_column(Text)


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE")
    )
    action: Mapped[str | None] = mapped_column(Text)
    object: Mapped[str | None] = mapped_column(Text)
    datetime: Mapped[datetime | None] = mapped_column(TIMESTAMP)


class Record(Base):
    __tablename__ = "spiders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    publ_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("publs.id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE")
    )
    datetime: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    ip: Mapped[str | None] = mapped_column(Text)
    errors: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str | None] = mapped_column(Text)
    adm_country: Mapped[str | None] = mapped_column(Text)
    adm_region: Mapped[str | None] = mapped_column(Text)
    adm_district: Mapped[str | None] = mapped_column(Text)
    adm_loc: Mapped[str | None] = mapped_column(Text)
    geo_nn: Mapped[float | None] = mapped_column(Double)
    geo_ee: Mapped[float | None] = mapped_column(Double)
    geo_nn_raw: Mapped[str | None] = mapped_column(String(255))
    geo_ee_raw: Mapped[str | None] = mapped_column(String(255))
    geo_origin: Mapped[str | None] = mapped_column(Text)
    geo_REM: Mapped[str | None] = mapped_column(Text)
    eve_YY: Mapped[int | None] = mapped_column(Integer)
    eve_MM: Mapped[int | None] = mapped_column(Integer)
    eve_DD: Mapped[int | None] = mapped_column(Integer)
    eve_day_def: Mapped[bool | None] = mapped_column(Boolean)
    eve_habitat: Mapped[str | None] = mapped_column(Text)
    eve_effort: Mapped[str | None] = mapped_column(Text)
    abu_coll: Mapped[str | None] = mapped_column(Text)
    eve_REM: Mapped[str | None] = mapped_column(Text)
    tax_fam: Mapped[str | None] = mapped_column(Text)
    tax_gen: Mapped[str | None] = mapped_column(Text)
    tax_sp: Mapped[str | None] = mapped_column(Text)
    tax_sp_def: Mapped[bool | None] = mapped_column(Boolean)
    tax_nsp: Mapped[bool | None] = mapped_column(Boolean)
    type_status: Mapped[str | None] = mapped_column(Text)
    tax_REM: Mapped[str | None] = mapped_column(Text)
    abu: Mapped[int | None] = mapped_column(Integer)
    abu_details: Mapped[str | None] = mapped_column(Text)
    abu_ind_rem: Mapped[str | None] = mapped_column(Text)
    geo_uncert: Mapped[float | None] = mapped_column(Double)
    eve_YY_end: Mapped[int | None] = mapped_column(Integer)
    eve_MM_end: Mapped[int | None] = mapped_column(Integer)
    eve_DD_end: Mapped[int | None] = mapped_column(Integer)
    adm_verbatim: Mapped[str | None] = mapped_column(Text)
