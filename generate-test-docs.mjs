import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outDir = path.join(__dirname, 'test-docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function h(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } });
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

// ─── DOC 1: Cisco VPN Recovery SOP ───────────────────────────────────────────
const doc1 = new Document({
  sections: [{
    properties: {},
    children: [
      h('SOP: Khôi phục cấu hình VPN Cisco sau sự cố mất nguồn'),
      p('Phiên bản: 1.2 | Ngày cập nhật: 2025-03-15 | Tác giả: IT Infrastructure Team'),
      p('Mã tài liệu: NET-SOP-VPN-001'),

      h('1. Mục đích', HeadingLevel.HEADING_2),
      p('Tài liệu này hướng dẫn kỹ thuật viên mạng thực hiện khôi phục toàn bộ cấu hình VPN trên thiết bị Cisco ASA và Cisco ISR sau sự cố mất điện đột ngột, nhằm đảm bảo thời gian khôi phục tối thiểu (MTTR < 30 phút).'),

      h('2. Phạm vi áp dụng', HeadingLevel.HEADING_2),
      p('Áp dụng cho các thiết bị:'),
      bullet('Cisco ASA 5500-X Series (phiên bản 9.x trở lên)'),
      bullet('Cisco ISR 4000 Series với module VPN'),
      bullet('Cisco Firepower 1000/2100 Series'),

      h('3. Các bước thực hiện', HeadingLevel.HEADING_2),

      h('Bước 1: Kiểm tra trạng thái khởi động', HeadingLevel.HEADING_3),
      p('Sau khi nguồn điện được khôi phục, kết nối console vào thiết bị và thực hiện:'),
      bullet('Kiểm tra quá trình boot: quan sát màn hình console trong 3-5 phút đầu tiên'),
      bullet('Xác nhận IOS đã load thành công: dấu nhắc lệnh "#" xuất hiện'),
      bullet('Chạy lệnh: show version — xác nhận phiên bản firmware'),
      bullet('Chạy lệnh: show startup-config — xác nhận cấu hình backup có tồn tại'),

      h('Bước 2: Khôi phục cấu hình VPN từ NVRAM', HeadingLevel.HEADING_3),
      p('Nếu startup-config còn nguyên vẹn, chạy lệnh sau để áp dụng lại toàn bộ cấu hình:'),
      p('    copy startup-config running-config'),
      p('Sau đó xác nhận VPN tunnel đã được khởi tạo lại:'),
      p('    show crypto isakmp sa'),
      p('    show crypto ipsec sa'),

      h('Bước 3: Kiểm tra trạng thái VPN Tunnel', HeadingLevel.HEADING_3),
      p('Sử dụng các lệnh sau để xác minh kết nối VPN đã hoạt động trở lại:'),
      bullet('show vpn-sessiondb — xem danh sách phiên VPN hiện tại'),
      bullet('show ip route — xác nhận routing table bao gồm các subnet VPN'),
      bullet('ping [IP nội bộ đối tác] source [interface LAN] — test kết nối end-to-end'),
      bullet('debug crypto isakmp — bật debug nếu tunnel không lên'),

      h('Bước 4: Khôi phục thủ công nếu cấu hình bị mất', HeadingLevel.HEADING_3),
      p('Trường hợp NVRAM bị hỏng, cần khôi phục từ bản backup trên TFTP server:'),
      p('    copy tftp://192.168.1.100/cisco-asa-backup.cfg startup-config'),
      p('Sau đó reload thiết bị:'),
      p('    reload'),

      h('4. Xử lý sự cố phổ biến', HeadingLevel.HEADING_2),
      p('Lỗi: "IKE Main Mode Failed" sau khi khôi phục'),
      bullet('Nguyên nhân: Clock lệch sau khi mất nguồn'),
      bullet('Giải pháp: Đồng bộ NTP — "ntp server pool.ntp.org"'),
      bullet('Kiểm tra: "show clock" phải đúng múi giờ'),

      p('Lỗi: VPN tunnel lên nhưng không ping được qua tunnel'),
      bullet('Kiểm tra crypto map: "show crypto map"'),
      bullet('Kiểm tra ACL permit: traffic match must be mirrored on both sides'),
      bullet('Chạy: "clear crypto isakmp sa" và "clear crypto ipsec sa" rồi thử lại'),

      h('5. Liên hệ hỗ trợ', HeadingLevel.HEADING_2),
      p('Nếu không khôi phục được sau 30 phút, leo thang lên:'),
      bullet('Network Team Lead: Ext. 1001'),
      bullet('Cisco TAC: 1-800-553-2447 (trường hợp có SmartNet contract)'),
      bullet('Ticket system: helpdesk.internal/network'),
    ],
  }],
});

// ─── DOC 2: Router Configuration Guide ───────────────────────────────────────
const doc2 = new Document({
  sections: [{
    properties: {},
    children: [
      h('Hướng dẫn cấu hình Router Cisco ISR 4321 — Môi trường văn phòng'),
      p('Phiên bản: 2.0 | Ngày cập nhật: 2025-01-20 | Bộ phận: IT Infrastructure'),
      p('Mã tài liệu: NET-CFG-RTR-002'),

      h('1. Thông tin thiết bị', HeadingLevel.HEADING_2),
      bullet('Model: Cisco ISR 4321/K9'),
      bullet('IOS Version: 16.12.4 (Recommend: 17.x LTS)'),
      bullet('RAM: 4GB DDR3 | Flash: 8GB'),
      bullet('Interfaces: 2x GE WAN + 2x GE LAN + 1x Console'),

      h('2. Cấu hình ban đầu (Initial Setup)', HeadingLevel.HEADING_2),

      h('2.1 Thiết lập cơ bản', HeadingLevel.HEADING_3),
      p('Kết nối console (9600 baud, 8N1) và thực hiện:'),
      p('    enable'),
      p('    configure terminal'),
      p('    hostname ROUTER-HQ-01'),
      p('    enable secret [strong-password]'),
      p('    service password-encryption'),
      p('    no ip domain-lookup'),
      p('    ip domain-name company.local'),

      h('2.2 Cấu hình Interface WAN (ISP)', HeadingLevel.HEADING_3),
      p('    interface GigabitEthernet0/0/0'),
      p('    description WAN-ISP-VIETTEL'),
      p('    ip address dhcp'),
      p('    no shutdown'),
      p('    exit'),

      h('2.3 Cấu hình Interface LAN', HeadingLevel.HEADING_3),
      p('    interface GigabitEthernet0/0/1'),
      p('    description LAN-OFFICE'),
      p('    ip address 192.168.1.1 255.255.255.0'),
      p('    no shutdown'),
      p('    exit'),

      h('2.4 Cấu hình DHCP Server', HeadingLevel.HEADING_3),
      p('    ip dhcp pool OFFICE-POOL'),
      p('    network 192.168.1.0 255.255.255.0'),
      p('    default-router 192.168.1.1'),
      p('    dns-server 8.8.8.8 8.8.4.4'),
      p('    lease 7'),
      p('    exit'),
      p('    ip dhcp excluded-address 192.168.1.1 192.168.1.50'),

      h('3. Cấu hình NAT/PAT', HeadingLevel.HEADING_2),
      p('    ip nat inside source list 1 interface GigabitEthernet0/0/0 overload'),
      p('    access-list 1 permit 192.168.1.0 0.0.0.255'),
      p('Đánh dấu interface inside/outside:'),
      p('    interface GigabitEthernet0/0/0'),
      p('    ip nat outside'),
      p('    interface GigabitEthernet0/0/1'),
      p('    ip nat inside'),

      h('4. Cấu hình SSH Remote Access', HeadingLevel.HEADING_2),
      p('    crypto key generate rsa modulus 2048'),
      p('    ip ssh version 2'),
      p('    ip ssh authentication-retries 3'),
      p('    ip ssh time-out 60'),
      p('    line vty 0 4'),
      p('    login local'),
      p('    transport input ssh'),
      p('    exit'),
      p('    username admin privilege 15 secret [admin-password]'),

      h('5. Lưu cấu hình', HeadingLevel.HEADING_2),
      p('    write memory'),
      p('Hoặc:'),
      p('    copy running-config startup-config'),

      h('6. Kiểm tra sau cấu hình', HeadingLevel.HEADING_2),
      bullet('show ip interface brief — kiểm tra trạng thái interfaces'),
      bullet('show ip route — xác nhận default route qua WAN'),
      bullet('show ip nat translations — xác nhận NAT hoạt động'),
      bullet('ping 8.8.8.8 — test internet connectivity'),
    ],
  }],
});

// ─── DOC 3: Network Troubleshooting Runbook ───────────────────────────────────
const doc3 = new Document({
  sections: [{
    properties: {},
    children: [
      h('Runbook: Xử lý sự cố mạng nội bộ — Dành cho IT Helpdesk Level 1'),
      p('Phiên bản: 3.1 | Cập nhật: 2025-04-01 | Đội: IT Helpdesk'),
      p('Mã tài liệu: NET-RUN-001'),

      h('TRIỆU CHỨNG 1: Người dùng không vào được Internet', HeadingLevel.HEADING_2),

      h('Bước 1 — Kiểm tra tại máy người dùng', HeadingLevel.HEADING_3),
      bullet('Chạy: ipconfig /all — xác nhận máy đã có IP từ DHCP (không phải 169.254.x.x)'),
      bullet('Chạy: ping 192.168.1.1 — kiểm tra gateway có phản hồi không'),
      bullet('Chạy: ping 8.8.8.8 — phân biệt lỗi DNS hay lỗi routing'),
      bullet('Chạy: nslookup google.com — kiểm tra DNS resolution'),

      h('Bước 2 — Kiểm tra tại Switch/AP', HeadingLevel.HEADING_3),
      bullet('Kiểm tra đèn port tương ứng: xanh lá = link OK, đỏ/cam = lỗi'),
      bullet('Login switch: show mac address-table — xác nhận MAC máy có trong bảng'),
      bullet('Kiểm tra VLAN assignment: show interfaces switchport'),

      h('Bước 3 — Kiểm tra tại Router (Cisco ISR)', HeadingLevel.HEADING_3),
      bullet('show ip interface brief — WAN interface phải có IP và trạng thái up/up'),
      bullet('show ip route — phải có default route 0.0.0.0/0 qua WAN'),
      bullet('show ip nat translations — xác nhận NAT đang hoạt động'),
      bullet('debug ip packet — theo dõi packet từ 192.168.1.x ra WAN (dùng cẩn thận)'),

      h('Phán đoán và xử lý', HeadingLevel.HEADING_3),
      p('Nếu ping 192.168.1.1 fail → lỗi L2/L3 nội bộ (dây, switch, VLAN)'),
      p('Nếu ping 8.8.8.8 fail nhưng ping gateway OK → lỗi WAN hoặc NAT'),
      p('Nếu ping 8.8.8.8 OK nhưng nslookup fail → lỗi DNS server'),

      h('TRIỆU CHỨNG 2: Máy tính không lấy được IP (169.254.x.x)', HeadingLevel.HEADING_2),

      h('Nguyên nhân phổ biến', HeadingLevel.HEADING_3),
      bullet('DHCP server không chạy hoặc hết địa chỉ trong pool'),
      bullet('VLAN sai, máy nằm ở VLAN không có DHCP server'),
      bullet('Firewall chặn UDP port 67/68'),
      bullet('Cáp mạng lỏng hoặc switch port bị disable'),

      h('Cách xử lý', HeadingLevel.HEADING_3),
      p('Trên Router Cisco — kiểm tra DHCP pool:'),
      p('    show ip dhcp pool'),
      p('    show ip dhcp binding'),
      p('    show ip dhcp conflict'),
      p('Nếu pool hết địa chỉ:'),
      p('    ip dhcp pool OFFICE-POOL'),
      p('    network 192.168.1.0 255.255.255.0'),
      p('Xóa binding bị conflict:'),
      p('    clear ip dhcp binding *'),

      h('TRIỆU CHỨNG 3: Kết nối chậm, packet loss cao', HeadingLevel.HEADING_2),

      h('Công cụ chẩn đoán', HeadingLevel.HEADING_3),
      bullet('ping -t [destination] — theo dõi liên tục, tìm pattern drop'),
      bullet('tracert [destination] — xác định hop nào có latency cao'),
      bullet('show interfaces GigabitEthernet0/0/0 — kiểm tra input/output errors, CRC'),
      bullet('show controllers GigabitEthernet0/0/0 — kiểm tra lỗi phần cứng'),

      h('Nguyên nhân và xử lý', HeadingLevel.HEADING_3),
      p('CRC errors cao → lỗi cáp mạng, thay cáp hoặc kiểm tra đầu bấm'),
      p('Input drops → QoS chưa cấu hình, interface bị quá tải'),
      p('Duplex mismatch → kiểm tra "show interfaces" xem speed/duplex, force 1000/full nếu cần'),

      h('TRIỆU CHỨNG 4: Switch port bị err-disabled', HeadingLevel.HEADING_2),
      p('Nguyên nhân: PortFast + BPDU Guard kích hoạt, hoặc security violation.'),
      p('Kiểm tra: show interfaces [port] status — thấy "err-disabled"'),
      p('Xử lý:'),
      p('    interface FastEthernet0/x'),
      p('    shutdown'),
      p('    no shutdown'),
      p('Nếu tái diễn, kiểm tra thiết bị kết nối vào port (switch lạ, hub, v.v.)'),

      h('5. Leo thang (Escalation)', HeadingLevel.HEADING_2),
      p('Các trường hợp cần leo thang lên Level 2 (Network Engineer):'),
      bullet('Lỗi liên quan đến routing protocol (OSPF, BGP)'),
      bullet('Sự cố ảnh hưởng toàn bộ văn phòng hoặc nhiều VLAN'),
      bullet('Firmware bug nghi ngờ cần upgrade IOS'),
      bullet('Lỗi phần cứng thiết bị (cần RMA Cisco)'),
    ],
  }],
});

// ─── Write files ──────────────────────────────────────────────────────────────
async function main() {
  const files = [
    { doc: doc1, name: 'SOP-VPN-Cisco-Recovery.docx' },
    { doc: doc2, name: 'Guide-Cisco-ISR4321-Configuration.docx' },
    { doc: doc3, name: 'Runbook-Network-Troubleshooting-L1.docx' },
  ];

  for (const { doc, name } of files) {
    const buffer = await Packer.toBuffer(doc);
    const filePath = path.join(outDir, name);
    fs.writeFileSync(filePath, buffer);
    console.log(`Created: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }
  console.log('\nDone! Upload these files to SmartDoc Insight to test RAG.');
}

main().catch(console.error);
