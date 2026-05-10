# Traveloop — Full-Stack Trip Planning Platform

A production-ready travel planning application built with **Spring Boot 4** and **Next.js 16**. Plan trips, track budgets, manage itineraries, share journeys, and discover trending destinations — all in one place.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Default Admin Credentials](#default-admin-credentials)
- [Architecture Notes](#architecture-notes)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Spring Boot 4.0.6, Java 25 |
| **Frontend** | Next.js 16.2.4, React 19, TypeScript 5 |
| **Database** | MySQL 8.0 |
| **Cache** | Redis |
| **Auth** | JWT (JJWT 0.13), OAuth2 (Google, GitHub) |
| **Storage** | Cloudinary |
| **Email** | Gmail SMTP |
| **API Docs** | Swagger / OpenAPI 3.0 |
| **Styling** | Tailwind CSS 4 |
| **Package Manager** | pnpm (frontend) |
| **Build Tool** | Maven Wrapper (backend) |
| **Containerization** | Docker (multi-stage), Docker Compose |

---

## Features

- **Authentication** — Email/password signup with OTP verification, JWT access tokens, rotating HttpOnly refresh token cookies, brute-force lockout (5 attempts → 15 min lock)
- **Social Login** — OAuth2 via Google and GitHub
- **Trip Management** — Create trips with start/end dates, budget, visibility (public/private), and status tracking
- **Itinerary Builder** — Add stops/waypoints to trips with activities at each stop
- **Expense Tracker** — Log expenses per trip with budget summaries and cost analysis
- **Packing Checklist** — Create packing lists with progress tracking
- **Trip Notes** — Attach notes and observations to any trip
- **Trip Sharing** — Generate public share links; viewers can copy shared trips to their own account
- **City Discovery** — Search cities, browse trending and popular destinations
- **Admin Dashboard** — User analytics, popular cities, active users, role management, ban/disable accounts
- **Multi-Device Sessions** — Independent refresh tokens per device with selective logout
- **API Documentation** — Full Swagger UI at `/swagger-ui.html`

---

## Project Structure

```
traveloop/
├── backend/                          # Spring Boot API
│   ├── src/main/java/org/odoo/backend/
│   │   ├── auth/                     # Auth, security, JWT, OAuth2
│   │   ├── trip/                     # Trip CRUD and management
│   │   ├── activity/                 # Activities at trip stops
│   │   ├── expense/                  # Expense tracking
│   │   ├── checklist/                # Packing checklist
│   │   ├── notes/                    # Trip notes
│   │   ├── itinerary/                # Trip stops / waypoints
│   │   ├── shared/                   # Public trip sharing
│   │   ├── city/                     # City reference data
│   │   └── admin/                    # Admin analytics & user management
│   ├── src/main/resources/
│   │   ├── application.yml           # Active profile selector (dev by default)
│   │   ├── application-dev.yml       # Development config
│   │   └── application-prod.yml      # Production config
│   ├── Dockerfile                    # Multi-stage: eclipse-temurin:25-jdk → distroless/java25
│   ├── docker-compose.yml            # MySQL + backend services
│   ├── pom.xml
│   └── mvnw / mvnw.cmd
│
├── frontend/                         # Next.js application
│   ├── app/
│   │   ├── (auth)/                   # Login, register, OTP, password reset
│   │   ├── (protected)/              # Dashboard, trips, cities, profile
│   │   ├── (admin)/                  # Admin panel
│   │   ├── public/                   # Public trip browsing
│   │   └── shared/                   # Shared trip viewer
│   ├── components/                   # Reusable UI components
│   ├── context/                      # React context providers
│   ├── lib/                          # API client, utilities
│   ├── types/                        # TypeScript type definitions
│   ├── Dockerfile                    # Multi-stage: node:24-alpine → distroless/nodejs22
│   └── .env.local                    # Frontend environment variables
│
├── .env                              # Root env (Docker Compose / MySQL)
└── .gitignore
```

---

## Prerequisites

Make sure the following are installed before you begin:

| Tool | Version | Notes |
|---|---|---|
| Docker | 24+ | Required for Docker setup |
| Docker Compose | v2+ | Bundled with Docker Desktop |
| Java | 25 | Required for local backend |
| Maven | 3.9+ | Or use the included `mvnw` wrapper |
| Node.js | 20+ | Required for local frontend |
| pnpm | 10.22+ | `npm install -g pnpm` |
| MySQL | 8.0 | Required for local setup only |
| Redis | 7+ | Required for local setup only |

---

## Environment Variables

### Root `.env` — used by Docker Compose

Copy and edit before running Docker:

```bash
cp .env .env.local   # optional — .env is read directly by docker-compose
```

```env
# MySQL
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=traveldb
MYSQL_USER=traveloop
MYSQL_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_256bit_base64_secret
JWT_EXPIRATION=86400000          # 1 day in ms
JWT_REFRESH_EXPIRATION=604800000 # 7 days in ms

# OTP
OTP_EXPIRATION=300000  # 5 minutes in ms
OTP_LENGTH=6

# Email (Gmail SMTP)
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password   # Use an App Password, not your account password

# OAuth2 — Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth2 — GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Default Admin (seeded on first boot)
ADMIN_EMAIL=admin@traveloop.com
ADMIN_PASSWORD=Admin@1234
ADMIN_FIRST_NAME=Super
ADMIN_LAST_NAME=Admin
ADMIN_CITY=New York
ADMIN_COUNTRY=USA

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### `backend/.env` — used when running the backend locally

```env
# Database
DB_URL=jdbc:mysql://localhost:3306/traveldb
DB_USERNAME=root
DB_PASSWORD=your_password

# Server
SERVER_PORT=5000

# JWT (same values as root .env)
JWT_SECRET=your_256bit_base64_secret
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# OTP
OTP_EXPIRATION=300000
OTP_LENGTH=6

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend URL (used in email links)
APP_FRONTEND_URL=http://localhost:3000

# Email
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password

# OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Admin seed
ADMIN_EMAIL=admin@traveloop.com
ADMIN_PASSWORD=Admin@1234
ADMIN_FIRST_NAME=Super
ADMIN_LAST_NAME=Admin
ADMIN_CITY=New York
ADMIN_COUNTRY=USA

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=Traveloop
```

> **Gmail App Password:** Go to [Google Account → Security → 2-Step Verification → App Passwords](https://myaccount.google.com/apppasswords) and generate a password for "Mail". Use that 16-character password as `MAIL_PASSWORD`.

---

## Running with Docker

This is the recommended way to run the full stack. Docker Compose handles MySQL, Redis, the backend, and the frontend together.

### 1. Clone the repository

```bash
git clone https://github.com/your-org/traveloop.git
cd traveloop
```

### 2. Configure environment variables

Edit the root `.env` file with your credentials (see [Environment Variables](#environment-variables) above). At minimum, set your Gmail App Password and OAuth2 credentials.

### 3. Build and start all services

```bash
# Build images and start containers in detached mode
docker compose up --build -d
```

This starts:
- `mysql` — MySQL 8.0 on port `3306`
- `blog_backend` — Spring Boot API on port `5000`

> The backend waits for MySQL to pass its health check before starting.

### 4. Start the frontend (separate step)

The frontend Dockerfile is in `frontend/`. Build and run it separately:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1 \
  --build-arg NEXT_PUBLIC_APP_NAME=Traveloop \
  -t traveloop-frontend \
  ./frontend

docker run -d \
  --name traveloop-frontend \
  -p 3000:3000 \
  traveloop-frontend
```

### 5. Verify everything is running

```bash
docker ps
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/v1 |
| Swagger UI | http://localhost:5000/swagger-ui.html |
| Health Check | http://localhost:5000/actuator/health |

### 6. Stopping the stack

```bash
# Stop and remove containers (keeps volumes)
docker compose down

# Stop and remove containers + volumes (wipes database)
docker compose down -v
```

### Useful Docker commands

```bash
# View backend logs
docker logs -f blog_backend

# View MySQL logs
docker logs -f mysql

# Restart only the backend
docker compose restart blog_backend

# Rebuild only the backend image
docker compose up --build blog_backend -d
```

---

## Running Locally

Use this approach for active development. You'll need MySQL and Redis running on your machine.

### Backend

#### 1. Start MySQL and Redis

Make sure MySQL 8.0 and Redis are running locally. Create the database:

```sql
CREATE DATABASE traveldb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Configure environment

Edit `backend/.env` with your local database credentials and other settings (see [Environment Variables](#environment-variables)).

#### 3. Run the backend

```bash
cd backend

# Using the Maven wrapper (recommended)
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

The API starts on `http://localhost:5000`. The active profile is `dev` by default (set in `application.yml`).

To run with the production profile:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

#### 4. Build a JAR (optional)

```bash
./mvnw clean package -DskipTests

# Run the JAR directly
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

---

### Frontend

#### 1. Install dependencies

```bash
cd frontend
pnpm install
```

#### 2. Configure environment

```bash
cp .env.local .env.local   # already exists — just verify the values
```

Make sure `NEXT_PUBLIC_API_URL` points to your running backend.

#### 3. Start the development server

```bash
pnpm dev
```

The app is available at `http://localhost:3000`.

#### 4. Build for production

```bash
pnpm build
pnpm start
```

---

## API Documentation

Swagger UI is available when the backend is running:

```
http://localhost:5000/swagger-ui.html
```

The raw OpenAPI spec is at:

```
http://localhost:5000/v3/api-docs
```

### Key API Groups

| Group | Base Path | Auth Required |
|---|---|---|
| Authentication | `/auth/**` | No |
| User Profile | `/user/me` | Yes |
| Trips | `/trips/**` | Yes (owner) |
| Activities | `/stops/**` | Yes |
| Expenses | `/trips/{id}/expenses` | Yes |
| Checklist | `/trips/{id}/checklist` | Yes |
| Notes | `/trips/{id}/notes` | Yes |
| Trip Sharing | `/shared/**` | No (public view) |
| City Discovery | `/cities/**` | No |
| Admin | `/admin/**` | ROLE_ADMIN |

### Authentication Flow

```
POST /auth/signup          → Register (sends OTP email)
POST /auth/verify-otp      → Verify email
POST /auth/login           → Get access token + refresh token cookie
POST /auth/refresh-token   → Rotate tokens (uses HttpOnly cookie)
POST /auth/logout          → Invalidate current session
```

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

---

## Default Admin Credentials

On first boot, the application seeds a default admin account from environment variables. Using the defaults from `.env`:

| Field | Value |
|---|---|
| Email | `admin@traveloop.com` |
| Password | `Admin@1234` |

> **Change these before deploying to production.** Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file.

The admin panel is accessible at `http://localhost:3000/admin` (frontend) or via the `/admin/**` API endpoints.

---

## Architecture Notes

**Session strategy** — The backend is stateless for API requests (JWT). Sessions are created only for OAuth2 authorization code flow. Refresh tokens are stored in the database and rotated on every use, enabling multi-device logout.

**Token cleanup** — A scheduled job runs daily at 03:00 UTC to purge expired refresh tokens and OTPs from the database.

**Database migrations** — Hibernate DDL is set to `update` in both dev and prod profiles. For production, consider switching to Flyway (already a dependency, disabled by default via `spring.flyway.enabled: false`).

**Image uploads** — Profile pictures and trip cover images are stored on Cloudinary. The backend handles upload via the Cloudinary SDK and stores the resulting URL in the database.

**CORS** — Allowed origins are configured via `CORS_ALLOWED_ORIGINS` (comma-separated). In dev, `http://localhost:3000` is allowed by default.

**Profiles** — The active Spring profile is set in `application.yml`. Switch between `dev` and `prod` by changing `spring.profiles.active` or passing `-Dspring.profiles.active=prod` at runtime.
