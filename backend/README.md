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

---

## Обязательные переменные окружения

| Переменная            | Описание                                           |
|-----------------------|----------------------------------------------------|
| `BOT_TOKEN`           | Токен Telegram-бота                                |
| `ADMIN_CHAT_ID`       | ID чата администратора                             |
| `DB_NAME`             | Имя базы данных                                    |
| `DB_HOST`             | Хост БД (или путь к Unix-сокету)                   |
| `DB_PORT`             | Порт БД                                            |
| `DB_USER`             | Пользователь БД                                    |
| `DB_PASSWORD`         | Пароль БД                                          |
| `JWT_SECRET`          | Секрет для JWT (мин. 32 символа)                   |
| `ENCRYPT_SECRET`      | Секрет для шифрования                              |

## Опциональные переменные

| Переменная                  | По умолчанию  | Описание                              |
|-----------------------------|---------------|---------------------------------------|
| `BOT_PROXY`                 | (нет)         | SOCKS5/HTTP прокси для бота           |
| `DEV_TG_ID`                 | (нет)         | ID разработчика в Telegram            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30          | Время жизни access-токена             |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | 30          | Время жизни refresh-токена            |
| `LOG_LEVEL`                 | WARNING       | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `DB_ECHO`                   | false         | Логировать SQL-запросы                |

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
