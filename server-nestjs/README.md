# PingUp Server - NestJS

Backend server cho ung dung mang xa hoi PingUp, xay dung tren NestJS monorepo architecture.

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 15 + TypeORM
- **Cache**: Redis 7 (ioredis)
- **Queue**: Bull (Redis-based)
- **Authentication**: JWT + Passport
- **Real-time**: Socket.IO
- **File Storage**: ImageKit / AWS S3
- **Email**: Nodemailer

## Project Structure

```
server-nestjs/
├── apps/
│   ├── app-api/          # Main API server (port 4000)
│   ├── notification/     # Notification service (port 4001)
│   └── cronjob-worker/   # Background jobs (port 4002)
├── libs/
│   ├── entity/           # TypeORM entities & migrations
│   ├── enum/             # Shared enums
│   ├── external-infra/   # Redis, WebSocket, Email, Storage
│   ├── logger/           # Logging utilities
│   └── shared-libs/      # Shared utilities
└── docker-compose.yml
```

## Apps

### app-api
API chinh xu ly:
- Authentication (JWT, 2FA)
- User management
- Posts, Comments, Stories
- Messages (real-time)
- Notifications
- Group chats
- File uploads

### notification
Xu ly push notifications va email thong bao.

### cronjob-worker
Background jobs:
- Story cleanup (24h expiry)
- Scheduled notifications
- Data cleanup tasks

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your config
```

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=pingup

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# ImageKit (optional)
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# Email (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Development

```bash
# Start all services with Docker
docker-compose up -d

# Run app-api in dev mode
npm run start:app-api

# Run notification service
npm run start:notification

# Run cronjob worker
npm run start:cronjob-worker
```

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- libs/entity/src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Build

```bash
# Build all apps
npm run build

# Build specific app
npm run build:app-api
npm run build:notification
npm run build:cronjob-worker
```

## Production Deployment

### Docker

```bash
# Build images
docker build -t pingup-app-api -f Dockerfile.app-api .
docker build -t pingup-notification -f Dockerfile.notification .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx

Copy `nginx.conf` to EC2:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/pingup
sudo ln -s /etc/nginx/sites-available/pingup /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Dang ky
- `POST /api/auth/login` - Dang nhap
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA

### User
- `GET /api/user/me` - Get current user
- `PUT /api/user/profile` - Update profile
- `GET /api/user/:id` - Get user by ID
- `POST /api/user/follow/:id` - Follow user
- `DELETE /api/user/follow/:id` - Unfollow user

### Posts
- `GET /api/post/feed` - Get feed
- `POST /api/post` - Create post
- `POST /api/post/:id/like` - Like/unlike post
- `DELETE /api/post/:id` - Delete post

### Messages
- `GET /api/message/conversations` - Get conversations
- `GET /api/message/:userId` - Get messages with user
- `POST /api/message/send` - Send message

### Stories
- `GET /api/story` - Get stories
- `POST /api/story` - Create story
- `POST /api/story/:id/like` - Like story

## Features

### Redis Lua Scripts
Atomic like/unlike operations su dung Redis Lua scripts de dam bao consistency:
- `TOGGLE_LIKE_SCRIPT` - Toggle like atomically
- `CHECK_LIKES_SCRIPT` - Batch check like status
- `SYNC_LIKES_SCRIPT` - Sync likes from DB to Redis

### Rate Limiting
- API: 30 req/s
- Auth: 5 req/s
- Connection limit: 20/IP

### WebSocket Events
- `message:new` - New message
- `message:seen` - Message seen
- `notification:new` - New notification
- `user:online` - User online status

## License

MIT
