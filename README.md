# Express App

REST API

Стек: Express 5, TypeScript, Inversify, Prisma (PostgreSQL), class-validator.

## Быстрый старт

```bash
npm install
cp .env.example .env
npm run db:up
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Сервер запускается на `http://localhost:8000`.

PostgreSQL поднимается через Docker Compose (`npm run db:up`). Остановить: `npm run db:down`.

Перед запуском создайте файл `.env` (или скопируйте из `.env.example`):

```env
DATABASE_URL=postgresql://express_app:express_app@localhost:5432/express_app
JWT_SECRET=change-me-to-a-long-random-secret
BCRYPT_ROUNDS=10
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AUTH_COOKIE_SECURE=false
```

## API

| Метод | Путь              | Описание                              | Авторизация                                      |
| ----- | ----------------- | ------------------------------------- | ------------------------------------------------ |
| POST  | `/users/register` | Регистрация пользователя              | —                                                |
| POST  | `/users/login`    | Логин, access в JSON + refresh cookie | —                                                |
| POST  | `/auth/refresh`   | Обновление access (ротация refresh)   | refresh cookie, body или `X-Refresh-Token`       |
| POST  | `/auth/logout`    | Выход, отзыв refresh                  | refresh cookie, body или `X-Refresh-Token`       |
| GET   | `/users/info`     | Профиль текущего пользователя         | `Authorization: Bearer <access>`                 |

### Ответ login / refresh

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 900
}
```

- Access — в JSON; клиент хранит в памяти и шлёт `Authorization: Bearer`.
- Refresh — HttpOnly cookie `refreshToken` с `Path=/auth` (на `/auth/refresh` и `/auth/logout`). Для Postman можно ещё передать refresh в body или `X-Refresh-Token`.

Для SPA: `CORS_ORIGIN=...` и `credentials: 'include'` на refresh/logout.

Подробнее — в [ARCHITECTURE.md](./ARCHITECTURE.md#аутентификация).

### Примеры

**Регистрация**

```bash
curl -X POST http://localhost:8000/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","password":"password","name":"User"}'
```

**Логин**

```bash
curl -X POST http://localhost:8000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","password":"password"}'
```

**Refresh (cookie / browser)**

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -b 'refreshToken=<refresh-token>'
```

**Refresh (заголовок)**

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "X-Refresh-Token: <refresh-token>"
```

**Logout**

```bash
curl -X POST http://localhost:8000/auth/logout \
  -b 'refreshToken=<refresh-token>'
```

**Профиль**

```bash
curl http://localhost:8000/users/info \
  -H "Authorization: Bearer <access-token>"
```

## Скрипты

| Команда              | Описание                             |
| -------------------- | ------------------------------------ |
| `npm run db:up`      | Запуск PostgreSQL (Docker Compose)   |
| `npm run db:down`    | Остановка PostgreSQL                 |
| `npm run dev`        | Запуск в режиме разработки (nodemon) |
| `npm run build`    | Сборка TypeScript                    |
| `npm start`        | Запуск собранного приложения         |
| `npm test`         | Unit-тесты                           |
| `npm run test:e2e` | E2E-тесты                            |

## Архитектура

Подробное описание слоёв, потока запросов, DI и аутентификации — в [ARCHITECTURE.md](./ARCHITECTURE.md).
