# Фронтенд Faunistica

React + TypeScript + Vite + Redux Toolkit + RTK Query.

## Требования

- Node.js 22+
- [pnpm](https://pnpm.io)

## Локальный запуск

```bash
cd frontend
pnpm install
pnpm dev
```

Фронтенд запустится на `http://localhost:5173` и будет проксировать API-запросы
на бэкенд через `VITE_API_URL`

## Переменная VITE_API_URL

`VITE_API_URL` задаёт базовый URL для API-запросов к бэкенду.

Значение в `.env.example`:

```env
VITE_API_URL=http://localhost:8000/api
```

- **В режиме разработки** — бэкенд запущен локально (`fastapi dev` на порту 8000)
- **В production Docker** — в образ встраивается значение `/api`,
  и nginx внутри контейнера проксирует `/api/*` на бэкенд.
  Меняется через `--build-arg VITE_API_URL=...` при сборке образа.

## Сборка

```bash
pnpm build
```

Результат — в `dist/`.

Локально результат сборки можно проверить с помощью `pnpm preview`
(настройке `AllowedOrigins` на бэкенде для корректной работы).

## Проверка кода

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
```
