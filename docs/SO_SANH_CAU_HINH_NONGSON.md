# So sánh cấu hình Nông Sơn và Thăng Phú

Kiểm tra ngày 10/10/2026 trên các checkout local D:\NONGSON, D:\THANGPHU
và đối chiếu D:\TRALIEN. Chưa kiểm tra .env trên VPS, GitHub Secrets hoặc
cấu hình tài khoản ở nhà cung cấp. Không sao chép hoặc công bố credential.

## Hiện trạng local

- Nông Sơn có .env cho cả ba app. Backend MONGO_URI còn là mẫu; Cloudinary,
  Upstash, Zalo OA, 1022, IOCTC credentials và khóa AI còn trống.
- Nông Sơn đã có appId trong MiniApp/zmp-cli.json nhưng APP_ID trong MiniApp/.env
  đang trống; cần đồng bộ trước khi build/deploy.
- Thăng Phú đã có .env riêng và đọc cấu hình chung từ Nông Sơn; appId để trống.
- Không có bằng chứng từ những file này rằng credential production đang dùng chung.
- Tài liệu Nông Sơn có ghi chú cũ rằng parser còn là VNPT, nhưng code hiện tại
  đã đọc CMS14. Ưu tiên đối chiếu code thay vì sao chép nguyên checklist cũ.

## Cái dùng chung và cái dùng riêng

| Thành phần / biến | Có thể dùng chung | Cần riêng hoặc điều kiện |
| --- | --- | --- |
| VPS, Nginx, PM2 | Cùng máy chủ | Thư mục dự án, tên process/container, cấu hình virtual host; các process cùng host phải khác cổng listen |
| MongoDB / MONGO_URI | Cùng cluster/server | Database riêng nongson và thangphu; nên cấp user theo database. Model hiện không có tenantId để tách xã trong cùng database |
| CLOUDINARY_* | Cùng tài khoản nếu cùng đơn vị quản lý, chấp nhận quota chung | Folder riêng: nongson-feedback và thangphu-feedback. Không có Cloudinary thì code lưu trên đĩa của từng backend |
| UPSTASH_REDIS_REST_* | Cùng Redis | Thăng Phú đã thêm tiền tố thangphu: vào mọi bộ đếm, không trùng khóa Nông Sơn. Có thể để trống để dùng RAM từng process |
| ANTHROPIC_API_KEY / ANTHROPIC_MODEL | Có thể cùng dịch vụ, cùng key nếu cùng chủ tài khoản và ngân sách | Quota/chi phí dùng chung; nội dung hướng dẫn AI, nguồn dữ liệu và hạn mức nên quản lý theo xã |
| Zalo MiniApp APP_ID, zmp-cli.json | Cùng tài khoản nhà phát triển nếu tài khoản đó có quyền quản lý các app | Mỗi Mini App của xã dùng ID đúng app. Không lấy ID Nông Sơn cho Thăng Phú |
| ZALO_APP_ID / ZALO_APP_SECRET | Không kết luận dùng chung từ code/local env | Phải đúng ứng dụng được liên kết/cấp quyền. Backend dùng cho OAuth OA và kiểm tra token người dùng; không mặc định coi là cùng giá trị với MiniApp APP_ID |
| ZALO_OA_TOKEN, ZALO_REFRESH_TOKEN, ZALO_OA_SECRET_KEY | Không dùng token của OA xã khác | Dùng OA Thăng Phú. Bộ lưu token tự refresh riêng trong database; sao chép token giữa backend dễ gây sai OA và tranh chấp refresh |
| JWT_SECRET, LICH_CUP_DIEN_INGEST_SECRET | Không nên dùng chung | Sinh khóa riêng cho từng backend. JWT hiện được xác minh bằng secret, không có lớp tenant bổ sung |
| PUBLIC_URL, VITE_API_URL, CORS_ORIGIN, ZALO_SITE_VERIFICATION | Có thể cùng tên miền gốc | URL/origin và xác minh phải đúng deployment Thăng Phú; không sao chép domain Nông Sơn hoặc mã xác minh Trà Liên |
| CGY1022_BASE_URL / GOPY_PATH | Cùng endpoint thành phố nếu cùng dịch vụ | Username/password có thể là tài khoản tích hợp chung chỉ khi đơn vị cấp xác nhận phạm vi. Email, nguồn góp ý, userId và mã lĩnh vực phải đúng cấu hình được cấp |
| IOCTC_BASE_URL | Endpoint hiện cùng https://tctthc.1022.vn | Tài khoản riêng/chung theo quyền đơn vị cấp; local cả hai chưa có credential để đối chiếu |
| EVNCPC_API_URL / ORG_LIST_URL | Cùng API EVN CPC | ORG_CODE, SUBORG_CODE, XENVN_URL theo điện lực phụ trách địa bàn; chỉ trùng nếu xác nhận cùng vùng phục vụ |
| NEWS_SOURCE_URL, VAN_BAN_SOURCE_URL | Có thể dùng chung một phần logic parser CMS14 | Domain và cấu trúc/chuyên mục đúng cổng xã; không dùng nguồn Nông Sơn cho Thăng Phú |
| Nội dung kỹ năng PCTT, link dịch vụ công chung | Có thể tái sử dụng nội dung chung | Dữ liệu địa phương, tin tức, dân số, liên hệ, thôn, logo/banner phải riêng. Video media nằm ngoài Git nên cần bố trí khi triển khai |

## Khác biệt cần nhớ khi cấu hình Thăng Phú

1. Compose Thăng Phú đã đổi host ports thành 4020, 3020, 3021;
   Nông Sơn giữ 4000, 3000, 3001. Container vẫn dùng chung số cổng nội bộ.
2. Nông Sơn hardcode domain API production trong MiniApp/src/data/api-config.js.
   Thăng Phú đã đọc VITE_API_URL. Cả MiniApp và AdminWeb phải build lại khi đổi URL.
3. utils/redis.js ở cả hai thực tế đọc/ghi collection Setting của MongoDB.
   Token OA, danh sách follower/group không nằm trong Upstash. Upstash đang dùng
   cho rate-limit; hai loại kho này cần được phân biệt khi triển khai.
4. CGY1022_NGUON ở local Nông Sơn là Zalo; Trà Liên là Góp ý Zalo;
   Thăng Phú để trống. Giá trị phải khớp phía 1022, không chọn theo tên thương hiệu.
5. Nông Sơn có re-host ảnh tin qua Cloudinary/đĩa local và cào nhiều chuyên mục;
   Thăng Phú hiện đọc tin trang chủ, dùng ảnh nguồn. Không coi hai scraper giống
   hoàn toàn chỉ vì cùng CMS14.
6. Workflow Nông Sơn tự deploy khi push main; Thăng Phú chỉ chạy thủ công,
   có cờ THANGPHU_DEPLOY_ENABLED và secrets mang tên THANGPHU_*.
7. Thẻ xác minh domain kế thừa từ Trà Liên ở AdminWeb Thăng Phú đã được bỏ
   sau lần đối chiếu này; cần dùng mã đúng domain nếu đăng ký xác minh tại đó.

## File đối chiếu

- Backend/src/config/index.js và Backend/.env.example của từng dự án.
- Backend/src/utils/cloudinary.js, rateLimit.js, redis.js, zaloToken.js.
- Backend/src/routes/assistant.js, publicFeedback.js.
- Backend/src/services/cgy1022Service.js, hoSoService.js, newsScrapeService.js.
- MiniApp/src/data/api-config.js, MiniApp/zmp-cli.json, MiniApp/vite.config.js.
- docker-compose.yml và .github/workflows/deploy.yml.

Đã áp dụng kế thừa cấu hình hạ tầng, tách database/Redis và đổi cổng Thăng Phú.
Credential còn thiếu tại nguồn chung; chưa push hoặc deploy.
Xem [hướng dẫn cấu hình dùng chung](CAU_HINH_DUNG_CHUNG.md).
