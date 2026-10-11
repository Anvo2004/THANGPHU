import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Thanh điều hướng 5 ô theo giao diện "Thăng Phú Số": Trang chủ · Dịch vụ ·
// [Phản ánh — nút tròn nổi ở giữa] · Liên hệ · Công dân. Icon vẽ bằng SVG nội
// tuyến (WebView Zalo chặn phông ngoài). "Hiến kế" vẫn ẩn như trước (chưa có
// backend lưu dữ liệu thật).
const SVG = {
  home: (
    <path d="M3 11.2 12 3.5l9 7.7V20a1 1 0 0 1-1 1h-5.2v-6.2H9.2V21H4a1 1 0 0 1-1-1z" />
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  call: (
    <path d="M21 16.9v2.6a1.9 1.9 0 0 1-2.1 1.9 18.7 18.7 0 0 1-8.1-2.9 18.4 18.4 0 0 1-5.7-5.7A18.7 18.7 0 0 1 2.2 4.1 1.9 1.9 0 0 1 4.1 2h2.6a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.6a1.9 1.9 0 0 1-.4 2L7.8 9.4a15.2 15.2 0 0 0 6.8 6.8l1.2-1.2a1.9 1.9 0 0 1 2-.4c.8.3 1.7.6 2.6.7a1.9 1.9 0 0 1 1.6 1.6z" />
  ),
  id: (
    <>
      <rect x="2.8" y="4.5" width="18.4" height="15" rx="3" />
      <circle cx="9" cy="10.6" r="2.2" />
      <path d="M5.6 16.2c.4-1.7 1.7-2.6 3.4-2.6s3 .9 3.4 2.6M14.5 9.5h4M14.5 13h4" />
    </>
  ),
};

const TABS = [
  { key: "/", label: "Trang chủ", icon: "home", fill: true },
  { key: "/dich-vu", label: "Dịch vụ", icon: "grid" },
  { key: "/phan-anh", label: "Phản ánh", center: true },
  { key: "/lien-he", label: "Liên hệ", icon: "call" },
  { key: "/cong-dan", label: "Công dân", icon: "id", also: ["/tich-diem"] },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <div className="layout__content">{children}</div>
      <nav className="tp-nav" aria-label="Điều hướng chính">
        {TABS.map((tab) => {
          const active =
            location.pathname === tab.key || (tab.also || []).includes(location.pathname);

          if (tab.center) {
            return (
              <button
                key={tab.key}
                type="button"
                className="tp-nav__item tp-nav__item--center"
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(tab.key)}
              >
                <span className="tp-nav__fab tp-pulse">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                    <path d="M3 10.2v3.6a1 1 0 0 0 1 1h2.3l5.2 4V5.2l-5.2 4H4a1 1 0 0 0-1 1z" />
                    <path
                      d="M15 9.2a4 4 0 0 1 0 5.6M17.6 6.6a7.7 7.7 0 0 1 0 10.8"
                      fill="none"
                      stroke="#FFD66B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="tp-nav__label">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              type="button"
              className={`tp-nav__item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(tab.key)}
            >
              <span className="tp-nav__icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={active && tab.fill ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {SVG[tab.icon]}
                </svg>
              </span>
              <span className="tp-nav__label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
