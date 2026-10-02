const mongoose = require("mongoose");
const config = require("../src/config");
const Village = require("../src/models/Village");
const DanSo = require("../src/models/DanSo");
const DuLich = require("../src/models/DuLich");
const VanHoa = require("../src/models/VanHoa");
const SiteInfo = require("../src/models/SiteInfo");

const VILLAGES = [];
const DAN_SO = { tongDanSo: null, dienTichKm2: null, soThon: null, hoDan: null, gioiTinh: null, doTuoi: null };
const DU_LICH = { title: "Du lịch - Danh thắng", subtitle: "Đang cập nhật thông tin Thăng Phú", diemNoiBat: [], diemThamQuan: [] };
const VAN_HOA = { title: "Văn hóa - Nghệ thuật", subtitle: "Đang cập nhật thông tin Thăng Phú", hoatDong: [], diSan: [], diemNoiBat: [], tinTuc: [] };
const SITE_INFO = {
  contact: {
    officeName: "UBND xã Thăng Phú", address: config.contact.address, phone: config.contact.phone,
    hotline: config.contact.phone, hotline2: "", email: config.contact.email, website: config.contact.website,
    workHours: "", chairman: { name: "", title: "Chủ tịch UBND xã Thăng Phú", phone: "" },
    policeStation: { name: "Công an xã Thăng Phú", address: "", phone: "" },
  },
  zaloOA: { name: "Zalo OA xã Thăng Phú", description: "Nhận thông báo, tin tức mới nhất từ chính quyền." },
  digitalTransform: { title: "Chuyển đổi số xã Thăng Phú", tags: ["Chính quyền số", "Kinh tế số", "Xã hội số"] },
};

module.exports = { VILLAGES, DAN_SO, DU_LICH, VAN_HOA, SITE_INFO };

async function main() {
  await mongoose.connect(config.mongoUri);
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
