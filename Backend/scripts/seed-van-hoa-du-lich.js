// Nạp nội dung THẬT cho trang Văn hóa và Du lịch từ cổng thông tin xã Thăng Phú.
//
// Nguồn (thangphu.danang.gov.vn):
//  - Mục "Văn hóa - Xã hội": các bài tin có ảnh, tóm tắt, ngày, liên kết.
//  - Trang "Giới thiệu chung": số liệu văn hóa - xã hội của xã (100% thôn văn hóa...).
//  - Hai ảnh cảnh quan trên trình chiếu của cổng (public/brand/hero-*.jpg).
// KHÔNG tự suy diễn địa danh/di tích: các mục "Danh lam - Thắng cảnh", "Du lịch",
// "Di tích - Danh nhân", "Làng nghề - Lễ hội" trên cổng đang ghi "Chưa có tin tức nào"
// nên điểm tham quan/di sản để trống cho tới khi UBND xã cung cấp.
//
// Chạy lại được: tinTuc luôn làm mới; các mảng còn lại chỉ ghi khi đang trống để
// không đè nội dung cán bộ đã sửa. Chạy: node scripts/seed-van-hoa-du-lich.js
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const config = require("../src/config");
const VanHoa = require("../src/models/VanHoa");
const DuLich = require("../src/models/DuLich");

const PORTAL = "https://thangphu.danang.gov.vn";
const CATEGORY = `${PORTAL}/tin-tuc-su-kien/van-hoa-xa-hoi`;
const PAGER = "dnn_ctr873_Main_ctl00_dtl_TinChinh1ChangePage";
const PAGES = 2; // ~20 bài mới nhất
const UA = "Mozilla/5.0 (compatible; ThangPhuMiniAppBot/1.0)";
const SOURCE = "Cổng TTĐT xã Thăng Phú";

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const abs = (u) => {
  try {
    const url = new URL(u, PORTAL);
    url.protocol = "https:";
    return url.href;
  } catch {
    return "";
  }
};

async function fetchPage(n) {
  const url = n > 1 ? `${CATEGORY}?${PAGER}=${n}` : CATEGORY;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function parseCategory(html) {
  const $ = cheerio.load(html);
  const out = [];
  $(".tinchinh").each((_, el) => {
    const row = $(el);
    const a = row.find("a.tieudetin").first();
    const href = a.attr("href") || "";
    const m = href.match(/\/nid\/(\d+)/);
    if (!m) return;
    const date = clean(row.find(".ngaynguoiluot").text()).match(/\d{1,2}\/\d{1,2}\/\d{4}/)?.[0] || "";
    out.push({
      id: Number(m[1]),
      tag: "Văn hóa - Xã hội",
      date,
      title: clean(a.attr("title") || a.text()),
      summary: clean(row.find(".noidunggioithieu").text()),
      source: SOURCE,
      image: abs(row.find("img.anhminhhoa").attr("src")),
      link: abs(href),
    });
  });
  return out;
}

// Số liệu trích nguyên văn từ trang "Giới thiệu chung" (cổng TTĐT xã).
const HOAT_DONG = [
  {
    id: "thon-van-hoa",
    icon: "🏡",
    title: "100% thôn đạt chuẩn thôn văn hóa",
    desc: "Toàn bộ thôn trên địa bàn xã Thăng Phú đạt chuẩn thôn văn hóa.",
  },
  {
    id: "tu-tra",
    icon: "🏆",
    title: "Thôn Tú Trà - 17 năm liền",
    desc: "Thôn Tú Trà đạt danh hiệu thôn văn hóa 17 năm liền (2008 - 2024).",
  },
  {
    id: "co-quan-van-hoa",
    icon: "🏢",
    title: "100% cơ quan đạt chuẩn văn hóa",
    desc: "Toàn bộ cơ quan trên địa bàn xã đạt chuẩn cơ quan văn hóa.",
  },
  {
    id: "truong-hoc",
    icon: "🎓",
    title: "Trường học đạt chuẩn quốc gia",
    desc: "100% trường học do xã quản lý đạt chuẩn quốc gia.",
  },
];

// Mục "Đất và người" của cổng hiện có 2 bài (nhóm 166). Lấy đúng tiêu đề/ảnh/liên kết.
const DAT_VA_NGUOI = [
  {
    id: 50,
    tag: "Đất và người",
    date: "",
    title: "GƯƠNG SÁNG HIẾU HỌC THÀNH ĐẠT NGUYỄN VĂN ĐÔNG",
    summary: "",
    source: SOURCE,
    image: "https://thangphu.danang.gov.vn/CMS14/pic/z7149688374906_1af8d821aef026b67579cf517b0c4410.jpg",
    link: "https://thangphu.danang.gov.vn/chi-tiet-tin/group/166/nid/50/guong-sang-hieu-hoc-thanh-dat-nguyen-van-dong",
  },
  {
    id: 87,
    tag: "Đất và người",
    date: "",
    title: "ĐIỂM TỰA NHÂN ÁI KHUYẾN HỌC TỪ GƯƠNG SÁNG TIỀN NHIỆM",
    summary:
      "Ở thị trấn Hà Lam xưa, nay thuộc xã Thăng Bình (TP. Đà Nẵng), mỗi khi nhắc đến những cán bộ tiền nhiệm tận tụy vì dân, người ta nhớ ngay đến “Ông Hai khuyến học” - Chú Nguyễn Hữu Hiệp...",
    source: SOURCE,
    image: "https://thangphu.danang.gov.vn/CMS14/pic/picture1.png",
    link: "https://thangphu.danang.gov.vn/chi-tiet-tin/group/166/nid/87/diem-tua-nhan-ai-khuyen-hoc-tu-guong-sang-tien-nhiem",
  },
];

const empty = (v) => !Array.isArray(v) || v.length === 0;

async function main() {
  await mongoose.connect(config.mongoUri, { dbName: config.mongoDbName });

  let tinTuc = [];
  for (let p = 1; p <= PAGES; p++) {
    try {
      tinTuc = tinTuc.concat(parseCategory(await fetchPage(p)));
    } catch (e) {
      console.warn(`Bỏ qua trang ${p}: ${e.message}`);
    }
  }
  const seen = new Set();
  tinTuc = tinTuc.concat(DAT_VA_NGUOI).filter((t) => (seen.has(t.id) ? false : seen.add(t.id)));
  console.log(`Văn hóa - Xã hội: ${tinTuc.length} bài (${tinTuc.filter((t) => t.image).length} có ảnh)`);

  const vh = (await VanHoa.findOne()) || new VanHoa();
  if (tinTuc.length) vh.tinTuc = tinTuc;
  if (empty(vh.hoatDong)) vh.hoatDong = HOAT_DONG;
  vh.subtitle = "Đời sống văn hóa - xã hội xã Thăng Phú";
  vh.updatedAt = new Date();
  await vh.save();

  const base = String(config.publicUrl || "").replace(/\/+$/, "");
  const noImages = process.argv.includes("--no-images"); // gỡ ảnh khi file ảnh chưa được deploy
  const dl = (await DuLich.findOne()) || new DuLich();
  const IMAGES = {
    "canh-quan-ho-doi": `${base}/brand/hero-1.jpg`,
    "dong-ruong-kenh": `${base}/brand/hero-2.jpg`,
  };
  if (empty(dl.diemNoiBat) && base) {
    dl.diemNoiBat = [
      {
        id: "canh-quan-ho-doi",
        icon: "🏞️",
        title: "Hồ nước và đồi núi",
        subtitle: "Cảnh quan thiên nhiên xã Thăng Phú",
        desc: "Cảnh quan hồ nước giữa vùng đồi núi của xã Thăng Phú, thành phố Đà Nẵng.",
        image: `${base}/brand/hero-1.jpg`,
      },
      {
        id: "dong-ruong-kenh",
        icon: "🌾",
        title: "Đồng ruộng và kênh thủy lợi",
        subtitle: "Vùng sản xuất nông nghiệp của xã",
        desc: "Cánh đồng lúa xanh ven kênh thủy lợi của xã Thăng Phú. Nông - lâm - thủy sản chiếm 29,6% cơ cấu kinh tế của xã năm 2025.",
        image: `${base}/brand/hero-2.jpg`,
      },
    ];
  }
  // Đồng bộ đường dẫn ảnh cho các mục do script này tạo (không đụng mục cán bộ thêm).
  dl.diemNoiBat = (dl.diemNoiBat || []).map((it) => {
    const own = Object.prototype.hasOwnProperty.call(IMAGES, it.id);
    return own ? { ...it, image: noImages ? "" : IMAGES[it.id] } : it;
  });
  dl.markModified("diemNoiBat");
  dl.subtitle = "Khám phá cảnh quan Thăng Phú";
  dl.updatedAt = new Date();
  await dl.save();

  console.log("VanHoa:", { hoatDong: vh.hoatDong.length, tinTuc: vh.tinTuc.length });
  console.log("DuLich:", { diemNoiBat: dl.diemNoiBat.length, diemThamQuan: (dl.diemThamQuan || []).length });
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
