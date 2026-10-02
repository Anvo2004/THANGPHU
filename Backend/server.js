const mongoose = require("mongoose");
const config = require("./src/config");
const app = require("./src/app");
const catDienService = require("./src/services/catDienService");
const vanBanService = require("./src/services/vanBanThangPhuService");
const newsScrapeService = require("./src/services/newsScrapeService");
const zaloNewsService = require("./src/services/zaloNewsService");
const { startCgy1022Retry } = require("./src/services/cgy1022RetryService");
const { startCgy1022StatusPolling } = require("./src/services/cgy1022StatusService");

async function main() {
  if (!config.mongoUri) throw new Error("Điền MONGO_URI của Thăng Phú trong Backend/.env");
  if (config.jwtSecret.length < 32) throw new Error("JWT_SECRET phải có ít nhất 32 ký tự riêng cho Thăng Phú");
  await mongoose.connect(config.mongoUri);
  console.log("[server] MongoDB connected");

  app.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port}`);
  });

  catDienService.startAutoSync();
  vanBanService.startAutoSync();
  newsScrapeService.startAutoSync();
  zaloNewsService.startAutoPost();
  startCgy1022Retry();
  startCgy1022StatusPolling();
}

main().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
