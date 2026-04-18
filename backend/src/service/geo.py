import logging
import re
from typing import Any

from fastapi import HTTPException
from geopy.exc import GeocoderTimedOut
from geopy.geocoders import Nominatim

from schemas import Location

logger = logging.getLogger(__name__)


class GeoService:
    def _parse_coordinate(self, coord: str) -> float:
        coord = coord.strip()

        # 1. Degree: 59°
        if re.match(r"^(-?\d+(?:\.\d+)?)°(?!\S)$", coord):
            return round(float(coord), 6)

        # 2. Degree + minutes: 59°29'
        match_deg_min = re.match(r"^(\d{1,3})°\s*(\d{1,2})\'$", coord)
        if match_deg_min:
            degrees = int(match_deg_min.group(1))
            minutes = int(match_deg_min.group(2))
            decimal = degrees + minutes / 60
            return round(decimal, 6)

        # 3. Degree + minutes + seconds: 56°51'10"
        match_deg_min_sec = re.match(
            r'^(\d{1,3})°\s*(\d{1,2})\'\s*(\d{1,2})(?:["″])$', coord
        )
        if match_deg_min_sec:
            degrees = int(match_deg_min_sec.group(1))
            minutes = int(match_deg_min_sec.group(2))
            seconds = int(match_deg_min_sec.group(3))
            decimal = degrees + (minutes / 60) + (seconds / 3600)
            return round(decimal, 6)

        logger.warning(f"Invalid coordinate format: {coord}")
        raise ValueError(f"Invalid coordinate format: {coord}")

    def parse_coordinate(self, coord: str | None) -> float | None:
        if not coord:
            return None
        try:
            return self._parse_coordinate(coord)
        except ValueError as e:
            logger.error(f"Value error: {e}", exc_info=True)
            return None

    async def get_location_suggestions(
        self,
        location_data: list[dict[str, Any]],
        field: str,
        text: str,
        filters: dict | None = None,
    ) -> list[str]:
        if not location_data:
            return []

        text = text.lower().strip()
        filters = filters or {}

        if field == "region":
            return [r["region"] for r in location_data if text in r["region"].lower()][
                :100
            ]

        if field == "district":
            region_filter = filters.get("region")
            districts = []

            for entry in location_data:
                if region_filter and entry["region"] != region_filter:
                    continue

                districts.extend([d for d in entry["districts"] if text in d.lower()])

            return districts[:200]

        return []

    # FIXME: typing
    def get_location_names(self, lat: float, lon: float) -> Location:
        geolocator = Nominatim(user_agent="geoapi", timeout=10)

        try:
            location = geolocator.reverse((lat, lon), language="ru")

            if location is None:
                logger.warning("Location not found for the given coordinates")
                raise HTTPException(
                    status_code=404,
                    detail="Location not found for the given coordinates",
                )

            address = location.raw.get("address", {})

            country = address.get("country", None)
            region = address.get("state", address.get("region", None))
            district = address.get("county", address.get("district", None))

            return Location(country=country, region=region, district=district)
        except GeocoderTimedOut as e:
            logger.error(f"GeocoderTimedOut: {e}", exc_info=True)
            raise HTTPException(
                status_code=408, detail="Geocoding service timeout"
            ) from e
        except Exception as e:
            logger.error(f"HTTP Error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e)) from e

    def dms_to_degrees(
        self,
        degrees: float,
        minutes: float | None = None,
        seconds: float | None = None,
    ) -> float:
        minutes = minutes if minutes is not None else 0
        seconds = seconds if seconds is not None else 0
        return degrees + (minutes / 60) + (seconds / 3600)
