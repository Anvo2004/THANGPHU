# Các module được kế thừa

Dự án mới sao chép từ MINIAPP_TRALIEN ngày 02/10/2026. Bảng này mô tả mã nguồn đã có, không xác nhận đã hoạt động trên production của Thăng Phú.

Đánh giá mới theo ảnh yêu cầu người dùng: [DANH_GIA_CHUC_NANG_2026-10-02.md](DANH_GIA_CHUC_NANG_2026-10-02.md).

| Nhóm | Chức năng đã giữ | Điều kiện sử dụng |
|---|---|---|
| Quản trị | Đăng nhập, JWT, người dùng, phân quyền, dashboard, thống kê | MongoDB riêng, JWT và seed admin |
| Phản ánh | Gửi ảnh/vị trí, quản lý, xử lý, phản hồi, phản ánh của tôi | DB, Zalo token hợp lệ cho chức năng cá nhân, cấu hình lưu ảnh |
| Zalo OA | Token, webhook, nhóm nhận tin, OTP, gửi tin/bài viết | OA và ứng dụng được cấp quyền riêng |
| Nội dung | Tin tức, văn bản, thông báo, dân số, thôn, văn hóa, du lịch, liên hệ | Nhập dữ liệu thật và nguồn của Thăng Phú |
| Dịch vụ | Danh mục TTHC, tra cứu hồ sơ, lịch điện, lịch y tế, trợ cấp, tiện ích | DB, nguồn điện, tài khoản IOCTC nếu tra cứu hồ sơ |
| Góp ý 1022 | Gửi phản ánh, retry và đồng bộ trạng thái | Tài khoản, lĩnh vực, nguồn góp ý được cấp |
| PCTT | Kỹ năng, ảnh/video, bản đồ mưa ngập | Đã có media riêng; kiểm tra nội dung trước khi phát hành |
| Trợ lý số | Hỏi đáp AI, lấy ngữ cảnh dữ liệu hành chính | Anthropic API key và model |
| Triển khai | Docker, PM2 workflow, ingest điện thủ công | VPS/repository/domain riêng; bật cấu hình khi sẵn sàng |

URL tin/văn bản mới có thể dùng CMS khác, cần kiểm tra parser sau khi nhận nguồn. Chưa kết nối DB hay kiểm thử dịch vụ bên ngoài. Tất cả đầu mục cần bổ sung nằm trong SETUP_CHECKLIST.md.
