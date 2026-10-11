// Kiểm thử tích hợp luồng Công dân trên một database TẠM rồi xoá — không đụng DB thật.
// Cần MONGO_URI thật; KHÔNG nằm trong `npm test` (tên file cố ý không kết thúc _test.js).
// Chạy: node scripts/citizen-integration-check.js
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const config = require("../src/config");
const svc = require("../src/services/citizenService");
const Citizen = require("../src/models/Citizen");
const PointTransaction = require("../src/models/PointTransaction");

const DB = `thangphu_citizen_test_${Date.now()}`;

async function main() {
  await mongoose.connect(config.mongoUri, { dbName: DB });
  try {
    // 1) Đăng ký lần đầu: +5, hạng Công dân, mã giới thiệu 6 ký tự
    const a = await svc.ensureCitizen("u_a", { displayName: "An", avatar: "x" });
    assert.equal(a.isNew, true);
    assert.equal(a.citizen.points, 5);
    assert.equal(a.citizen.tierKey, "cong_dan");
    assert.match(a.citizen.referralCode, /^[A-Z2-9]{6}$/);

    // 2) Idempotent: mở lại không cộng thêm
    const a2 = await svc.ensureCitizen("u_a", {});
    assert.equal(a2.isNew, false);
    assert.equal(a2.citizen.points, 5);
    assert.equal(await PointTransaction.countDocuments({ zaloUserId: "u_a", type: "register" }), 1);

    // 3) Giới thiệu: B nhập mã của A → A +2, B +5 (đăng ký) +2
    const b = await svc.ensureCitizen("u_b", { displayName: "Bình" });
    const r = await svc.redeemReferral("u_b", a.citizen.referralCode.toLowerCase());
    assert.equal(r.ok, true);
    assert.equal((await Citizen.findOne({ zaloUserId: "u_a" })).points, 7);
    assert.equal((await Citizen.findOne({ zaloUserId: "u_b" })).points, 7);

    // 4) Chống gian lận: nhập lại, tự giới thiệu, mã sai
    assert.equal((await svc.redeemReferral("u_b", a.citizen.referralCode)).ok, false);
    assert.equal((await svc.redeemReferral("u_a", a.citizen.referralCode)).ok, false);
    assert.equal((await svc.redeemReferral("u_a", "ZZZZZZ")).ok, false);
    assert.equal((await Citizen.findOne({ zaloUserId: "u_a" })).points, 7);

    // 5) Phản ánh được phản hồi: +2 đúng một lần dù gọi lại
    const fb = { _id: new mongoose.Types.ObjectId(), userId: "u_a" };
    assert.equal((await svc.awardFeedbackResolved(fb)).created, true);
    assert.equal((await svc.awardFeedbackResolved(fb)).created, false);
    assert.equal((await Citizen.findOne({ zaloUserId: "u_a" })).points, 9);

    // 6) Điểm đến trước khi đăng ký được gộp khi đăng ký
    await svc.awardFeedbackResolved({ _id: new mongoose.Types.ObjectId(), userId: "u_c" });
    const c = await svc.ensureCitizen("u_c", {});
    assert.equal(c.citizen.points, 7); // +2 phản ánh trước, +5 đăng ký

    // 7) Lên hạng Hội viên khi đủ 20 điểm; điều chỉnh tay có thể trừ nhưng không âm
    await svc.award({ zaloUserId: "u_a", type: "adjust", refId: "t1", points: 11, note: "thử" });
    const up = await Citizen.findOne({ zaloUserId: "u_a" });
    assert.equal(up.points, 20);
    assert.equal(up.tierKey, "hoi_vien");
    await svc.award({ zaloUserId: "u_a", type: "adjust", refId: "t2", points: -500, note: "thử trừ" });
    assert.equal((await Citizen.findOne({ zaloUserId: "u_a" })).points, 0);

    // 8) Cấu hình đổi qua AdminWeb có hiệu lực: đổi điểm phản ánh, ngưỡng hạng
    const prog = await svc.getProgram();
    prog.rules.feedback.points = 10;
    await svc.saveProgram(prog);
    const fb2 = { _id: new mongoose.Types.ObjectId(), userId: "u_b" };
    await svc.awardFeedbackResolved(fb2);
    assert.equal((await Citizen.findOne({ zaloUserId: "u_b" })).points, 17);

    // 9) View trả đúng tiến trình & hạng kế
    const view = await svc.toView(await Citizen.findOne({ zaloUserId: "u_b" }));
    assert.equal(view.tier.key, "cong_dan");
    assert.equal(view.nextTier.key, "hoi_vien");
    assert.equal(view.pointsNeeded, 3);

    console.log("TÍCH HỢP: tất cả kịch bản đạt");
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log("Đã xoá database tạm", DB);
  }
}

main().catch((e) => {
  console.error("THẤT BẠI:", e.message);
  process.exit(1);
});
