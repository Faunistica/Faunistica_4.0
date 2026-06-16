# All-Docker: полный запуск в контейнерах

**Плюсы:** вся инфраструктура поднимается одной командой, изолирована, воспроизводима.
Отдельный [nginx](https://nginx.org)-контейнер не нужен — фронтенд сам проксирует `/api/*` на бэкенд.

**Минусы:** PostgreSQL в Docker — дополнительная нагрузка на I/O, требует настройки бекапов отдельно.

```bash
curl -o .env https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/.env.example
curl -o config.yaml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/config.yaml
curl -o compose.yml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/all-docker/compose.yml
# curl можно заменить на wget -O <file> <url>
# Отредактируйте .env: укажите BOT_TOKEN, ADMIN_CHAT_ID, JWT_SECRET
docker compose up -d
```
