import { loadEnv } from "vite";
import { writeFileSync } from "node:fs";
const env = loadEnv("production", process.cwd(), "");
const appId = (env.APP_ID || "").trim();
if (!/^\d+$/.test(appId)) throw new Error("Điền APP_ID hợp lệ trong MiniApp/.env trước khi deploy Zalo");
writeFileSync("zmp-cli.json", JSON.stringify({ appId }, null, 2) + "\n");
console.log("Đã đồng bộ APP_ID sang zmp-cli.json");
