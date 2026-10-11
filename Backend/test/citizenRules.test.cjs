const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_PROGRAM,
  normalizeProgram,
  tierInfo,
  makeReferralCode,
  normalizeReferralCode,
  normalizePhone,
  CODE_ALPHABET,
} = require("../src/services/citizenRules");

test("mặc định theo thể lệ Đại Lộc: điểm và ngưỡng hạng", () => {
  const p = normalizeProgram(null);
  assert.equal(p.rules.register.points, 5);
  assert.equal(p.rules.referrer.points, 2);
  assert.equal(p.rules.survey.points, 5);
  assert.equal(p.rules.feedback.points, 2);
  assert.equal(p.rules.event.points, 5);
  assert.equal(p.rules.exam.points, 5);
  assert.deepEqual(p.tiers.map((t) => [t.name, t.min]), [
    ["Công dân", 5],
    ["Hội viên", 20],
    ["Công dân số", 50],
  ]);
  assert.equal(p.benefits.length, 3);
});

test("tierInfo: 5 điểm là Công dân, 25% tiến trình tới Hội viên (như Đại Lộc)", () => {
  const { tiers } = DEFAULT_PROGRAM;
  const i = tierInfo(5, tiers);
  assert.equal(i.current.key, "cong_dan");
  assert.equal(i.next.key, "hoi_vien");
  assert.equal(i.progress, 25);
  assert.equal(i.pointsNeeded, 15);
});

test("tierInfo: dưới ngưỡng đầu chưa có hạng, tiến trình tính từ 0", () => {
  const i = tierInfo(0, DEFAULT_PROGRAM.tiers);
  assert.equal(i.current, null);
  assert.equal(i.next.key, "cong_dan");
  assert.equal(i.pointsNeeded, 5);
});

test("tierInfo: đạt hạng cao nhất thì tiến trình 100%", () => {
  const i = tierInfo(80, DEFAULT_PROGRAM.tiers);
  assert.equal(i.current.key, "cong_dan_so");
  assert.equal(i.next, null);
  assert.equal(i.progress, 100);
});

test("normalizeProgram: giá trị bẩn bị làm sạch, hạng được sắp theo điểm", () => {
  const p = normalizeProgram({
    rules: { feedback: { points: "7.4", title: "  ", desc: 5 }, bogus: { points: 99 } },
    tiers: [
      { name: "Cao", min: 100 },
      { name: "", min: 1 },
      { name: "Thấp", min: 10 },
    ],
    benefits: [{ title: "", items: ["x"] }, { title: "Ưu đãi", items: ["a", "", 3] }],
  });
  assert.equal(p.rules.feedback.points, 7);
  assert.equal(p.rules.feedback.title, DEFAULT_PROGRAM.rules.feedback.title);
  assert.equal(p.rules.bogus, undefined);
  assert.deepEqual(p.tiers.map((t) => t.name), ["Thấp", "Cao"]);
  assert.deepEqual(p.benefits, [{ title: "Ưu đãi", items: ["a"] }]);
});

test("mã giới thiệu: 6 ký tự, không có ký tự dễ nhầm, chuẩn hóa chữ hoa", () => {
  for (let i = 0; i < 200; i++) {
    const c = makeReferralCode();
    assert.match(c, /^[A-Z2-9]{6}$/);
    assert.ok(![..."0O1IL"].some((ch) => c.includes(ch)));
  }
  assert.ok(!/[0O1IL]/.test(CODE_ALPHABET));
  assert.equal(normalizeReferralCode(" hvh-ldz "), "HVHLDZ");
});

test("normalizePhone: 84… → 0…", () => {
  assert.equal(normalizePhone("84848018141"), "0848018141");
  assert.equal(normalizePhone("0905 029 474"), "0905029474");
  assert.equal(normalizePhone(""), "");
});
