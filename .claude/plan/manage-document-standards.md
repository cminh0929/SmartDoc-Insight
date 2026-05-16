## Implementation Plan: Coding Standards & Quality Assurance

### Task Type

- [x] Engineering Standards (→ Parallel)

### Technical Solution

Thiết lập bộ tiêu chuẩn lập trình và quy trình kiểm thử tự động để đảm bảo code sạch (Clean Code), dễ bảo trì (OOP) và ít lỗi.

#### 1. Nguyên tắc lập trình (Coding Principles)

- **SOLID & OOP**: Tận dụng tối đa Dependency Injection của NestJS để tách biệt các lớp logic.
- **Clean Code**: Đặt tên biến/hàm tường minh, hàm ngắn gọn (không quá 20 dòng), xử lý lỗi tập trung.
- **DRY (Don't Repeat Yourself)**: Tạo các Shared Modules cho Storage, Search và Database Utilities.

#### 2. Chiến lược kiểm thử (Testing Strategy)

- **Unit Testing (Jest)**: Kiểm thử logic nghiệp vụ trong các Services (độ phủ > 80%).
- **Integration Testing**: Kiểm thử khả năng kết nối giữa Controller -> Service -> Database.
- **E2E Testing (Playwright)**: Kiểm thử các luồng quan trọng (Upload -> Search -> View) trên trình duyệt thực tế.

#### 3. Công cụ hỗ trợ (Tooling)

- **ESLint & Prettier**: Tự động hóa việc định dạng và kiểm tra lỗi cú pháp.
- **Husky & Lint-staged**: Chặn commit nếu code chưa pass linting hoặc unit test.
- **Vitest/Jest**: Runner cho các bộ test.

### Implementation Steps

1. **Quality Tooling Setup** - Cài đặt ESLint, Prettier, Jest và cấu hình Husky.
2. **Base Service Class** - Xây dựng các Base Classes (Abstract) để các service kế thừa, đảm bảo tính OOP.
3. **Unit Test Boilerplate** - Tạo file mẫu `.spec.ts` cho các service chính.
4. **Integration Test Setup** - Cấu hình test database (Testcontainers hoặc Postgres Docker riêng).
5. **Quality Gate Integration** - Thêm script `npm test` vào quy trình build.

### Key Files

| File                  | Operation | Description                                            |
| --------------------- | --------- | ------------------------------------------------------ |
| `.eslintrc.js`        | Create    | Cấu hình linting cho dự án.                            |
| `jest.config.ts`      | Create    | Cấu hình bộ test.                                      |
| `backend/src/common/` | Create    | Chứa các Base Classes, Decorators và Utils dùng chung. |

### SESSION_ID (Simulated)

- CODEX_SESSION: manage_doc_qa_be
- GEMINI_SESSION: manage_doc_qa_fe
