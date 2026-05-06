# TaskFlow — Team Task Manager

A collaborative task management web application where teams can create projects, assign tasks, and track progress — built with React, Node.js/Express, and MongoDB.

## Features

- **Auth** — JWT-based signup/login with protected routes
- **Projects** — Create projects, add/remove members, set roles (Admin/Member)
- **Tasks** — Full CRUD with title, description, due date, priority, assignee, status
- **Board View** — Kanban-style columns (To Do / In Progress / Done)
- **List View** — Sortable table with inline status updates
- **Dashboard** — Stats, workload per member, overdue tasks, recent activity
- **Role-Based Access** — Admins manage everything; Members update only assigned tasks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) |
| Deployment | Railway |

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd taskflow

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# backend/.env
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/taskflow
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

In MongoDB Atlas, also open **Security > Network Access** and add your current public IP address. If your ISP changes IPs often, update this entry whenever the backend starts failing with a server selection or TLS error.

```bash
# frontend/.env
echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env
```

### 3. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm start
```

Open http://localhost:3000

---

## Deployment on Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### Step 2 — Deploy Backend

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your repo → Set **Root Directory** to `backend`
3. Add environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random string (use `openssl rand -base64 32`)
   - `JWT_EXPIRE` — `7d`
   - `NODE_ENV` — `production`
   - `FRONTEND_URL` — *(set after frontend is deployed)*
4. Deploy — Railway auto-detects Node.js
5. Copy the generated backend URL (e.g., `https://taskflow-backend.up.railway.app`)

### Step 3 — Deploy Frontend

1. In the same Railway project → New Service → GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `REACT_APP_API_URL` — `https://<your-backend-url>/api`
4. Deploy

### Step 4 — Connect

Go back to backend service → Update `FRONTEND_URL` variable to your frontend Railway URL → Redeploy.

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |

### Projects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects` | Member |
| POST | `/api/projects` | Authenticated |
| GET | `/api/projects/:id` | Member |
| PATCH | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin |
| POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:memberId` | Admin |

### Tasks
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects/:id/tasks` | Member |
| POST | `/api/projects/:id/tasks` | Admin |
| PATCH | `/api/projects/:id/tasks/:taskId` | Admin / Assignee |
| DELETE | `/api/projects/:id/tasks/:taskId` | Admin |

### Dashboard
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/dashboard` | Authenticated |

---

## Database Schema

### Users
```
_id, name, email, password (hashed), createdAt
```

### Projects
```
_id, name, description, color, members[{user, role}], createdBy, isArchived, timestamps
```

### Tasks
```
_id, title, description, status, priority, dueDate, project, assignedTo, createdBy, tags, timestamps
```

---

## Folder Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── controllers/    # authController, projectController, taskController, dashboardController
│   │   ├── middleware/     # auth.js (JWT), projectAccess.js (role guard)
│   │   ├── models/         # User.js, Project.js, Task.js
│   │   ├── routes/         # auth.js, projects.js, tasks.js, dashboard.js
│   │   └── index.js        # Express app entry
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/        # AuthContext.js
│   │   ├── pages/          # Login, Signup, Dashboard, Projects, ProjectDetail
│   │   ├── components/     # Layout.js
│   │   ├── utils/          # api.js (axios), helpers.js
│   │   └── App.js
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```
