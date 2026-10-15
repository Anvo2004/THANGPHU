const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { mkdtempSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomFillSync } = require("node:crypto");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const config = require("../src/config");
const publicMedia = require("../src/utils/publicMedia");

// Isolate generated media and config; no live Zalo, database or source requests.
const cacheDir = mkdtempSync(path.join(os.tmpdir(), "thangphu-image-test-"));
config.publicUrl = "https://media.example.test";
publicMedia.dirOf = () => cacheDir;
const { zaloFriendlyImage } = require("../src/utils/imageHost");

after(async () => {
  for (const file of await fs.readdir(cacheDir)) await fs.unlink(path.join(cacheDir, file));
  await fs.rmdir(cacheDir);
});

async function readHosted(url) {
  assert.ok(url.startsWith(`${config.publicUrl}/images/tin/anh/`));
  const data = await fs.readFile(path.join(cacheDir, path.basename(new URL(url).pathname)));
  assert.equal(data.subarray(0, 3).toString("hex"), "ffd8ff", "output must be a real JPEG");
  assert.ok(data.length <= 950000, "Zalo article images must stay below 1 MB");
  return loadImage(data);
}

test("small PNG disguised as .jpg is normalized, cached and shared by concurrent requests", async (t) => {
  const source = "https://source.example.test/CMS14/pic/thumb/2026/10/news.jpg";
  const png = await createCanvas(240, 180).encode("png");
  const fetchMock = t.mock.method(global, "fetch", async (url, options) => {
    assert.equal(url, source);
    assert.notEqual(options.method, "HEAD");
    return new Response(png, { headers: { "content-type": "image/jpeg", "content-length": String(png.length) } });
  });

  const urls = await Promise.all(Array.from({ length: 4 }, () => zaloFriendlyImage(source, { required: true })));
  assert.ok(urls.every((url) => url === urls[0]));
  assert.notEqual(urls[0], source);
  const img = await readHosted(urls[0]);
  assert.equal(img.width, 240);
  assert.equal(img.height, 180);
  assert.equal(await zaloFriendlyImage(source, { required: true }), urls[0]);
  assert.equal(fetchMock.mock.callCount(), 1, "only one download, including cached calls");
});

test("images without Content-Length are normalized and tall images are bounded", async (t) => {
  const png = await createCanvas(100, 4000).encode("png");
  t.mock.method(global, "fetch", async () => new Response(png));
  const img = await readHosted(await zaloFriendlyImage("https://source.example.test/tall.png", { required: true }));
  assert.equal(img.height, 1600);
  assert.equal(img.width, 40);
});

test("high-detail image is reduced until encoded JPEG fits the Zalo limit", async (t) => {
  const canvas = createCanvas(1600, 1600);
  const ctx = canvas.getContext("2d");
  const pixels = ctx.createImageData(1600, 1600);
  randomFillSync(pixels.data);
  for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = 255;
  ctx.putImageData(pixels, 0, 0);
  const originalJpeg = await canvas.encode("jpeg", 82);
  assert.ok(originalJpeg.length > 1000000, "fixture must exercise compression beyond resizing to 1600px");
  t.mock.method(global, "fetch", async () => new Response(originalJpeg));
  const img = await readHosted(await zaloFriendlyImage("https://source.example.test/large.jpg", { required: true }));
  assert.ok(img.width < 1600);
  assert.equal(img.width, img.height);
});

test("required images fail clearly on invalid source data and retry after recovery", async (t) => {
  const source = "https://source.example.test/broken.jpg";
  const fetchMock = t.mock.method(global, "fetch", async () => new Response("<html>Error</html>"));
  await assert.rejects(zaloFriendlyImage(source, { required: true }), /Không chuẩn bị được ảnh cho Zalo/);
  const png = await createCanvas(80, 60).encode("png");
  fetchMock.mock.mockImplementation(async () => new Response(png));
  await readHosted(await zaloFriendlyImage(source, { required: true }));
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("download errors stop mandatory covers while optional body images keep their fallback", async (t) => {
  const source = "https://source.example.test/missing.jpg";
  t.mock.method(global, "fetch", async () => new Response("Missing", { status: 404 }));
  await assert.rejects(zaloFriendlyImage(source, { required: true }), /HTTP 404/);
  assert.equal(await zaloFriendlyImage(source), source);
});

test("reject oversized downloads both with and without Content-Length", async (t) => {
  const tooLarge = 25 * 1024 * 1024 + 1;
  const fetchMock = t.mock.method(global, "fetch", async () => new Response("", {
    headers: { "content-length": String(tooLarge) },
  }));
  await assert.rejects(zaloFriendlyImage("https://source.example.test/huge.jpg", { required: true }), /ảnh quá lớn/);
  fetchMock.mock.mockImplementation(async () => new Response(Buffer.alloc(tooLarge)));
  await assert.rejects(zaloFriendlyImage("https://source.example.test/chunked.jpg", { required: true }), /ảnh quá lớn/);
});

test("mandatory images require a public HTTPS media URL", async (t) => {
  t.mock.method(global, "fetch", () => { throw new Error("must not download"); });
  const previous = config.publicUrl;
  config.publicUrl = "http://localhost:4012";
  try {
    const source = "https://source.example.test/news.jpg";
    await assert.rejects(zaloFriendlyImage(source, { required: true }), /PUBLIC_URL HTTPS/);
    assert.equal(await zaloFriendlyImage(source), source);
  } finally {
    config.publicUrl = previous;
  }
});
