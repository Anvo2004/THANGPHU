// Bộ icon 3D của giao diện mới (ThangPhuSo_GiaoDien/02_Icon-3D, dạng SVG).
// Vite nhúng sẵn qua import.meta.glob; tra theo "khóa" là tên file không đuôi.
const FILES = import.meta.glob("../static/icons3d/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const ICONS = {};
for (const [path, url] of Object.entries(FILES)) {
  const key = path.split("/").pop().replace(/\.svg$/, "");
  ICONS[key] = url;
}

export function icon3dUrl(key) {
  return ICONS[key] || null;
}

// Nội dung do cán bộ nhập qua AdminWeb (AppLink) nên ánh xạ theo nhãn → đường dẫn
// → tên icon Material cũ; mục nào không khớp sẽ rơi về icon phẳng như trước.
const BY_LABEL = [
  [/dân số/i, "dan-so"],
  [/thôn/i, "thon-xom"],
  [/bản đồ/i, "ban-do"],
  [/dịch vụ công quốc gia|dvcqg/i, "cong-dvc"],
  [/dịch vụ công/i, "dich-vu-cong"],
  [/vneid/i, "vneid"],
  [/danh mục tthc|thủ tục hành chính/i, "tthc"],
  [/văn hóa|văn hoá/i, "van-hoa"],
  [/du lịch/i, "du-lich"],
  [/thiên tai/i, "thien-tai"],
  [/lịch y tế|tiêm chủng/i, "lich-y-te"],
  [/lịch cắt điện|cắt điện/i, "lich-cat-dien"],
  [/góp ý/i, "gop-y"],
  [/phản ánh|kiến nghị/i, "phan-anh"],
  [/qr/i, "tao-qr"],
  [/bình dân/i, "binh-dan-so-hoc"],
  [/khảo sát/i, "khao-sat"],
  [/cổng dữ liệu|dữ liệu/i, "cong-du-lieu"],
  [/tra cứu hồ sơ|hồ sơ/i, "tra-cuu-ho-so"],
  [/văn bản|chính sách/i, "van-ban"],
  [/trợ lý|công dân số ai|hỏi đáp ai/i, "tro-ly-ai"],
  [/danang ai|đà nẵng ai/i, "danang-ai"],
  [/trợ cấp/i, "tro-cap"],
  [/thông báo/i, "thong-bao"],
  [/tin tức/i, "tin-tuc"],
  [/liên hệ/i, "lien-he"],
  [/chia sẻ/i, "chia-se"],
  [/tích điểm/i, "tich-diem"],
];

const BY_PATH = {
  "/dan-so": "dan-so",
  "/thon-xom": "thon-xom",
  "/dich-vu": "dich-vu-cong",
  "/thu-tuc-hanh-chinh": "tthc",
  "/van-hoa": "van-hoa",
  "/du-lich": "du-lich",
  "/phong-chong-thien-tai": "thien-tai",
  "/lich-y-te": "lich-y-te",
  "/lich-cup-dien": "lich-cat-dien",
  "/phan-anh": "phan-anh",
  "/phan-anh-cua-toi": "phan-anh",
  "/tra-cuu-ho-so": "tra-cuu-ho-so",
  "/van-ban": "van-ban",
  "/tro-ly-so": "tro-ly-ai",
  "/thong-bao": "tro-cap",
  "/tin-tuc": "tin-tuc",
  "/lien-he": "lien-he",
  "/cong-dan": "tich-diem",
  "/tich-diem": "tich-diem",
};

const BY_ICON = {
  groups: "dan-so",
  holiday_village: "thon-xom",
  map: "ban-do",
  account_balance: "dich-vu-cong",
  theater_comedy: "van-hoa",
  travel_explore: "du-lich",
  storm: "thien-tai",
  vaccines: "lich-y-te",
  bolt: "lich-cat-dien",
  rate_review: "gop-y",
  campaign: "phan-anh",
  call: "lien-he",
  qr_code_2: "tao-qr",
  computer: "binh-dan-so-hoc",
  star: "khao-sat",
  public: "cong-du-lieu",
  search: "tra-cuu-ho-so",
  folder_open: "tra-cuu-ho-so",
  description: "van-ban",
  auto_awesome: "danang-ai",
  smart_toy: "tro-ly-ai",
  volunteer_activism: "tro-cap",
  notifications_active: "thong-bao",
};

// Trả khóa icon 3D cho một AppLink {label, path, href, icon}, hoặc null.
export function resolve3d(item) {
  if (!item) return null;
  const label = item.label || "";
  for (const [re, key] of BY_LABEL) {
    if (re.test(label) && ICONS[key]) return key;
  }
  if (item.path && BY_PATH[item.path] && ICONS[BY_PATH[item.path]]) return BY_PATH[item.path];
  if (item.icon && BY_ICON[item.icon] && ICONS[BY_ICON[item.icon]]) return BY_ICON[item.icon];
  return null;
}
