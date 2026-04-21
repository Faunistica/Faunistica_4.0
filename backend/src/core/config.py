from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_core import Url
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)


class DatabaseSettings(BaseSettings):
    DB_NAME: str = "faunistica"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "faunistica"
    DB_PASSWORD: SecretStr = Field(init=False)
    DB_ECHO: bool = False


class SecuritySettings(BaseSettings):
    JWT_SECRET: SecretStr = Field(init=False)
    ACCESS_TOKEN_EXPIRE: int = 30
    REFRESH_TOKEN_EXPIRE: int = 30
    ENCRYPT_SECRET: SecretStr = Field(init=False)


class BotSettings(BaseSettings):
    BOT_TOKEN: SecretStr = Field(init=False)
    BOT_PROXY: Url | None = None
    ADMIN_CHAT_ID: int = Field(init=False)


class LoggingSettings(BaseSettings):
    LOG_LEVEL: str = "INFO"
    LOGS_DIR: Path = Path("logs")


class AppSettings(BaseSettings):
    DEV_MODE: bool = False
    ALLOWED_ORIGINS: list[str] = []


class Settings(
    DatabaseSettings,
    SecuritySettings,
    BotSettings,
    LoggingSettings,
    AppSettings,
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
        return (env_settings, dotenv_settings, yaml_source)

    @property
    def ACCESS_TOKEN_EXPIRE_SECONDS(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE * 60

    @property
    def REFRESH_TOKEN_EXPIRE_SECONDS(self) -> int:
        return self.REFRESH_TOKEN_EXPIRE * 24 * 60 * 60


settings = Settings()
