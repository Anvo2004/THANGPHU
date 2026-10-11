import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header } from "zmp-ui";
import Icon3D from "../components/icon3d.jsx";
import { SERVICE_CATEGORIES } from "../data/services.js";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";

const STEPS = [
  "Chọn dịch vụ cần thực hiện bên dưới",
  "Đăng nhập bằng tài khoản VNeID hoặc CCCD",
  "Điền thông tin và nộp hồ sơ trực tuyến",
  "Nhận kết quả qua bưu điện hoặc tải về",
];

const ServicesPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [services, setServices] = useState(null);
  const [portalLinks, setPortalLinks] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/app-links?section=service`)
      .then((res) => res.json())
      .then((data) => setServices(data.items || []))
      .catch(() => setServices([]));

    fetch(`${API_BASE_URL}/api/public/app-links?section=portal`)
      .then((res) => res.json())
      .then((data) => setPortalLinks(data.items || []))
      .catch(() => setPortalLinks([]));
  }, []);

  const list = services || [];
  const filteredServices = list.filter(
    (service) => activeCategory === "all" || service.type === activeCategory
  );

  return (
    <Page className="page-services tp-page">
      <Header title="Dịch vụ công" />

      <div className="tp-subhero">
        <div className="tp-subhero__row">
          <Icon3D name="dich-vu-cong" size={64} className="tp-float" />
          <div>
            <h1 className="tp-subhero__title">Dịch vụ công trực tuyến</h1>
            <p className="tp-subhero__desc">Thủ tục hành chính xã Thăng Phú · nộp hồ sơ 24/7</p>
          </div>
        </div>
        <div className="tp-subhero__badges">
          <div className="tp-badge">
            <b className="tp-badge__value tp-badge__value--mint">100%</b>
            <span>Mức độ 4</span>
          </div>
          <div className="tp-badge">
            <b className="tp-badge__value tp-badge__value--gold">24/7</b>
            <span>Trực tuyến</span>
          </div>
          <div className="tp-badge">
            <b className="tp-badge__value">{list.length}</b>
            <span>Nhóm dịch vụ</span>
          </div>
        </div>
      </div>

      <section className="tp-steps tp-rise">
        <h2 className="tp-steps__head">{STEPS.length} bước nộp hồ sơ trực tuyến</h2>
        {STEPS.map((step, index) => (
          <div className="tp-steps__row" key={step}>
            <span className={`tp-steps__n ${index === STEPS.length - 1 ? "is-last" : ""}`}>{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </section>

      <div className="tp-seg" role="tablist">
        {SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            role="tab"
            aria-selected={activeCategory === category.key}
            className={activeCategory === category.key ? "is-active" : ""}
            onClick={() => setActiveCategory(category.key)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="tp-cards">
        {services === null &&
          [0, 1, 2, 3].map((i) => <div key={i} className="tp-card tp-skeleton tp-card--ghost" />)}
        {filteredServices.map((service, index) => {
          const Tag = service.path ? "button" : "div";
          return (
            <Tag
              key={service._id}
              type={service.path ? "button" : undefined}
              className="tp-card tp-press tp-rise"
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              onClick={service.path ? () => navigate(service.path) : undefined}
            >
              <Icon3D item={service} size={56} />
              <h3 className="tp-card__title">{service.label}</h3>
              <span className={`tp-chip tp-chip--${service.type === "online" ? "online" : "offline"}`}>
                {service.type === "online" ? "Trực tuyến" : "Trực tiếp"}
              </span>
            </Tag>
          );
        })}
      </div>

      {portalLinks.length > 0 && (
        <section className="tp-section" aria-labelledby="tp-portal">
          <div className="tp-section__head">
            <h2 id="tp-portal">Cổng dịch vụ công</h2>
          </div>
          <div className="tp-list">
            {portalLinks.map((link) => (
              <button
                key={link._id}
                type="button"
                className="tp-list__item tp-press"
                onClick={() => (link.path ? navigate(link.path) : openExternal(link.href))}
                disabled={!link.path && !link.href}
              >
                <Icon3D item={link} size={44} fallbackClass="i20" />
                <span className="tp-list__body">
                  <span className="tp-list__title">
                    {link.label}
                    {link.badge && <em className="tp-list__badge">{link.badge}</em>}
                  </span>
                  {link.description && <span className="tp-list__desc">{link.description}</span>}
                </span>
                <span className="tp-list__arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
};

export default ServicesPage;
