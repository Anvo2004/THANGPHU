const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { loadEnvironment } = require("../src/config/loadEnvironment");

function fixture(t, privateValues, sharedValues) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "thangphu-shared-test-"));
  const encode = values => Object.entries(values).map(([k, v]) => `${k}=${v}`).join("\n");
  fs.writeFileSync(path.join(dir, ".env"), encode({ SHARED_ENV_FILE: "shared.env", ...privateValues }));
  fs.writeFileSync(path.join(dir, "shared.env"), encode(sharedValues));
  t.after(() => {
    fs.unlinkSync(path.join(dir, ".env"));
    fs.unlinkSync(path.join(dir, "shared.env"));
    fs.rmdirSync(dir);
  });
  return dir;
}

test("inherits shared infrastructure but never ward identity or secrets", t => {
  const backendDir = fixture(t, { MONGO_DB_NAME: "thangphu", JWT_SECRET: "private-test" }, {
    MONGO_URI: "mongodb://shared.test/nongson", MONGO_DB_NAME: "nongson",
    CLOUDINARY_CLOUD_NAME: "shared", CLOUDINARY_API_KEY: "test-key", CLOUDINARY_API_SECRET: "test-secret",
    ANTHROPIC_API_KEY: "test-ai", JWT_SECRET: "other-test", ZALO_OA_TOKEN: "other-oa",
    CGY1022_PASSWORD: "other-city", PUBLIC_URL: "https://other.test", REDIS_KEY_PREFIX: "nongson",
  });
  const env = {};
  loadEnvironment({ backendDir, env });
  assert.equal(env.MONGO_URI, "mongodb://shared.test/nongson");
  assert.equal(env.MONGO_DB_NAME, "thangphu");
  assert.equal(env.CLOUDINARY_CLOUD_NAME, "shared");
  assert.equal(env.ANTHROPIC_API_KEY, "test-ai");
  assert.equal(env.JWT_SECRET, "private-test");
  for (const key of ["ZALO_OA_TOKEN", "CGY1022_PASSWORD", "PUBLIC_URL", "REDIS_KEY_PREFIX"]) assert.equal(env[key], undefined);
});

test("environment/private values take precedence and credential groups are not mixed", t => {
  const backendDir = fixture(t, { ANTHROPIC_MODEL: "local-model", CLOUDINARY_API_KEY: "private-key" }, {
    ANTHROPIC_MODEL: "shared-model", CLOUDINARY_CLOUD_NAME: "shared",
    CLOUDINARY_API_KEY: "shared-key", CLOUDINARY_API_SECRET: "shared-secret",
    UPSTASH_REDIS_REST_URL: "https://redis.test", UPSTASH_REDIS_REST_TOKEN: "test-token",
  });
  const env = { ANTHROPIC_MODEL: "process-model" };
  loadEnvironment({ backendDir, env });
  assert.equal(env.ANTHROPIC_MODEL, "process-model");
  assert.equal(env.CLOUDINARY_API_KEY, "private-key");
  assert.equal(env.CLOUDINARY_API_SECRET, undefined);
  assert.equal(env.UPSTASH_REDIS_REST_TOKEN, "test-token");
});

test("ignores placeholders and fails clearly for an explicitly missing shared file", t => {
  const backendDir = fixture(t, {}, { MONGO_URI: "mongodb+srv://user:pass@cluster.mongodb.net/nongson", ANTHROPIC_API_KEY: "TODO_KEY" });
  const env = {};
  assert.deepEqual(loadEnvironment({ backendDir, env }).inheritedKeys, []);
  assert.equal(env.MONGO_URI, undefined);
  assert.throws(() => loadEnvironment({ backendDir, env: { SHARED_ENV_FILE: "missing.env" } }), /SHARED_ENV_FILE/);
});

test("Redis isolates the same caller across wards and applies expiry to the same key", async t => {
  const config = require("../src/config");
  const { checkRateLimit } = require("../src/utils/rateLimit");
  const original = { ...config.upstash };
  const originalFetch = global.fetch;
  const counts = new Map();
  const expiries = [];
  t.after(() => { Object.assign(config.upstash, original); global.fetch = originalFetch; });
  config.upstash.url = "https://redis.test";
  config.upstash.token = "test-token";
  global.fetch = async url => {
    const [, command, encodedKey] = new URL(url).pathname.split("/");
    const key = decodeURIComponent(encodedKey);
    if (command === "incr") {
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      return { ok: true, json: async () => ({ result: count }) };
    }
    expiries.push(key);
    return { ok: true };
  };
  config.upstash.keyPrefix = "thangphu";
  assert.equal((await checkRateLimit("assistant:one-user", 1, 60)).allowed, true);
  assert.equal((await checkRateLimit("assistant:one-user", 1, 60)).allowed, false);
  config.upstash.keyPrefix = "nongson";
  assert.equal((await checkRateLimit("assistant:one-user", 1, 60)).allowed, true);
  assert.deepEqual(expiries, ["thangphu:assistant:one-user", "nongson:assistant:one-user"]);
  config.upstash.url = "";
  assert.equal((await checkRateLimit("memory:one-user", 1, 60)).allowed, true);
  assert.equal((await checkRateLimit("memory:one-user", 1, 60)).allowed, false);
  config.upstash.keyPrefix = "thangphu";
  assert.equal((await checkRateLimit("memory:one-user", 1, 60)).allowed, true);
});
