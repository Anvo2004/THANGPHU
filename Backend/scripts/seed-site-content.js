// Seeds the Village/DanSo/DuLich/VanHoa/SiteInfo collections with the content
// that used to live in MiniApp/src/data/*.js before those pages moved to
// fetching from the DB. Safe to re-run — skips any collection that already
// has data, so this is the source of truth for reconstructing this content on
// a fresh DB (e.g. disaster recovery, a new environment) instead of it only
// existing wherever it was manually seeded. Usage: node scripts/seed-site-content.js
const mongoose = require("mongoose");
const config = require("../src/config");
const Village = require("../src/models/Village");
const DanSo = require("../src/models/DanSo");
const DuLich = require("../src/models/DuLich");
const VanHoa = require("../src/models/VanHoa");
const SiteInfo = require("../src/models/SiteInfo");

// Nguồn: https://cttdt.danangportal.gov.vn/vi/w/xa-thang-phu
// Dân số 17.344 người và diện tích 60,5 km²: trang "Giới thiệu chung" của cổng TTĐT xã
// (được UBND xã chọn làm số liệu chính thức, 11/10/2026).
// Hotline/địa chỉ UBND và Công an: theo Cổng thông tin bản đồ Đà Nẵng (xác nhận 10/10/2026).
// Xã sáp nhập từ Bình Phú + Bình Quế (huyện Thăng Bình cũ). Thông tin chưa xác minh
// (giờ làm việc, chủ tịch, thôn) để trống, cán bộ cập nhật qua AdminWeb.
// Danh sách 11 thôn và trưởng thôn do UBND xã Thăng Phú cung cấp (file
// ThongTin_DSThon_Xa_Thang_Phu.xlsx, 11/10/2026). Bí thư, Mặt trận, số hộ, dân số
// để trống — cán bộ cập nhật sau.
const VILLAGES = [
  { ten: "Thôn Linh Cang", thonTruong: "Trương Văn Thành", dienThoai: "0973439649" },
  { ten: "Thôn Phước An", thonTruong: "Lê Hồ Như Ý", dienThoai: "0357220515" },
  { ten: "Thôn Lý Trường", thonTruong: "Võ Đình Công", dienThoai: "0985682070" },
  { ten: "Thôn Long Hội", thonTruong: "Đoàn Ngọc Chiến", dienThoai: "0899922541" },
  // Số gốc trong file có 11 chữ số (09396967347) — giữ nguyên, cần xác nhận lại.
  { ten: "Thôn Tú Trà", thonTruong: "Lê Đức Thắng", dienThoai: "09396967347" },
  { ten: "Thôn Ngũ Xã", thonTruong: "Dương Trung Hiếu", dienThoai: "0971669069" },
  { ten: "Thôn Mỹ Trà", thonTruong: "Đặng Văn Hương", dienThoai: "0983338317" },
  { ten: "Thôn Bình Quang", thonTruong: "Nguyễn Hồng Ngân", dienThoai: "0979107411" },
  { ten: "Thôn Bình Xá", thonTruong: "Nguyễn Thanh Thiêm", dienThoai: "0398333129" },
  { ten: "Thôn Bình Hội", thonTruong: "Nguyễn Văn Sương", dienThoai: "0779553943" },
  { ten: "Thôn Bình Phụng", thonTruong: "Nguyễn Hữu Nhung", dienThoai: "0935937257" },
];
const DAN_SO = { source: "https://thangphu.danang.gov.vn/gioi-thieu/gioi-thieu-chung", dataAsOf: "Theo trang Giới thiệu chung của cổng thông tin điện tử xã", tongDanSo: 17344, dienTichKm2: 60.5, soThon: 11, hoDan: null, gioiTinh: null, doTuoi: null };
const DU_LICH = { title: "Du lịch - Danh thắng", subtitle: "Khám phá Thăng Phú", diemNoiBat: [], diemThamQuan: [] };
const VAN_HOA = { title: "Văn hóa - Nghệ thuật", subtitle: "Văn hóa địa phương Thăng Phú", hoatDong: [], diSan: [], diemNoiBat: [], tinTuc: [] };
const SITE_INFO = {
  contact: {
    officeName: "UBND xã Thăng Phú",
    address: "Thôn Tú Trà, xã Thăng Phú, thành phố Đà Nẵng",
    phone: "0905 029 474", hotline: "0905 029 474", hotline2: "",
    email: "tttdt-xathangphu@danang.gov.vn",
    website: "thangphu.danang.gov.vn",
    workHours: "",
    chairman: { name: "", title: "Chủ tịch UBND xã Thăng Phú", phone: "" },
    policeStation: { name: "Công an xã Thăng Phú", address: "Tổ 7, Thôn Bình Quang, xã Thăng Phú (trụ sở UBND xã Bình Quế cũ)", phone: "023 5366 9113" },
  },
  zaloOA: { name: "Zalo OA xã Thăng Phú", description: "Nhận thông báo, tin tức mới nhất từ chính quyền." },
  digitalTransform: { title: "Chuyển đổi số xã Thăng Phú", tags: ["Chính quyền số", "Kinh tế số", "Xã hội số"] },
};

module.exports = { VILLAGES, DAN_SO, DU_LICH, VAN_HOA, SITE_INFO };

async function main() {
  await mongoose.connect(config.mongoUri, { dbName: config.mongoDbName });
  console.log("Connected to MongoDB");

  const villageCount = await Village.countDocuments();
  if (villageCount === 0) {
    await Village.insertMany(VILLAGES.map((v, i) => ({ ...v, thuTu: i + 1 })));
    console.log(`Seeded ${VILLAGES.length} villages.`);
  } else {
    console.log(`Village collection already has ${villageCount} documents, skipping.`);
  }

  for (const [name, Model, data] of [
    ["DanSo", DanSo, DAN_SO],
    ["DuLich", DuLich, DU_LICH],
    ["VanHoa", VanHoa, VAN_HOA],
    ["SiteInfo", SiteInfo, SITE_INFO],
  ]) {
    const existing = await Model.findOne();
    if (existing) {
      console.log(`${name} already has a document, skipping.`);
    } else {
      await Model.create(data);
      console.log(`Seeded ${name}.`);
    }
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
