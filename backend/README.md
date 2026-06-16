# Бэкенд Faunistica

## Система конфигурации

Настройки загружаются из нескольких источников.
Приоритет (от высшего к низшему):

1. **Init-аргументы** (передача параметров в конструктор `Settings()` — редко используется)
2. **Переменные окружения** (`export DB_HOST=...`)
3. **Файл `.env`** — читается из корня `backend/`
4. **Docker secrets** — файлы из `/run/secrets/<ИМЯ_ПЕРЕМЕННОЙ>`
5. **`config.yaml`** — читается из корня `backend/`

Источник с более высоким приоритетом перекрывает значения из нижестоящих.

### Docker secrets

Для production можно не использовать `.env`, а положить секреты в Docker Swarm
или просто смонтировать файлы в `/run/secrets/`:

```yaml
# docker-compose.yml
services:
  backend:
    image: ghcr.io/faunistica/backend:latest
    secrets:
      - db_password
      - jwt_secret
      - bot_token

secrets:
  db_password:
    file: ./secrets/DB_PASSWORD
  jwt_secret:
    file: ./secrets/JWT_SECRET
  bot_token:
    file: ./secrets/BOT_TOKEN
```

Имя файла должно совпадать с именем переменной (например, `/run/secrets/DB_PASSWORD`).
Подробнее: [документация pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/#use-case-docker-secrets).

### Пример production-конфига

Готовый `config.yaml` и `.env.example` для production лежат в [examples/](../examples/).

### Генерация секретов

```bash
# JWT_SECRET (64 символа в hex-формате)
python -c "import secrets; print(secrets.token_hex(32))"

# Альтернатива через openssl
openssl rand -hex 32
```

---

## Все переменные окружения

### Обязательные (без них приложение не запустится)

| Переменная      | Тип       | Описание                              |
|-----------------|-----------|---------------------------------------|
| `BOT_TOKEN`     | SecretStr | Токен Telegram-бота                   |
| `ADMIN_CHAT_ID` | int       | ID чата администраторов техподдержки  |
| `JWT_SECRET`    | SecretStr | Секрет для подписи JWT (мин. 32 символа, кроме DEV_MODE=true) |
| `DB_PASSWORD`   | SecretStr | Пароль пользователя PostgreSQL        |

### База данных

| Переменная | Тип    | По умолчанию | Описание                            |
|------------|--------|--------------|-------------------------------------|
| `DB_NAME`  | str    | faunistica   | Название базы данных                |
| `DB_HOST`  | str    | localhost    | Хост БД (или путь к Unix-сокету)    |
| `DB_PORT`  | int    | 5432         | Порт БД                             |
| `DB_USER`  | str    | faunistica   | Пользователь БД                      |
| `DB_ECHO`  | bool   | false        | Логировать SQL-запросы              |

### Безопасность

| Переменная                  | Тип | По умолчанию | Описание                              |
|-----------------------------|-----|--------------|---------------------------------------|
| `JWT_SECRET`                | SecretStr | — (обязательно) | Секрет для подписи JWT            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | int | 30         | Время жизни access-токена (минут)     |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | int | 30         | Время жизни refresh-токена (дней)     |
| `PASSWORD_EXPIRE_MINUTES`   | int | 1440         | Время жизни одноразового пароля (минут) |

### Telegram-бот

| Переменная      | Тип        | По умолчанию | Описание                              |
|-----------------|------------|--------------|---------------------------------------|
| `BOT_TOKEN`     | SecretStr  | — (обязательно) | Токен Telegram-бота                |
| `BOT_PROXY`     | Url\|None  | нет          | Прокси: socks5://user:pass@host:port или http://host:port |
| `ADMIN_CHAT_ID` | int        | — (обязательно) | ID чата администраторов            |
| `ADMIN_USER_IDS` | list[int] | [911269241, 412819044, 950994899] | ID администраторов в Telegram |
| `BOT_USERNAME`  | str\|None  | нет          | Имя пользователя бота (без @)         |
| `BOT_ENABLED`   | bool       | true         | Включить бота (false — для smoke-тестов) |

### Логирование

| Переменная   | Тип  | По умолчанию | Описание                              |
|--------------|------|--------------|---------------------------------------|
| `LOG_LEVEL`  | str  | INFO         | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `LOGS_DIR`   | Path | logs         | Директория для файлов логов           |
| `LOG_FORMAT` | str  | (см. код)    | Формат логов (строка форматирования)  |

### Приложение

| Переменная                    | Тип      | По умолчанию | Описание                                |
|-------------------------------|----------|--------------|-----------------------------------------|
| `DEV_MODE`                    | bool     | false        | Режим разработки (отключает проверки)   |
| `SITE_URL`                    | str      | https://faunistica.ru | URL сайта                         |
| `GLOBAL_RATE_LIMIT`           | str      | 100/minute   | Глобальный лимит запросов               |
| `ALLOWED_ORIGINS`             | list[str] | []          | Разрешённые CORS-источники              |
| `MAX_IMPORT_FILE_BYTES`       | int      | 5242880 (5MB) | Максимальный размер импортируемого файла |
| `MAX_USER_RECORDS_PER_PUBLICATION` | int | 1000       | Максимум записей на публикацию          |
| `INTERACTABLE_QUEUE_COUNT`    | int      | 1           | Количество очередей взаимодействия      |
| `PUBLICATION_FILES_BASE_URL`  | str      | (см. код)   | Базовый URL файлов публикаций           |

### Данные

| Переменная           | Тип  | По умолчанию               | Описание                      |
|----------------------|------|----------------------------|-------------------------------|
| `SPECIES_CSV_PATH`   | Path | data/species_export.csv    | Справочник видов              |
| `LOCATIONS_JSON_PATH` | Path | data/locations.json       | Координаты локаций            |
| `SHORT_COUNTRIES_PATH` | Path | data/short_countries.txt | Список сокращений стран       |
| `URAL_BORDER_PATH`   | Path | data/ural_border.geojson   | Граница Урала для фильтрации  |

### Telegram-авторизация

| Переменная                                 | Тип | По умолчанию | Описание                          |
|--------------------------------------------|-----|--------------|-----------------------------------|
| `TG_TOKEN_EXPIRE_SECONDS`                  | int | 3600 (60 мин) | Время жизни токена авторизации   |
| `TG_CODE_EXPIRE_SECONDS`                   | int | 900 (15 мин)  | Время жизни кода авторизации     |
| `TG_AUTH_POLL_INTERVAL_SECONDS`            | int | 1            | Интервал опроса статуса           |
| `TG_AUTH_POLL_TIMEOUT_SECONDS`             | int | 25           | Таймаут опроса                    |
| `REGISTRATION_PENDING_CLEANUP_INTERVAL_SECONDS` | int | 600 (10 мин) | Интервал очистки зависших регистраций |
| `REGISTRATION_PENDING_CONFIRMED_BACKLOG_SECONDS` | int | 300 (5 мин) | Задержка перед очисткой подтверждённых |
| `SURVEY_FILLING_INTERVAL_SECONDS`          | int | 1800 (30 мин) | Интервал заполнения анкеты       |

### Стартовые публикации

| Переменная                      | Тип       | По умолчанию | Описание                          |
|---------------------------------|-----------|--------------|-----------------------------------|
| `STARTED_PUBLICATION_IDS_ENG`   | list[int] | [3378, 3411] | ID начатых английских публикаций  |
| `STARTED_PUBLICATION_IDS_RUS`   | list[int] | [815, 2739, 5287] | ID начатых русских публикаций |
| `STARTED_PUBLICATION_AMOUNT_ENG` | int      | 2            | Кол-во начатых английских         |
| `STARTED_PUBLICATION_AMOUNT_RUS` | int      | 2            | Кол-во начатых русских            |
| `STARTED_PUBLICATION_AMOUNT_ALL` | int      | 2            | Кол-во начатых всего              |

### PgAdmin

Визуальный менеджер PostgreSQL. По умолчанию **не запускается** — добавлен профиль `tools`.

```bash
# Запустить БД + PgAdmin:
docker compose --profile tools up -d

# Или запустить PgAdmin после того, как БД уже работает:
docker compose --profile tools up -d pgadmin

# Открыть: http://localhost:8080
# Логин/пароль: PGADMIN_DEFAULT_EMAIL / PGADMIN_DEFAULT_PASSWORD из .env
```

При первом входе подключитесь к серверу:
- **Host**: `db` (в Docker-сети)
- **Port**: `5432`
- **Username**: значение `DB_USER`
- **Password**: значение `DB_PASSWORD`

---

## Директория `/data`

При старте бэкенд ожидает в `/app/data/` следующие файлы:

| Файл                    | Назначение                                        |
|-------------------------|---------------------------------------------------|
| `species_export.csv`    | Справочник видов (дамп из GBIF / WoRMS)           |
| `locations.json`        | Координаты локаций                                |
| `short_countries.txt`   | Список сокращений стран                           |
| `ural_border.geojson`   | Граница Урала для фильтрации географических данных |

Все эти файлы **вшиты в Docker-образ** (лежат в `backend/data/`).
Чтобы переопределить любой из них, смонтируйте свой том:

```yaml
volumes:
  - ./custom_data:/app/data:ro
```

---

## Разработка

### Требования

- Python 3.13+
- [uv](https://github.com/astral-sh/uv)
- [Docker](https://docs.docker.com/engine/install) + [Docker Compose](https://docs.docker.com/compose)
- make (опционально)

### Локальный запуск

```bash
cd backend
cp .env.example .env
# отредактировать .env (BOT_TOKEN, ADMIN_CHAT_ID, JWT_SECRET и др.)

# Запустить PostgreSQL
docker compose up -d

# Установить зависимости и запустить сервер
make run
# или вручную: uv sync && uv run fastapi dev src/app.py --port 8000
```

Сервер будет доступен на `http://localhost:8000`.

### Тестовые данные

```bash
./init.sh
```

Скрипт создаёт пользователя `DEV_USERNAME` с паролем `password`.

### Переменная VITE_API_URL

Для локальной разработки фронтенд обращается к бэкенду через
`VITE_API_URL=http://localhost:8000/api` (см. `frontend/.env.example`).
Порт 8000 — значение по умолчанию для `fastapi dev`.

### Проверка кода

```bash
make lint
make format
make test
```

Отдельные команды описаны в [Makefile](Makefile).
