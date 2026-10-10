# Thăng Phú Số

Mini App Zalo phục vụ người dân xã Thăng Phú, phát triển từ dự án Trà Liên.
Gồm MiniApp, AdminWeb và Backend Express/MongoDB; giữ chức năng phản ánh,
tin tức, văn bản, tra cứu, lịch y tế, lịch điện, thông báo và trợ lý số.

## Chạy local

Trong mỗi app, sao chép .env.example thành .env nếu chưa có, rồi cài dependency
bằng npm ci. Backend đọc các cấu hình hạ tầng dùng chung từ Backend/.env của
Nông Sơn qua SHARED_ENV_FILE. Database luôn chọn theo MONGO_DB_NAME=thangphu;
không dùng chung dữ liệu xã. Xem [hướng dẫn cấu hình chung](docs/CAU_HINH_DUNG_CHUNG.md).
Chạy từng app trong terminal riêng:

- Backend: npm run dev (cổng 4020).
- Frontend/AdminWeb: npm run dev (cổng 5175).
- MiniApp: npm run start (cổng 5176).

Sau khi cấu hình database, trong Backend chạy node scripts/seed-site-content.js
và node scripts/seed-app-links.js để tạo nội dung ban đầu.
Tạo tài khoản cán bộ và danh mục bằng node scripts/seed.js trong Backend.
Script tạo tài khoản admin với mật khẩu khởi tạo ghi trong script; đổi ngay sau lần đăng nhập đầu.

## Kiểm tra

- Backend: node --test
- MiniApp và Frontend/AdminWeb: npm run build

VITE_API_URL của mỗi frontend mặc định là http://localhost:4020; khi triển khai
điền URL HTTPS thực tế rồi build lại. Không dùng database, OA hoặc Mini App ID
của Trà Liên. Xem [checklist cấu hình](docs/SETUP_CHECKLIST.md).
