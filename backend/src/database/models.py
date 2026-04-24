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
    __tablename__ = "records"

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

    country: Mapped[str | None] = mapped_column("countrycode", Text)
    region: Mapped[str | None] = mapped_column("stateprovince", Text)
    district: Mapped[str | None] = mapped_column("county", Text)
    locality: Mapped[str | None] = mapped_column("verbatimlocality", Text)
    is_manual_location: Mapped[bool | None] = mapped_column("adm_verbatim", Boolean)
    latitude: Mapped[float | None] = mapped_column("decimallatitude", Double)
    longitude: Mapped[float | None] = mapped_column("decimallongitude", Double)
    uncertainty: Mapped[float | None] = mapped_column(
        "coordinateuncertaintyinmeters", Double
    )

    verbatimlatitude: Mapped[str | None] = mapped_column(String(255))
    verbatimlongitude: Mapped[str | None] = mapped_column(String(255))

    georef_source: Mapped[str | None] = mapped_column("georeferencedby", Text)
    location_remarks: Mapped[str | None] = mapped_column("locationremarks", Text)

    year: Mapped[int | None] = mapped_column("eve_YY", Integer)
    month: Mapped[int | None] = mapped_column("eve_MM", Integer)
    day: Mapped[int | None] = mapped_column("eve_DD", Integer)
    day_defined: Mapped[bool | None] = mapped_column("day_defined", Boolean)
    year_end: Mapped[int | None] = mapped_column("eve_YY_end", Integer)
    month_end: Mapped[int | None] = mapped_column("eve_MM_end", Integer)
    day_end: Mapped[int | None] = mapped_column("eve_DD_end", Integer)

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
    taxon_rank: Mapped[bool | None] = mapped_column("taxonrank", Boolean)
    is_new_species: Mapped[bool | None] = mapped_column("tax_nsp", Boolean)
    type_status: Mapped[str | None] = mapped_column(Text)
    accepted_name: Mapped[str | None] = mapped_column("acceptednameusage", Text)
    taxon_remarks: Mapped[str | None] = mapped_column("taxonremarks", Text)

    quantity: Mapped[int | None] = mapped_column("organismquantity", Integer)
    quantity_type: Mapped[str | None] = mapped_column("organismquantitytype", Text)
    sex: Mapped[str | None] = mapped_column(Text)
    life_stage: Mapped[str | None] = mapped_column("lifestage", Text)
    occurrence_remarks: Mapped[str | None] = mapped_column("occurrenceremarks", Text)
    identification_remarks: Mapped[str | None] = mapped_column(
        "identificationremarks", Text
    )

    abu_details: Mapped[str | None] = mapped_column(Text)
    abu_ind_rem: Mapped[str | None] = mapped_column(Text)
