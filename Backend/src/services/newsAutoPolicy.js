const Setting = require("../models/Setting");

const AUTO_KEY = "thangphu_news_card_auto";
const POLICY_VERSION = 2;
const MAX_NEWS_AGE_MS = 24 * 60 * 60 * 1000;

// Nâng chính sách một lần khi triển khai: bỏ hàng đợi cũ, giữ trạng thái bật/tắt.
// Dùng DB trực tiếp để lỗi đọc/ghi không vô tình bật lại bộ gửi. So sánh value
// khi ghi để không đè thay đổi từ cán bộ hay tiến trình khác.
async function getAutoConfig() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = new Date().toISOString();
    let doc;
    try {
      doc = await Setting.findOneAndUpdate(
        { key: AUTO_KEY },
        { $setOnInsert: { value: JSON.stringify({ enabled: true, since: now, policyVersion: POLICY_VERSION }) } },
        { upsert: true, new: true }
      ).lean();
    } catch (err) {
      if (err.code === 11000) continue;
      throw err;
    }
    const current = JSON.parse(doc.value);
    if (typeof current.enabled !== "boolean" || !Number.isFinite(Date.parse(current.since))) {
      throw new Error("Cấu hình tự động gửi tin không hợp lệ — dừng tự động gửi");
    }
    if (current.policyVersion >= POLICY_VERSION) return current;
    const next = { ...current, since: now, policyVersion: POLICY_VERSION };
    const result = await Setting.updateOne({ key: AUTO_KEY, value: doc.value }, { $set: { value: JSON.stringify(next) } });
    if (result.matchedCount) {
      console.log(`[NewsAuto] Bỏ hàng đợi cũ; chỉ tự động xử lý tin đăng từ ${now}, tối đa 24 giờ tuổi`);
      return next;
    }
  }
  throw new Error("Cấu hình gửi tin đang thay đổi — chờ lượt sau");
}

async function setAutoConfig(enabled) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await getAutoConfig();
    const next = {
      ...current,
      enabled: Boolean(enabled),
      since: enabled && !current.enabled ? new Date().toISOString() : current.since,
    };
    const result = await Setting.updateOne(
      { key: AUTO_KEY, value: JSON.stringify(current) },
      { $set: { value: JSON.stringify(next) } }
    );
    if (result.matchedCount) return next;
  }
  throw new Error("Không lưu được cấu hình gửi tin — thử lại");
}

function freshNewsFilter(cfg, now = new Date()) {
  const since = Date.parse(cfg.since);
  if (!Number.isFinite(since)) throw new Error("Thiếu mốc tự động gửi tin");
  const cutoff = new Date(Math.max(since, now.getTime() - MAX_NEWS_AGE_MS));
  // Kiểm tra cả ngày nhập và ngày đăng thật; tin cũ vừa cào lại vẫn bị loại.
  return {
    createdAt: { $gte: cutoff, $lte: now },
    publishedAt: { $gte: cutoff, $lte: now },
  };
}

function isFreshNews(news, cfg, now = new Date()) {
  const { publishedAt: range } = freshNewsFilter(cfg, now);
  return [news.createdAt, news.publishedAt].every((value) => {
    const date = value ? new Date(value).getTime() : NaN;
    return date >= range.$gte.getTime() && date <= now.getTime();
  });
}

module.exports = { getAutoConfig, setAutoConfig, freshNewsFilter, isFreshNews };
