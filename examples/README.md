# Примеры Docker-развёртывания Faunistica

> ⚠️ **Перед использованием** образы должны быть собраны и опубликованы в registry
> (см. `ghcr.io/faunistica/backend` и `ghcr.io/faunistica/frontend`).
> Либо соберите локально: `docker build -t ghcr.io/faunistica/backend backend/` ([Docker](https://docs.docker.com)).

## Варианты

### [all-docker](./all-docker/) — всё в Docker
PostgreSQL, бэкенд и фронтенд — каждый в своём контейнере. \
Отдельный [nginx](https://nginx.org)-контейнер **не обязателен**: фронтенд-контейнер сам проксирует
`/api/*` на бэкенд

```
postgres → backend:5001 → frontend:80 (статический SPA + /api/ → backend)
```

```bash
mkdir faunistica && cd faunistica
curl -o .env https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/.env.example
curl -o config.yaml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/config.yaml
curl -o compose.yml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/all-docker/compose.yml
# curl можно заменить на wget -O <file> <url>
```

Отредактируйте `.env`: укажите `BOT_TOKEN`, `ADMIN_CHAT_ID`, `JWT_SECRET`.

```bash
docker compose up -d
```

### [hybrid](./hybrid/) — Docker + хост
Бэкенд и фронтенд в Docker, PostgreSQL и nginx работают напрямую на хосте. \
Хост-nginx **опционален** — фронтенд доступен на `http://localhost:8080`, бэкенд на `http://localhost:5001/docs`.

```bash
mkdir faunistica && cd faunistica
curl -o .env https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/.env.example
curl -o config.yaml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/config.yaml
curl -o compose.yml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/hybrid/compose.yml
curl -o faunistica.conf https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/hybrid/nginx/faunistica.conf
# curl можно заменить на wget -O <file> <url>
```

Отредактируйте `.env`: укажите `BOT_TOKEN`, `ADMIN_CHAT_ID`, `JWT_SECRET`, `DB_HOST=/var/run/postgresql`.

```bash
docker compose up -d
```

(опционально) хост nginx: `sudo cp faunistica.conf /etc/nginx/sites-available/`

---

## Настройка nginx

### all-docker: фронтенд-контейнер как reverse proxy

Образ фронтенда (`ghcr.io/faunistica/frontend`) содержит полноценный nginx:
- Раздача статики (`/assets/` с долгим кешем, SPA-роутинг для `/`)
- Проксирование `/api/*`, `/docs`, `/openapi.json` на бэкенд
- HTTPS с самоподписанным сертификатом (порт 443)
- HTTP (порт 80) без редиректа, для совместимости

Для замены самоподписанного сертификата на реальный смонтируйте свои сертификаты:

```yaml
volumes:
  - /etc/letsencrypt:/etc/nginx/ssl:ro
```

### hybrid: nginx на хосте (опционально)

Фронтенд доступен напрямую на `http://localhost:8080`, бэкенд — на `http://localhost:5001/docs`.
Хост-nginx нужен только для кастомного домена, HTTPS или единого порта.

Конфиг: [nginx/faunistica.conf](hybrid/nginx/faunistica.conf).

Для HTTPS:
```bash
certbot certonly --standalone -d faunistica.ru
```
Раскомментируйте `server`-блок с `listen 443` и перезагрузите nginx.

## Лимиты памяти (рекомендуемые)

| Сервис    | Лимит  |
|-----------|--------|
| postgres  | 512 MB |
| backend   | 1 GB   |
| frontend  | 128 MB |

Изменить: `mem_limit` в `compose.yml`.

---

## Настройка конфигурации бэкенда

Подробно описано в [backend/README.md](../backend/README.md).

Кратко:

1. **`config.yaml`** — общие настройки (production-версия лежит в `examples/config.yaml`)
2. **`.env`** — чувствительные переменные (токены, пароли)
3. **Docker secrets** — альтернатива `.env` для production: монтируйте файлы в `/run/secrets/<ИМЯ_ПЕРЕМЕННОЙ>`

Все три источника объединяются; приоритет: переменные окружения → `.env` → Docker secrets → `config.yaml`.

## Подключение к PostgreSQL через Unix-сокет (hybrid)

В hybrid-схеме контейнер бэкенда подключается к PostgreSQL на хосте через Unix-сокет.
Для этого сокет монтируется как volume:

```yaml
volumes:
  - /var/run/postgresql:/var/run/postgresql:ro
```

В `.env` указывается:

| Переменная  | Значение                | Примечание |
|-------------|-------------------------|------------|
| `DB_HOST`   | `/var/run/postgresql`   | Путь к сокету внутри контейнера |
| `DB_PORT`   | `5432`                  | Порт (игнорируется при сокете) |

Если PostgreSQL на хосте использует нестандартный путь к сокету, измените путь в volume и `DB_HOST`.

## Кастомные данные в `/data`

Файлы в `backend/data/` (species_export.csv, locations.json и др.) вшиты в образ.
По умолчанию постоянный том не используется — данные берутся из образа.

Чтобы переопределить их, скачайте исходные файлы и смонтируйте свою папку:

```bash
mkdir data
curl -O https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/backend/data/species_export.csv
curl -O https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/backend/data/locations.json
curl -O https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/backend/data/short_countries.txt
curl -O https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/backend/data/ural_border.geojson
```

Добавьте в `compose.yml`:
```yaml
volumes:
  - ./data:/app/data:ro
```

Подробнее — в [backend/README.md](../backend/README.md).
