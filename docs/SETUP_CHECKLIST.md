# Chuẩn bị triển khai Thăng Phú Số

## Đã chuẩn bị

Tên xã trên ba app; banner từ cổng xã; icon tòa nhà tạm (chưa phải logo chính thức).
Parser CMS14 cho tin tức, thân bài, bảng văn bản; database mẫu thangphu và khóa
Setting riêng. Đã bỏ dữ liệu riêng Trà Liên. Xem nguồn trong bảng đối chiếu.

## Cần cấu hình

- [ ] Backend/.env: SHARED_ENV_FILE đúng đường dẫn, MONGO_DB_NAME=thangphu,
  JWT_SECRET ngẫu nhiên, PUBLIC_URL và CORS. Có thể dùng cùng MongoDB server.
- [ ] Tài khoản quản trị riêng, bằng Backend/scripts/seed.js; đổi mật khẩu khởi tạo sau lần đăng nhập đầu.
- [ ] Mini App ID: cùng giá trị trong MiniApp/zmp-cli.json và MiniApp/.env (APP_ID).
- [ ] Backend ZALO_APP_ID, app secret, token OA, OA secret, webhook và domain whitelist.
- [ ] ZALO_SITE_VERIFICATION cho domain mới, không dùng mã xã khác.
- [ ] Cloudinary, Upstash và khóa AI: điền một lần ở file chung;
  Thăng Phú tự kế thừa. REDIS_KEY_PREFIX=thangphu tách bộ đếm.
- [ ] 1022/IOCTC: tài khoản của xã, email, nguồn góp ý, mã lĩnh vực.
- [ ] EVN/XENVN: xác nhận mã/feed điện lực đúng khu vực trước khi bật đồng bộ.
- [ ] Logo, hotline tiếp dân, giờ làm việc, danh sách thôn, lịch y tế, văn hóa và du lịch.
- [ ] Rà soát điều khoản sử dụng trước khi gửi Zalo xét duyệt.
- [ ] VITE_API_URL trong cả hai frontend, build lại trước khi triển khai.
- [ ] PREVIEW_ALLOWED_HOSTS nếu dùng web mirror qua Vite preview.

Nếu nguồn tin thiếu chuỗi chứng chỉ TLS, sửa chuỗi hoặc dùng CA hệ thống tin cậy;
không tắt xác minh TLS trong code. Tự đăng OA và broadcast mặc định tắt.

## Git và triển khai

Checkout xuất phát từ repo TRALIEN. Tạo repo riêng rồi đổi remote trước khi push;
không push thay đổi này vào Trà Liên. Chưa push hoặc deploy trong bước chuyển đổi.

Workflow deploy chỉ chạy thủ công khi THANGPHU_DEPLOY_ENABLED=true, environment
thangphu, secrets THANGPHU_VPS_HOST và THANGPHU_VPS_DEPLOY_SSH_KEY.
Đường dẫn dự kiến /var/www/thangphu; PM2 thangphu và thangphu-backend.

Workflow lịch điện yêu cầu variables THANGPHU_API_URL, THANGPHU_EVNCPC_ORG_CODE,
THANGPHU_EVNCPC_SUBORG_CODE và secret THANGPHU_LICH_CUP_DIEN_INGEST_SECRET.
