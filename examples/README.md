# Примеры Docker-развёртывания Faunistica

> ⚠️ **Перед использованием** образы должны быть собраны и опубликованы в registry
> (см. `ghcr.io/faunistica/backend` и `ghcr.io/faunistica/frontend`).
> Либо соберите локально: `docker build -t ghcr.io/faunistica/backend backend/` ([Docker](https://docs.docker.com)).

## Варианты

### [all-docker](./all-docker/) — всё в Docker
PostgreSQL, бэкенд и фронтенд — каждый в своём контейнере. \
Отдельный [nginx](https://nginx.org)-контейнер **не нужен**: фронтенд-контейнер сам проксирует
`/api/*` на бэкенд через смонтированный nginx-конфиг.

```
postgres → backend:5001 → frontend:80 (статический SPA + /api/ → backend)
```

```bash
curl -o .env https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/.env.example
curl -o config.yaml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/config.yaml
curl -o compose.yml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/all-docker/compose.yml
# curl можно заменить на wget -O <file> <url>
# отредактировать .env
docker compose up -d
```

### [hybrid](./hybrid/) — Docker + хост
Бэкенд и фронтенд в Docker, PostgreSQL и nginx работают напрямую на хосте.

```bash
curl -o .env https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/.env.example
curl -o config.yaml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/config.yaml
curl -o compose.yml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/hybrid/compose.yml
curl -o faunistica.conf https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/hybrid/nginx/faunistica.conf
# curl можно заменить на wget -O <file> <url>
# отредактировать .env (указать DB_HOST=/var/run/postgresql)
docker compose up -d
# sudo cp faunistica.conf /etc/nginx/sites-available/
```

---

## Настройка nginx

### all-docker: фронтенд-контейнер как reverse proxy

По умолчанию образ фронтенда (`ghcr.io/faunistica/frontend`) содержит минимальный
nginx-конфиг, который только раздаёт статику (`frontend/nginx/default.conf`).

Чтобы превратить его в полноценный reverse proxy, смонтируйте production-конфиг
поверх дефолтного:

```yaml
volumes:
  - ./nginx/faunistica.conf:/etc/nginx/conf.d/default.conf:ro
```

Файл `nginx/faunistica.conf` в примере уже включает:
- Раздачу статики (`/assets/` с долгим кешем, SPA-роутинг для `/`)
- Проксирование `/api/*`, `/docs`, `/openapi.json` на бэкенд
- Заголовки безопасности (CSP, X-Frame-Options и др.)
- Закомментированный блок HTTPS

Если вам нужен **кастомный nginx-конфиг** — просто замените файл в `./nginx/`
или смонтируйте свой путь. Всё остальное остаётся без изменений.

### hybrid: nginx на хосте

В hybrid-схеме nginx работает на хосте, конфиг лежит в `nginx/faunistica.conf`.

**Для включения HTTPS:**
```bash
# [certbot](https://certbot.eff.org) (рекомендуется)
certbot certonly --standalone -d faunistica.ru
# или acme.sh
acme.sh --issue --standalone -d faunistica.ru
```
Раскомментируйте `server`-блок с `listen 443` в nginx-конфиге и перезагрузите nginx.

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
