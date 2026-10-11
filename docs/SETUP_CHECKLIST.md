# Thông tin cần bổ sung — MINIAPP_THANGPHU

Ngày tạo: 02/10/2026. Tất cả mục chưa đánh dấu cần bạn cung cấp hoặc xác nhận. Không có domain, mã điện lực, tài khoản hay dữ liệu thực tế của Thăng Phú nào được suy đoán từ Trà Liên.

## 1. Bắt buộc để chạy Backend và đăng nhập

Điền tại `Backend/.env`:

| Biến | Cần cung cấp |
|---|---|
| `MONGO_URI` | Chuỗi kết nối MongoDB riêng, có tên DB (gợi ý `thangphu`), tài khoản và quyền truy cập riêng; cho phép IP máy/VPS. Chưa điền để tránh kết nối nhầm. |
| `JWT_SECRET` | Khóa ngẫu nhiên riêng ít nhất 32 ký tự; có thể tạo bằng `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `ADMIN_SEED_USERNAME` | Tên tài khoản quản trị ban đầu; đang gợi ý `admin`. |
| `ADMIN_SEED_PASSWORD` | Mật khẩu riêng ít nhất 12 ký tự để chạy `node scripts/seed.js`; không có mật khẩu mặc định. |
| `PORT` | Đã đặt 4012 để tách khỏi dự án gốc; cập nhật các API URL nếu thay đổi. |
| `NODE_ENV` | `development` khi chạy local; đặt `production` khi triển khai. |
| `PUBLIC_URL` | URL HTTPS Backend thật khi triển khai; dùng tạo link file gửi Zalo. Local đang là `http://localhost:4012`. |
| `CORS_ORIGIN` | Danh sách origin được phép, phân cách dấu phẩy; bổ sung origin của AdminWeb/MiniApp/Zalo thực tế. Local đã có các cổng của dự án này. |

Backend dừng với thông báo cấu hình thiếu nếu chưa có DB/JWT. Seed chưa được chạy vì chưa có database của bạn.

## 2. Domain, API và Zalo Mini App

- [ ] Cung cấp domain HTTPS riêng cho Backend, AdminWeb, MiniApp web nếu dùng; DNS, SSL và reverse proxy tương ứng.
- [ ] `Frontend/AdminWeb/.env`: `VITE_API_URL` = URL Backend; `VITE_MAP_LAT`, `VITE_MAP_LNG` = tọa độ trụ sở đã xác nhận. Để trống tọa độ thì giao diện không đánh dấu vị trí xã.
- [ ] `MiniApp/.env`: `VITE_API_URL` = cùng Backend; `APP_ID` = ID Mini App mới từ Zalo Mini App Console; `PREVIEW_ALLOWED_HOSTS` = domain preview không kèm giao thức, ngăn bằng dấu phẩy nếu có nhiều domain.
- [ ] Chạy `npm run sync:app-id` trong MiniApp để ghi ID vào `zmp-cli.json`. File hiện để trống, không chứa ID của dự án gốc.
- [ ] Khai báo domain API được phép gọi, quyền thông tin người dùng/vị trí, người kiểm thử và liên kết OA theo cấu hình Console của Mini App mới.
- [ ] Rà soát trang điều khoản và quyền riêng tư tại `<PUBLIC_URL>/dieu-khoan-su-dung` trước khi gửi Zalo duyệt. Nội dung kế thừa đang là bản dự thảo.
- [ ] Chọn tên hiển thị chính thức, xác nhận đơn vị hành chính. Nhãn tạm là “Thăng Phú Số”, “UBND xã Thăng Phú”, Thành phố Đà Nẵng theo cấu trúc dự án nguồn.

## 3. Zalo OA và xác thực

Điền tại `Backend/.env` bằng thông tin ứng dụng/OA được cấp cho Thăng Phú:

| Biến | Cần cung cấp |
|---|---|
| `ZALO_APP_ID` | ID ứng dụng Zalo Developers gắn OA. Phân biệt với `APP_ID` của Mini App. |
| `ZALO_APP_SECRET` | Secret ứng dụng dùng bởi luồng token và xác thực người dùng hiện có; xác nhận ứng dụng liên kết đúng Mini App/OA. |
| `ZALO_OA_TOKEN`, `ZALO_REFRESH_TOKEN` | Cặp access token/refresh token của OA riêng. |
| `ZALO_OA_SECRET_KEY` | Khóa OA cho chữ ký webhook. |
| `ZALO_SITE_VERIFICATION` | Mã xác minh domain mới, chỉ điền giá trị content; Backend xuất thẻ meta khi có giá trị. |
| `ZALO_ARTICLE_ENABLED` | Giữ `false` tới khi kiểm tra nguồn tin và quyền tạo bài OA. |
| `ZALO_ARTICLE_DEFAULT_COVER` | URL ảnh cover do Thăng Phú quản lý. |
| `ZALO_BROADCAST_ENABLED` | Giữ `false` tới khi muốn tự gửi bài tới follower và đã kiểm tra quyền gửi. |

- [ ] OA ID/trang OA, tên OA và tài khoản quản trị OA mới.
- [ ] Đăng ký webhook `<PUBLIC_URL>/api/zalo/webhook`, redirect URL OAuth và các quyền tương ứng trên Zalo Developers.
- [ ] Gắn Zalo user ID của cán bộ, danh mục/phòng ban và nhóm nhận thông báo trong AdminWeb. Danh sách follower/nhóm/token lưu trong DB mới, không sao chép dữ liệu cũ.
- [ ] Trước khi bật đăng bài tự động cho database đã có tin: rà soát rồi chạy `node scripts/backfill-news-zalo-skip.js` theo nhu cầu bỏ qua tin cũ.

## 4. Ảnh, video và lưu trữ

| Nơi cấu hình | Thông tin còn thiếu |
|---|---|
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Tài khoản Cloudinary riêng nếu dùng CDN; nếu bỏ trống, upload lưu trong `Backend/public/images`. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Tùy chọn theo nhu cầu triển khai. Mã nguồn hiện có fallback và một số dữ liệu setting lưu MongoDB. |
| `MEDIA_DIR` | Thư mục video/ảnh riêng; bỏ trống dùng `Backend/media`. Với Docker, đường dẫn phải đúng bên trong container. |
| `MiniApp/src/static/logo-thangphu.svg`, `Frontend/AdminWeb/src/images/logo-thangphu.svg` | Logo chính thức; hiện là biểu tượng tạm. Nếu dùng PNG/JPG cần sửa import tương ứng. |
| `MiniApp/src/static/banner-thangphu.svg` | Banner/ảnh trụ sở chính thức. |
| `docs/MEDIA_CHECKLIST.json` | Danh sách đầy đủ ảnh và video PCTT; đã có bản sao riêng. Đường dẫn `/media/...` tương ứng file trong `Backend/media/...`. |

Danh mục, tiêu đề và cấu trúc bài PCTT được giữ nguyên. Đã sao chép 14 video từ máy và tải 57 ảnh hướng dẫn công khai về `Backend/media` của dự án mới. Link ảnh Cloudinary của dự án nguồn đã chuyển sang media nội bộ, không phụ thuộc tài khoản lưu trữ cũ khi chạy. Toàn bộ đường dẫn trong manifest đã có file. Media nằm ngoài Git; khi chuyển sang máy/VPS mới cần sao chép thư mục này riêng.

## 5. Tin tức, văn bản và lịch điện

| Biến trong `Backend/.env` | Cần cung cấp |
|---|---|
| `NEWS_SOURCE_URL` | URL trang danh sách tin chính thức của Thăng Phú. |
| `VAN_BAN_SOURCE_URL` | URL danh sách văn bản/chỉ đạo điều hành chính thức. |
| `XENVN_URL` | URL nguồn lịch điện đúng đơn vị phụ trách; chưa xác nhận nên để trống. |
| `EVNCPC_ORG_CODE`, `EVNCPC_SUBORG_CODE` | Mã công ty/đơn vị điện lực thực tế. |
| `EVNCPC_API_URL`, `EVNCPC_ORG_LIST_URL` | Endpoint API điện lực dùng chung đã giữ từ nguồn; xác nhận nếu nhà cung cấp thay đổi. |
| `LICH_CUP_DIEN_INGEST_SECRET` | Khóa riêng nếu dùng ingest từ GitHub Actions, phải khớp GitHub Secret cùng tên. |

Parser tin/văn bản kế thừa portal VNPT (`ArticleCat`/`ArticleList`); phải thử HTML của URL mới, có thể cần điều chỉnh parser nếu CMS khác. Chưa có URL nên chưa kiểm tra khả năng đồng bộ nguồn Thăng Phú. Cron trong Backend được giữ; nguồn chưa có cấu hình thì bỏ qua. Feed lịch điện hiện lấy toàn bộ trạm từ nguồn đã chọn; xác nhận phạm vi hoặc yêu cầu lọc theo xã nếu cần.

## 6. Góp ý 1022, hồ sơ hành chính và trợ lý AI

| Nhóm | Biến cần điền/xác nhận |
|---|---|
| Góp ý 1022 | `CGY1022_BASE_URL`, `CGY1022_USERNAME`, `CGY1022_PASSWORD`: tài khoản được cấp cho Thăng Phú. |
| Metadata góp ý | `CGY1022_GOPY_PATH` (đang `/api/gopy`), `CGY1022_USER_ID` (đang 0), `CGY1022_DEFAULT_EMAIL`, `CGY1022_NGUON` (giá trị đã đăng ký với phía 1022). |
| Ánh xạ lĩnh vực | `CGY1022_LINHVUC_MAP` là JSON tên danh mục → ID; `CGY1022_LINHVUC_DEFAULT` là ID dự phòng hợp lệ. Công cụ: `scripts/cgy1022-map-categories.js`, `scripts/probe-cgy1022.js`. |
| Tra cứu hồ sơ IOCTC | `IOCTC_BASE_URL`, `IOCTC_USERNAME`, `IOCTC_PASSWORD`. |
| Trợ lý số | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`: key riêng và model mà tài khoản được cấp quyền sử dụng. |

Các tích hợp này chưa được gọi tới hệ thống thật. Giữ trống để tính năng báo chưa cấu hình hoặc bỏ qua đồng bộ.

## 7. Dữ liệu địa phương

- [ ] Địa chỉ, điện thoại, hotline, email, website, giờ làm việc của UBND/Trung tâm phục vụ hành chính công.
- [ ] Họ tên, chức vụ, số liên hệ chủ tịch; địa chỉ, điện thoại công an xã và các đơn vị cần hiển thị.
- [ ] Dân số, diện tích, số hộ, số thôn, thống kê giới tính/độ tuổi và ngày số liệu được xác nhận.
- [ ] Danh sách thôn, trưởng thôn, bí thư, mặt trận và thông tin liên hệ.
- [ ] Nội dung/ảnh du lịch, danh thắng, văn hóa, di sản và nguồn bài viết được phép sử dụng.
- [ ] Danh mục TTHC, giấy tờ, lệ phí, thời hạn, nơi tiếp nhận, link dịch vụ; rà soát `Backend/scripts/seed-tthc.js` trước khi seed.
- [ ] Thông báo, lịch y tế/tiêm chủng, trợ cấp, lịch chi trả, các danh mục phản ánh và người phụ trách.
- [ ] Link UBND xã, OA, bản đồ và các tiện ích liên quan. Link dịch vụ chung được giữ từ dự án nguồn; xác nhận phù hợp trước khi công bố.

`CONTACT_ADDRESS`, `CONTACT_PHONE`, `CONTACT_EMAIL`, `CONTACT_WEBSITE` trong `Backend/.env` phục vụ trang điều khoản và seed liên hệ lần đầu. `CONTACT_WEBSITE` dùng hostname để tương thích trang liên hệ. Sau khi seed, cập nhật nội dung DB qua các API quản trị `/api/site-info`, `/api/dan-so`, `/api/du-lich`, `/api/van-hoa`, `/api/thon-xom` (cần token và quyền phù hợp); không phải mọi mục này đều có màn hình sửa riêng trong AdminWeb. Có thể chuẩn bị dữ liệu trong `seed-site-content.js` trước lần seed đầu. Đổi `.env` không tự ghi đè nội dung đã lưu trong DB.

## 8. VPS, Docker và GitHub

- [x] Đã xác định repository riêng [Anvo2004/THANGPHU](https://github.com/Anvo2004/THANGPHU), nhánh `main`; không mang lịch sử Git của Trà Liên.
- [ ] VPS, user SSH, đường dẫn dự án riêng có tên thư mục cuối là `thangphu` (ví dụ `/var/www/thangphu`), Node.js, Nginx, PM2, SSL.
- [ ] Khởi tạo PM2 process `thangphu` (MiniApp preview nếu dùng) và `thangphu-backend`; workflow chỉ restart process đã có. Nếu chọn Docker thì vận hành bằng Compose, workflow PM2 không dùng cho cách triển khai này.
- [ ] Nginx AdminWeb trỏ tới `Frontend/AdminWeb/www`; cấu hình API, media, HTTPS và giới hạn upload phù hợp.
- [ ] `.env` gốc cho Compose: `BACKEND_PORT`, `ADMIN_PORT`, `MINIAPP_PORT`, `VITE_API_URL_ADMIN`, `VITE_API_URL_MINIAPP`, `APP_ID`, `VITE_MAP_LAT`, `VITE_MAP_LNG`. Đây là cấu hình riêng của Compose, không tự đọc frontend `.env` vì chúng bị loại khỏi Docker build context.

GitHub **Secrets**: `VPS_HOST`, `VPS_DEPLOY_SSH_KEY`, `LICH_CUP_DIEN_INGEST_SECRET` (nếu dùng ingest).

GitHub **Variables**: `VPS_USERNAME`, `VPS_PROJECT_PATH`, `BACKEND_PUBLIC_URL`, `EVNCPC_ORG_CODE`, `EVNCPC_SUBORG_CODE`. Đặt `DEPLOY_ENABLED=true` khi sẵn sàng deploy, `SYNC_ENABLED=true` khi sẵn sàng chạy sync thủ công. Cả hai workflow chỉ nhận `workflow_dispatch`, không tự chạy khi push.

## 9. Kiểm thử sau khi bổ sung

- [ ] Seed DB riêng, đăng nhập admin, quản lý người dùng và phân quyền.
- [ ] Đọc nội dung MiniApp, gửi phản ánh/ảnh, theo dõi phản ánh cá nhân và phản hồi cán bộ.
- [ ] Token người dùng MiniApp, OA webhook, quên mật khẩu/OTP Zalo, nhóm nhận tin.
- [ ] Tin/văn bản đúng xã, lịch điện đúng địa bàn, 1022 và IOCTC bằng tài khoản mới.
- [ ] Ảnh/video PCTT, liên hệ, bản đồ, điều khoản và quyền riêng tư.
- [ ] Domain API thực tế trong bundle frontend sau build; không dùng localhost khi truy cập từ thiết bị khác/production.
- [ ] Chỉ bật tự đăng bài/broadcast sau khi thử thành công với nội dung và OA của Thăng Phú.
