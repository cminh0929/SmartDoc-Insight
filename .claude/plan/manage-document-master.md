## Master Implementation Plan: Document Management System (IT Support)

### Overview

Đây là bản kế hoạch tổng thể kết nối tất cả các thành phần đã được thiết lập. Việc thực thi bản kế hoạch này sẽ điều phối Claude hoàn thiện hệ thống theo đúng quy trình từ thiết kế đến triển khai.

### Interconnected Plans (The Ecosystem)

1. **[Design & Schema](./manage-document-db.md)**: Định nghĩa cấu trúc dữ liệu PostgreSQL & FTS.
2. **[Architecture & Stack](./manage-document-stack.md)**: Thiết lập hạ tầng Docker, NestJS, Next.js, Meilisearch.
3. **[Visual Guidelines](./manage-document-diagrams.md)**: Tạo sơ đồ Use Case & Sequence (Mermaid).
4. **[Coding Standards & QA](./manage-document-standards.md)**: Thiết lập Clean Code, OOP và quy trình Testing.
5. **[Project Manifest & Log](./manage-document-manifest.md)**: Theo dõi tiến độ, log thay đổi và bản đồ chức năng file/folder.
6. **[Backend Core](./manage-document-be.md)**: Triển khai NestJS Services, Storage & Search modules.
7. **[Frontend Portal](./manage-document-fe.md)**: Triển khai Next.js UI & Explorer components.
8. **[Integration Bridge](./manage-document-api-bridge.md)**: Kết nối API, shared schemas và React Query hooks.
9. **[Enterprise Multi-Tenancy](./enterprise-multi-tenancy.md)**: Thiết lập phân vùng cô lập dữ liệu Doanh nghiệp đa người dùng (Multi-Tenant SaaS).

### Unified Implementation Roadmap

#### Giai đoạn 1: Chuẩn bị & Hạ tầng (Setup Phase)

- Cài đặt dịch vụ cục bộ trên Windows (Postgres, Meilisearch).
- Triển khai thiết kế DB (`db.md`) và khởi tạo `MANIFEST.md` (`manifest.md`).
- **Setup Quality Gate**: Cài đặt ESLint, Prettier, Jest theo `manage-document-standards.md`.

#### Giai đoạn 2: Phát triển Core (Core Development)

- Phát triển Backend (`be.md`) và Frontend (`fe.md`) song song với việc viết Unit Test cho từng chức năng mới.

#### Giai đoạn 3: Kết nối & Kiểm thử (Integration Phase)

- Thiết lập API Bridge theo `manage-document-api-bridge.md`.
- Kiểm thử luồng nghiệp vụ IT Support (Upload, Fast Search, Versioning).

### Key Output Files

- Local Setup (Postgres, Meilisearch binaries)
- `backend/` (NestJS Service)
- `frontend/` (Next.js App)
- `docs/diagrams.md` (System documentation)

### SESSION_ID (Master Coordination)

- CODEX_SESSION: master_coord_be_v2
- GEMINI_SESSION: master_coord_fe_v2
