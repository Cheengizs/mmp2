# Лабораторная работа №2: Каталог книг (Full-Stack SPA & REST API)

Полнофункциональное веб-приложение для учета книг с архитектурой Single Page Application (SPA), REST API на Node.js (Express), реляционной базой данных PostgreSQL и хранилищем файлов Azure Blob Storage (с поддержкой локального эмулятора Azurite).

---

## 🚀 Стек технологий

- **Клиент**: React 18, Vite, Lucide Icons, FormData API, нативный адаптивный CSS.
- **Сервер**: Node.js, Express, `@azure/storage-blob` (официальный Azure SDK), Multer (memoryStorage для прямой передачи в Azure без сохранения на диск), Zod (типизированная валидация DTO), `pg` (PostgreSQL Client Pool).
- **База данных**: PostgreSQL 16 (таблицы `authors`, `genres`, `books` с внешними ключами и ограничениями целостности).
- **Хранилище медиа**: Azure Blob Storage (контейнер `book-covers`, локальный эмулятор Azurite).
- **Контейнеризация**: Docker & Docker Compose (4 сервиса: `client`, `api`, `db`, `azurite`).

---

## 📦 Быстрый старт с Docker Compose

Запуск всей инфраструктуры (база данных, эмулятор хранилища, бэкенд и фронтенд) одной командой:

```bash
docker compose up --build -d
```

После запуска сервисы доступны по адресам:
- **Клиент (SPA)**: [http://localhost:3000](http://localhost:3000)
- **REST API**: [http://localhost:5000/api/books](http://localhost:5000/api/books)
- **Проверка здоровья API**: [http://localhost:5000/health](http://localhost:5000/health)
- **Эмулятор Azurite**: `http://localhost:10000`
- **PostgreSQL**: `localhost:5432` (логин: `postgres`, пароль: `postgres`, БД: `book_catalog`)

Остановка контейнеров:
```bash
docker compose down
```

---

## 🛠 Локальный запуск без Docker (для разработки)

### 1. Сервер (`/server`)
```bash
cd server
npm install
npm run dev
```

### 2. Клиент (`/client`)
```bash
cd client
npm install
npm run dev
```
Клиент откроется на `http://localhost:3000` и будет проксировать запросы `/api/*` на `http://localhost:5000`.

---

## 📋 Спецификация REST API

### Книги (`/api/books`)
| Метод | Эндпоинт | Тело запроса | Код | Описание |
|---|---|---|---|---|
| `GET` | `/api/books` | Query: `genreId`, `authorId`, `status`, `search` | 200 OK | Список книг с вложенными автором и жанром |
| `GET` | `/api/books/:id` | — | 200 OK, 404 | Детальная карточка книги |
| `POST` | `/api/books` | `multipart/form-data` (`title`, `authorId`, `genreId`, `year`, `status`, `description`, `cover`) | 201 Created, 400, 415 | Создание книги, загрузка файла в Azure Blob Storage |
| `PUT` | `/api/books/:id` | `multipart/form-data` или `application/json` | 200 OK, 400, 404, 415 | Редактирование книги. При новом файле старый блоб удаляется из Azure |
| `PATCH`| `/api/books/:id/status` | `application/json` (`{"status": "reading"}`) | 200 OK, 400, 404 | Быстрое переключение статуса |
| `DELETE`| `/api/books/:id` | — | 204 No Content, 404 | Удаление книги из БД и удаление ассоциированного блоба из Azure |
| `GET` | `/api/books/cover/:blobName` | — | 200 OK, 404 | Стриминг обложки из Azure Storage |

### Справочники (`/api/authors`, `/api/genres`)
| Метод | Эндпоинт | Описание |
|---|---|---|
| `GET` | `/api/authors` | Список всех авторов |
| `POST`| `/api/authors` | Добавить автора (`firstName`, `lastName`, `bio`) |
| `GET` | `/api/genres` | Список всех жанров |
| `POST`| `/api/genres` | Добавить жанр (`name`, `description`) |

---

## 🛡 Валидация и обработка ошибок

- Сервер валидирует входящие DTO с помощью **Zod**:
  - `title`: не пустая строка, макс 255 символов.
  - `authorId`: положительное целое число, существование в таблице `authors`.
  - `genreId`: положительное целое число, существование в таблице `genres`.
  - `year`: целое число от 0 до текущего года.
  - `status`: допустимы только `planned`, `reading`, `completed`.
  - `cover`: ограничение до 5 МБ, проверка MIME-типов (`image/jpeg`, `image/png`, `image/webp`). При несоответствии возвращается **HTTP 415** без засорения хранилища и БД.
- Клиент отображает ошибки валидации непосредственно под полями ввода формы и во всплывающих уведомлениях.
