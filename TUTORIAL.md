# Hướng Dẫn Khởi Chạy Dự Án SmartDoc Insight Trên Máy Tính Này

Tài liệu này hướng dẫn chi tiết các bước thiết lập và khởi chạy lại dự án **SmartDoc Insight** dựa trên hiện trạng môi trường thực tế của máy tính này (Windows, đã có Docker, Node.js trong Program Files nhưng chưa nhận biến môi trường, chưa có dịch vụ Postgres cục bộ).

---

## 🛠️ Bước 1: Cấu hình Môi trường Node.js & PowerShell

### 1. Thêm Node.js vào biến môi trường `PATH`
Do Node.js đã được cài đặt ở `C:\Program Files\nodejs\` nhưng CMD/PowerShell chưa nhận:
1. Nhấn phím `Windows`, tìm kiếm và mở **"Edit the system environment variables"**.
2. Chọn nút **Environment Variables...** ở góc dưới bên phải.
3. Trong bảng **User variables** (hoặc **System variables**), tìm biến `Path` $\rightarrow$ chọn **Edit**.
4. Chọn **New** $\rightarrow$ Thêm đường dẫn: `C:\Program Files\nodejs`.
5. Chọn **OK** để lưu lại tất cả các cửa sổ.
6. **Khởi động lại Terminal, Command Prompt hoặc VS Code** để thay đổi có hiệu lực.

### 2. Cho phép chạy file script trên PowerShell (Sửa lỗi npm script block)
Nếu chạy lệnh `npm` trong PowerShell báo lỗi chặn file `.ps1`, hãy mở PowerShell dưới quyền quản trị viên (Run as Administrator) và chạy lệnh:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
*(Nhấn `Y` khi được hỏi để xác nhận).*

---

## 📦 Bước 2: Khởi chạy Database PostgreSQL qua Docker
Vì máy tính này chưa cài đặt trực tiếp PostgreSQL và không có Windows Service Postgres, cách nhanh nhất là chạy Postgres qua Docker (Docker Desktop đã được cài đặt sẵn):

1. Khởi động ứng dụng **Docker Desktop** trên Windows và đảm bảo dịch vụ Docker đang hoạt động.
2. Mở Terminal và chạy lệnh sau để khởi tạo một container PostgreSQL với đúng cấu hình kết nối của dự án:
   ```bash
   docker run --name smartdoc-postgres -e POSTGRES_USER=it_support_admin -e POSTGRES_PASSWORD=your_password_here -e POSTGRES_DB=manage_document_db -p 5432:5432 -d postgres:16
   ```

---

## 📂 Bước 3: Cài đặt Thư viện & Cấu hình File `.env`

Đứng tại thư mục gốc của dự án (`d:\Dev\SmartDoc-Insight`), thực hiện các lệnh sau:

### 1. Cài đặt các thư viện (Dependencies)
```bash
npm install
```

### 2. Tạo cấu hình môi trường cho Backend
Sao chép file cấu hình mẫu:
```bash
copy backend\.env.example backend\.env
```
*(Bạn có thể mở file `backend/.env` bằng VS Code để kiểm tra chuỗi kết nối `DATABASE_URL` hoặc cấu hình thêm các tham số AI/OpenAI API Key nếu cần).*

### 3. Tạo cấu hình môi trường cho Frontend
Tạo file `frontend/.env.local` với nội dung sau:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🚀 Bước 4: Tạo Schema & Seed Dữ liệu

Sau khi Container Postgres ở **Bước 2** đã chạy thành công, thực hiện khởi tạo cơ sở dữ liệu:

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Đồng bộ các bảng dữ liệu lên Database
npx drizzle-kit push

# 3. Chạy tập lệnh tạo dữ liệu Tenant mẫu và User Admin
npx ts-node scripts/seed-tenant.ts

# 4. Quay lại thư mục gốc của dự án
cd ..
```

---

## 🏃 Bước 5: Khởi chạy Ứng dụng ở chế độ Development

Từ thư mục gốc dự án, chạy lệnh:
```bash
npm run dev
```

Lúc này, hệ thống sẽ chạy đồng thời:
- **Backend NestJS**: chạy ở cổng `3001` (API: `http://localhost:3001`)
- **Frontend Next.js**: chạy ở cổng `3000` (Giao diện: `http://localhost:3000`)

Mở trình duyệt và truy cập **[http://localhost:3000](http://localhost:3000)** để sử dụng ứng dụng.
