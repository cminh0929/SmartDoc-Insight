# Project Manifest: Document Management System (IT Support)

## 1. Nhật ký tiến độ (Process Log)

- **Current Status**: DỰ ÁN HOÀN TẤT - PHIÊN BẢN 1.0.0. Hệ thống quản lý tài liệu IT Support Document Insight đã được đóng gói hoàn chỉnh với kiến trúc SaaS (Enterprise Multi-Tenancy), RBAC động, và Full-Text Search qua Meilisearch.
- **Last Action**: Chốt phiên bản v1.0.0. Tạo tài liệu hướng dẫn chạy dự án trên máy Windows (`TUTORIAL.md`) giải quyết vấn đề cấu hình PATH và cơ sở dữ liệu.
- **Next Action**: Thiết lập dự án trên máy mới theo hướng dẫn trong `TUTORIAL.md`, khởi chạy Postgres qua Docker và kiểm thử luồng nghiệp vụ cơ bản.

## 2. Cấu trúc thư mục & Chức năng (Folder & File Details)

### Backend (`/backend`)

- `src/db/`: Chứa `schema.ts` và `database.module.ts` (Drizzle ORM).
- `src/common/`: Chứa `BaseService`, `StorageService` (Local FS).
- `src/modules/`: Chứa `DocumentsModule`, `SearchModule`, `FoldersModule`, `AuthModule`, `DashboardModule`, `AuditLogsModule`, `PermissionsModule`, `TagsModule`, `RolesModule`, `TenantsModule`.
- `drizzle.config.ts`: Cấu hình kết nối và migration DB.

### Frontend (`/frontend`)

- `src/app/`: Next.js App Router (Layout & Pages).
- `src/components/`: Chứa `layout/` (Sidebar, Header), `modules/` (Documents, Folders, Dashboard, Permissions) và `ui/` (Shadcn).
- `src/lib/`: Chứa các hàm tiện ích (`utils.ts`, `api.ts`).

### Shared (`/shared`)

- `index.ts`: Các Schema (Zod) và Types dùng chung (bao gồm Audit Logs, Permissions, Tags).

## 3. Quy tắc chống trùng lặp (Anti-Redundancy Rules)

- **Search Before Create**: Trước khi tạo hàm mới, AI phải quét thư mục `common/` và các service liên quan.
- **Atomic Functions**: Mỗi hàm chỉ làm một việc duy nhất (Single Responsibility).
- **Manifest Priority**: Luôn cập nhật file này sau mỗi task lớn để duy trì bối cảnh cho các phiên làm việc sau.
- **Type Safety**: Ưu tiên sử dụng shared types và tránh ép kiểu `any` trừ khi thực sự cần thiết (đã cấu hình ESLint để hỗ trợ dev nhanh).

## 4. Trạng thái hạ tầng (Infrastructure Status)

- **Postgres**: Chạy qua Docker Container trên Windows (hoặc Windows Service nếu có).
  - Lệnh khởi chạy nhanh qua Docker: `docker run --name smartdoc-postgres -e POSTGRES_USER=it_support_admin -e POSTGRES_PASSWORD=your_password_here -e POSTGRES_DB=manage_document_db -p 5432:5432 -d postgres:16`
  - DB Name: `manage_document_db`
  - Admin User: `it_support_admin` / `it_support_password` (Đã phân quyền OWNER).
  - Port: `5432`
- **Backend API**: `http://localhost:3001` (NestJS)
- **Frontend App**: `http://localhost:3000` (Next.js)
- **Meilisearch**: Chạy cục bộ tại `http://localhost:7700` (Master Key: `it_support_master_key`).
- **Storage**: Local Filesystem (`backend/uploads`).
- **Redis**: In-memory (tùy chọn).
