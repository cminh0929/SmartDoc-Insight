## Implementation Plan: API Bridge & Integration

### Task Type

- [x] Fullstack (→ Parallel)

### Technical Solution

Kết nối Frontend và Backend thông qua **Axios**, **React Query** và **Zod Schemas** dùng chung. Đảm bảo tính nhất quán về kiểu dữ liệu giữa hai bên.

### Implementation Steps

1. **Shared Schemas** - Định nghĩa các Zod schemas cho Request/Response.
2. **API Client Setup** - Cấu hình Axios instance với base URL và interceptors.
3. **React Query Hooks** - Viết các custom hooks (useDocuments, useUpload, useSearch).
4. **Proxy/CORS Config** - Thiết lập CORS trên Backend và Proxy trên Frontend.

### Key Files

| File                             | Operation | Description             |
| -------------------------------- | --------- | ----------------------- |
| `shared/schemas/`                | Create    | Zod schemas dùng chung. |
| `frontend/src/lib/api-client.ts` | Create    | Cấu hình Axios.         |
| `frontend/src/hooks/api/`        | Create    | Các React Query hooks.  |

### SESSION_ID (Simulated)

- CODEX_SESSION: manage_doc_bridge_be
- GEMINI_SESSION: manage_doc_bridge_fe
