const cheerio = require("cheerio");

const clean = (value) => (value || "").replace(/\s+/g, " ").trim();

function portalUrl(href, baseUrl) {
  if (!href) return "";
  try {
    const base = new URL(baseUrl);
    const url = new URL(href, base);
    if (!/^https?:$/.test(url.protocol) || url.hostname !== base.hostname) return "";
    // CMS14 emits http links even when accessed over HTTPS.
    url.protocol = base.protocol;
    return url.href;
  } catch {
    return "";
  }
}

// CMS14: category cards on the homepage, then remaining featured/news links.
function parseNewsListing(html, baseUrl) {
  const $ = cheerio.load(html);
  const items = new Map();
  const add = (el) => {
    const a = $(el);
    const link = portalUrl(a.attr("href"), baseUrl);
    const match = link.match(/\/nid\/(\d+)(?:\/|$)/i);
    const title = clean(a.text()) || clean(a.attr("title"));
    if (!match || !title) return;
    const nid = Number(match[1]);
    const card = a.closest(".tinkhac, .noidung, .sp-img, li");
    const module = a.closest(".DnnModule");
    const category = clean(module.find('[class^="Title-"] a').first().text());
    const summary = clean(card.find(".gioithieu > p:not(.ngaynguoiluot)").first().text());
    const date = clean(card.find(".ngaynguoiluot").first().text()).match(/\d{1,2}\/\d{1,2}\/\d{4}/)?.[0] || "";
    const imageUrl = portalUrl(card.find("img").first().attr("src"), baseUrl);
    if (items.has(nid)) {
      const existing = items.get(nid);
      if (!existing.imageUrl) existing.imageUrl = imageUrl;
      if (!existing.summary) existing.summary = summary;
      return;
    }
    items.set(nid, { nid, title, summary, date, tag: category || "Tin tức", link, imageUrl });
  };
  $(".QTI_tinthuong .tieude a").each((_, el) => add(el));
  $('a[href*="/nid/"]').each((_, el) => add(el));
  return [...items.values()].sort((a, b) => b.nid - a.nid);
}

function parseDocumentListing(html, baseUrl) {
  const $ = cheerio.load(html);
  const rows = [];
  const seen = new Set();
  $(".rgMasterTable tr.rgRow, .rgMasterTable tr.rgAltRow").each((_, el) => {
    const row = $(el);
    const a = row.find("a.newPage").first();
    const title = clean(a.text());
    const detailUrl = portalUrl(a.attr("href"), baseUrl);
    if (!title || !detailUrl || seen.has(detailUrl)) return;
    seen.add(detailUrl);
    rows.push({
      title,
      detailUrl,
      soHieu: clean(row.find('[id$="lbl_SoKyHieu"]').text()),
      dateStr: clean(row.find('[id$="lbl_NgayBanHanh"]').text()),
    });
  });
  return rows;
}

module.exports = { parseNewsListing, parseDocumentListing };
