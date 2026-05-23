# Hướng Dẫn Cài Đặt và Vận Hành Hệ Thống SmartDoc Insight

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để thiết lập, chạy thử nghiệm (Development) và triển khai vận hành (Production) dự án **SmartDoc Insight (Hệ thống quản lý tài liệu IT Support)** khi clone về một máy tính mới.

---

## 1. Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

- **Node.js**: Phiên bản LTS mới nhất (Khuyến nghị **Node.js v18+** hoặc **v20+**).
- **PostgreSQL**: Phiên bản **16+** (Cơ sở dữ liệu chính).
- **Meilisearch**: (Tùy chọn nhưng khuyến nghị) Công cụ tìm kiếm Full-Text Search.
- **Git**: Để clone dự án.
- **PM2**: (Tùy chọn) Để quản lý quy trình chạy ứng dụng ở môi trường Production.

---

## 2. Các Bước Cài Đặt Chi Tiết

### Bước 2.1: Clone dự án và cài đặt Thư viện (Dependencies)

1. Mở Terminal và chạy lệnh clone dự án (thay thế URL git của bạn):
   ```bash
   git clone <URL_DA_AN>
   cd ManageDocument
   ```
2. Cài đặt toàn bộ thư viện cho dự án. Vì dự án được thiết kế dưới dạng **Monorepo (npm workspaces)**, bạn chỉ cần chạy một lệnh duy nhất ở thư mục gốc:
   ```bash
   npm install
   ```
   _Lệnh này sẽ tự động cài đặt thư viện cho thư mục gốc, thư mục `backend`, `frontend`, và liên kết thư mục `shared`._

---

### Bước 2.2: Cấu hình biến môi trường (Environment Variables)

Hệ thống cần cấu hình các biến môi trường cho cả Backend và Frontend để có thể kết nối với DB và các dịch vụ đi kèm.

#### 1. Cấu hình Backend:

Di chuyển vào thư mục `backend`, tạo file `.env` bằng cách copy từ file `.env.example`:

```bash
cd backend
cp .env.example .env
```

Mở file `.env` vừa tạo và chỉnh sửa các giá trị sau:

| Biến môi trường       | Ý nghĩa / Giá trị cấu hình                                                                                                                                                                   |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Chuỗi kết nối PostgreSQL. Định dạng: `postgresql://<user>:<password>@<host>:<port>/<db_name>` (Ví dụ: `postgresql://it_support_admin:it_support_password@localhost:5432/manage_document_db`) |
| `JWT_SECRET`          | Khóa bảo mật JWT để ký mã token đăng nhập. Hãy đặt một chuỗi ngẫu nhiên dài (ít nhất 32 ký tự).                                                                                              |
| `MEILISEARCH_HOST`    | URL kết nối Meilisearch (Mặc định: `http://localhost:7700`)                                                                                                                                  |
| `MEILISEARCH_API_KEY` | Master Key của Meilisearch (Ví dụ: `it_support_master_key`)                                                                                                                                  |
| `UPLOAD_DIR`          | Thư mục lưu trữ file upload vật lý (Mặc định: `./uploads`)                                                                                                                                   |
| `OPENAI_API_KEY`      | API Key của OpenAI để phục vụ tính năng RAG / AI Document (Nếu dùng).                                                                                                                        |
| `LLM_PROVIDER`        | Provider AI sử dụng (`openai` hoặc `azure`)                                                                                                                                                  |
| `PORT`                | Cổng chạy API Backend (Mặc định: `3001`)                                                                                                                                                     |

#### 2. Cấu hình Frontend:

Di chuyển vào thư mục `frontend` và tạo file `.env.local`:

```bash
cd ../frontend
```

Tạo file `.env.local` với nội dung như sau:

```env
# URL của API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### Bước 2.3: Thiết lập Cơ sở dữ liệu (PostgreSQL Database)

1. Khởi động dịch vụ PostgreSQL trên máy của bạn.
2. Đăng nhập vào PostgreSQL (qua pgAdmin, DBeaver hoặc CLI) và tạo một cơ sở dữ liệu trống có tên khớp với cấu hình `DATABASE_URL` của bạn (Ví dụ: `manage_document_db`).
3. Đứng ở thư mục gốc của dự án, chạy lệnh di trú cấu hình bảng (Drizzle Migrations) để tự động tạo cấu trúc bảng trong DB:
   ```bash
   # Di chuyển vào thư mục backend
   cd backend
   # Đồng bộ trực tiếp schema lên database
   npx drizzle-kit push
   ```
4. **Khởi tạo dữ liệu mẫu (Seed Tenant & User)**:
   Để hệ thống SaaS Multi-tenancy có thể hoạt động và cho phép đăng nhập, bạn cần khởi tạo Tenant mẫu. Chạy tập lệnh seed bằng cách gõ:
   ```bash
   npx ts-node scripts/seed-tenant.ts
   ```
   _Lệnh này sẽ tạo Tenant `SmartDoc Global` (Code: `DEMO123`) và cập nhật các dữ liệu hiện có trong DB sang Tenant này._

---

### Bước 2.4: Cài đặt và Khởi chạy Meilisearch (Tùy chọn)

Meilisearch giúp hệ thống tìm kiếm tài liệu nhanh chóng và chính xác.

1. **Tải Meilisearch**:
   - **Windows**: Tải file binary `meilisearch.exe` từ trang chủ Meilisearch và lưu vào thư mục gốc dự án.
   - **macOS/Linux**: Cài đặt qua Homebrew `brew install meilisearch` hoặc tải binary.
   - **Docker (Khuyến nghị)**:
     ```bash
     docker run -it --rm -p 7700:7700 -v $(pwd)/meilisearch_data:/meili_data getmeili/meilisearch:v1.6 meilisearch --master-key="it_support_master_key"
     ```
2. **Khởi chạy cục bộ (Windows)**:
   Mở CMD/PowerShell tại thư mục chứa file `meilisearch.exe` và chạy:
   ```cmd
   meilisearch.exe --master-key="it_support_master_key"
   ```
   _(Nếu bạn không chạy Meilisearch, ứng dụng vẫn hoạt động và sẽ tự động sử dụng PostgreSQL Full-Text Search làm phương án dự phòng)._

---

## 3. Khởi Chạy Ứng Dụng (Môi Trường Phát Triển - Development)

Sau khi hoàn thành tất cả các bước cấu hình trên, bạn quay lại thư mục gốc của dự án và chạy:

```bash
cd ..
npm run dev
```

_Lệnh này sử dụng gói `concurrently` để chạy song song cả 2 dịch vụ:_

- **Backend NestJS**: Chạy tại địa chỉ `http://localhost:3001`
- **Frontend Next.js**: Chạy tại địa chỉ `http://localhost:3000`

Mở trình duyệt và truy cập `http://localhost:3000` để bắt đầu sử dụng hệ thống.

---

## 4. Triển Khai Môi Trường Vận Hành (Production)

Để triển khai dự án chạy ổn định trong môi trường Production, chúng ta sử dụng **PM2** để quản lý tiến trình.

### Bước 4.1: Build ứng dụng

Đứng tại thư mục gốc, chạy lệnh build cho cả Frontend và Backend:

```bash
npm run build --workspace=backend
npm run build --workspace=frontend
```

### Bước 4.2: Khởi chạy dịch vụ với PM2

Hệ thống đã chuẩn bị sẵn file cấu hình [ecosystem.config.cjs](file:///d:/01_Dev/_Workspaces/Active/ManageDocument/ecosystem.config.cjs). Chạy lệnh sau tại thư mục gốc để khởi động:

```bash
# Khởi chạy lần đầu tiên
pm2 start ecosystem.config.cjs

# Lưu cấu hình danh sách PM2 để tự khởi động lại khi server restart
pm2 save
```

### Các lệnh điều khiển PM2 hữu ích:

- Xem trạng thái các service: `pm2 status` hoặc `pm2 list`
- Xem log thời gian thực: `pm2 logs`
- Khởi động lại toàn bộ: `pm2 restart all`
- Dừng toàn bộ dịch vụ: `pm2 stop all`
- Theo dõi tài nguyên hệ thống: `pm2 monit`

---

## 5. Cấu Trúc Dự Án (Project Structure)

Dự án được tổ chức như sau:

```text
ManageDocument/
├── backend/                   # 🚀 NestJS Backend API
│   ├── src/db/schema.ts       # Cấu trúc bảng cơ sở dữ liệu (Drizzle ORM)
│   ├── src/modules/           # Các module nghiệp vụ (Auth, Documents, Search...)
│   └── uploads/               # Thư mục chứa các file tài liệu tải lên vật lý
├── frontend/                  # 💻 Next.js Frontend Application
│   ├── src/app/               # Giao diện chính (Next.js App Router)
│   └── src/components/        # Các Component UI (Dashboard, Folders...)
├── shared/                    # 📦 Shared Types & Zod Schemas
│   └── index.ts               # Định nghĩa kiểu dữ liệu dùng chung cho FE & BE
├── ecosystem.config.cjs       # Cấu hình dịch vụ chạy Production với PM2
└── package.json               # Cấu hình npm workspaces cho toàn bộ dự án
```

---

## 6. Xử lý sự cố thường gặp (Troubleshooting)

1.  **Lỗi: `ECONNREFUSED 127.0.0.1:5432`**
    - _Nguyên nhân_: Dịch vụ PostgreSQL chưa khởi chạy hoặc cổng kết nối cấu hình sai.
    - _Khắc phục_: Kiểm tra dịch vụ PostgreSQL trong máy đã chạy chưa và xác nhận lại `DATABASE_URL` trong file `.env`.
2.  **Cảnh báo: `Meilisearch sync failed (non-blocking)`**
    - _Nguyên nhân_: Meilisearch chưa chạy hoặc sai Master Key.
    - _Khắc phục_: Ứng dụng vẫn chạy bình thường. Nếu bạn muốn dùng tính năng tìm kiếm nâng cao, hãy chạy Meilisearch ở cổng `7700` với đúng Master Key.
3.  **Lỗi liên quan đến Upload File**:
    - Đảm bảo thư mục `/backend/uploads` đã được tạo và phân quyền ghi đầy đủ.
