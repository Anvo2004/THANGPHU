# Kết quả kiểm tra — 02/10/2026

## Đã đạt

Phần này ghi lại kiểm tra khi sao chép dự án. Kết quả rà soát mới theo yêu cầu người dùng ở cuối tài liệu.

- Cài dependency bằng `npm ci` cho cả ba ứng dụng, dùng lockfile kế thừa.
- `npm run build` thành công cho MiniApp và AdminWeb; kết quả trong thư mục `www` của từng app.
- Kiểm tra cú pháp 72 file JavaScript Backend, bao gồm server và các script.
- Kiểm tra seed dân số/du lịch/văn hóa/liên hệ hợp lệ với schema và không chứa dữ liệu xã cũ.
- Kiểm tra HTTP local không kết nối DB: `/health`, trang gốc, trang điều khoản, CORS cho cổng AdminWeb riêng, chặn API quản trị khi thiếu token, trả 503 cho IOCTC/ingest điện khi thiếu cấu hình.
- Kiểm tra cấu hình mặc định: DB, JWT, credentials Zalo, nguồn tin/văn bản và mã xác minh domain để trống; tự đăng bài/broadcast tắt.
- Kiểm tra mọi biến đọc trong config Backend đều có trong `.env.example`.
- Backend dừng rõ ràng khi thiếu `MONGO_URI`; lệnh đồng bộ Zalo App ID từ chối khi ID chưa điền.
- Kiểm tra bundle hai frontend dùng `http://localhost:4012`, không chứa API/domain Trà Liên, ID Mini App cũ hoặc cloud ảnh cũ.
- Đã có bản sao riêng 57 ảnh và 14 video PCTT; tất cả đường dẫn media trong manifest tồn tại.
- Các file `.env`, `.env.production`, dependency, build và media riêng được Git bỏ qua. Git mới dùng nhánh `main`, chưa gắn remote.
- Dự án nguồn MINIAPP_TRALIEN không bị sửa; `git status --porcelain` rỗng sau khi hoàn tất sao chép.

## Chưa kiểm thử

Chưa kết nối MongoDB, chưa seed hay chạy quy trình nghiệp vụ đầy đủ. Chưa kiểm thử trên thiết bị Zalo, OA, Cloudinary/Upstash riêng, IOCTC, CGY1022, AI hoặc nguồn tin/điện của Thăng Phú vì cần cấu hình từ người dùng. Chưa chạy Docker build/Compose do máy kiểm tra không có lệnh Docker. Chưa triển khai VPS/GitHub/Zalo.

Build còn cảnh báo dependency/API cũ của Vite/Sass và kích thước bundle AdminWeb lớn từ dự án kế thừa; không làm build thất bại. Không thay đổi phiên bản thư viện trong lần sao chép này.

## Rà soát theo yêu cầu người dùng — 02/10/2026

Môi trường: Windows, Node.js `v20.19.5`, npm `11.11.0`. Dùng dependency đã cài sẵn; không chạy lại `npm ci` trong đợt đánh giá này.

| Kiểm tra đã chạy lại | Kết quả |
|---|---|
| `npm run build` tại MiniApp | Thành công; cảnh báo Vite CJS và Sass legacy API. |
| `npm run build` tại Frontend/AdminWeb | Thành công; cảnh báo chunk lớn, JS chính khoảng 1,57 MB trước gzip. |
| `node --check` trên 72 file JS Backend | 72/72 hợp lệ. |
| Đối chiếu manifest media với file trên máy | 71/71 có file. |
| GET `/health`, `/`, `/dieu-khoan-su-dung` | HTTP 200. |
| GET `/api/feedbacks` không có JWT | HTTP 401. |
| GET `/api/public/feedbacks/mine` khi thiếu Zalo secret | HTTP 503. |
| GET `/api/public/tra-cuu-ho-so?ma_ho_so=AUDIT` khi chưa cấu hình | HTTP 503. |
| POST `/api/public/assistant/ask` có câu hỏi khi chưa cấu hình | HTTP 503. |
| POST `/api/public/lich-cup-dien/ingest` khi thiếu ingest secret | HTTP 503. |
| CORS origin `http://localhost:5182` | Header cho phép đúng origin. |

HTTP chạy Express trên cổng tạm, không chạy `server.js`, không kết nối DB hoặc khởi động các job đồng bộ. Lượt kiểm tra đầu dùng nhầm tham số `maHoSo` nên nhận 400; đã sửa harness dùng đúng `ma_ho_so` và chạy lại toàn bộ thành công. Đây là lỗi tham số của kiểm tra, không phải lỗi API tra cứu.

### Mô phỏng lỗi nghiệp vụ đã xác nhận

Dùng Node VM nạp `cgy1022StatusService.js`, thay model/1022/Zalo bằng đối tượng giả; không gọi dịch vụ ngoài hoặc gửi tin thật.

- Với `maTinhTrangXuLy=DANG_XU_LY`: không ghi DB, trạng thái nội bộ vẫn `pending`.
- Với `DA_XU_LY` và nội dung kết quả, Zalo giả trả `{error:-1}`: trạng thái vẫn thành `resolved`; gọi kiểm tra lần hai không gửi lại. Tổng hai lần kiểm tra chỉ có một lần gọi gửi.
- Đọc mã xác nhận luồng trên chỉ gọi gửi người dân, không gửi nhóm; truy vấn sweep giới hạn 20 bản cũ nhất và loại bản `resolved`.

Các kết quả này chứng minh khoảng thiếu trong mã hiện tại; chưa phải kiểm thử tích hợp thật. Không sửa logic nghiệp vụ trong đợt đánh giá.

### Chuẩn bị GitHub

- Rà soát các file chuẩn bị commit bằng mẫu nhận diện private key, GitHub token, API key, JWT, URL chứa mật khẩu và chuỗi mật khẩu gán trực tiếp.
- Phát hiện chuỗi JWT trong tài liệu API DOCX; đã thêm `docs/*.docx` vào `.gitignore` để giữ tài liệu tại máy. Không kết luận token còn hiệu lực.
- `.env`, dependency, build, ảnh upload và media tiếp tục nằm ngoài Git. Không đưa cấu hình bí mật lên repository.
- Repository đích: `https://github.com/Anvo2004/THANGPHU.git`, nhánh `main`. Deploy/sync chỉ chạy thủ công; push không tự triển khai.

Báo cáo nghiệp vụ và danh sách đầu vào: [DANH_GIA_CHUC_NANG_2026-10-02.md](DANH_GIA_CHUC_NANG_2026-10-02.md).
