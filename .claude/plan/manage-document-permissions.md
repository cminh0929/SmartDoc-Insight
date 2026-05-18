## Implementation Plan: Document & Folder Permissions (IT Support System)

### Overview
Xây dựng hệ thống phân quyền chi tiết (Document & Folder Permissions) giúp kiểm soát quyền hạn truy cập của từng người dùng cụ thể đối với từng tài liệu hoặc thư mục trong hệ thống. Quyền truy cập sẽ tuân thủ nguyên tắc kế thừa từ thư mục cha xuống thư mục con và tài liệu bên trong.

---

### 1. Phân tích Nghiệp vụ & Kiến trúc Quyền hạn (Security Model)

#### Quyền hạn cơ bản (Permission Levels):
*   `read`: Xem danh sách, tải xuống tài liệu, xem thông tin chi tiết tài liệu/thư mục.
*   `write`: Được tải lên tài liệu mới vào thư mục, tạo phiên bản mới, đổi tên thư mục/tài liệu.
*   `admin` (Owner): Toàn quyền quản lý, bao gồm chia sẻ quyền truy cập, thu hồi quyền truy cập, và xóa vĩnh viễn tài liệu/thư mục.

#### Cơ chế kế thừa (Inheritance & Resolving Logic):
Hiệu lực quyền hạn truy cập (`effectivePermission`) của một `User` đối với một `Document` hoặc `Folder` được tính toán đệ quy theo thứ tự ưu tiên sau:
1.  **Quyền Quản trị viên (Super Admin Role)**: Nếu `User` có `role === 'admin'` trong bảng `users`, mặc định có toàn quyền `admin` trên toàn hệ thống.
2.  **Quyền Sở hữu (Owner/Creator)**: Nếu `User` là `ownerId` của tài liệu hoặc người tạo thư mục, mặc định có quyền `admin` trên thực thể đó.
3.  **Quyền cấu hình trực tiếp (Explicit Permission)**: Nếu có bản ghi phân quyền trực tiếp cho `User` trên `Document` hoặc `Folder` này, áp dụng cấp quyền cao nhất được gán trực tiếp.
4.  **Quyền kế thừa từ thư mục cha (Inherited Permission)**: Nếu không có cấu hình trực tiếp, tìm đệ quy ngược lên thư mục cha (`parentId`) gần nhất có cấu hình trực tiếp cho `User` này và áp dụng quyền đó.
5.  **Quyền mặc định theo vai trò (Default Fallbacks)**: Nếu hoàn toàn không có cấu hình trực tiếp hay kế thừa:
    *   `staff`: Có quyền `write` đối với tài liệu do họ tạo, quyền `read` đối với các tài liệu công khai khác.
    *   `intern`: Chỉ có quyền `read` đối với toàn bộ tài liệu công khai, không có quyền ghi/sửa trừ khi được gán cụ thể.

---

### 2. Thiết kế Cơ sở Dữ liệu (Database Schema)

Chúng ta sẽ tạo một bảng `permissions` và một kiểu Enum `permission_level` để lưu trữ thông tin cấu hình phân quyền.

```typescript
// backend/src/db/schema.ts

export const permissionLevelEnum = pgEnum('permission_level', ['read', 'write', 'admin']);

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id')
    .references(() => folders.id, { onDelete: 'cascade' }),
  level: permissionLevelEnum('level').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

### 3. Kế hoạch Triển khai Chi tiết (Implementation Phases)

#### Bước 3.1: Định nghĩa Schemas & Di trú Cơ sở dữ liệu (Database Layer)
1.  Định nghĩa bảng `permissions` trong `backend/src/db/schema.ts`.
2.  Tạo Zod Schemas dùng chung tại `shared/index.ts`:
    *   `PermissionSchema`
    *   `GrantPermissionSchema` (`userId`, `documentId`, `folderId`, `level`)
3.  Chạy di trú database thông qua `drizzle-kit generate` và `drizzle-kit push`.

#### Bước 3.2: Phát triển Core Permissions Service & Controller (Backend Layer)
1.  Tạo **PermissionsService** (`backend/src/modules/permissions/permissions.service.ts`):
    *   `grantPermission(dto)`: Gán quyền cho người dùng trên tài liệu/thư mục, tự động ghi Audit Log (`GRANT_PERMISSION`).
    *   `revokePermission(id)`: Thu hồi quyền truy cập, ghi Audit Log (`REVOKE_PERMISSION`).
    *   `getPermissionsByEntity(documentId?, folderId?)`: Xem danh sách phân quyền hiện tại của một đối tượng kèm thông tin User.
    *   `checkEffectivePermission(userId, entityType, entityId, requiredLevel)`: Hàm cốt lõi đệ quy tính toán effective permission và so sánh với cấp quyền yêu cầu (`read`, `write`, `admin`).
2.  Tạo **PermissionsGuard** (`backend/src/common/guards/permissions.guard.ts`):
    *   Một Decorator `@RequirePermission(level: 'read' | 'write' | 'admin')` để áp dụng cho các route của `DocumentsController` và `FoldersController`.
    *   Guard sẽ đọc `user` từ JWT, gọi `PermissionsService.checkEffectivePermission` để chặn hoặc cho phép truy cập.
3.  Tạo **PermissionsController** (`backend/src/modules/permissions/permissions.controller.ts`):
    *   `GET /permissions/document/:documentId` - Xem quyền hạn của tài liệu.
    *   `GET /permissions/folder/:folderId` - Xem quyền hạn của thư mục.
    *   `POST /permissions` - Gán quyền mới.
    *   `DELETE /permissions/:id` - Thu hồi quyền.
    *   Bảo vệ toàn bộ Controller bằng `JwtAuthGuard` và kiểm tra quyền `admin` của tài liệu/thư mục đích.

#### Bước 3.3: Tích hợp Frontend UI (Frontend Layer)
1.  **API Bridge Updates** (`frontend/src/lib/api.ts`):
    *   Bổ sung `permissionsApi` tương tác với các endpoint backend mới.
2.  **Share / Permissions Modal Component** (`frontend/src/components/modules/documents/permissions-modal.tsx`):
    *   Một cửa sổ chia sẻ hiện đại, chuyên nghiệp.
    *   Hiển thị danh sách những người dùng hiện có quyền truy cập trực tiếp.
    *   Giao diện thêm người dùng mới: Ô tìm kiếm/chọn thành viên kèm dropdown chọn cấp độ quyền (`Viewer`, `Editor`, `Administrator`).
    *   Bảng nút hành động xóa quyền truy cập (thu hồi).
3.  **Tích hợp Modal vào File Explorer & Document Details**:
    *   Thêm tuỳ chọn "Share" trong dropdown hành động của danh sách tài liệu.
    *   Tích hợp nút "Permissions" hoặc "Share" trong `DocumentDetailsModal` dành riêng cho chủ sở hữu tài liệu và quản trị viên.
4.  **UI Enforcement based on Permissions**:
    *   Hạn chế hiển thị hoặc vô hiệu hóa các nút nhạy cảm (Upload, Delete, Edit, Update version) nếu kết quả kiểm tra effective permission của user hiện tại không đạt yêu cầu.

---

### 4. Key Files to Modify/Create

| File | Operation | Description |
|---|---|---|
| `backend/src/db/schema.ts` | Modify | Thêm Enum và bảng `permissions`. |
| `shared/index.ts` | Modify | Định nghĩa types và schemas dùng chung cho Permissions. |
| `backend/src/modules/permissions/...` | Create | Tạo module, service, controller xử lý nghiệp vụ phân quyền. |
| `backend/src/common/guards/permissions.guard.ts` | Create | Guard kiểm tra hiệu lực quyền hạn thời gian thực cho các API. |
| `backend/src/modules/documents/documents.controller.ts` | Modify | Áp dụng `@RequirePermission` cho các route xem, sửa, xóa, tải lên. |
| `backend/src/modules/folders/folders.controller.ts` | Modify | Áp dụng `@RequirePermission` kiểm soát tạo, xóa thư mục. |
| `frontend/src/lib/api.ts` | Modify | Bổ sung API client cho module permissions. |
| `frontend/src/components/modules/documents/permissions-modal.tsx` | Create | Modal quản trị phân quyền đẹp mắt, hiện đại. |
| `frontend/src/app/documents/page.tsx` | Modify | Vô hiệu hóa tính năng và hiển thị nút dựa trên quyền hạn người dùng. |

---

### 5. SESSION_ID & Coordination

*   **CODEX_SESSION**: manage_doc_permissions_be_v3
*   **GEMINI_SESSION**: manage_doc_permissions_fe_v3
