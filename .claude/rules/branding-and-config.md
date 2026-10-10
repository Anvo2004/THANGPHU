# Chuyển dự án sang xã khác

Mỗi xã có checkout, database, tài khoản OA, Mini App ID và cấu hình triển khai riêng.
Xem docs/SETUP_CHECKLIST.md cho bản Thăng Phú hiện tại.

- Đổi tên app, nhãn giao diện, package, container, khóa Setting và đường dẫn triển khai.
- URL API frontend lấy từ VITE_API_URL khi build, không hardcode domain xã cũ.
- Không suy ra URL cổng xã hay mã điện lực bằng tìm-thay; kiểm tra nguồn thật.
- Cấu trúc CMS có thể khác; kiểm tra cả danh sách, thân bài và văn bản.
- Không đổi tên rồi giữ dữ liệu, logo hoặc ảnh riêng của xã cũ.
- Không dùng lại Zalo Mini App ID, token OA, mã xác minh domain hay database của xã cũ.
- Thiếu cấu hình bên ngoài: để trống và bỏ qua có thông báo.
