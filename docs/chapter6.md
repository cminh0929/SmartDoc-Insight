# Chapter 6: Triển khai & Bảo mật (Deployment & Security)

Để đảm bảo SmartDoc Insight có thể vận hành ổn định 24/7 và bảo vệ dữ liệu nội bộ nhạy cảm của các doanh nghiệp khách hàng (Tenants), hệ thống được thiết kế với kiến trúc triển khai tối ưu và nhiều lớp rào chắn bảo mật.

## 6.1 Kiến trúc Vận hành (Production Deployment)

Thay vì sử dụng các công nghệ container hóa phức tạp như Docker (có thể gây lãng phí tài nguyên ảo hóa trên Windows Server), SmartDoc Insight lựa chọn **PM2 (Process Manager 2)** làm giải pháp lõi để quản lý tiến trình.

- **Quản lý Tập trung (Ecosystem):**
  Thông qua file cấu hình `ecosystem.config.cjs`, PM2 khởi chạy và giám sát song song cả hai nền tảng:
  - **Frontend (Next.js):** Chạy ở chế độ Production tại cổng `3000`.
  - **Backend (NestJS):** Hoạt động độc lập tại cổng `3001`.
- **Độ sẵn sàng cao (High Availability):**
  PM2 liên tục theo dõi tình trạng sức khỏe (Health Check) của các tiến trình. Nếu có bất kỳ sự cố rò rỉ bộ nhớ (Memory Leak) hoặc treo ứng dụng (Crash), hệ thống sẽ ngay lập tức **tự phục hồi (Auto-restart)** trong tích tắc, đảm bảo Uptime lên tới 99.99%.
- **Quản lý Nhật ký (Log Management):**
  Mọi lịch sử hoạt động, lỗi hệ thống (Errors) của cả Frontend và Backend đều được PM2 thu thập và gom về một luồng duy nhất, giúp kỹ sư dễ dàng truy vết sự cố (Troubleshooting) khi cần.

## 6.2 Chiến lược Bảo mật Nhiều Lớp (Multi-layered Security)

Việc phục vụ nhiều doanh nghiệp trên cùng một hệ thống (Multi-Tenant) đòi hỏi các tiêu chuẩn bảo mật cấp doanh nghiệp (Enterprise-grade).

### 6.2.1 Bảo mật Mạng (Transport Layer - CORS)

Hệ thống API Backend (NestJS) được cấu hình **CORS (Cross-Origin Resource Sharing)** cực kỳ khắt khe.

- Nó từ chối mọi yêu cầu (Request) đến từ các tên miền lạ.
- Chỉ duy nhất Domain của ứng dụng Frontend nội bộ mới được phép giao tiếp và lấy dữ liệu từ Backend. Điều này ngăn chặn triệt để các cuộc tấn công CSRF (Cross-Site Request Forgery) hoặc việc kẻ gian cố tình gọi trực tiếp vào API từ bên ngoài.

### 6.2.2 Xác thực Phi trạng thái (Identity Layer - JWT)

SmartDoc Insight sử dụng **JWT (JSON Web Token)** cho cơ chế duy trì phiên đăng nhập (Session).

- Thay vì lưu trữ trạng thái đăng nhập vào RAM hay Database (gây tốn tài nguyên khi số lượng người dùng lớn), mọi thông tin định danh (Bao gồm `userId` và `tenantId`) đều được mã hóa bằng chữ ký số (Digital Signature) và gói gọn vào Token cấp cho người dùng.
- Khi người dùng gọi API, Backend chỉ cần dùng Secret Key để giải mã và xác thực tính hợp lệ của Token mà không cần tốn chi phí truy vấn Database, mang lại tốc độ cực nhanh mà vẫn miễn nhiễm với nạn giả mạo Token.

### 6.2.3 Minh bạch & Kiểm toán (Compliance Layer - Audit Logs)

Một tài liệu IT quan trọng bị sửa sai hoặc xóa mất có thể gây thiệt hại lớn nếu kỹ thuật viên làm theo. Vì vậy, tính minh bạch là yếu tố sống còn.

- **Theo dõi vết (Tracking):** Hệ thống ghi nhận mọi thao tác nhạy cảm (Tạo, Sửa, Xóa tài liệu hoặc thư mục) vào bảng Audit Logs.
- **Bằng chứng số:** Quản trị viên (Admin) luôn biết được _Ai_ đã làm _Gì_ và vào _Thời gian nào_.
- **Xuất dữ liệu (Export):** Tích hợp sẵn tính năng kết xuất (Export) dữ liệu ra tệp `.CSV`, đáp ứng các tiêu chuẩn khắt khe về báo cáo và kiểm toán hệ thống (System Auditing) của doanh nghiệp.

## 6.3 Bản vá Bảo mật Phân quyền & Cô lập Dữ liệu (Security Patches)

Trong quá trình hoàn thiện, hệ thống đã được gia cố với các bản vá bảo mật quan trọng nhằm đảm bảo an toàn tuyệt đối cho kiến trúc Multi-Tenant:

- **Global `JwtAuthGuard`:** Được áp dụng toàn cục (Global Guard) trên toàn bộ bề mặt định tuyến của API. Mọi endpoints đều mặc định yêu cầu Token hợp lệ.
- **Phân tách Custom Roles & System Roles:** Đảm bảo các vai trò nội bộ của hệ thống (System Roles) không bị can thiệp bởi quản trị viên của doanh nghiệp thuê bao, trong khi vẫn cho phép họ tự định nghĩa Custom Roles.
- **Kiểm định Chủ sở hữu cùng Tenant:** Mọi thay đổi dữ liệu (như sửa quyền, xóa tài liệu) đều bị kiểm tra chặt chẽ bởi điều kiện `caller.tenantId === target.tenantId` trong cấp Service. Người dùng của công ty A tuyệt đối không thể tác động lên đối tượng của công ty B, dù họ có truyền sai ID lên API.

## 6.4 Kiểm thử Tự động E2E Tenant Isolation

Để chứng minh hệ thống đạt chuẩn Doanh nghiệp, một bộ kiểm thử tự động khắt khe (`backend/test-e2e-tenant-isolation.ts`) đã được xây dựng. Bộ kiểm thử này tạo ra một môi trường Sandbox trải qua 5 giai đoạn chính:

1. **Khởi tạo:** Tạo 2 Tenants hoàn toàn độc lập (Công ty A & Công ty B) cùng các User thuộc từng công ty.
2. **Cấp phép:** Tạo các thư mục và tài liệu cho mỗi Tenant.
3. **Kiểm tra Chéo Quyền (Cross-Tenant Unauthorized Access):** Mô phỏng việc User của Tenant A sử dụng ID tài liệu của Tenant B để gọi API (Đọc, Cập nhật, Xóa). Hệ thống PHẢI chặn lại và báo lỗi `404` hoặc `403`.
4. **Kiểm tra Chéo Vector RAG:** Kiểm tra việc tìm kiếm thông tin ngữ nghĩa (Semantic Search) trên PGVector. User A không thể nhận được dữ liệu Chunk từ Tenant B, dù câu hỏi có độ tương đồng cosine lớn.
5. **Dọn dẹp:** Xóa bỏ rác sinh ra trong Sandbox để giữ môi trường sạch sẽ.
