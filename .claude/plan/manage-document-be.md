## Implementation Plan: Backend Service (IT Support Document Management)

### Task Type

- [x] Backend (→ Codex)

### Technical Solution

Xây dựng Core Backend sử dụng **NestJS**, **Drizzle ORM** và **PostgreSQL**. Hỗ trợ lưu trữ file tập trung và đánh chỉ mục tìm kiếm.

### Implementation Steps

1. **Initialize NestJS** - Khởi tạo dự án NestJS với TypeScript.
2. **Database & Drizzle** - Thiết lập kết nối Postgres và định nghĩa schema (Users, Folders, Documents).
3. **Storage Module** - Sử dụng Local Filesystem để quản lý file vật lý (thay thế MinIO).
4. **Search Module** - Tích hợp Meilisearch binary chạy cục bộ để đồng bộ dữ liệu tìm kiếm.
5. **Core API Services** - Viết CRUD cho Folders và Documents.

### Key Files

| File                           | Operation | Description                       |
| ------------------------------ | --------- | --------------------------------- |
| `backend/src/db/schema.ts`     | Create    | Định nghĩa cấu trúc DB.           |
| `backend/src/modules/storage/` | Create    | Xử lý upload/download file.       |
| `backend/src/modules/search/`  | Create    | Đồng bộ dữ liệu sang Meilisearch. |

### SESSION_ID (Simulated)

- CODEX_SESSION: manage_doc_be_exec
- GEMINI_SESSION: manage_doc_be_ui_sim
