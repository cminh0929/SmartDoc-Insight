# Project Manifest: Document Management System (IT Support)

## 1. Nhật ký tiến độ (Process Log)

- **Current Status**: Giai đoạn 6 hoàn tất. Bắt đầu Giai đoạn 7 (Tính năng nâng cao: Tags, Permissions).
- **Last Action**: Triển khai hệ thống Audit Logs toàn diện (BE/FE) và tính năng xuất báo cáo CSV cho quản trị viên.
- **Next Action**: [Giai đoạn 7] Triển khai hệ thống Gán nhãn (Tags), Phân quyền tài liệu (Document Permissions) và Quản lý phiên bản nâng cao.

## 2. Cấu trúc thư mục & Chức năng (Folder & File Details)

### Backend (`/backend`)

- `src/db/`: Chứa `schema.ts` và `database.module.ts` (Drizzle ORM).
- `src/common/`: Chứa `BaseService`, `StorageService` (Local FS).
- `src/modules/`: Chứa `DocumentsModule`, `SearchModule`, `FoldersModule`, `AuthModule`, `DashboardModule`, `AuditLogsModule`.
- `drizzle.config.ts`: Cấu hình kết nối và migration DB.

### Frontend (`/frontend`)

- `src/app/`: Next.js App Router (Layout & Pages).
- `src/components/`: Chứa `layout/` (Sidebar, Header), `modules/` (Documents, Folders, Dashboard) và `ui/` (Shadcn).
- `src/lib/`: Chứa các hàm tiện ích (`utils.ts`, `api.ts`).

### Shared (`/shared`)

- `index.ts`: Các Schema (Zod) và Types dùng chung.

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
