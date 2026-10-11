# MINIAPP_THANGPHU

Dự án riêng kế thừa chức năng MINIAPP_TRALIEN. Xem README.md và docs/SETUP_CHECKLIST.md.

- Backend Express/Mongoose cổng 4012; AdminWeb React/Vite cổng 5182; MiniApp Zalo/Vite cổng 5183.
- Giữ riêng MongoDB, env, khóa Zalo, JWT, domain, storage và credentials tích hợp.
- Không suy đoán domain/mã điện lực/dữ liệu xã; chưa biết thì để trống và ghi checklist.
- API URL của cả hai frontend lấy từ VITE_API_URL; phải build lại khi thay đổi.
- APP_ID trong MiniApp/.env đồng bộ bằng npm run sync:app-id; không dùng ID dự án nguồn.
- Không sửa dự án nguồn, không kết nối hệ thống cũ để seed/test.
- Logo/banner tạm dạng SVG; thông tin địa phương còn chờ bổ sung. Đã sao chép media PCTT vào Backend/media.
- Workflow deploy/sync chỉ chạy thủ công sau khi cấu hình repository riêng.
