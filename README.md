# Gym Membership Management System

A full-stack gym membership management application with a Node.js/Express/MongoDB backend and a React/Vite frontend.

## Project Structure

```
gym-membership/
├── gym-membership-backend/     Express REST API server
│   ├── src/
│   │   ├── config/             Environment & database config
│   │   ├── constants/          Roles, genders enums
│   │   ├── controllers/        Route handlers
│   │   ├── middlewares/        Error handling, async wrapper
│   │   ├── models/             Mongoose schemas (Auth, User)
│   │   ├── repositories/       Data access layer
│   │   ├── routes/             Express route definitions
│   │   ├── services/           Business logic layer
│   │   └── utils/              ApiError, ApiResponse
│   └── package.json
│
├── gym-membership-frontend/    React SPA (Vite)
│   ├── src/
│   │   ├── components/         Reusable UI & layout components
│   │   ├── context/            React context (AuthContext placeholder)
│   │   ├── hooks/              Custom React hooks
│   │   ├── pages/              Route-level page components
│   │   ├── routes/             React Router configuration
│   │   ├── services/           Axios API service modules
│   │   └── utils/              Constants, formatters
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd gym-membership-backend
npm install
```

Create a `.env` file (see `.env.example`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gym-membership-db
CORS_ORIGIN=*
```

Start the server:

```bash
npm run dev
```

Backend runs at **http://localhost:5000**

### Frontend

```bash
cd gym-membership-frontend
npm install
```

Create a `.env` file (see `.env.example`):

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the dev server:

```bash
npm run dev
```

Frontend runs at **http://localhost:5173**

## Available Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Overview with live user count and server health |
| `/register` | Register | Two-step user registration (account + profile) |
| `/login` | Login | Placeholder — backend login API not yet implemented |
| `/users` | Users List | Table of all users with view/edit/delete actions |
| `/users/:id` | User Detail | Full profile and account information |
| `/users/:id/edit` | Edit User | Update user profile fields |

## Backend API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new auth record (username, email, password) |
| `GET` | `/api/v1/auth/:id` | Get auth record by ID |
| `PATCH` | `/api/v1/auth/:id` | Update auth fields (password changes blocked) |
| `DELETE` | `/api/v1/auth/:id` | Delete auth record |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users` | Create user profile (linked to auth via authId) |
| `GET` | `/api/v1/users` | List all users (populated with auth data) |
| `GET` | `/api/v1/users/:id` | Get user by ID (populated with auth data) |
| `PATCH` | `/api/v1/users/:id` | Update user profile fields |
| `DELETE` | `/api/v1/users/:id` | Delete user profile |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Server and database health check |

## Architecture

The system uses a **two-model architecture**:

- **Auth Model** — Stores authentication credentials (username, email, hashed password, role, account status)
- **User Model** — Stores profile information (name, phone, DOB, gender) linked to Auth via `authId`

Registration is a two-step process:
1. `POST /api/v1/auth/register` → creates auth record → returns `authId`
2. `POST /api/v1/users` → creates profile linked to that `authId`

## Current Limitations

- **No login/logout** — The backend does not yet have `POST /auth/login`, `POST /auth/logout`, or `GET /auth/me` endpoints
- **No session/JWT** — There is no authentication middleware or protected routes
- **No memberships/payments** — Membership plans, subscriptions, and payment tracking are planned for future releases
- **No attendance tracking** — Check-in/check-out functionality is not yet implemented

## Tech Stack

### Backend
- Node.js, Express.js 5, MongoDB, Mongoose
- bcrypt, helmet, cors, morgan

### Frontend
- React 19, Vite, React Router
- Axios, React Hot Toast, React Icons

# gym_membership_demo