# Cấu hình khi tạo dự án cho địa phương khác

Đọc README.md và docs/SETUP_CHECKLIST.md. Tên package, container, network, khóa lưu phiên và process phải riêng. Mỗi dự án có DB riêng.

Đổi nhãn địa phương không đồng nghĩa dữ liệu cũ áp dụng cho xã mới. Xóa dữ liệu mẫu đặc thù, logo/banner cũ; giữ chức năng và dùng nội dung chờ cập nhật.

Không suy đoán URL bên thứ ba, tài khoản hay mã điện lực bằng cách thay tên. Thông tin chưa có để trống trong .env.example, ghi rõ checklist. Không sao chép .env thật, token hoặc lịch sử Git.

VITE_API_URL dùng cho cả hai frontend. APP_ID khai báo trong MiniApp/.env và đồng bộ bằng npm run sync:app-id.
