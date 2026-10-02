// Thông tin thương hiệu tĩnh (tên app, banner) — hiếm khi đổi nên để trong
// code. Số liệu dân số, thông báo, và thông tin liên hệ đã chuyển sang
// MongoDB (xem components/stats-row.jsx, pages/home.jsx, pages/contact.jsx —
// gọi /api/public/dan-so, /thong-bao, /site-info).
const SITE = {
  appName: "Thăng Phú Số",
  shortName: "Thăng Phú kết nối số",
  province: "Thành phố Đà Nẵng", // Cần xác nhận thông tin địa phương trước khi phát hành.
  badge: "Chính quyền số",
  heroCaption: "Xã Thăng Phú",
  wardName: "Thăng Phú", // dùng để build query ?ward= cho bando.danang.gov.vn (pages/contact.jsx)
};

export default SITE;
