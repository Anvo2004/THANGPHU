# Cấu hình dùng chung với Nông Sơn

Thăng Phú đọc trực tiếp các giá trị được phép từ `D:/NONGSON/Backend/.env`.
Không cần sao chép key sang hai dự án. Nông Sơn tiếp tục dùng file hiện có;
không sửa code hoặc dữ liệu Nông Sơn. Đổi giá trị trong file chung rồi khởi động
lại backend để áp dụng; cấu hình không tự nạp lại khi tiến trình đang chạy.

## Dùng chung

- `MONGO_URI`: cùng server/cluster. Mọi kết nối, kể cả script seed/backfill,
  đều truyền `dbName` từ `MONGO_DB_NAME=thangphu`, ghi đè database trong URI.
  Tài khoản MongoDB cần được cấp quyền cho database Thăng Phú.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`:
  cùng tài khoản; ảnh phản ánh Thăng Phú vào folder `thangphu-feedback`.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: cùng Redis;
  khóa giới hạn lượt gọi của Thăng Phú bắt đầu bằng `thangphu:`.
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`: chung dịch vụ và hạn mức tài khoản.
- `EVNCPC_API_URL`, `EVNCPC_ORG_LIST_URL`, `CGY1022_BASE_URL`,
  `CGY1022_GOPY_PATH`, `IOCTC_BASE_URL`: endpoint dịch vụ dùng chung.

## Giữ riêng

Database, JWT/ingest secret, Zalo/OA/Mini App, URL/CORS/mã xác minh domain,
nguồn tin/văn bản, mã điện lực và dữ liệu địa phương không được kế thừa.
Tài khoản 1022/IOCTC chỉ cấu hình sau khi xác định phạm vi được cấp cho xã;
không tự lấy username/password hoặc mã định danh của Nông Sơn.

Thứ tự ưu tiên: biến môi trường tiến trình → `.env` của Thăng Phú → file chung
→ mặc định trong code. Giá trị trống cho phép kế thừa. Cloudinary và Upstash
phải đủ cả nhóm; nếu đã điền một thành phần riêng thì không ghép với tài khoản
chung. Nếu cần ngắt kế thừa hoàn toàn, đặt `SHARED_ENV_FILE=`.

## Chạy trên máy hiện tại

`Backend/.env` dùng `SHARED_ENV_FILE=../../NONGSON/Backend/.env` (tính từ
thư mục Backend). File riêng đã tạo JWT/ingest secret ngẫu nhiên và được Git
bỏ qua. Khi tạo môi trường khác từ `.env.example`, sinh lại hai secret này.

File Nông Sơn local được kiểm tra ngày 10/10/2026: MongoDB còn URI mẫu,
Cloudinary/Upstash/AI còn thiếu credential. Loader bỏ qua mẫu đã nhận diện;
MongoDB khi đó dùng `mongodb://127.0.0.1:27017`, database `thangphu`.
Cần có MongoDB local hoặc điền URI thật tại nguồn chung trước khi chạy backend.
Cloudinary thiếu thì dùng lưu file local; rate limit dùng RAM; AI chưa bật.

| Dịch vụ | Cổng mặc định Thăng Phú |
| --- | --- |
| Backend local / host Docker | 4020 |
| Admin Vite dev | 5175 |
| MiniApp Vite dev | 5176 |
| Admin Docker | 3020 |
| MiniApp preview / Docker | 3021 |

MiniApp preview và container MiniApp là hai cách phục vụ thay thế; nếu chạy
đồng thời, đổi `PREVIEW_PORT` hoặc `THANGPHU_MINIAPP_PORT`.

## Docker hoặc VPS

Docker Compose đọc `.env` ở gốc dự án. `SHARED_ENV_FILE_HOST` trỏ tới file chung
trên host; compose mount chỉ đọc vào `/run/shared/backend.env`. Cổng nội bộ
backend là 4000, cổng host mặc định 4020. Cả hai frontend dùng API Thăng Phú.
Đặt URL HTTPS thực tế, `THANGPHU_MINIAPP_ID` đúng app và build lại khi triển khai.

Trên VPS, chỉnh `SHARED_ENV_FILE` thành đường dẫn file chung thực tế và cho
user chạy backend quyền đọc. Có thể chuyển phần hạ tầng sang một file chung
chuyên dụng mà không sửa loader. Kiểm tra cổng còn trống và cấu hình Nginx/PM2.
Chưa triển khai lên VPS hay thay đổi GitHub Secrets trong bước này.
