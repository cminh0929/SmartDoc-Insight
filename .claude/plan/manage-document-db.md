## Implementation Plan: Document Management System (IT Support) - Database Layer

### Task Type

- [ ] Frontend (→ Gemini)
- [x] Backend (→ Codex)
- [ ] Fullstack (→ Parallel)

### Technical Solution

Xây dựng cơ sở dữ liệu PostgreSQL tối ưu cho việc lưu trữ tài liệu tập trung và tìm kiếm nhanh (Fast Search), phục vụ bộ phận **IT Support**.

#### Database Schema Highlights:

- **`folders` & `categories`**: Cấu trúc cây để phân loại tài liệu theo thiết bị, phần mềm, hoặc quy trình IT.
- **`documents`**: Metadata phong phú hỗ trợ tìm kiếm (tiêu đề, mô tả, từ khóa).
- **`document_versions`**: Quản lý lịch sử thay đổi và lưu trữ file tập trung.
- **`full_text_search`**: Tận dụng `tsvector` của PostgreSQL để hỗ trợ tìm kiếm nội dung nhanh chóng.
- **`users` & `permissions`**: Phân quyền cho thực tập sinh (Intern) và quản lý (IT Admin).

### Implementation Steps

1. **Initialize Project** - Cài đặt Node.js, TypeScript, và Drizzle ORM.
2. **Database Configuration** - Cài đặt PostgreSQL local trên Windows và cấu hình biến môi trường.
3. **Schema Definition** - Định nghĩa các bảng (Users, Folders, Documents, Versions, Tags) với hỗ trợ Full-Text Search.
4. **Migration Strategy** - Tạo và chạy migration bằng Drizzle Kit.
5. **Seeding Script** - Tạo dữ liệu mẫu phù hợp với bối cảnh IT Support (ví dụ: thư mục "Hardware Manuals", "Software Licenses").
6. **Search Optimization** - Tạo GIN index trên các cột metadata để tối ưu tốc độ tìm kiếm.

### Key Files

| File               | Operation | Description                            |
| ------------------ | --------- | -------------------------------------- |
| `package.json`     | Create    | Project dependencies.                  |
| `src/db/schema.ts` | Create    | Schema định nghĩa bảng và FTS indexes. |
| `src/db/seed.ts`   | Create    | Script tạo dữ liệu mẫu cho IT Support. |
| `.env`             | Create    | Database connection string.            |

### Risks and Mitigation

| Risk                            | Mitigation                                                              |
| ------------------------------- | ----------------------------------------------------------------------- |
| Tốc độ tìm kiếm khi dữ liệu lớn | Sử dụng GIN Index và tsvector để tối ưu Full-Text Search.               |
| Bảo mật tài liệu nhạy cảm       | Triển khai Row-Level Security (RLS) hoặc middleware kiểm tra quyền hạn. |

### SESSION_ID (Simulated)

- CODEX_SESSION: manage_doc_be_sim_v2
- GEMINI_SESSION: manage_doc_fe_sim_v2
