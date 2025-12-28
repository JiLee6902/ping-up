# PingUp Express → NestJS Migration Plan

## Migration Decisions
- **Authentication**: JWT thuần (thay Clerk)
- **Database**: PostgreSQL/TypeORM (thay MongoDB/Mongoose)
- **Background Jobs**: Bull Queue + NestJS Schedule (thay Inngest)
- **Real-time**: WebSocket/Socket.io (thay SSE)
- **Storage**: ImageKit (giữ nguyên)

---

## Phase 1: Core Infrastructure ✅ (Đã hoàn thành)
- [x] Monorepo structure (nest-cli.json)
- [x] Package.json với dependencies
- [x] TypeScript config
- [x] Entity library với base entities
- [x] Enum library
- [x] Shared-libs (decorators, guards, filters, dto)
- [x] External-infra (redis, kafka, storage, websocket, email modules)

---

## Phase 2: App-API Bootstrap (Ưu tiên cao)
- [ ] **2.1** Tạo main.ts với global config (CORS, ValidationPipe, prefix)
- [ ] **2.2** Tạo app.module.ts với tất cả imports
- [ ] **2.3** Tạo database.module.ts (TypeORM PostgreSQL config)
- [ ] **2.4** Tạo config module với environment variables
- [ ] **2.5** Thêm ImageKit module/service cho upload

---

## Phase 3: Authentication Module (JWT)
- [ ] **3.1** Tạo auth.module.ts
- [ ] **3.2** Tạo jwt.strategy.ts (Passport JWT)
- [ ] **3.3** Tạo auth.service.ts (register, login, refresh, logout)
- [ ] **3.4** Tạo auth.controller.ts với endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/logout
- [ ] **3.5** Tạo DTOs (register.dto, login.dto)
- [ ] **3.6** Cập nhật jwt-auth.guard.ts để validate đúng

---

## Phase 4: User Domain Module
- [ ] **4.1** Tạo user.module.ts
- [ ] **4.2** Tạo user.repository.ts
- [ ] **4.3** Tạo user.service.ts với logic:
  - getUserData()
  - updateUserData() với ImageKit upload
  - discoverUsers() search
  - followUser() / unfollowUser()
  - sendConnectionRequest() với rate limiting
  - acceptConnectionRequest()
  - getUserConnections()
- [ ] **4.4** Tạo user.controller.ts với endpoints:
  - GET /api/user/data
  - POST /api/user/update (multipart)
  - POST /api/user/discover
  - POST /api/user/follow
  - POST /api/user/unfollow
  - POST /api/user/connect
  - POST /api/user/accept
  - GET /api/user/connections
  - POST /api/user/profiles (public)
- [ ] **4.5** Tạo DTOs (update-user.dto, discover.dto, etc.)

---

## Phase 5: Post Domain Module
- [ ] **5.1** Tạo post.module.ts
- [ ] **5.2** Tạo post.repository.ts
- [ ] **5.3** Tạo post.service.ts với logic:
  - addPost() với ImageKit upload (max 4 images)
  - getFeedPosts() (user + connections + following)
  - likePost() toggle
- [ ] **5.4** Tạo post.controller.ts với endpoints:
  - POST /api/post/add (multipart)
  - GET /api/post/feed
  - POST /api/post/like
- [ ] **5.5** Tạo DTOs (create-post.dto, like-post.dto)

---

## Phase 6: Message Domain Module (WebSocket)
- [ ] **6.1** Tạo message.module.ts
- [ ] **6.2** Tạo message.repository.ts
- [ ] **6.3** Tạo message.service.ts với logic:
  - sendMessage() với WebSocket broadcast
  - getChatMessages() và mark as seen
  - getRecentMessages()
- [ ] **6.4** Tạo message.controller.ts với endpoints:
  - POST /api/message/send (multipart)
  - POST /api/message/get
  - GET /api/user/recent-messages
- [ ] **6.5** Cập nhật websocket.gateway.ts để handle:
  - User connection tracking
  - Real-time message delivery
  - Online status
- [ ] **6.6** Tạo DTOs (send-message.dto, get-messages.dto)

---

## Phase 7: Story Domain Module
- [ ] **7.1** Tạo story.module.ts
- [ ] **7.2** Tạo story.repository.ts
- [ ] **7.3** Tạo story.service.ts với logic:
  - addUserStory() với ImageKit upload
  - getStories() từ connections/following
  - deleteStory() (scheduled via Bull)
- [ ] **7.4** Tạo story.controller.ts với endpoints:
  - POST /api/story/create (multipart)
  - GET /api/story/get
- [ ] **7.5** Tạo DTOs (create-story.dto)

---

## Phase 8: Background Jobs (Bull + Schedule)
- [ ] **8.1** Tạo jobs.module.ts trong app-api
- [ ] **8.2** Tạo story-cleanup.processor.ts (xóa story sau 24h)
- [ ] **8.3** Tạo connection-reminder.processor.ts (nhắc nhở connection pending)
- [ ] **8.4** Tạo notification.processor.ts (email notifications)

---

## Phase 9: Cronjob Worker App
- [ ] **9.1** Tạo main.ts cho cronjob-worker
- [ ] **9.2** Tạo cronjob.module.ts
- [ ] **9.3** Tạo unseen-messages.cron.ts (daily email summary 9 AM)

---

## Phase 10: Notification App
- [ ] **10.1** Tạo main.ts cho notification service
- [ ] **10.2** Tạo notification.module.ts
- [ ] **10.3** Kafka consumer để xử lý notification events

---

## Phase 11: Testing & Finalization
- [ ] **11.1** Test all endpoints với Postman/Insomnia
- [ ] **11.2** Verify WebSocket messaging
- [ ] **11.3** Verify background jobs
- [ ] **11.4** Update client API calls nếu cần
- [ ] **11.5** Documentation

---

## Environment Variables Needed

```env
# Application
NODE_ENV=development
APP_PORT=4000
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=pingup

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# Email (SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SENDER_EMAIL=
```

---

## Progress Tracking

| Phase | Status | Last Updated |
|-------|--------|--------------|
| Phase 1 | ✅ Done | - |
| Phase 2 | ✅ Done | 2025-12-26 |
| Phase 3 | ✅ Done | 2025-12-26 |
| Phase 4 | ✅ Done | 2025-12-26 |
| Phase 5 | ✅ Done | 2025-12-26 |
| Phase 6 | ✅ Done | 2025-12-26 |
| Phase 7 | ✅ Done | 2025-12-26 |
| Phase 8 | ✅ Done | 2025-12-26 |
| Phase 9 | ✅ Done | 2025-12-26 |
| Phase 10 | ✅ Done | 2025-12-26 |
| Phase 11 | ⏳ Pending (Testing) | - |

---

## Notes
- Entities đã có sẵn trong libs/entity (cần review lại cho phù hợp)
- External-infra modules đã có sẵn (redis, kafka, websocket, storage, email)
- Shared-libs đã có guards, decorators, filters
