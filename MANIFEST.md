# Project Manifest: Document Management System (IT Support)

## 1. Nhật ký tiến độ (Process Log)

- **Current Status**: Giai đoạn 9 (RBAC & Custom Roles) hoàn tất xuất sắc. Dự án đã được nâng cấp với khả năng tạo và cấp quyền động (Custom Roles) trực tiếp từ giao diện Quản trị.
- **Last Action**: Tích hợp module quản lý Vai trò (Roles & Permissions) trong `Settings`, cho phép tick/bật các cờ quyền hạn (ví dụ: View Audit Logs, Create Root Folders) và tự động đồng bộ vào PostgreSQL theo thời gian thực. Bổ sung script hướng dẫn Onboarding cho AI mới.
- **Next Action**: Bắt đầu Giai đoạn 10: Triển khai Kế hoạch Cô lập Doanh nghiệp Đa người dùng (Multi-Tenant Enterprise SaaS) theo bản thiết kế kiến trúc `.claude/plan/enterprise-multi-tenancy.md`.

## 2. Cấu trúc thư mục & Chức năng (Folder & File Details)

### Backend (`/backend`)

- `src/db/`: Chứa `schema.ts` và `database.module.ts` (Drizzle ORM).
- `src/common/`: Chứa `BaseService`, `StorageService` (Local FS).
- `src/modules/`: Chứa `DocumentsModule`, `SearchModule`, `FoldersModule`, `AuthModule`, `DashboardModule`, `AuditLogsModule`, `PermissionsModule`, `TagsModule`, `RolesModule`.
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

- **Postgres**: Chạy cục bộ (Windows Service: `postgresql-x64-16`).
  - DB Name: `manage_document_db`
  - Admin User: `it_support_admin` / `it_support_password` (Đã phân quyền OWNER).
  - Port: `5432`
- **Backend API**: `http://localhost:3001` (NestJS)
- **Frontend App**: `http://localhost:3000` (Next.js)
- **Meilisearch**: Chạy cục bộ tại `http://localhost:7700` (Master Key: `it_support_master_key`).
- **Storage**: Local Filesystem (`backend/uploads`).
- **Redis**: In-memory (tùy chọn).
