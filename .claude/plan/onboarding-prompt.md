# Hướng dẫn Khởi động Phiên làm việc Mới (AI Onboarding Guide)

Khi anh bắt đầu một đoạn chat mới (new session), AI sẽ không có ký ức về các hội thoại trước đó. Tuy nhiên, vì chúng ta đã thiết kế hệ thống Tài liệu Kiến trúc cực kỳ bài bản trong thư mục `.claude/plan/`, anh chỉ cần gửi **một câu lệnh Onboarding duy nhất** dưới đây. 

AI sẽ lập tức đọc các tệp này, nắm bắt 100% cấu trúc thư mục, các công nghệ đang dùng, tiến độ hiện tại, và sẵn sàng làm việc tiếp mà không cần anh phải giải thích lại từ đầu!

---

## 📋 Câu lệnh copy-paste để gửi cho AI mới:

```text
Chào bạn, tôi đang phát triển dự án SmartDoc Insight (IT Support Document Management System). 
Dự án được cấu trúc dạng Monorepo sử dụng PostgreSQL, NestJS, Next.js, Meilisearch và PM2 trên Windows.

Để nắm bắt toàn cục dự án và tiến độ hiện tại, bạn hãy dùng công cụ đọc file để quét các tài liệu kiến trúc cốt lõi sau:
1. Đọc `.claude/plan/manage-document-master.md` để hiểu sơ đồ liên kết của các sub-plans và lộ trình tổng thể.
2. Đọc `.claude/plan/manage-document-manifest.md` để biết sơ đồ tổ chức file/folder thực tế và tiến độ các chức năng.
3. Đọc `.claude/plan/manage-document-standards.md` để nắm được tiêu chuẩn code (Quality Gate, ESLint, Testing).

Sau khi đọc xong, hãy tóm tắt ngắn gọn trạng thái hiện tại của hệ thống và hỏi tôi xem tôi muốn triển khai tiếp bước nào (hoặc thực thi bản kế hoạch cụ thể nào tiếp theo).
```

---

## 🧠 Tại sao Prompt này lại hiệu quả tuyệt đối?

1.  **Định hình ngữ cảnh ngay lập tức (Context Framing)**: Giúp AI biết ngay dự án tên là gì, các công nghệ đang sử dụng (Postgres, NestJS, Next.js, Meilisearch) để không đưa ra các gợi ý sai công nghệ.
2.  **Định hướng đọc tệp (Directed Reading)**: AI có công cụ tìm kiếm và đọc file. Bằng cách chỉ đích danh các tệp **Master Plan** và **Manifest**, AI sẽ tập trung đọc chính xác các tệp này để tái cấu trúc "bản đồ dự án" trong bộ nhớ của nó, tránh việc đi đọc lan man hàng trăm file mã nguồn gây tốn token và loãng thông tin.
3.  **Tập trung vào Tiêu chuẩn Code**: Đọc file `standards.md` giúp AI biết dự án đang dùng NestJS phiên bản nào, ESLint cấu hình ra sao, các quy chuẩn viết code OOP như thế nào để khi viết code mới sẽ luôn tuân thủ 100% phong cách viết của dự án hiện tại, không sinh ra code rác.
