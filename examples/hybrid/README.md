# Hybrid: бэкенд и фронтенд в Docker, СУБД и nginx на хосте

**Плюсы:** PostgreSQL с нативной производительностью, привычные инструменты бекапа, nginx легко обслуживать.

**Минусы:** требуется настроенный PostgreSQL и nginx на хосте (см. nginx/faunistica.conf).

```bash
cp ../.env.example .env   # отредактировать, DB_HOST=/var/run/postgresql
cp ../config.yaml .
docker compose up -d
# Настроить nginx на хосте: nginx/faunistica.conf → /etc/nginx/sites-available/
```
