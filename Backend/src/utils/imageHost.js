const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { publicBase, dirOf, urlOf } = require("./publicMedia");

// ============================================================
// Chuẩn hóa mọi ảnh tin thành JPEG thật rồi phục vụ từ Backend. Nguồn CMS14
// có ảnh đuôi .jpg / Content-Type image/jpeg nhưng dữ liệu là PNG; dù chỉ
// 131 KB vẫn bị Zalo từ chối photo_url. HEAD/dung lượng không đủ để xác định
// ảnh dùng được. API Article còn yêu cầu mỗi ảnh dưới 1 MB.
// Ảnh bìa/thẻ bắt buộc chuẩn bị thành công; ảnh nội dung có thể dùng URL gốc
// khi lỗi để cơ chế lùi về bản chỉ chữ trong zaloNewsService tiếp tục xử lý.
// ============================================================

const GROUP = "anh";
const CACHE_VERSION = "v2"; // không dùng lại JPEG cũ chưa được kiểm tra dung lượng
const MAX_IMAGE_BYTES = 950000; // chừa biên an toàn dưới giới hạn 1 MB của Zalo
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 1600; // giới hạn cả chiều rộng và chiều cao
const JPEG_QUALITY = 82;
const TIMEOUT_MS = 20000;
const UA = "Mozilla/5.0 (compatible; ZaloMiniAppBot/1.0)";

async function usableCache(file) {
  try {
    const stat = await fs.stat(file);
    return stat.isFile() && stat.size > 0 && stat.size <= MAX_IMAGE_BYTES;
  } catch {
    return false;
  }
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok || Number(res.headers.get("content-length")) > MAX_DOWNLOAD_BYTES) {
    await res.body?.cancel();
    throw new Error(res.ok ? "ảnh quá lớn" : `HTTP ${res.status}`);
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of res.body) {
    bytes += chunk.length;
    if (bytes > MAX_DOWNLOAD_BYTES) throw new Error("ảnh quá lớn");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function normalize(url, out) {
  const { createCanvas, loadImage } = require("@napi-rs/canvas");
  const data = await download(url);
  const img = await loadImage(data);
  if (!img.width || !img.height) throw new Error("ảnh không có kích thước hợp lệ");
  let scale = Math.min(1, MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
  let canvas;
  let jpeg;
  do {
    canvas = createCanvas(Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // JPEG không có nền trong suốt
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    jpeg = await canvas.encode("jpeg", JPEG_QUALITY);
    scale *= 0.8;
  } while (jpeg.length > MAX_IMAGE_BYTES);

  await fs.mkdir(path.dirname(out), { recursive: true });
  // Chỉ công bố file khi đã ghi xong, kể cả khi nhiều tiến trình cùng tạo ảnh.
  const temp = `${out}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, jpeg);
    await fs.rename(temp, out);
  } finally {
    await fs.unlink(temp).catch(() => {});
  }
  return { bytes: jpeg.length, width: canvas.width, height: canvas.height, source: data.length };
}

const preparing = new Map();

// Lưu một lần cho mỗi URL; ảnh bìa, nội dung và thẻ tin dùng chung bản JPEG.
async function zaloFriendlyImage(url, { required = false } = {}) {
  try {
    if (!url) throw new Error("thiếu URL ảnh");
    if (!publicBase()) throw new Error("chưa cấu hình PUBLIC_URL HTTPS công khai để phục vụ ảnh");
    const file = `${crypto.createHash("sha1").update(url).digest("hex").slice(0, 16)}-${CACHE_VERSION}.jpg`;
    const out = path.join(dirOf(GROUP), file);
    if (preparing.has(out)) return await preparing.get(out);
    if (await usableCache(out)) return urlOf(GROUP, file);
    if (!preparing.has(out)) {
      const task = normalize(url, out).then((r) => {
        console.log(
          `[AnhTin] Đã chuẩn hóa ảnh ${(r.source / 1048576).toFixed(2)}MB → ${Math.round(r.bytes / 1024)}KB (${r.width}x${r.height}): ${url}`
        );
        return urlOf(GROUP, file);
      }).finally(() => preparing.delete(out));
      preparing.set(out, task);
    }
    return await preparing.get(out);
  } catch (err) {
    if (required) throw new Error(`Không chuẩn bị được ảnh cho Zalo: ${err.message}`, { cause: err });
    console.warn(`[AnhTin] Không chuẩn hóa được ảnh (${url}): ${err.message}`);
    return url;
  }
}

module.exports = { zaloFriendlyImage };
