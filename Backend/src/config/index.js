require("dotenv").config();
const path = require("path");

module.exports = {
  port: process.env.PORT || 4012,
  mongoUri: process.env.MONGO_URI,
  // Luôn chọn DB theo tên này, bất kể URI có kèm tên DB hay không.
  mongoDbName: process.env.MONGO_DB_NAME || "thangphu",
  jwtSecret: process.env.JWT_SECRET || "",

  adminSeed: {
    username: process.env.ADMIN_SEED_USERNAME || "admin",
    password: process.env.ADMIN_SEED_PASSWORD || "",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    keyPrefix: process.env.REDIS_KEY_PREFIX || "thangphu",
  },

  zalo: {
    appId: process.env.ZALO_APP_ID,
    appSecret: process.env.ZALO_APP_SECRET,
    oaToken: process.env.ZALO_OA_TOKEN,
    refreshToken: process.env.ZALO_REFRESH_TOKEN,
    // Khoá bí mật OA (oa.zalo.me → Cài đặt → Bảo mật) — dùng để xác thực chữ ký
    // webhook (X-ZEvent-Signature), KHÁC với ZALO_APP_SECRET. Để trống thì
    // webhook vẫn nhận request bình thường, chỉ bỏ qua bước xác thực chữ ký.
    oaSecretKey: process.env.ZALO_OA_SECRET_KEY || "",
    siteVerification: process.env.ZALO_SITE_VERIFICATION || "",
    // ID Official Account — Mini App dùng cho followOA/unfollowOA. Trống thì ẩn nút theo dõi.
    oaId: process.env.ZALO_OA_ID || "",
  },

  corsOrigin: process.env.CORS_ORIGIN === "*" ? "*" : (process.env.CORS_ORIGIN || "http://localhost:5182,http://localhost:5183").split(",").map((s) => s.trim()).filter(Boolean),

  // Tên miền ngoài .gov.vn được phép làm liên kết trong MiniApp (chủ thể là CQNN, VD báo đài
  // địa phương) — phân tách bằng dấu phẩy. Để trống = chỉ cho .gov.vn. Xem utils/linkPolicy.js.
  allowedLinkDomains: process.env.ALLOWED_LINK_DOMAINS || "",

  // URL công khai của Backend — để tạo LINK TUYỆT ĐỐI cho file gửi qua Zalo OA
  // (Zalo cần URL đầy đủ https://...; link tương đối bị bọc thành zalo.me/nf).
  publicUrl: process.env.PUBLIC_URL || "http://localhost:4012",

  // ===== Trợ lý số (Claude API) — tự tắt (503) nếu thiếu API key =====
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "",
  },

  // Thư mục chứa media tĩnh nặng (video Kỹ năng PCTT) — nằm ngoài git, phục vụ
  // qua express.static, không bị đụng tới bởi git pull / npm ci khi deploy.
  mediaDir: process.env.MEDIA_DIR || path.join(__dirname, "..", "..", "media"),

  // ===== Lịch cắt điện (EVN CPC public API) =====
  // Xác nhận mã điện lực của Thăng Phú trước khi bật đồng bộ.
  evncpc: {
    apiUrl: process.env.EVNCPC_API_URL || "https://cskh-api.cpc.vn/api/remote/outages/area",
    orgListUrl:
      process.env.EVNCPC_ORG_LIST_URL || "https://cskh-api.cpc.vn/api/remote/organizations",
    orgCode: process.env.EVNCPC_ORG_CODE || "",
    subOrgCode: process.env.EVNCPC_SUBORG_CODE || "",
    // GitHub Actions cron job (sync-lich-cup-dien.yml) gọi EVN CPC từ hạ tầng
    // GitHub rồi đẩy dữ liệu qua route ingest này (VPS có thể bị chặn gọi thẳng
    // cskh-api.cpc.vn — xem README của workflow).
    ingestSecret: process.env.LICH_CUP_DIEN_INGEST_SECRET || "",
    // Nguồn thay thế: cào trang bên thứ 3 xenvn.com (đăng lại lịch cắt điện).
    // Path dạng "dien-luc-<đơn vị>-<mã>" theo từng khu vực điện lực.
    xenvnUrl: process.env.XENVN_URL || "",
  },

  // ===== Văn bản - Chính sách =====
  // TODO: chưa xác nhận cổng thông tin điều hành của xã Thăng Phú — để trống
  // thì vanBanThangPhuService tự bỏ qua đồng bộ (không cào nhầm site khác).
  vanBanSourceUrl: process.env.VAN_BAN_SOURCE_URL || "",

  // ===== Tin tức (trang TTĐT xã) =====
  // Trang chủ Thăng Phú dùng CMS14; parser kiểm tra trên HTML thật.
  newsSourceUrl: process.env.NEWS_SOURCE_URL || "",

  // ===== Cổng góp ý 1022 (gopy.danang.gov.vn) — đồng bộ phản ánh sang hệ thống thành phố =====
  // Xác thực: HTTP Basic Auth. Bắt buộc User-Agent trình duyệt (WAF chặn UA lạ).
  // Thiếu baseUrl/username/password thì tính năng tự tắt (isConfigured=false).
  // TODO: chưa xác định Thăng Phú dùng tài khoản 1022 riêng hay dùng chung với
  // xã khác (xem docs/SETUP_CHECKLIST.md) — nếu dùng chung, phản ánh trên 1022
  // sẽ mang định danh tài khoản đó, chỉ phân biệt được qua nội dung/địa điểm.
  cgy1022: {
    baseUrl: process.env.CGY1022_BASE_URL || "",
    username: process.env.CGY1022_USERNAME || "",
    password: process.env.CGY1022_PASSWORD || "",
    gopyPath: process.env.CGY1022_GOPY_PATH || "/api/gopy",
    userId: process.env.CGY1022_USER_ID || "0",
    defaultEmail: process.env.CGY1022_DEFAULT_EMAIL || "",
    // Điền đúng nguồn đã được cấp cho tài khoản 1022 của Thăng Phú.
    nguon: process.env.CGY1022_NGUON || "",
    // JSON map tên danh mục → linhVucId của 1022, VD: {"Môi trường": 4}
    linhVucMap: process.env.CGY1022_LINHVUC_MAP || "{}",
    linhVucDefault: process.env.CGY1022_LINHVUC_DEFAULT || "",
  },

  // ===== IOCTC (Tra cứu thủ tục hành chính / hồ sơ — tctthc.1022.vn) =====
  // Xác thực: POST /getToken (username/password) → Bearer token (cache 23h),
  // rồi GET /tra-cuu?ma_ho_so=... Thiếu baseUrl/username/password thì tự tắt.
  // TODO: chưa xác định Thăng Phú dùng tài khoản IOCTC riêng hay dùng chung với
  // xã khác (xem docs/SETUP_CHECKLIST.md).
  ioctc: {
    baseUrl: process.env.IOCTC_BASE_URL || "",
    username: process.env.IOCTC_USERNAME || "",
    password: process.env.IOCTC_PASSWORD || "",
  },

  // ===== Tự động đăng tin cào lên Zalo OA (Nội dung dạng Bài viết) =====
  // Dùng CHUNG token OA của zaloToken.js (KHÔNG tạo token store riêng — tránh
  // 2 nơi refresh đá nhau làm hỏng token production). Tắt mặc định; bật bằng
  // ZALO_ARTICLE_ENABLED=true trên VPS sau khi đã chạy backfill để không dồn
  // tin cũ lên OA.
  zaloArticle: {
    enabled: (process.env.ZALO_ARTICLE_ENABLED || "false").toLowerCase() === "true",
    // Ảnh cover mặc định khi tin không có ảnh (Zalo Article bắt buộc có cover)
    defaultCover: process.env.ZALO_ARTICLE_DEFAULT_COVER || "",
    // Cờ RIÊNG cho bước broadcast (gửi bài đã tạo tới toàn bộ follower) — tách
    // khỏi "enabled" (chỉ tạo bài) vì cần quyền Zalo khác + rủi ro cao hơn hẳn
    // (không thể thu hồi sau khi gửi). Bật bằng ZALO_BROADCAST_ENABLED=true.
    broadcastEnabled: (process.env.ZALO_BROADCAST_ENABLED || "false").toLowerCase() === "true",
  },
};
