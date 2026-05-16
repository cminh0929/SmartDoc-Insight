## Project Manifest: Document Management System (IT Support)

### Task Type

- [x] Project Management (→ Parallel)

### Technical Solution

Thiết lập một "Bản đồ dự án" động để theo dõi tiến độ, ghi lại các thay đổi và định nghĩa rõ chức năng của từng thành phần, giúp tránh trùng lặp mã nguồn (Duplicate Code) và các hàm/file thừa.

#### 1. Nhật ký tiến độ (Process Log)

- **Current Status**: Đang ở giai đoạn "Planning & Setup".
- **Last Action**: Đã hoàn thiện hệ thống 7 bản kế hoạch liên kết.
- **Next Action**: Thực thi Master Plan để khởi tạo hạ tầng.

#### 2. Cấu trúc thư mục & Chức năng (Folder & File Details)

- `backend/src/modules/`: Chứa các Business Logic tách biệt (Storage, Search, Auth).
- `backend/src/common/`: Chứa các Base Classes, Interfaces dùng chung (tránh viết lại logic).
- `frontend/src/components/`: Chia nhỏ thành UI (nguyên tử) và Modules (phức hợp).
- `shared/`: Chứa Zod Schemas và Types dùng chung cho cả Front và Back.

#### 3. Quy tắc chống trùng lặp (Anti-Redundancy Rules)

- **Search Before Create**: Trước khi tạo hàm mới, AI phải quét thư mục `common/` và các service liên quan.
- **Atomic Functions**: Mỗi hàm chỉ làm một việc duy nhất (Single Responsibility).
- **Session Handoff**: Cuối mỗi phiên làm việc, cập nhật file này để phiên sau AI có thể "đọc vị" và chạy tiếp ngay lập tức.

### Implementation Steps

1. **Initialize Manifest** - Tạo file `MANIFEST.md` tại gốc dự án.
2. **Structure Mapping** - Ghi chú chức năng của các thư mục chính ngay khi chúng được tạo ra.
3. **Change Tracking Setup** - Thiết lập quy trình ghi log sau mỗi lần thực thi `/ccg:execute`.
4. **Validation Check** - Trước khi code chức năng mới, đối chiếu với danh sách "Feature List" trong manifest.

### Key Files

| File                       | Operation | Description                                                 |
| -------------------------- | --------- | ----------------------------------------------------------- |
| `MANIFEST.md`              | Create    | File nhật ký và bản đồ chức năng của toàn bộ dự án.         |
| `.agent/rules/manifest.md` | Create    | Rule yêu cầu AI phải cập nhật MANIFEST.md sau mỗi task lớn. |

### SESSION_ID (Simulated)

- CODEX_SESSION: manage_doc_manifest_be
- GEMINI_SESSION: manage_doc_manifest_fe
