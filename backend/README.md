# UMLForge Backend

FastAPI + SQLAlchemy + JWT authentication backend for the UMLForge AI-powered UML generator.

> [!IMPORTANT]
> **Requires Python 3.11 or 3.12 or 3.13** (not 3.14 — packages don't have wheels for it yet).
> Check your version: `py --list`   Use `py -3.13 -m venv venv` to create the venv.

---

## Quick Start (Windows PowerShell)

### 1. Create and activate a virtual environment

```powershell
cd AI-UML-Generator\backend
py -3.13 -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `JWT_SECRET_KEY` | Random 32-character secret — run `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GEMINI_API_KEY` | Google Gemini API key (get one free at https://aistudio.google.com) |
| `OPENAI_API_KEY` | OpenAI API key (alternative) |

### 4a. Quick start with SQLite (no PostgreSQL needed)

SQLite is the default — just leave `DATABASE_URL` as `sqlite+aiosqlite:///./umlforge.db`.
Tables are created automatically on first start.

```powershell
uvicorn app.main:app --reload
```

### 4b. Use PostgreSQL

First create the database:

```powershell
# If psql is in PATH
psql -U postgres -c "CREATE DATABASE umlforge;"
```

Then update `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/umlforge
```

Run Alembic migrations:

```powershell
alembic upgrade head
```

Start the server:

```powershell
uvicorn app.main:app --reload
```

---

## Enable the Backend in the Frontend

```powershell
# In the frontend directory:
Copy-Item .env.example .env.local
# .env.local already contains: VITE_API_URL=http://localhost:8000
```

When `VITE_API_URL` is set, the frontend routes all API calls to the backend instead of localStorage.

---

## Running Tests

```powershell
cd backend
python -m pytest tests/ -v
```

Tests use an in-memory SQLite database and mock AI calls — no API keys required.

---

## API Documentation

With the server running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Sign out |
| GET | `/auth/me` | Get current user |
| POST | `/auth/forgot-password` | Request password reset |

Authentication uses **HttpOnly cookies** — the frontend sends `credentials: 'include'` on every request.

### Diagrams

| Method | Endpoint | Description |
|---|---|---|
| GET | `/diagrams` | List all diagrams (metadata only) |
| GET | `/diagrams/{id}` | Get full diagram |
| PUT | `/diagrams/{id}` | Save / create diagram |
| DELETE | `/diagrams/{id}` | Delete diagram |

### AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/generate-diagram` | Generate diagram from requirements |
| POST | `/ai/modify-diagram` | Modify existing diagram with instructions |
| POST | `/ai/explain-diagram` | Analyze and explain a diagram |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application factory
│   ├── config.py            # Settings (from .env)
│   ├── database.py          # SQLAlchemy async engine
│   ├── dependencies.py      # FastAPI Depends: get_db, get_current_user
│   ├── core/
│   │   ├── security.py      # JWT + bcrypt
│   │   └── exceptions.py    # Custom HTTP exceptions
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response models
│   ├── repositories/        # Database query functions
│   ├── services/            # Business logic
│   └── routers/             # FastAPI route handlers
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── requirements.txt
├── .env.example
├── alembic.ini
└── pytest.ini
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./umlforge.db` | Database connection string |
| `JWT_SECRET_KEY` | *(required)* | JWT signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRE_MINUTES` | `60` | Token expiry (non-remember) |
| `JWT_REMEMBER_DAYS` | `30` | Token expiry (remember me) |
| `GEMINI_API_KEY` | *(optional)* | Google Gemini API key |
| `OPENAI_API_KEY` | *(optional)* | OpenAI API key |
| `AI_PROVIDER` | `gemini` | Primary AI provider |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `DEBUG` | `true` | Enable debug logging |
