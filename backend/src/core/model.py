from datetime import datetime as datetime_type
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    REAL,
    BigInteger,
    Boolean,
    Double,
    ForeignKey,
    Identity,
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
    tlg_name: Mapped[str | None] = mapped_column(String(255))
    tlg_username: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str | None] = mapped_column(String(255))
    reg_stat: Mapped[UserState] = mapped_column(
        UserStateType,
        default=UserState.DATA_CLEARED,
        server_default="0",
    )
    hash: Mapped[str | None] = mapped_column(String(255))
    hash_date: Mapped[datetime_type | None] = mapped_column(TIMESTAMP)
    items: Mapped[str] = mapped_column(Text, server_default="")
    age: Mapped[int | None] = mapped_column(Integer)
    lng: Mapped[str | None] = mapped_column(String)
    comm: Mapped[str | None] = mapped_column(String)
    reg_run: Mapped[datetime_type | None] = mapped_column(
        TIMESTAMP, server_default=func.now()
    )
    reg_end: Mapped[datetime_type | None] = mapped_column(TIMESTAMP)
    sex: Mapped[str | None] = mapped_column(String(3))
    rating: Mapped[int | None] = mapped_column(Integer)
    email: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Publication(Base):
    __tablename__ = "publs"

    publ_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[str | None] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column(Text)
    year: Mapped[int | None] = mapped_column(Integer)
    name: Mapped[str | None] = mapped_column(Text)
    external: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(Text)
    ural: Mapped[int | None] = mapped_column(Integer)
    pdf_file: Mapped[str | None] = mapped_column(Text)
    bib_file: Mapped[str | None] = mapped_column(Text)
    arj_file: Mapped[str | None] = mapped_column(Text)
    resume: Mapped[str | None] = mapped_column(Text)
    # TODO: change type to bool in migration
    coords: Mapped[int | None] = mapped_column(Integer)
    cover: Mapped[int | None] = mapped_column(Integer, server_default="0")
    occs: Mapped[int | None] = mapped_column(Integer)
    spec: Mapped[int | None] = mapped_column(Integer)
    e_author: Mapped[str | None] = mapped_column(Text)
    e_name: Mapped[str | None] = mapped_column(Text)


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        server_default=Identity(),
    )
    user_id: Mapped[int] = mapped_column(BigInteger)
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
        Integer, ForeignKey("publs.publ_id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.user_id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime_type] = mapped_column(
        "datetime", TIMESTAMP(precision=6), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime_type] = mapped_column(
        TIMESTAMP(precision=6),
        server_default=func.now(),
        nullable=False,
    )
    ip: Mapped[str | None] = mapped_column(Text)
    errors: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str | None] = mapped_column(Text)

    country: Mapped[str | None] = mapped_column("countrycode", Text)
    region: Mapped[str | None] = mapped_column("stateprovince", Text)
    district: Mapped[str | None] = mapped_column("county", Text)
    locality: Mapped[str | None] = mapped_column("verbatimlocality", Text)
    is_manual_location: Mapped[bool | None] = mapped_column("adm_verbatim", Boolean)
    latitude: Mapped[str | None] = mapped_column("decimallatitude", Text)
    longitude: Mapped[str | None] = mapped_column("decimallongitude", Text)

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


class Record(Base):
    __tablename__ = "records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    datetime: Mapped[datetime_type | None] = mapped_column(TIMESTAMP(precision=6))
    ip: Mapped[str | None] = mapped_column(Text)
    publ_id: Mapped[int | None] = mapped_column(Integer)
    type: Mapped[str | None] = mapped_column(Text)
    errors: Mapped[str | None] = mapped_column(Text)
    adm_country: Mapped[str | None] = mapped_column(Text)
    adm_region: Mapped[str | None] = mapped_column(Text)
    adm_district: Mapped[str | None] = mapped_column(Text)
    adm_loc: Mapped[str | None] = mapped_column(Text)
    geo_nn: Mapped[float | None] = mapped_column(Double)
    geo_ee: Mapped[float | None] = mapped_column(Double)
    geo_nn_raw: Mapped[str | None] = mapped_column(Text)
    geo_ee_raw: Mapped[str | None] = mapped_column(Text)
    geo_origin: Mapped[str | None] = mapped_column(Text)
    geo_REM: Mapped[str | None] = mapped_column(Text)
    eve_YY: Mapped[Decimal | None] = mapped_column(Numeric)
    eve_MM: Mapped[Decimal | None] = mapped_column(Numeric)
    eve_DD: Mapped[Decimal | None] = mapped_column(Numeric)
    eve_day_def: Mapped[bool | None] = mapped_column("eve_day.def", Boolean)
    eve_habitat: Mapped[str | None] = mapped_column(Text)
    eve_effort: Mapped[str | None] = mapped_column(Text)
    abu_coll: Mapped[str | None] = mapped_column(Text)
    eve_REM: Mapped[str | None] = mapped_column(Text)
    tax_fam: Mapped[str | None] = mapped_column(Text)
    tax_gen: Mapped[str | None] = mapped_column(Text)
    tax_sp: Mapped[str | None] = mapped_column(Text)
    tax_sp_def: Mapped[bool | None] = mapped_column("tax_sp.def", Boolean)
    tax_nsp: Mapped[bool | None] = mapped_column(Boolean)
    type_status: Mapped[str | None] = mapped_column(Text)
    tax_REM: Mapped[str | None] = mapped_column(Text)
    abu: Mapped[float | None] = mapped_column(Double)
    abu_details: Mapped[str | None] = mapped_column(Text)
    abu_ind_rem: Mapped[str | None] = mapped_column(Text)
    user_id: Mapped[int | None] = mapped_column(BigInteger)
    geo_uncert: Mapped[Decimal | None] = mapped_column(Numeric)
    eve_YY_end: Mapped[Decimal | None] = mapped_column(Numeric)
    eve_MM_end: Mapped[Decimal | None] = mapped_column(Numeric)
    eve_DD_end: Mapped[Decimal | None] = mapped_column(Numeric)
    adm_verbatim: Mapped[int | None] = mapped_column(Integer)


class Spider(Base):
    __tablename__ = "spiders"

    RECORD: Mapped[str | None] = mapped_column(String(6), server_default="RECORD")
    id: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(15), nullable=False)
    modified: Mapped[str | None] = mapped_column(String(15))
    language: Mapped[str | None] = mapped_column(String(15))
    license: Mapped[str] = mapped_column(String(15), nullable=False)
    rightsholder: Mapped[str | None] = mapped_column(Text)
    references: Mapped[str] = mapped_column(Text, nullable=False)
    bibliographiccitation: Mapped[str | None] = mapped_column(Text)
    institutionid: Mapped[str | None] = mapped_column(Text)
    institutioncode: Mapped[str | None] = mapped_column(Text)
    ownerinstitutioncode: Mapped[str | None] = mapped_column(Text)
    collectioncode: Mapped[str | None] = mapped_column(Text)
    datasetname: Mapped[str | None] = mapped_column(Text)
    basisofrecord: Mapped[str] = mapped_column(String(20), nullable=False)
    dynamicproperties: Mapped[str | None] = mapped_column(Text)
    OCCURRENCE: Mapped[str | None] = mapped_column(
        String(10), server_default="OCCURRENCE"
    )
    occurrencestatus: Mapped[str] = mapped_column(String(15), nullable=False)
    disposition: Mapped[str | None] = mapped_column(String(20))
    occurrenceid: Mapped[str] = mapped_column(Text, nullable=False)
    catalognumber: Mapped[str | None] = mapped_column(Text)
    recordedby: Mapped[str | None] = mapped_column(Text)
    individualcount: Mapped[int | None] = mapped_column(Integer)
    organismquantity: Mapped[str | None] = mapped_column(Text)
    organismquantitytype: Mapped[str | None] = mapped_column(Text)
    sex: Mapped[str | None] = mapped_column(String(100))
    lifestage: Mapped[str | None] = mapped_column(String(100))
    associatedreferences: Mapped[str | None] = mapped_column(Text)
    associatedtaxa: Mapped[str | None] = mapped_column(Text)
    establishmentmeans: Mapped[str | None] = mapped_column(String(35))
    occurrenceremarks: Mapped[str | None] = mapped_column(Text)
    EVENT: Mapped[str | None] = mapped_column(String(5), server_default="EVENT")
    eventid: Mapped[str | None] = mapped_column(String(100))
    parenteventid: Mapped[str | None] = mapped_column(String(100))
    fieldnumber: Mapped[str | None] = mapped_column(String(100))
    eventdate: Mapped[str | None] = mapped_column(String(25))
    startdayofyear: Mapped[int | None] = mapped_column(Integer)
    enddayofyear: Mapped[int | None] = mapped_column(Integer)
    year: Mapped[int | None] = mapped_column(Integer)
    month: Mapped[int | None] = mapped_column(Integer)
    day: Mapped[int | None] = mapped_column(Integer)
    verbatimeventdate: Mapped[str | None] = mapped_column(String(100))
    habitat: Mapped[str | None] = mapped_column(Text)
    samplingprotocol: Mapped[str | None] = mapped_column(Text)
    samplingeffort: Mapped[str | None] = mapped_column(Text)
    samplesizevalue: Mapped[float | None] = mapped_column(REAL)
    samplesizeunit: Mapped[str | None] = mapped_column(String(100))
    eventremarks: Mapped[str | None] = mapped_column(Text)
    LOCATION: Mapped[str | None] = mapped_column(String(10), server_default="LOCATION")
    locationid: Mapped[str | None] = mapped_column(String(100))
    highergeography: Mapped[str | None] = mapped_column(String(100))
    continent: Mapped[str | None] = mapped_column(String(30))
    country: Mapped[str | None] = mapped_column(String(30))
    countrycode: Mapped[str | None] = mapped_column(String(3))
    stateprovince: Mapped[str | None] = mapped_column(String(100))
    county: Mapped[str | None] = mapped_column(String(100))
    municipality: Mapped[str | None] = mapped_column(String(100))
    locality: Mapped[str | None] = mapped_column(Text)
    verbatimlocality: Mapped[str | None] = mapped_column(Text)
    minimumelevationinmeters: Mapped[int | None] = mapped_column(Integer)
    maximumelevationinmeters: Mapped[int | None] = mapped_column(Integer)
    decimallatitude: Mapped[float | None] = mapped_column(Double)
    decimallongitude: Mapped[float | None] = mapped_column(Double)
    geodeticdatum: Mapped[str | None] = mapped_column(String(30))
    coordinateuncertaintyinmeters: Mapped[int | None] = mapped_column(Integer)
    coordinateprecision: Mapped[float | None] = mapped_column(REAL)
    verbatimcoordinates: Mapped[str | None] = mapped_column(String(50))
    georeferencedby: Mapped[str | None] = mapped_column(String(200))
    georeferenceddate: Mapped[str | None] = mapped_column(String(10))
    locationremarks: Mapped[str | None] = mapped_column(Text)
    IDENTIFICATION: Mapped[str | None] = mapped_column(
        String(15), server_default="IDENTIFICATION"
    )
    identifiedby: Mapped[str | None] = mapped_column(String(200))
    dateidentified: Mapped[str | None] = mapped_column(String(10))
    verbatimidentification: Mapped[str | None] = mapped_column(String(100))
    identificationremarks: Mapped[str | None] = mapped_column(Text)
    TAXON: Mapped[str | None] = mapped_column(String(5), server_default="TAXON")
    taxonrank: Mapped[str | None] = mapped_column(String(10))
    scientificname: Mapped[str] = mapped_column(String(100), nullable=False)
    kingdom: Mapped[str | None] = mapped_column(String(10), server_default="Animalia")
    phylum: Mapped[str | None] = mapped_column(String(10), server_default="Arthropoda")
    class_: Mapped[str | None] = mapped_column(
        "class", String(10), server_default="Arachnida"
    )
    order: Mapped[str | None] = mapped_column(String(10))
    family: Mapped[str | None] = mapped_column(String(30))
    genus: Mapped[str | None] = mapped_column(String(30))
    specificepithet: Mapped[str | None] = mapped_column(String(50))
    scientificnameauthorship: Mapped[str | None] = mapped_column(String(100))
    canonicalname: Mapped[str | None] = mapped_column(String(100))
    acceptednameusage: Mapped[str | None] = mapped_column(String(100))
    type_status: Mapped[str | None] = mapped_column(String(30))
    taxonremarks: Mapped[str | None] = mapped_column(Text)
    REMOVE: Mapped[str | None] = mapped_column(String(6), server_default="REMOVE")
    publ_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vol_ids: Mapped[str | None] = mapped_column(Text)
    shortlink: Mapped[str] = mapped_column(String(30), primary_key=True)
    year1: Mapped[int | None] = mapped_column(Integer)
    year2: Mapped[int | None] = mapped_column(Integer)
