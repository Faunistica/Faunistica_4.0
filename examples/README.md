# Примеры Docker-развёртывания Faunistica

> ⚠️ **Перед использованием** образы должны быть собраны и опубликованы в registry
> (см. `ghcr.io/faunistica/backend` и `ghcr.io/faunistica/frontend`).
> Либо соберите локально: `docker build -t ghcr.io/faunistica/backend backend/`.

## Варианты

### [all-docker](./all-docker/) — всё в Docker
PostgreSQL, бэкенд, фронтенд и nginx — каждый в своём контейнере.
Подходит для isolated-сервера или первого знакомства.

```bash
cd examples/all-docker
cp ../.env.example .env
cp ../config.yaml .
# отредактировать .env
docker compose up -d
```

### [hybrid](./hybrid/) — Docker + хост
Бэкенд и фронтенд в Docker, PostgreSQL и nginx работают напрямую на хосте.
Рекомендуется для production: БД с нативной производительностью, привычные бекапы.

```bash
cd examples/hybrid
cp ../.env.example .env
cp ../config.yaml .
# отредактировать .env, указать DB_HOST=/var/run/postgresql
docker compose up -d
# скопировать nginx/faunistica.conf в /etc/nginx/sites-available/
```

---

## Настройка nginx

В каждой директории примера лежит `nginx/faunistica.conf` — production-конфиг с:

- Проксированием `/api` на бэкенд, `/` на фронтенд
- WebSocket-поддержкой
- Заголовками безопасности (CSP, X-Frame-Options и др.)
- Закомментированным блоком HTTPS

**Для включения HTTPS:**
```bash
# certbot (рекомендуется)
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
| nginx     | 64 MB  |

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
Чтобы переопределить их, смонтируйте свой том поверх:

```yaml
volumes:
  - ./my_data:/app/data:ro
```

Подробнее — в [backend/README.md](../backend/README.md).
