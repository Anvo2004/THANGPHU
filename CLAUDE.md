# MINIAPP_THANGPHU

Dự án riêng cho xã Thăng Phú, phát triển từ TRALIEN.
Xem [README.md](README.md) và [checklist](docs/SETUP_CHECKLIST.md).

- Ba app: Backend Express/MongoDB, Frontend/AdminWeb React/Vite, MiniApp React/Zalo.
- Mỗi app có .env riêng; không commit token hoặc mật khẩu thật.
- Database, JWT, OA/Mini App và thông tin địa phương phải riêng cho Thăng Phú.
- Hạ tầng MongoDB, Cloudinary, Upstash, AI và endpoint chung đọc từ SHARED_ENV_FILE;
  chỉ kế thừa allowlist trong Backend/src/config/loadEnvironment.js.
- Không đoán URL, mã điện lực hoặc tài khoản OA/1022/IOCTC.
- Tích hợp chưa cấu hình tự bỏ qua hoặc báo chưa sẵn sàng.
- VITE_API_URL được đưa vào bundle cả hai frontend khi build.
- Tin tức và văn bản dùng CMS14; kiểm tra bằng node --test test/portalParser.test.cjs.
- Chỉ push vào repo riêng của Thăng Phú sau khi cấu hình remote.
- Không ghi code trực tiếp lên VPS trước khi commit vào repo dự án.
