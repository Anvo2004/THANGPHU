// Cập nhật danh sách thôn + trưởng thôn trên database đang chạy (idempotent).
// Khác seed-site-content.js (chỉ nạp khi bảng trống): script này upsert theo tên,
// bỏ thôn không còn trong danh sách và đồng bộ DanSo.soThon.
// Chạy: node scripts/update-villages.js
const mongoose = require("mongoose");
const config = require("../src/config");
const Village = require("../src/models/Village");
const DanSo = require("../src/models/DanSo");
const Citizen = require("../src/models/Citizen");
const { VILLAGES } = require("./seed-site-content");

async function main() {
  await mongoose.connect(config.mongoUri, { dbName: config.mongoDbName });

  const names = VILLAGES.map((v) => v.ten);
  for (const [i, v] of VILLAGES.entries()) {
    await Village.updateOne(
      { ten: v.ten },
      { $set: { thonTruong: v.thonTruong, dienThoai: v.dienThoai, thuTu: i + 1, updatedAt: new Date() },
        $setOnInsert: { ten: v.ten, biThu: "", matTran: "", soHo: null, danSo: null } },
      { upsert: true }
    );
  }

  const stale = await Village.find({ ten: { $nin: names } }).lean();
  for (const v of stale) {
    const moved = await Citizen.updateMany({ villageId: v._id }, { $set: { villageId: null, villageName: "" } });
    await Village.deleteOne({ _id: v._id });
    console.log(`Đã bỏ "${v.ten}" (gỡ khỏi ${moved.modifiedCount} công dân)`);
  }

  await DanSo.updateOne({}, { $set: { soThon: VILLAGES.length } });
  const all = await Village.find().sort({ thuTu: 1 }).lean();
  console.log(`Có ${all.length} thôn:`);
  all.forEach((v) => console.log(` ${v.thuTu}. ${v.ten} — ${v.thonTruong} — ${v.dienThoai}`));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
