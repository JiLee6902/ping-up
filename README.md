# PingUp

A full-featured social networking application with real-time messaging.

## Overview

PingUp is a comprehensive social networking platform featuring:
- Posts with images and videos
- Stories (auto-delete after 24 hours)
- Real-time messaging (1-1 and group chat)
- End-to-end encryption (E2EE)
- Voice messages with AI transcription
- AI Chatbot
- Follow and friend connections
- Push notifications
- User and post search
- Two-factor authentication (2FA)
- Guest login
- VNPAY payment + Premium subscription
- Monitoring with Prometheus + Grafana

## Tech Stack

### Client
- **React 19** + Vite 7
- **Redux Toolkit** - State management
- **React Router 7** - Routing
- **Tailwind CSS 4** - Styling
- **Socket.IO Client** - Real-time
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Web Crypto API** - E2E Encryption

### Server
- **NestJS 10** - Framework
- **PostgreSQL 15** - Database
- **TypeORM** - ORM
- **Redis 7** - Cache, Rate Limiting, Presence, Trending
- **Apache Kafka** - Message broker & Event streaming
- **Bull** - Job queue
- **Socket.IO** - WebSocket
- **JWT + Passport** - Auth
- **ImageKit / S3** - File storage
- **Groq AI** - Whisper transcription + LLaMA chatbot
- **VNPAY** - Payment gateway

### Monitoring
- **Prometheus** - Metrics collection
- **Grafana** - Visualization & Dashboards

## Project Structure

```
pingup-full-stack/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # Axios config
│   │   ├── app/           # Redux store
│   │   ├── components/    # UI components
│   │   ├── features/      # Redux slices
│   │   ├── hooks/         # Custom hooks (useE2EE)
│   │   ├── utils/         # Crypto utilities
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
│   │   ├── shared-libs/   # Guards, Decorators, Filters
│   │   └── external-infra/# Redis, Kafka, WebSocket, Prometheus
│   ├── monitoring/
│   │   ├── prometheus/    # Prometheus config & alert rules
│   │   └── grafana/       # Grafana dashboards & datasources
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

# Start infrastructure (PostgreSQL, Redis, Kafka, Prometheus, Grafana)
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

| Service | URL | Description |
|---------|-----|-------------|
| Client | http://localhost:5173 | React frontend |
| API | http://localhost:4000 | NestJS backend |
| Kafka UI | http://localhost:8080 | Kafka management |
| Prometheus | http://localhost:9090 | Metrics & queries |
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |

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

# Groq AI (optional)
GROQ_API_KEY=

# VNPAY (optional)
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=
VNPAY_RETURN_URL=
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
- Guest login (limited features)
- JWT tokens with refresh
- Two-factor authentication (2FA)
- Password reset via email

### Social
- Create posts with images/videos
- Like, comment, share posts
- Stories (24h expiry)
- Follow/unfollow users
- Friend connections
- Trending posts (time-decay algorithm)

### Messaging
- Real-time 1-1 chat
- Group chat
- End-to-end encryption (E2EE)
- Voice messages with AI transcription
- Message requests
- Message deletion/unsend
- Read receipts
- Typing indicators

### AI Features
- Voice message transcription (Groq Whisper)
- AI Chatbot (Groq LLaMA 3.3 70B)
- Vietnamese language support

### Payment
- VNPAY integration
- Premium subscription (Monthly/Yearly)
- Coin wallet system
- Transaction history

### Notifications
- Push notifications (via Kafka)
- Email notifications
- In-app notifications

### Search
- Full-text search (PostgreSQL tsvector)
- User search
- Hashtag search
- Advanced filters

### Security
- Rate limiting (Redis sliding window)
- E2E encryption for messages
- 2FA with TOTP
- JWT with refresh token rotation

## Monitoring

### Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_requests_in_flight` | Gauge | Active requests |
| `websocket_connections_active` | Gauge | WebSocket connections |
| `websocket_events_total` | Counter | WebSocket events |

### Grafana Dashboards

Pre-configured dashboard includes:
- Request Rate & Error Rate
- Response Time Percentiles (p50, p95, p99)
- Top Routes by Traffic
- WebSocket Connections
- System Resources (CPU, Memory)
- Service Health Status

### Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| ServiceDown | Service unavailable > 1min | Critical |
| HighErrorRate | Error rate > 5% for 2min | Warning |
| HighResponseTime | p95 > 2s for 5min | Warning |
| HighMemoryUsage | RSS > 850MB for 5min | Warning |

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

Client is deployed on Vercel. Configuration in `client/vercel.json`.

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
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Prometheus  │────▶│   Grafana   │
                    │  (Metrics)  │     │    (UI)     │
                    └─────────────┘     └─────────────┘
```

### Event-Driven Flow

1. **User Action** → App API receives request
2. **Produce Event** → App API publishes event to Kafka topic
3. **Consume Event** → Notification service consumes from Kafka
4. **Process** → Send push notification / email / store in DB
5. **Real-time** → Socket.IO broadcasts to connected clients

### Monitoring Flow

1. **Request** → MetricsInterceptor records metrics
2. **Expose** → NestJS exposes /metrics endpoint
3. **Scrape** → Prometheus scrapes metrics every 15s
4. **Store** → Prometheus stores in time-series database
5. **Query** → Grafana queries Prometheus with PromQL
6. **Visualize** → Grafana renders charts and dashboards

## License

MIT
