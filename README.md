# 🌿 Grove — Your Personal Student OS

**A calmer, more intentional way to organise student life.**

Grove is a student productivity system designed to bring academics, tasks, habits, journaling, finances, and everyday planning into one organised space.

Built around the idea that productivity should feel less like managing a complicated system and more like having a space that helps you grow.

---

## ✨ Features

Grove is being developed as a modular student productivity dashboard.

Its planned modules include:

- **Home** — A central dashboard for your day.
- **Academics** — Organise subjects, coursework, and academic progress.
- **Tasks** — Keep track of assignments, deadlines, and to-dos.
- **Habits** — Build and monitor consistent routines.
- **Study** — Dedicated tools for study sessions.
- **Journal** — A space for reflection and personal notes.
- **Finance** — Keep track of personal expenses.
- **Calendar** — Get an overview of important dates.
- **Stats** — Review your productivity and progress.
- **Settings** — Configure your Grove experience.

*Modules and functionality are subject to ongoing development.*

## 🎨 Design Philosophy

Grove aims to make productivity feel calm, personal, and approachable.

- Minimal, card-based interface
- Botanical-inspired visual identity
- Muted, earthy colour palette
- Fraunces and Karla typography
- Responsive layouts for different screen sizes
- A focus on clarity over visual clutter

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Backend

- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT)
- bcryptjs for password hashing
- Passport.js and Google OAuth 2.0

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- Git (optional, for version control)

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd grove
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

```env
PORT=3000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_long_random_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

Google OAuth credentials are optional if you only intend to use email/password authentication.

**Important:** Never commit your `.env` file or expose your database credentials and JWT secret.

### 4. Start the backend

On Windows PowerShell:

```powershell
npm.cmd run dev
```

The server should start at:

```text
http://localhost:3000
```

### 5. Verify the backend

Open another PowerShell window and run:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

A successful response should return:

```json
{
  "ok": true
}
```

### 6. Open Grove

Visit:

```text
http://localhost:3000
```

The Express server serves the frontend as static files.

## 🔐 Authentication & API

The backend currently provides the following authentication endpoints:

| Method | Endpoint                    | Purpose                         |
| ------ | --------------------------- | ------------------------------- |
| POST   | `/api/auth/register`        | Register a new account          |
| POST   | `/api/auth/login`           | Log in with email and password  |
| GET    | `/api/auth/google`          | Initiate Google sign-in         |
| GET    | `/api/auth/google/callback` | Handle Google OAuth callback    |
| GET    | `/api/me`                   | Retrieve the authenticated user |

User-specific data endpoints:

| Method | Endpoint           | Purpose              |
| ------ | ------------------ | -------------------- |
| GET    | `/api/data`        | Retrieve user data   |
| PUT    | `/api/data/:key`   | Save a data category |
| GET    | `/api/data/export` | Export user data     |
| POST   | `/api/data/import` | Import user data     |

Protected endpoints require a valid JWT supplied through the `Authorisation: Bearer <token>` header.

## 🚧 Development Status

Grove is an evolving project.

Current development includes:

- Modular extraction of the original frontend.
- Express backend setup.
- PostgreSQL database integration.
- Email/password authentication endpoints.
- Optional Google OAuth support.
- User-specific data API.

### Work in Progress

- Connecting frontend authentication to backend endpoints.
- Replacing the original Claude Artefact storage dependency.
- Integrating persistent user-specific data.
- Improving cross-device accessibility.
- Refining the interface and individual modules.

## 🌱 Project Philosophy

Grove started with a simple idea: student life is already complicated enough. The tools we use to organise it shouldn't make it harder.

This project is also a learning journey — an opportunity to explore frontend development, backend architecture, databases, authentication, and product design by building something useful.

**Built with curiosity, a little chaos, and the intention to grow.**

---

*Grove is an independent personal project currently under active development.*
