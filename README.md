# Personal Kanban Board

A cross-platform task management application built with React Native (web + Android) and Node.js backend.

## Features

- 📋 **Kanban Board** - Organize tasks in customizable columns (To Do, In Progress, Done)
- 🏷️ **Epics** - Group related tasks with color-coded epic tags
- 🔍 **Search & Filter** - Find tasks by title, priority, due date, or epic
- 🔄 **Real-Time Sync** - Changes sync across devices within 3 seconds
- 📱 **Cross-Platform** - Works on web browsers and Android devices
- 🌐 **Offline Support** - Queue changes when offline, sync when back online
- 📎 **Attachments** - Upload images and documents to tasks
- 💬 **Comments** - Add comments to tasks for collaboration
- 📊 **Progress Tracking** - Visual progress bars for boards and epics
- 📥 **Data Export** - Export your data as JSON

## Project Structure

This is a monorepo using npm workspaces:

```
personal-kanban-board/
├── packages/
│   ├── frontend/     # React Native app (web + Android)
│   ├── backend/      # Node.js API server
│   └── shared/       # Shared TypeScript types
├── package.json      # Root package with workspace config
├── render.yaml       # Render deployment configuration
├── DEPLOYMENT.md     # Deployment guide
└── tsconfig.base.json # Base TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (for local development)

### Installation

```bash
# Install all dependencies
npm install

# Build shared types
npm run build --workspace=packages/shared
```

### Docker Development Environment

Start MongoDB and MinIO for local development:

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- **MongoDB**: localhost:27017 (user: `kanban_user`, password: `kanban_password`)
- **MinIO API**: localhost:9000
- **MinIO Console**: localhost:9001 (user: `minioadmin`, password: `minioadmin123`)

See [docker/README.md](docker/README.md) for detailed documentation.

### Environment Setup

```bash
# Copy environment examples
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

### Development

```bash
# Run backend in development mode
npm run dev --workspace=packages/backend

# Run frontend
npm run start --workspace=packages/frontend
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=packages/shared
npm run build --workspace=packages/backend
npm run build --workspace=packages/frontend
```

### Testing

```bash
# Run all tests
npm test

# Run backend tests with coverage
npm run test:coverage --workspace=packages/backend

# Run frontend tests
npm test --workspace=packages/frontend
```

## Deployment

This application is designed to run on free-tier services:

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Backend | [Render](https://render.com) | 750 hours/month |
| Frontend | [Vercel](https://vercel.com) | 100GB bandwidth |
| Database | [MongoDB Atlas](https://mongodb.com/atlas) | 512MB storage |
| File Storage | [Cloudinary](https://cloudinary.com) | 25GB storage |

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native + Expo + React Native Web |
| State Management | Redux Toolkit + RTK Query |
| Real-Time | WebSocket (Socket.io) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas (prod) / MongoDB 7 (dev) |
| File Storage | Cloudinary (prod) / MinIO (dev) |
| Authentication | JWT + bcrypt |

## API Documentation

The backend exposes a RESTful API:

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/boards` - List user's boards
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id/tasks` - Get tasks for a board
- `POST /api/boards/:id/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `PUT /api/tasks/:id/move` - Move a task to another section
- `GET /api/health` - Health check endpoint

## License

MIT
