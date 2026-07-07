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
SECRET=your-jwt-secret
SALT=10
```

## API

| Метод | Путь              | Описание                      | Авторизация                     |
| ----- | ----------------- | ----------------------------- | ------------------------------- |
| POST  | `/users/register` | Регистрация пользователя      | —                               |
| POST  | `/users/login`    | Логин, возвращает JWT         | —                               |
| GET   | `/users/info`     | Профиль текущего пользователя | `Authorization: Bearer <token>` |

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

**Профиль**

```bash
curl http://localhost:8000/users/info \
  -H "Authorization: Bearer <jwt-token>"
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
