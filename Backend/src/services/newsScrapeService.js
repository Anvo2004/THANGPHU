const cheerio = require("cheerio");
const config = require("../config");
const News = require("../models/News");

// Cào cổng thông tin CMS14 của Thăng Phú; giữ nội dung chi tiết theo thứ tự.
const { parseNewsListing } = require("./portalParser");

const UA = "Mozilla/5.0 (compatible; ThangPhuMiniAppBot/1.0)";

function isConfigured() {
  return Boolean(config.newsSourceUrl);
}

function toAbsoluteUrl(src, base) {
  if (!src) return "";
  try {
    const url = new URL(src, base);
    if (url.hostname === new URL(base).hostname) url.protocol = new URL(base).protocol;
    return /^https?:$/.test(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

async function fetchListing() {
  const res = await fetch(config.newsSourceUrl, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Không tải được trang nguồn: HTTP ${res.status}`);
  return parseNewsListing(await res.text(), config.newsSourceUrl);
}

// Upsert theo nid — tin mới tạo mới, tin đã có cập nhật lại text/ảnh (ảnh nhúng
// thẳng từ nguồn, không lưu file riêng nên cứ ghi đè theo bản mới nhất).
async function syncNews() {
  if (!isConfigured()) {
    console.log("[News] Bỏ qua đồng bộ: NEWS_SOURCE_URL chưa được cấu hình");
    return 0;
  }
  const items = await fetchListing();
  let created = 0;
  for (const it of items) {
    const existing = await News.findOne({ nid: it.nid }).select("_id date publishedAt originalImageUrl").lean();
    let metadata = {};
    if (!existing?.publishedAt || !existing?.originalImageUrl) {
      try {
        const page = await fetchNewsPage(it.link);
        metadata = { publishedAt: page.publishedAt, originalImageUrl: page.originalImageUrl };
        if (page.date) it.date = page.date;
      } catch (err) {
        // Thiếu ngày đăng thật thì bộ tự động bỏ qua; lượt đồng bộ sau thử lại.
        console.warn(`[News] Chưa lấy được ngày đăng/ảnh gốc nid=${it.nid}: ${err.message}`);
      }
    }
    if (existing) {
      await News.updateOne(
        { nid: it.nid },
        {
          $set: {
            title: it.title,
            summary: it.summary,
            date: it.date || existing.date || "",
            tag: it.tag,
            link: it.link,
            imageUrl: it.imageUrl,
            ...metadata,
          },
        }
      );
      continue;
    }
    await News.create({
      nid: it.nid,
      title: it.title,
      summary: it.summary,
      date: it.date,
      tag: it.tag,
      source: "UBND xã Thăng Phú",
      link: it.link,
      imageUrl: it.imageUrl,
      scrapedAt: new Date(),
      ...metadata,
    });
    created++;
  }
  console.log(`[News] Đồng bộ ${items.length} tin (mới: ${created})`);
  return created;
}

// ===== Nội dung đầy đủ 1 tin (trang chi tiết) — dùng để tạo bài viết OA đầy đủ =====
// CMS14: .qti_gioithieu là sapo, .qti_ct_noidung là thân bài.
const DETAIL_BLOCK_TAGS = new Set([
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul", "ol", "blockquote",
  "figure", "figcaption", "section", "article", "table", "thead", "tbody", "tr",
]);
// Nội dung bài OA không thể hiện được: file đính kèm (tin "V/v tin bão..." chỉ có
// PDF nhúng + nút "Tải về") và khung nhúng (iframe/video).
const DETAIL_FILE_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|rar)(?:[?#]|$)/i;
const DETAIL_EMBED_TAGS = new Set(["iframe", "embed", "object", "video", "audio"]);

// → [{ type: "text", paragraphs: [...] } | { type: "image", url } | { type: "file", url }]
// — sapo (nếu có) là đoạn đầu; "file" = tài liệu đính kèm/khung nhúng.
function parseNewsDetail(html, pageUrl) {
  const $ = cheerio.load(html);
  const root = $(".qti_ct_noidung").first();
  const sapo = $(".qti_gioithieu").first().text().replace(/\s+/g, " ").trim();

  const blocks = sapo ? [{ type: "text", paragraphs: [sapo] }] : [];
  let para = "";
  const flush = () => {
    const text = para.replace(/\s+/g, " ").trim();
    para = "";
    if (!text) return;
    const last = blocks[blocks.length - 1];
    if (last && last.type === "text") last.paragraphs.push(text);
    else blocks.push({ type: "text", paragraphs: [text] });
  };
  const walk = (node) => {
    if (node.type === "text") {
      para += node.data;
      return;
    }
    if (node.type !== "tag" || node.name === "script" || node.name === "style") return;
    if (node.name === "img") {
      const src = $(node).attr("src") || $(node).attr("data-src") || "";
      // new URL().href giữ nguyên %XX sẵn có, chỉ mã hoá dấu cách/chữ có dấu trong src.
      const url = src ? toAbsoluteUrl(src, pageUrl) : "";
      if (url) {
        flush();
        blocks.push({ type: "image", url });
      }
      return;
    }
    const fileUrl =
      node.name === "a" && DETAIL_FILE_RE.test($(node).attr("href") || "")
        ? $(node).attr("href")
        : DETAIL_EMBED_TAGS.has(node.name)
          ? $(node).attr("src") || $(node).attr("data") || $(node).find("source").attr("src") || ""
          : null;
    if (fileUrl !== null) {
      // Bỏ chữ của link tải ("Tải về") — thay bằng khối file; cùng 1 file (link +
      // khung xem PDF) chỉ giữ 1 lần.
      const url = fileUrl ? toAbsoluteUrl(fileUrl, pageUrl) : "";
      if (url && !blocks.some((b) => b.type === "file" && b.url === url)) {
        flush();
        blocks.push({ type: "file", url });
      }
      return;
    }
    if (node.name === "br") return flush();
    if (node.name === "td" || node.name === "th") {
      for (const child of node.children || []) walk(child);
      para += " | ";
      return;
    }
    const isBlock = DETAIL_BLOCK_TAGS.has(node.name);
    if (isBlock) flush();
    for (const child of node.children || []) walk(child);
    if (node.name === "tr") para = para.replace(/\s*\|\s*$/, "");
    if (isBlock) flush();
  };
  root.contents().each((_, node) => walk(node));
  flush();
  return blocks;
}

function parseNewsPage(html, link) {
  const $ = cheerio.load(html);
  const stamp = $(".qti_ct_thongtin").first().text().replace(/\s+/g, " ");
  const match = stamp.match(/(\d{1,2}):(\d{2})\s*\|\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  let publishedAt = null;
  let date = "";
  if (match) {
    const [, hour, minute, day, month, year] = match;
    const parts = [year, month, day, hour, minute].map(Number);
    const parsed = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:00+07:00`);
    const local = new Date(parsed.getTime() + 7 * 60 * 60 * 1000);
    if (parts.every((v, i) => v === [local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes()][i])) {
      publishedAt = parsed;
      date = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
  }
  const blocks = parseNewsDetail(html, link);
  const originalImageUrl = blocks.find((b) => b.type === "image" && !/\/thumb\//i.test(b.url))?.url || "";
  return { publishedAt, date, originalImageUrl, blocks };
}

async function fetchNewsPage(link) {
  const res = await fetch(link, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Không tải được trang chi tiết: HTTP ${res.status}`);
  return parseNewsPage(await res.text(), link);
}

async function fetchNewsDetail(link) {
  return (await fetchNewsPage(link)).blocks;
}

// Cả bài OA và thẻ dùng cùng ảnh gốc. Tin cũ chưa có metadata cũng được bổ
// sung khi cán bộ xem/gửi lại bằng tay; không thay đổi mốc nhập tin.
async function ensureNewsMetadata(news) {
  if ((news.publishedAt && news.originalImageUrl) || !news.link) return news;
  try {
    const page = await fetchNewsPage(news.link);
    const metadata = {};
    if (page.publishedAt) Object.assign(metadata, { publishedAt: page.publishedAt, date: page.date });
    if (page.originalImageUrl) metadata.originalImageUrl = page.originalImageUrl;
    if (Object.keys(metadata).length) {
      await News.updateOne({ _id: news._id }, { $set: metadata });
      return { ...news, ...metadata };
    }
  } catch (err) {
    console.warn(`[News] Chưa bổ sung được ảnh gốc nid=${news.nid}: ${err.message}`);
  }
  return news;
}

// Tin mới nhất — sắp theo nid giảm dần (id bài lớn hơn ~ bài mới hơn).
async function listNews(limit = 20) {
  return News.find().sort({ nid: -1 }).limit(limit).lean();
}

function startAutoSync() {
  const cron = require("node-cron");
  syncNews().catch((e) => console.error("[News] Sync lần đầu lỗi:", e.message));
  cron.schedule("30 5,11,17 * * *", () => {
    syncNews().catch((e) => console.error("[News] Sync định kỳ lỗi:", e.message));
  });
  console.log("[News] Đã bật tự động cào tin tức (3 lần/ngày)");
}

module.exports = {
  fetchListing,
  syncNews,
  listNews,
  startAutoSync,
  isConfigured,
  parseNewsDetail,
  fetchNewsDetail,
  parseNewsPage,
  fetchNewsPage,
  ensureNewsMetadata,
};
