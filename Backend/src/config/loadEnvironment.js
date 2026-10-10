const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

// Only infrastructure settings are inherited. Ward identity, Zalo tokens,
// JWT/ingest secrets and city-service credentials stay in the private .env.
const SHARED_GROUPS = [
  ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
];
const SHARED_KEYS = [
  "MONGO_URI", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL",
  "EVNCPC_API_URL", "EVNCPC_ORG_LIST_URL",
  "CGY1022_BASE_URL", "CGY1022_GOPY_PATH", "IOCTC_BASE_URL",
];

function hasValue(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isConfiguredValue(value) {
  return hasValue(value) && !/^(change[-_]?me|your[-_]|TODO|placeholder)/i.test(value.trim())
    && !/user:pass@cluster\.mongodb\.net/i.test(value);
}

function loadEnvironment({ backendDir = path.resolve(__dirname, "../.."), env = process.env } = {}) {
  const privatePath = path.join(backendDir, ".env");
  if (fs.existsSync(privatePath)) {
    const privateEnv = dotenv.parse(fs.readFileSync(privatePath));
    for (const [key, value] of Object.entries(privateEnv)) {
      if (env[key] === undefined) env[key] = value;
    }
  }

  if (!hasValue(env.SHARED_ENV_FILE)) return { inheritedKeys: [] };
  const sharedPath = path.resolve(backendDir, env.SHARED_ENV_FILE);
  let shared;
  try {
    shared = dotenv.parse(fs.readFileSync(sharedPath));
  } catch {
    throw new Error("Không đọc được SHARED_ENV_FILE. Kiểm tra đường dẫn file cấu hình chung.");
  }

  const inheritedKeys = [];
  function inherit(key) {
    env[key] = shared[key];
    inheritedKeys.push(key);
  }
  for (const group of SHARED_GROUPS) {
    // Never mix half of a private credential set with a different shared account.
    if (group.some(key => hasValue(env[key]))) continue;
    if (group.every(key => isConfiguredValue(shared[key]))) group.forEach(inherit);
  }
  for (const key of SHARED_KEYS) {
    if (!hasValue(env[key]) && isConfiguredValue(shared[key])) inherit(key);
  }
  return { inheritedKeys };
}

module.exports = { loadEnvironment };
