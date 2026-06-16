# Hybrid: бэкенд и фронтенд в Docker, СУБД и [nginx](https://nginx.org) на хосте

**Плюсы:** PostgreSQL с нативной производительностью, привычные инструменты бекапа, nginx легко обслуживать.

**Минусы:** требуется настроенный PostgreSQL и nginx на хосте (см. nginx/faunistica.conf).

```bash
curl -o .env https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/.env.example
curl -o config.yaml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/config.yaml
curl -o compose.yml https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/hybrid/compose.yml
curl -o faunistica.conf https://raw.githubusercontent.com/Faunistica/Faunistica_4.0/main/examples/hybrid/nginx/faunistica.conf
# curl можно заменить на wget -O <file> <url>
# Отредактируйте .env: укажите BOT_TOKEN, ADMIN_CHAT_ID, JWT_SECRET, DB_HOST=/var/run/postgresql
docker compose up -d
# sudo cp faunistica.conf /etc/nginx/sites-available/
```
