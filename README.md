# Private Book Catalog

![Node.js](https://img.shields.io/badge/Node.js-24+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

A production-oriented REST API for cataloging and managing a private personal library. The backend separates **relational metadata** (titles, authors, genres, reading status, notes) in PostgreSQL from **binary media assets** (cover images) on the local filesystem, exposing a clear HTTP surface for CRUD operations and authenticated file retrieval.

> Portfolio project demonstrating backend design: parameterized SQL, JWT session security, multipart uploads, and a disk-backed media pipeline with database path references.

---

## Description

**Private Book Catalog** is a multi-tenant book management API. Each registered user owns isolated `user_books` records linked to shared reference tables (`authors`, `genres`, `book_statuses`). All book routes are protected; row-level isolation is enforced with `user_id` predicates on every query.

### Media pipeline & metadata management

1. **Upload (write path)** — Clients send `multipart/form-data` with a `cover` field. [Multer](https://github.com/expressjs/multer) validates MIME type (`jpeg`, `png`, `webp`, `gif`) and size (≤ 5 MB), then persists the file under `backend/images/` using a collision-resistant name: `{timestamp}-{random-hex}{ext}`.
2. **Persist reference (metadata path)** — Only a **relative URL path** (e.g. `/images/1747123456789-a1b2c3d4e5f6.jpg`) is stored in `user_books.cover_url`. The database never stores BLOBs, keeping backups small and queries fast.
3. **Serve (read path)** — Express static middleware mounts `GET /images/*` from the `images/` directory. API list/detail responses return `cover_url`; clients resolve full URLs against the API host (e.g. `http://localhost:8000/images/...`).
4. **Fallback** — On create, if no file is uploaded, an optional external `cover_url` string (remote URL) may be stored instead, supporting hybrid local/remote cover sources.

This split follows a common storage pattern: **filesystem for bytes, database for pointers and business data**, with user-scoped authorization at the application layer.

---

## Core Features

| Area | Capability |
|------|------------|
| **CRUD** | Create, read, update, and delete personal book copies (`user_books`) with filtering by author, genre, and status |
| **Local storage engine** | Multer `diskStorage` pipeline with MIME whitelist, size limits, and deterministic public paths |
| **Database tracking** | Normalized schema: users, books, authors, genres, statuses, notes, contacts (lending), notifications |
| **Cover management** | Upload on create (`POST /api/books`) or replace later (`POST /api/books/:id/cover`) |
| **Auth** | bcrypt password hashing, JWT in `httpOnly` cookies, per-request `authMiddleware` |
| **Auxiliary APIs** | Reading notes, borrow/return workflow, favorites, ratings, reference lookups, optional Google Books metadata search |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES modules) |
| HTTP | Express.js 5 |
| Database | PostgreSQL 18 |
| Driver | [`pg`](https://node-postgres.com/) connection pool (`Pool` + parameterized queries) — **no ORM** |
| Uploads | Multer 2 |
| Security | bcrypt, jsonwebtoken, cookie-parser, CORS with credentials |
| Scheduling | node-cron (due-date notifications) |
| Dev | nodemon, dotenv |

The API lives in `/backend`. A React + Vite frontend (`/frontend`) consumes these endpoints but is out of scope for this document.

---

## File Storage Logic

```
Client (multipart) → Multer → backend/images/{unique-filename}
                                    ↓
                         cover_url = "/images/{filename}"
                                    ↓
                         PostgreSQL user_books.cover_url
                                    ↓
Client GET → Express static /images → filesystem read
```

| Step | Detail |
|------|--------|
| **Directory** | `images/` is created at server startup if missing (`upload.middleware.js`) |
| **Filename** | `Date.now()` + 6 random bytes (hex) + original extension — avoids collisions and path traversal via original names |
| **DB value** | Relative path only (`/images/...`), not absolute disk paths — portable across environments |
| **HTTP exposure** | `app.use('/images', express.static('images'))` in `server.js` |
| **Authorization** | Book mutations require JWT; static image URLs are currently public once known (typical for portfolio/CDN-style covers; tighten with signed URLs if needed) |

**Note:** Deleting a book removes the DB row (cascade deletes notes) but does not automatically unlink the cover file from disk — a deliberate trade-off unless a cleanup job is added.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ (24 recommended; matches Docker image)
- [PostgreSQL](https://www.postgresql.org/) 16+
- [Git](https://git-scm.com/)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/private-cataloging-system.git
cd private-cataloging-system
```

### 2. Create the database

```bash
# PostgreSQL CLI example
createdb library_db

psql -d library_db -f backend/database/schema.sql
```

The schema seeds reference data (statuses, genres, sample authors) and optional demo users.

### 3. Install dependencies

```bash
cd backend
npm install
```

### 4. Environment variables

Create `backend/.env` (or project-root `.env` when using Docker):

```env
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/library_db
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
NODE_ENV=development

# Optional
GOOGLE_BOOKS_API_KEY=
GEMINI_API_KEY=
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string for `pg` Pool |
| `JWT_SECRET` | Yes | Signs and verifies session tokens |
| `PORT` | No | API port (default `8000`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins for credentialed requests |

### 5. Run the API

```bash
# from backend/
npm start

# development with auto-reload
npm run dev
```

Server: `http://localhost:8000`  
Health check: `GET http://localhost:8000/images/` (after uploading a cover)

### Docker (optional)

```bash
docker compose up --build
```

Maps API to port `8000` and PostgreSQL to host port `5433`. Apply `schema.sql` to the `db` service on first run if tables are missing.

---

## Key API Endpoints

Base URL: `http://localhost:8000`  
Protected routes require a valid `token` **httpOnly** cookie (set via `POST /api/auth/login`).

### Authentication

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/auth/register` | Register user; returns session cookie |
| `POST` | `/api/auth/login` | Authenticate; issues JWT cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |

### Books — CRUD & media

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/books` | List current user's books (`?author=&genre=&status=` filters) |
| `GET` | `/api/books/:id` | Get single book with full metadata |
| `POST` | `/api/books` | **Create** book; `multipart/form-data` with optional `cover` file + JSON fields (`title`, `isbn`, `author_id`, …) |
| `PUT` | `/api/books/:id` | **Update** status and/or rating |
| `DELETE` | `/api/books/:id` | **Delete** book copy (user-scoped) |
| `POST` | `/api/books/:id/cover` | **Upload/replace** cover image (`cover` field); updates `cover_url` in DB |

### Static file retrieval

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/images/{filename}` | Serve stored cover binary (path matches `cover_url` in responses) |

### Reference data (authenticated)

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/books/authors` | List authors |
| `GET` | `/api/books/genres` | List genres |
| `GET` | `/api/books/statuses` | List reading statuses |
| `GET` | `/api/books/book/external` | Search external metadata (Google Books API) |

### Related book operations

| Method | URL | Description |
|--------|-----|-------------|
| `PUT` | `/api/books/rating/:id` | Set 1–5 star rating |
| `PUT` | `/api/books/:id/favorite` | Toggle favorite flag |
| `POST` | `/api/books/:id/borrow` | Mark as lent to a contact |
| `POST` | `/api/books/:id/return` | Return from loan |
| `GET` | `/api/books/:id/notes` | List notes |
| `POST` | `/api/books/:id/notes` | Add note |
| `DELETE` | `/api/books/:id/notes/:noteId` | Delete note |

### Example: create book with cover

```http
POST /api/books HTTP/1.1
Host: localhost:8000
Cookie: token=<jwt>
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="title"

Foundation
------boundary
Content-Disposition: form-data; name="cover"; filename="cover.jpg"
Content-Type: image/jpeg

<binary>
------boundary--
```

**Response (201):**

```json
{
  "message": "Книга успішно додана",
  "user_book_id": 42,
  "cover_url": "/images/1747123456789-a1b2c3d4e5f6.jpg"
}
```

Retrieve cover: `GET http://localhost:8000/images/1747123456789-a1b2c3d4e5f6.jpg`

---

## Project structure (backend)

```
backend/
├── server.js                 # Express app, static /images, route mounting
├── database/
│   ├── database.js           # pg Pool wrapper
│   └── schema.sql            # DDL + seed data
├── middleware/
│   ├── auth.middleware.js    # JWT cookie verification
│   └── upload.middleware.js  # Multer disk storage + validation
├── routers/
│   └── book.router.js        # Book + notes + lending routes
├── controllers/
│   └── book.controller.js    # SQL + cover_url persistence
└── images/                   # Uploaded covers (gitignored in production)
```

---

## Author

Junior Backend Developer — portfolio showcase of REST API design, PostgreSQL modeling, and filesystem-backed media handling with Express.js.
