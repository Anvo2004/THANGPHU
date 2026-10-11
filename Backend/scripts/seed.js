// Creates the first superadmin account + default categories. Safe to re-run —
// skips anything that already exists. Usage: node scripts/seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../src/config");
const AdminUser = require("../src/models/AdminUser");
const Category = require("../src/models/Category");

const DEFAULT_CATEGORIES = [
  { name: "Hạ tầng - Giao thông", icon: "🚧", order: 1 },
  { name: "Môi trường", icon: "🌳", order: 2 },
  { name: "Y tế - Sức khỏe", icon: "🏥", order: 3 },
  { name: "Giáo dục", icon: "🎓", order: 4 },
  { name: "An ninh trật tự", icon: "🚨", order: 5 },
  { name: "Khác", icon: "📌", order: 6 },
];

async function main() {
  if (!config.mongoUri) throw new Error("Thiếu MONGO_URI của Thăng Phú");
  if (config.adminSeed.password.length < 12) throw new Error("Điền ADMIN_SEED_PASSWORD ít nhất 12 ký tự trước khi seed");
  await mongoose.connect(config.mongoUri, { dbName: config.mongoDbName });
  console.log("Connected to MongoDB");

  const existing = await AdminUser.findOne({ username: config.adminSeed.username });
  if (!existing) {
    const password = await bcrypt.hash(config.adminSeed.password, 10);
    await AdminUser.create({
      username: config.adminSeed.username,
      password,
      fullName: "Quản trị viên",
      role: "superadmin",
    });
    console.log("Created superadmin using ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD.");
  } else {
    console.log("Superadmin 'admin' already exists, skipping.");
  }

  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true });
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
