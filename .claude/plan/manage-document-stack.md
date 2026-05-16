## Implementation Plan: Tech Stack & Architecture for Document Management System

### Task Type

- [ ] Frontend (→ Gemini)
- [ ] Backend (→ Codex)
- [x] Fullstack (→ Parallel)

### Technical Solution

Một hệ thống Hybrid hiện đại kết hợp giữa khả năng quản lý dữ liệu chặt chẽ của SQL và khả năng tìm kiếm linh hoạt.

#### 1. Ngôn ngữ & Framework (Hybrid Core)

- **TypeScript**: Sử dụng xuyên suốt từ Backend đến Frontend để đảm bảo tính an toàn dữ liệu.
- **Backend**:
  - **NestJS**: Kiến trúc Modular mạnh mẽ, phù hợp cho hệ thống doanh nghiệp.
  - **Fastify**: Nếu ưu tiên tốc độ xử lý I/O cao cho việc truyền tải file.
- **Frontend**:
  - **Next.js 14+ (App Router)**: Tối ưu SEO (nếu cần) và Server-side Rendering cho metadata.
  - **Tailwind CSS & Shadcn/UI**: Xây dựng giao diện chuyên nghiệp, nhanh chóng.

#### 2. Cơ sở dữ liệu & Tìm kiếm (Hybrid Storage)

- **PostgreSQL**: Lưu trữ metadata, quan hệ thư mục và quản lý phiên bản.
- **Drizzle ORM**: Type-safe ORM cực nhẹ, tối ưu cho SQL thuần.
- **Meilisearch (Hybrid Search)**: Kết hợp với PostgreSQL FTS để cung cấp trải nghiệm "Instant Search" (tìm kiếm ngay khi gõ) cho người dùng IT Support.
- **Redis**: (Tùy chọn) Caching cho các truy vấn thư mục phức tạp và session người dùng. Có thể sử dụng In-memory cache nếu không cài được Redis cục bộ.
- **Local Filesystem**: Lưu trữ file vật lý trực tiếp trên ổ đĩa cục bộ trong quá trình phát triển để thay thế MinIO.

#### 3. Kiến trúc (Architecture)

- **Modular Monolith**: Chia hệ thống thành các module (Auth, Storage, Search, Audit) để dễ dàng bảo trì nhưng không quá phức tạp như Microservices.
- **Clean Architecture**: Tách biệt logic nghiệp vụ khỏi các framework và database.
- **Object Storage**: Sử dụng **MinIO** (Local/On-premise) hoặc **AWS S3** để lưu trữ file vật lý tập trung.

#### 4. Kỹ thuật bổ trợ

- **Local Host Services**: Chạy trực tiếp các binary của Postgres, Meilisearch trên Windows để triển khai.
- **Zod**: Validation dữ liệu đầu vào.
- **React Query (TanStack Query)**: Quản lý trạng thái server và caching ở Frontend.

### Key Reference Files

| File              | Operation | Description                                    |
| ----------------- | --------- | ---------------------------------------------- |
| `.env`            | Create    | Cấu hình kết nối Postgres, Meilisearch local.  |
| `architecture.md` | Create    | Tài liệu hướng dẫn kiến trúc và luồng dữ liệu. |

### SESSION_ID (Simulated)

- CODEX_SESSION: manage_doc_stack_be
- GEMINI_SESSION: manage_doc_stack_fe
