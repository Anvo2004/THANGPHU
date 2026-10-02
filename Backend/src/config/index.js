require("dotenv").config();
const path = require("path");

module.exports = {
  port: process.env.PORT || 4012,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "",

  adminSeed: {
    username: process.env.ADMIN_SEED_USERNAME || "admin",
    password: process.env.ADMIN_SEED_PASSWORD || "",
  },
  siteVerification: process.env.ZALO_SITE_VERIFICATION || "",
  contact: {
    address: process.env.CONTACT_ADDRESS || "",
    phone: process.env.CONTACT_PHONE || "",
    email: process.env.CONTACT_EMAIL || "",
    website: process.env.CONTACT_WEBSITE || "",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },

  zalo: {
    appId: process.env.ZALO_APP_ID,
    appSecret: process.env.ZALO_APP_SECRET,
    oaToken: process.env.ZALO_OA_TOKEN,
    refreshToken: process.env.ZALO_REFRESH_TOKEN,
    oaSecretKey: process.env.ZALO_OA_SECRET_KEY || "",
  },

  corsOrigin: process.env.CORS_ORIGIN === "*" ? "*" : (process.env.CORS_ORIGIN || "http://localhost:5182,http://localhost:5183").split(",").map((s) => s.trim()).filter(Boolean),

  publicUrl: process.env.PUBLIC_URL || "http://localhost:4012",

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "",
  },

  mediaDir: process.env.MEDIA_DIR || path.join(__dirname, "..", "..", "media"),

  evncpc: {
    apiUrl: process.env.EVNCPC_API_URL || "https://cskh-api.cpc.vn/api/remote/outages/area",
    orgListUrl:
      process.env.EVNCPC_ORG_LIST_URL || "https://cskh-api.cpc.vn/api/remote/organizations",
    orgCode: process.env.EVNCPC_ORG_CODE || "",
    subOrgCode: process.env.EVNCPC_SUBORG_CODE || "",
    ingestSecret: process.env.LICH_CUP_DIEN_INGEST_SECRET || "",
    xenvnUrl: process.env.XENVN_URL || "",
  },

  vanBanSourceUrl: process.env.VAN_BAN_SOURCE_URL || "",

  newsSourceUrl: process.env.NEWS_SOURCE_URL || "",

  cgy1022: {
    baseUrl: process.env.CGY1022_BASE_URL || "",
    username: process.env.CGY1022_USERNAME || "",
    password: process.env.CGY1022_PASSWORD || "",
    gopyPath: process.env.CGY1022_GOPY_PATH || "/api/gopy",
    userId: process.env.CGY1022_USER_ID || "0",
    defaultEmail: process.env.CGY1022_DEFAULT_EMAIL || "",
    nguon: process.env.CGY1022_NGUON || "",
    linhVucMap: process.env.CGY1022_LINHVUC_MAP || "{}",
    linhVucDefault: process.env.CGY1022_LINHVUC_DEFAULT || "",
  },

  ioctc: {
    baseUrl: process.env.IOCTC_BASE_URL || "",
    username: process.env.IOCTC_USERNAME || "",
    password: process.env.IOCTC_PASSWORD || "",
  },

  zaloArticle: {
    enabled: (process.env.ZALO_ARTICLE_ENABLED || "false").toLowerCase() === "true",
    defaultCover: process.env.ZALO_ARTICLE_DEFAULT_COVER || "",
    broadcastEnabled: (process.env.ZALO_BROADCAST_ENABLED || "false").toLowerCase() === "true",
  },
};
