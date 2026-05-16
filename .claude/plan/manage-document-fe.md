## Implementation Plan: Frontend Application (IT Support UI)

### Task Type

- [x] Frontend (→ Gemini)

### Technical Solution

Xây dựng giao diện người dùng hiện đại với **Next.js 14**, **Tailwind CSS** và **Shadcn/UI**. Tập trung vào trải nghiệm quản lý file và tìm kiếm tức thì.

### Implementation Steps

1. **Initialize Next.js** - Khởi tạo dự án với App Router và Tailwind.
2. **UI Foundation** - Cài đặt Shadcn/UI và thiết lập Theme (Light/Dark).
3. **Layout & Navigation** - Xây dựng Sidebar và Topbar cho IT Support Portal.
4. **Document Explorer** - Phát triển component Tree View và File Grid.
5. **Search Interface** - Xây dựng thanh tìm kiếm với kết quả trả về tức thì.

### Key Files

| File                                | Operation | Description                     |
| ----------------------------------- | --------- | ------------------------------- |
| `frontend/src/app/layout.tsx`       | Create    | Cấu trúc layout chung.          |
| `frontend/src/components/explorer/` | Create    | Component quản lý file/thư mục. |
| `frontend/src/components/search/`   | Create    | Giao diện tìm kiếm.             |

### SESSION_ID (Simulated)

- CODEX_SESSION: manage_doc_fe_be_sim
- GEMINI_SESSION: manage_doc_fe_exec
