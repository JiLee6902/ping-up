# PingUp

Ung dung mang xa hoi voi tinh nang nhan tin thoi gian thuc.

## Overview

PingUp la mot ung dung mang xa hoi day du tinh nang bao gom:
- Dang bai viet, hinh anh, video
- Stories (tu dong xoa sau 24h)
- Nhan tin thoi gian thuc (1-1 va nhom)
- Theo doi, ket ban
- Thong bao push
- Tim kiem nguoi dung va bai viet
- Xac thuc 2 yeu to (2FA)

## Tech Stack

### Client
- **React 19** + Vite 7
- **Redux Toolkit** - State management
- **React Router 7** - Routing
- **Tailwind CSS 4** - Styling
- **Socket.IO Client** - Real-time
- **Axios** - HTTP client
- **Lucide React** - Icons

### Server
- **NestJS 10** - Framework
- **PostgreSQL 15** - Database
- **TypeORM** - ORM
- **Redis 7** - Cache & Session
- **Apache Kafka** - Message broker & Event streaming
- **Bull** - Job queue
- **Socket.IO** - WebSocket
- **JWT + Passport** - Auth
- **ImageKit / S3** - File storage

## Project Structure

```
pingup-full-stack/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # Axios config
│   │   ├── app/           # Redux store
│   │   ├── components/    # UI components
│   │   ├── features/      # Redux slices
│   │   ├── pages/         # Route pages
│   │   └── App.jsx        # Root component
│   └── package.json
│
├── server-nestjs/          # NestJS backend
│   ├── apps/
│   │   ├── app-api/       # Main API (port 4000)
│   │   ├── notification/  # Notification consumer (port 4001)
│   │   └── cronjob-worker/# Background jobs (port 4002)
│   ├── libs/
│   │   ├── entity/        # TypeORM entities
│   │   ├── enum/          # Shared enums
│   │   └── external-infra/# Redis, Kafka, WebSocket, Email
│   ├── docker-compose.yml
│   └── nginx.conf
│
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Apache Kafka 3.5+ (with Zookeeper)

### 1. Clone repository

```bash
git clone https://github.com/JiLee6902/ping-up.git
cd ping-up
```

### 2. Setup Server

```bash
cd server-nestjs

# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Redis, Kafka)
docker-compose up -d

# Setup environment
cp .env.example .env.local

# Run migrations
npm run migration:run

# Start server
npm run start:app-api
```

### 3. Setup Client

```bash
cd client

# Install dependencies
npm install

# Setup environment
echo "VITE_BASEURL=http://localhost:4000" > .env

# Start dev server
npm run dev
```

### 4. Access Application

- **Client**: http://localhost:5173
- **API**: http://localhost:4000
- **Kafka UI**: http://localhost:8080

## Environment Variables

### Client (.env)
```env
VITE_BASEURL=http://localhost:4000
```

### Server (.env.local)
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

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=pingup-api
KAFKA_GROUP_ID=pingup-consumer-group

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# ImageKit (optional)
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

## Development

### Client Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview build
npm run lint      # Run ESLint
```

### Server Commands
```bash
npm run start:app-api        # Start API server
npm run start:notification   # Start notification consumer
npm run start:cronjob-worker # Start cron worker
npm run build                # Build all apps
npm run migration:run        # Run migrations
npm run migration:generate   # Generate migration
```

## Features

### Authentication
- Email/Password login
- JWT tokens with refresh
- Two-factor authentication (2FA)
- Password reset via email

### Social
- Create posts with images/videos
- Like, comment, share posts
- Stories (24h expiry)
- Follow/unfollow users
- Friend connections

### Messaging
- Real-time 1-1 chat
- Group chat
- Message requests
- Read receipts
- Typing indicators

### Notifications
- Push notifications (via Kafka)
- Email notifications
- In-app notifications

### Search
- Full-text search (PostgreSQL tsvector)
- User search
- Hashtag search
- Advanced filters

## Kafka Topics

| Topic | Description | Producer | Consumer |
|-------|-------------|----------|----------|
| `notification.push` | Push notifications | app-api | notification |
| `notification.email` | Email notifications | app-api | notification |
| `user.activity` | User activity events | app-api | cronjob-worker |
| `post.events` | Post create/update/delete | app-api | notification |
| `message.events` | Message events | app-api | notification |

## Production Deployment

### Docker Compose

```bash
cd server-nestjs

# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx Setup (EC2)

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/pingup
sudo ln -s /etc/nginx/sites-available/pingup /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Get SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Vercel (Client)

Client duoc deploy tren Vercel. Config trong `client/vercel.json`.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Nginx     │────▶│  App API    │
│  (React)    │     │  (Reverse   │     │  (NestJS)   │
└─────────────┘     │   Proxy)    │     └──────┬──────┘
                    └─────────────┘            │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Zookeeper  │────▶│    Kafka    │◀────│    Redis    │
│             │     │  (Broker)   │     │   (Cache)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────┐     ┌─────────────┐  ┌─────────────┐
│ Notification│     │   Cronjob   │  │  PostgreSQL │
│  Consumer   │     │   Worker    │  │  (Database) │
└─────────────┘     └─────────────┘  └─────────────┘
```

### Event-Driven Flow

1. **User Action** → App API receives request
2. **Produce Event** → App API publishes event to Kafka topic
3. **Consume Event** → Notification service consumes from Kafka
4. **Process** → Send push notification / email / store in DB
5. **Real-time** → Socket.IO broadcasts to connected clients

## License

MIT
