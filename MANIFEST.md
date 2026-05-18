# Project Manifest: Document Management System (IT Support)

## 1. Nhật ký tiến độ (Process Log)

- **Current Status**: Giai đoạn 7 hoàn tất. Hệ thống Phân quyền (Permissions System) và Giao diện Chia sẻ (Sharing Portal) đã chạy ổn định.
- **Last Action**: Triển khai phân quyền đệ quy/kế thừa (BE/FE), bảo vệ endpoints qua PermissionsGuard, và xây dựng UI Sharing Modal glassmorphic cao cấp.
- **Next Action**: [Giai đoạn 8] Tối ưu hóa trải nghiệm UI/UX, kiểm thử bảo mật tự động và chuẩn bị đóng gói phân phối môi trường Production.

## 2. Cấu trúc thư mục & Chức năng (Folder & File Details)

### Backend (`/backend`)

- `src/db/`: Chứa `schema.ts` và `database.module.ts` (Drizzle ORM).
- `src/common/`: Chứa `BaseService`, `StorageService` (Local FS).
- `src/modules/`: Chứa `DocumentsModule`, `SearchModule`, `FoldersModule`, `AuthModule`, `DashboardModule`, `AuditLogsModule`, `PermissionsModule`, `TagsModule`.
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
