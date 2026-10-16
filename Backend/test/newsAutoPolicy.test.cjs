const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const settingPath = require.resolve("../src/models/Setting");
let stored;
let unavailable;
const writes = [];

// In-memory CAS behaves like the Setting operations; no production DB writes.
require.cache[settingPath] = { id: settingPath, filename: settingPath, loaded: true, exports: {
  findOneAndUpdate: (filter, update) => ({ lean: async () => {
    if (unavailable) throw new Error("database unavailable");
    if (stored === undefined) stored = update.$setOnInsert.value;
    return { value: stored };
  } }),
  updateOne: async (filter, update) => {
    if (unavailable) throw new Error("database unavailable");
    if (filter.value !== stored) return { matchedCount: 0 };
    stored = update.$set.value;
    writes.push(stored);
    return { matchedCount: 1 };
  },
} };
const { getAutoConfig, setAutoConfig, freshNewsFilter, isFreshNews } = require("../src/services/newsAutoPolicy");
beforeEach(() => { stored = undefined; unavailable = false; writes.length = 0; });

test("upgrade discards old backlog once and persists the cutoff across restarts", async () => {
  stored = JSON.stringify({ enabled: true, since: "2026-10-11T00:00:00.000Z" });
  const before = Date.now();
  const migrated = await getAutoConfig();
  assert.ok(Date.parse(migrated.since) >= before);
  assert.equal(migrated.enabled, true);
  assert.equal(migrated.policyVersion, 2);
  const again = await getAutoConfig();
  assert.deepEqual(again, migrated);
  assert.equal(writes.length, 1);
});

test("migration preserves disabled mode, and enabling later excludes paused backlog", async () => {
  stored = JSON.stringify({ enabled: false, since: "2026-10-11T00:00:00.000Z" });
  const disabled = await getAutoConfig();
  assert.equal(disabled.enabled, false);
  const enabled = await setAutoConfig(true);
  assert.equal(enabled.enabled, true);
  assert.ok(Date.parse(enabled.since) >= Date.parse(disabled.since));
  assert.equal(enabled.policyVersion, 2);
  const stopped = await setAutoConfig(false);
  assert.equal(stopped.enabled, false);
  assert.equal(stopped.since, enabled.since);
});

test("concurrent initialization converges on a single persisted cutoff", async () => {
  stored = JSON.stringify({ enabled: true, since: "2026-10-11T00:00:00.000Z" });
  const results = await Promise.all([getAutoConfig(), getAutoConfig(), getAutoConfig()]);
  assert.ok(results.every((cfg) => cfg.since === results[0].since));
  assert.equal(writes.length, 1);
});

test("invalid settings or database errors stop automatic processing", async () => {
  stored = "broken json";
  await assert.rejects(getAutoConfig());
  stored = JSON.stringify({ enabled: true, since: "invalid" });
  await assert.rejects(getAutoConfig(), /không hợp lệ/);
  unavailable = true;
  await assert.rejects(getAutoConfig(), /database unavailable/);
  assert.equal(writes.length, 0);
});

test("freshness rejects existing backlog, old publications imported now, missing and future dates", () => {
  const now = new Date("2026-10-16T06:00:00Z");
  const cfg = { since: "2026-10-16T05:00:00Z" };
  const fresh = { createdAt: "2026-10-16T05:30:00Z", publishedAt: "2026-10-16T05:15:00Z" };
  assert.equal(isFreshNews(fresh, cfg, now), true);
  assert.equal(isFreshNews({ ...fresh, createdAt: "2026-10-11T05:00:00Z" }, cfg, now), false);
  assert.equal(isFreshNews({ ...fresh, publishedAt: "2026-10-07T05:07:00Z" }, cfg, now), false);
  assert.equal(isFreshNews({ ...fresh, publishedAt: null }, cfg, now), false);
  assert.equal(isFreshNews({ ...fresh, publishedAt: "2026-10-17T05:00:00Z" }, cfg, now), false);
  const filter = freshNewsFilter(cfg, now);
  assert.deepEqual(filter.createdAt, filter.publishedAt);
  assert.equal(filter.publishedAt.$gte.toISOString(), "2026-10-16T05:00:00.000Z");
});

test("retry window expires after 24 hours even when activation was earlier", () => {
  const now = new Date("2026-10-18T06:00:00Z");
  const cfg = { since: "2026-10-16T05:00:00Z" };
  const news = { createdAt: "2026-10-17T06:00:00Z", publishedAt: "2026-10-17T05:59:59Z" };
  assert.equal(isFreshNews(news, cfg, now), false);
  assert.equal(freshNewsFilter(cfg, now).publishedAt.$gte.toISOString(), "2026-10-17T06:00:00.000Z");
});
