import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'test-docs');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function h(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function p(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    spacing: { after: 120 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 24 })],
    spacing: { after: 80 },
    indent: { left: 360 },
  });
}

const docsData = [
  {
    name: 'AD-User-Management-Guide.docx',
    title: 'Hướng dẫn Quản lý Người dùng Active Directory (AD)',
    content: [
      h('Hướng dẫn Quản lý Người dùng Active Directory (AD)'),
      p('Tài liệu hướng dẫn kỹ thuật viên Helpdesk thao tác quản trị người dùng trên AD Domain Controller.'),
      h('1. Tạo mới tài khoản người dùng', HeadingLevel.HEADING_2),
      p('Quy trình tạo mới tài khoản cho nhân viên mới:'),
      bullet('Mở Active Directory Users and Computers (ADUC)'),
      bullet('Tìm đến OU tương ứng của phòng ban nhân viên mới'),
      bullet('Click chuột phải chọn New -> User'),
      bullet('Điền thông tin First name, Last name, và User logon name theo chuẩn email (ví dụ: cminh0929)'),
      bullet('Thiết lập mật khẩu tạm thời và tích chọn "User must change password at next logon"'),
      h('2. Reset mật khẩu người dùng', HeadingLevel.HEADING_2),
      p('Khi nhận yêu cầu quên mật khẩu từ người dùng:'),
      bullet('Tìm kiếm username tương ứng trong ADUC'),
      bullet('Click chuột phải chọn Reset Password'),
      bullet('Nhập mật khẩu mới tuân thủ chính sách bảo mật (tối thiểu 8 ký tự, có ký tự đặc biệt)'),
      bullet('Xác nhận mở khóa tài khoản nếu đang bị khóa (tích chọn "Unlock user\'s account")'),
    ]
  },
  {
    name: 'Firewall-Fortinet-Policy.docx',
    title: 'Quy trình Cấu hình Firewall Fortinet',
    content: [
      h('Quy trình Cấu hình Firewall Fortinet'),
      p('Tài liệu hướng dẫn cấu hình các chính sách truy cập mạng (Firewall Policy) trên thiết bị FortiGate.'),
      h('1. Tạo Policy cho phép truy cập Web', HeadingLevel.HEADING_2),
      p('Các bước thiết lập Internet access policy:'),
      bullet('Vào menu Policy & Objects -> Firewall Policy'),
      bullet('Chọn Create New ở góc trên bên trái'),
      bullet('Incoming Interface: LAN (hoặc cổng mạng nội bộ)'),
      bullet('Outgoing Interface: WAN1 (hoặc cổng kết nối Internet của ISP)'),
      bullet('Source: all | Destination: all | Service: HTTP, HTTPS, DNS'),
      bullet('Action: ACCEPT | Enable NAT: Tích chọn'),
      h('2. Chặn các trang web độc hại', HeadingLevel.HEADING_2),
      p('Áp dụng Web Filtering profile:'),
      bullet('Bật tính năng Web Filter trong phần Security Profiles của Policy'),
      bullet('Chọn Profile mặc định hoặc tạo mới để chặn các danh mục độc hại (Malicious, Gambling, Adult)'),
      bullet('Lưu lại cấu hình bằng cách chọn OK'),
    ]
  },
  {
    name: 'Office-Printer-Setup.docx',
    title: 'Hướng dẫn Cấu hình Máy in Văn phòng',
    content: [
      h('Hướng dẫn Cấu hình Máy in Văn phòng'),
      p('Quy trình cài đặt máy in mạng dùng chung cho các phòng ban tại văn phòng.'),
      h('1. Tìm địa chỉ IP máy in', HeadingLevel.HEADING_2),
      p('Tất cả máy in văn phòng đều được gán IP tĩnh:'),
      bullet('Máy in Phòng Kế toán: 192.168.1.200 (Canon LBP2900)'),
      bullet('Máy in Phòng Kỹ thuật: 192.168.1.201 (HP LaserJet Pro)'),
      bullet('Máy in Ban Giám đốc: 192.168.1.202 (Epson L3110)'),
      h('2. Cài đặt trên máy tính Windows', HeadingLevel.HEADING_2),
      p('Các bước cài đặt thủ công:'),
      bullet('Vào Settings -> Bluetooth & devices -> Printers & scanners'),
      bullet('Chọn Add device -> Add manually'),
      bullet('Chọn "Add a printer using an IP address or hostname"'),
      bullet('Nhập địa chỉ IP tương ứng của máy in văn phòng'),
      bullet('Chọn Driver thích hợp và hoàn tất quá trình cài đặt'),
    ]
  },
  {
    name: 'Office-Wi-Fi-Secure-Access.docx',
    title: 'Hướng dẫn Kết nối Wi-Fi Văn phòng Bảo mật',
    content: [
      h('Hướng dẫn Kết nối Wi-Fi Văn phòng Bảo mật'),
      p('Tài liệu hướng dẫn cấu hình kết nối mạng Wi-Fi bảo mật chuẩn WPA3-Enterprise cho nhân viên.'),
      h('1. Danh sách các SSID Wi-Fi', HeadingLevel.HEADING_2),
      bullet('SSID: SmartDoc-Staff — Dành cho nhân viên (yêu cầu đăng nhập tài khoản AD)'),
      bullet('SSID: SmartDoc-Guest — Dành cho khách hàng (yêu cầu xác thực qua Web Portal)'),
      bullet('SSID: SmartDoc-IoT — Dành cho thiết bị chấm công, camera (IP tĩnh, WPA3-Personal)'),
      h('2. Kết nối trên thiết bị di động', HeadingLevel.HEADING_2),
      p('Cài đặt kết nối an toàn:'),
      bullet('Chọn mạng Wi-Fi SmartDoc-Staff'),
      bullet('EAP Method: Chọn PEAP'),
      bullet('CA Certificate: Chọn Don\'t validate (hoặc chọn chứng chỉ nội bộ nếu có)'),
      bullet('Identity: Nhập tài khoản AD của nhân viên'),
      bullet('Password: Nhập mật khẩu tài khoản AD'),
    ]
  },
  {
    name: 'Email-O365-Migration.docx',
    title: 'Tài liệu Hướng dẫn Chuyển đổi Email Office 365',
    content: [
      h('Tài liệu Hướng dẫn Chuyển đổi Email Office 365'),
      p('Quy trình chuyển đổi hòm thư điện tử từ hệ thống Mail Server cũ sang Microsoft Office 365.'),
      h('1. Chuẩn bị trước khi chuyển đổi', HeadingLevel.HEADING_2),
      bullet('Sao lưu toàn bộ dữ liệu email cũ ra file định dạng .pst'),
      bullet('Xác minh tài khoản người dùng đã được tạo và cấp license trên Microsoft Admin Center'),
      bullet('Thông báo lịch bảo trì hệ thống mail cho nhân viên trước 24 giờ'),
      h('2. Thực hiện cấu hình DNS', HeadingLevel.HEADING_2),
      p('Cập nhật các bản ghi tên miền tại trang quản lý DNS:'),
      bullet('Cập nhật bản ghi MX: trỏ về msofficial.mail.protection.outlook.com'),
      bullet('Thêm bản ghi TXT (SPF): v=spf1 include:spf.protection.outlook.com -all'),
      bullet('Thêm bản ghi CNAME cho Autodiscover: autodiscover.outlook.com'),
    ]
  },
  {
    name: 'Database-Backup-Replication.docx',
    title: 'Chính sách Sao lưu và Phục hồi Database',
    content: [
      h('Chính sách Sao lưu và Phục hồi Database'),
      p('Tài liệu đặc tả quy trình sao lưu định kỳ và khôi phục cơ sở dữ liệu PostgreSQL của hệ thống SmartDoc.'),
      h('1. Tần suất sao lưu', HeadingLevel.HEADING_2),
      bullet('Sao lưu hàng ngày (Daily): Thực hiện tự động vào lúc 02:00 AM, lưu trữ tại local disk'),
      bullet('Sao lưu hàng tuần (Weekly): Lưu trữ tại NAS Server'),
      bullet('Sao lưu hàng tháng (Monthly): Đẩy lên Cloud Storage (AWS S3)'),
      h('2. Lệnh sao lưu thủ công', HeadingLevel.HEADING_2),
      p('Sử dụng công cụ pg_dump để sao lưu nhanh:'),
      p('    pg_dump -U it_support_admin -d manage_document_db -F c -b -v -f /backups/manage_document_db_backup.dump'),
      h('3. Quy trình khôi phục dữ liệu', HeadingLevel.HEADING_2),
      p('Chạy lệnh khôi phục dữ liệu từ bản dump:'),
      p('    pg_restore -U it_support_admin -d manage_document_db -v /backups/manage_document_db_backup.dump'),
    ]
  },
  {
    name: 'Windows-Update-WSUS.docx',
    title: 'Quy trình Cấu hình Windows Update qua WSUS',
    content: [
      h('Quy trình Cấu hình Windows Update qua WSUS'),
      p('Tài liệu hướng dẫn triển khai cập nhật hệ điều hành Windows tập trung qua máy chủ Windows Server Update Services (WSUS).'),
      h('1. Cấu hình Group Policy (GPO)', HeadingLevel.HEADING_2),
      p('Thiết lập chính sách cập nhật trên Group Policy Management Editor:'),
      bullet('Đường dẫn: Computer Configuration -> Policies -> Administrative Templates -> Windows Components -> Windows Update'),
      bullet('Configure Automatic Updates: Enabled (chọn Auto download and notify for install)'),
      bullet('Specify intranet Microsoft update service location: Nhập địa chỉ máy chủ WSUS (http://wsus-server.company.local:8530)'),
      h('2. Kiểm tra trên máy trạm client', HeadingLevel.HEADING_2),
      p('Chạy lệnh kiểm tra đồng bộ cập nhật trên PowerShell:'),
      p('    gpupdate /force'),
      p('    Get-WindowsUpdateLog'),
    ]
  },
  {
    name: 'SOP-Password-Security.docx',
    title: 'Quy trình Chuẩn (SOP) về Bảo mật Mật khẩu',
    content: [
      h('Quy trình Chuẩn (SOP) về Bảo mật Mật khẩu'),
      p('Văn bản quy định về tiêu chuẩn đặt mật khẩu và chính sách an toàn tài khoản đối với toàn thể cán bộ nhân viên.'),
      h('1. Tiêu chuẩn mật khẩu mạnh', HeadingLevel.HEADING_2),
      bullet('Độ dài tối thiểu: 10 ký tự'),
      bullet('Phải bao gồm ít nhất: 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%)'),
      bullet('Không chứa thông tin dễ đoán như tên riêng, ngày sinh, hoặc tên công ty'),
      h('2. Chính sách quản lý tài khoản', HeadingLevel.HEADING_2),
      bullet('Thời gian hết hạn mật khẩu: 90 ngày (bắt buộc đổi mật khẩu mới)'),
      bullet('Ngăn chặn lặp lại mật khẩu: Không được trùng với 5 mật khẩu gần nhất'),
      bullet('Khóa tài khoản (Lockout): Tự động khóa 15 phút nếu nhập sai quá 5 lần liên tiếp'),
    ]
  },
  {
    name: 'Linux-SSH-Authentication.docx',
    title: 'Hướng dẫn Bảo mật SSH trên Linux Server',
    content: [
      h('Hướng dẫn Bảo mật SSH trên Linux Server'),
      p('Tài liệu hướng dẫn cấu hình xác thực khóa công khai (Public Key) và tắt tính năng đăng nhập bằng mật khẩu thường trên hệ điều hành Ubuntu Server.'),
      h('1. Tạo khóa SSH Keypair trên máy client', HeadingLevel.HEADING_2),
      p('Chạy lệnh sinh khóa RSA 4096-bit:'),
      p('    ssh-keygen -t rsa -b 4096 -C "cminh0929@gmail.com"'),
      p('Đẩy khóa công khai lên máy chủ Linux:'),
      p('    ssh-copy-id -i ~/.ssh/id_rsa.pub user@linux-server-ip'),
      h('2. Cấu hình bảo mật file sshd_config', HeadingLevel.HEADING_2),
      p('Mở file cấu hình SSH Daemon `/etc/ssh/sshd_config` và sửa các dòng:'),
      bullet('Port 2222 (thay đổi port mặc định)'),
      bullet('PermitRootLogin no (tắt quyền root đăng nhập trực tiếp)'),
      bullet('PasswordAuthentication no (tắt đăng nhập bằng mật khẩu thường)'),
      bullet('PubkeyAuthentication yes (bật đăng nhập bằng SSH Key)'),
      p('Khởi động lại dịch vụ SSH:'),
      p('    sudo systemctl restart sshd'),
    ]
  },
  {
    name: 'EDR-Antivirus-Deployment.docx',
    title: 'Hướng dẫn Cấu hình và Cài đặt EDR Antivirus',
    content: [
      h('Hướng dẫn Cấu hình và Cài đặt EDR Antivirus'),
      p('Tài liệu hướng dẫn triển khai cài đặt phần mềm diệt virus thế hệ mới EDR (Endpoint Detection and Response) cho máy tính người dùng.'),
      h('1. Yêu cầu hệ thống', HeadingLevel.HEADING_2),
      bullet('Hệ điều hành: Windows 10/11 trở lên hoặc macOS Catalina trở lên'),
      bullet('Dung lượng RAM tối thiểu: 4GB'),
      bullet('Kết nối Internet liên tục để đồng bộ cơ sở dữ liệu mẫu độc hại trên Cloud'),
      h('2. Các bước cài đặt agent', HeadingLevel.HEADING_2),
      bullet('Tải file cài đặt Agent.msi từ trang quản trị tập trung EDR Dashboard'),
      bullet('Mở Command Prompt dưới quyền Administrator và cài đặt bằng lệnh:'),
      p('    msiexec /i EDR-Agent.msi /quiet CUSTOM_KEY=it_support_edr_key_123'),
      bullet('Chạy lệnh xác nhận Agent đã kết nối thành công: edr-client --status'),
    ]
  }
];

async function main() {
  console.log('Generating 10 IT Support test documents...');
  for (const docData of docsData) {
    const doc = new Document({
      sections: [{
        properties: {},
        children: docData.content,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filePath = path.join(outDir, docData.name);
    fs.writeFileSync(filePath, buffer);
    console.log(`Created: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }
  console.log('\nSuccess! 10 test documents created in directory "test-docs".');
}

main().catch(console.error);
