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
    const existing = await News.findOne({ nid: it.nid }).select("_id").lean();
    if (existing) {
      await News.updateOne(
        { nid: it.nid },
        {
          $set: {
            title: it.title,
            summary: it.summary,
            date: it.date,
            tag: it.tag,
            link: it.link,
            imageUrl: it.imageUrl,
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

async function fetchNewsDetail(link) {
  const res = await fetch(link, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Không tải được trang chi tiết: HTTP ${res.status}`);
  return parseNewsDetail(await res.text(), link);
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
};
