from pathlib import Path

from pydantic import ConfigDict, Field, SecretStr
from pydantic_core import Url
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)


def to_camel_case(string: str) -> str:
    components = string.split("_")
    return "".join(c.title() for c in components)


# THX: https://github.com/lsst-sqre/safir/blob/main/src/safir/pydantic/_camel.py
class CamelCaseSettings(BaseSettings):
    model_config = ConfigDict(alias_generator=to_camel_case, populate_by_name=True)


class DatabaseSettings(CamelCaseSettings):
    DB_NAME: str = "faunistica"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "faunistica"
    DB_PASSWORD: SecretStr = Field(init=False)
    DB_ECHO: bool = False


class SecuritySettings(CamelCaseSettings):
    JWT_SECRET: SecretStr = Field(init=False)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30


class BotSettings(CamelCaseSettings):
    BOT_TOKEN: SecretStr = Field(init=False)
    BOT_PROXY: Url | None = None
    ADMIN_CHAT_ID: int = Field(init=False)


class LoggingSettings(CamelCaseSettings):
    LOG_LEVEL: str = "INFO"
    LOGS_DIR: Path = Path("logs")


class AppSettings(CamelCaseSettings):
    DEV_MODE: bool = False
    ALLOWED_ORIGINS: list[str] = []


class DataSettings(CamelCaseSettings):
    SPECIES_CSV_PATH: Path = Path("data/species_export.csv")
    LOCATIONS_JSON_PATH: Path = Path("data/locations.json")


class Settings(
    DatabaseSettings,
    SecuritySettings,
    BotSettings,
    LoggingSettings,
    AppSettings,
    DataSettings,
):
    model_config = SettingsConfigDict(
        yaml_file=Path("config.yaml"),
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        yaml_source = YamlConfigSettingsSource(settings_cls)
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            file_secret_settings,
            yaml_source,
        )

    @property
    def ACCESS_TOKEN_EXPIRE_SECONDS(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    @property
    def REFRESH_TOKEN_EXPIRE_SECONDS(self) -> int:
        return self.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


settings = Settings()
