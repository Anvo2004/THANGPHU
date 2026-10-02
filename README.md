# MINIAPP_THANGPHU — Thăng Phú Số

Dự án độc lập được sao chép từ MINIAPP_TRALIEN ngày 02/10/2026, giữ các module Backend, AdminWeb và Zalo MiniApp. Database, tài khoản, môi trường, dữ liệu địa phương và triển khai được cấu hình riêng.

**Bắt đầu tại [Danh sách thông tin cần bổ sung](docs/SETUP_CHECKLIST.md).** Các file `.env` đã được tạo, thông tin chưa biết để trống. Chưa kết nối database, chưa tạo tài khoản trên hệ thống ngoài, chưa deploy.

**[Đánh giá theo 5 nhóm yêu cầu — 02/10/2026](docs/DANH_GIA_CHUC_NANG_2026-10-02.md): chưa đủ điều kiện nghiệm thu.** Báo cáo nêu chức năng đã có, lỗi cần sửa, thông tin cần cung cấp và các ca kiểm thử thực tế.

## Chạy trên máy

Yêu cầu Node.js 20 và MongoDB riêng (local hoặc Atlas). Các dependency đã được cài; trên máy mới chạy `npm ci` trong từng thư mục.

1. Điền `MONGO_URI`, `JWT_SECRET`, `ADMIN_SEED_PASSWORD` trong `Backend/.env`.
2. Từ thư mục `Backend`, khởi tạo dữ liệu:

```powershell
node scripts/seed.js
node scripts/seed-site-content.js
node scripts/seed-app-links.js
```

`seed-site-content.js` tạo nội dung trống cho Thăng Phú; các script bỏ qua bản ghi đã có. `seed-tthc.js` giữ danh mục TTHC tham khảo của dự án gốc; chỉ chạy sau khi rà soát nội dung cho xã mới. Không chạy seed với database của xã khác.

3. Mở ba terminal riêng:

| Thư mục | Lệnh | Địa chỉ local |
|---|---|---|
| `Backend` | `npm run dev` | http://localhost:4012 |
| `Frontend/AdminWeb` | `npm run dev` | http://localhost:5182 |
| `MiniApp` | `npm run start` | http://localhost:5183 |

Đăng nhập bằng `ADMIN_SEED_USERNAME` và `ADMIN_SEED_PASSWORD` đã đặt. Điền thông tin tích hợp theo nhu cầu. Các phần cần Zalo phải kiểm tra trong môi trường Zalo với App ID riêng.

## File cấu hình

| File | Vai trò |
|---|---|
| `Backend/.env` | DB, JWT, tài khoản admin khởi tạo, Zalo, nguồn tin, điện lực và tích hợp |
| `Frontend/AdminWeb/.env` | API và tọa độ trụ sở cho AdminWeb |
| `MiniApp/.env` | API, Mini App ID, domain preview |
| `.env` tại thư mục gốc | Biến dùng riêng cho Docker Compose |
| `MiniApp/zmp-cli.json` | App ID triển khai Zalo; đồng bộ bằng `npm run sync:app-id` |

Mỗi `.env` có `.env.example` đi kèm. Không đưa khóa bí mật vào các biến `VITE_*`, vì chúng xuất hiện trong JavaScript phía người dùng. Đổi cấu hình frontend phải build lại.

## Build và triển khai

Chạy `npm run build` trong `Frontend/AdminWeb` và `MiniApp`; cả hai xuất ra `www/`. Trong MiniApp, sau khi điền `APP_ID`, chạy `npm run sync:app-id` trước khi dùng Zalo CLI/extension. Các lệnh `deploy:dev` và `deploy:testing` tự đồng bộ ID.

Docker: điền cả `.env` ở gốc rồi chạy `docker compose up --build -d`. Cổng host mặc định: Backend 4012, AdminWeb 3012, MiniApp 3013. Compose không cung cấp MongoDB; nếu MongoDB chạy trên máy host, dùng địa chỉ phù hợp từ container (ví dụ `host.docker.internal` trên Docker Desktop). Dữ liệu upload và media gắn vào thư mục riêng của dự án.

GitHub Actions deploy và đồng bộ điện chỉ chạy thủ công sau khi bật biến tương ứng. Xem checklist để cấu hình repository/VPS. Repository của dự án: [Anvo2004/THANGPHU](https://github.com/Anvo2004/THANGPHU), nhánh `main`.

## Nội dung cần bổ sung

Logo/banner hiện là SVG tạm. Dân số, thôn, liên hệ, văn hóa, du lịch đang để trống. Đã sao chép riêng 57 ảnh và 14 video PCTT vào `Backend/media`; danh sách ở [MEDIA_CHECKLIST.json](docs/MEDIA_CHECKLIST.json). Mã nguồn đầy đủ được giữ; các chức năng cần dữ liệu hoặc dịch vụ bên ngoài chỉ kiểm thử đầy đủ sau khi bạn cung cấp cấu hình.

Kết quả kiểm tra: [VERIFICATION.md](docs/VERIFICATION.md).
