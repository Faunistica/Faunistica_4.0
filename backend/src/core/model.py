from datetime import datetime as datetime_type
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    Double,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from core.enums import UserState, UserStateType


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    publ_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("publs.id", ondelete="CASCADE")
    )
    tlg_name: Mapped[str | None] = mapped_column(String(255))
    tlg_username: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str | None] = mapped_column(String(255))
    reg_stat: Mapped[UserState] = mapped_column(
        UserStateType, default=UserState.DATA_CLEARED
    )
    hash: Mapped[str | None] = mapped_column(String(255))
    hash_date: Mapped[datetime_type | None] = mapped_column(TIMESTAMP)
    items: Mapped[str] = mapped_column(Text, default="")
    age: Mapped[int | None] = mapped_column(Integer)
    lng: Mapped[str | None] = mapped_column(String)
    comm: Mapped[str | None] = mapped_column(Text)
    reg_run: Mapped[datetime_type] = mapped_column(TIMESTAMP, server_default=func.now())
    reg_end: Mapped[datetime_type | None] = mapped_column(TIMESTAMP)
    sex: Mapped[str | None] = mapped_column(String(3))
    rating: Mapped[int | None] = mapped_column(Integer)
    email: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)


class Publication(Base):
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
        BigInteger, ForeignKey("users.user_id", ondelete="CASCADE")
    )
    user_ip: Mapped[str | None] = mapped_column(Text)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    object: Mapped[str | None] = mapped_column(Text)
    datetime: Mapped[datetime_type] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now()
    )


class EventRecord(Base):
    __tablename__ = "event_records"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    publ_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("publs.id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.user_id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime_type] = mapped_column(
        TIMESTAMP(precision=6), server_default=func.now()
    )
    updated_at: Mapped[datetime_type | None] = mapped_column(
        TIMESTAMP(precision=6), server_default=func.now(), server_onupdate=func.now()
    )
    ip: Mapped[str | None] = mapped_column(Text)
    errors: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str | None] = mapped_column(Text)

    country: Mapped[str | None] = mapped_column("countrycode", Text)
    region: Mapped[str | None] = mapped_column("stateprovince", Text)
    district: Mapped[str | None] = mapped_column("county", Text)
    locality: Mapped[str | None] = mapped_column("verbatimlocality", Text)
    is_manual_location: Mapped[bool | None] = mapped_column("adm_verbatim", Boolean)
    latitude: Mapped[float | None] = mapped_column("decimallatitude", Double)
    longitude: Mapped[float | None] = mapped_column("decimallongitude", Double)

    verbatimcoordinates: Mapped[str | None] = mapped_column("verbatimcoordinates", Text)
    coordinate_uncertainty: Mapped[float | None] = mapped_column(
        "coordinateuncertaintyinmeters", Numeric
    )

    georef_source: Mapped[str | None] = mapped_column("georeferencedby", Text)
    location_remarks: Mapped[str | None] = mapped_column("locationremarks", Text)

    verbatim_date: Mapped[str | None] = mapped_column("verbatimeventdate", Text)
    date_precision: Mapped[str | None] = mapped_column("dttm_precision", Text)
    is_interval: Mapped[bool | None] = mapped_column("dttm_interval", Boolean)

    habitat: Mapped[str | None] = mapped_column(Text)
    sampling_protocol: Mapped[str | None] = mapped_column("samplingprotocol", Text)
    sampling_effort: Mapped[str | None] = mapped_column("samplingeffort", Text)
    sample_size_value: Mapped[float | None] = mapped_column("samplesizevalue", Double)
    sample_size_unit: Mapped[str | None] = mapped_column("samplesizeunit", Text)
    event_remarks: Mapped[str | None] = mapped_column("eventremarks", Text)
    field_number: Mapped[str | None] = mapped_column("fieldnumber", Text)
    catalog_number: Mapped[str | None] = mapped_column("catalognumber", Text)
    collection_code: Mapped[str | None] = mapped_column("collectioncode", Text)
    recorded_by: Mapped[str | None] = mapped_column("recordedby", Text)

    family: Mapped[str | None] = mapped_column(Text)
    genus: Mapped[str | None] = mapped_column(Text)
    species: Mapped[str | None] = mapped_column("specificepithet", Text)
    tax_verbatim: Mapped[bool | None] = mapped_column(Boolean)
    taxon_rank: Mapped[str | None] = mapped_column("taxonrank", Text)
    type_status: Mapped[str | None] = mapped_column(Text)
    accepted_name: Mapped[str | None] = mapped_column("acceptednameusage", Text)
    taxon_remarks: Mapped[str | None] = mapped_column("taxonremarks", Text)

    quantity: Mapped[float | None] = mapped_column("organismquantity", Double)
    quantity_type: Mapped[str | None] = mapped_column("organismquantitytype", Text)
    sex: Mapped[str | None] = mapped_column(Text)
    life_stage: Mapped[str | None] = mapped_column("lifestage", Text)
    occurrence_remarks: Mapped[str | None] = mapped_column("occurrenceremarks", Text)
    identification_remarks: Mapped[str | None] = mapped_column(
        "identificationremarks", Text
    )
