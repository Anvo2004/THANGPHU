import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "zmp-ui";
import HomeSearch from "../components/home-search.jsx";
import StatsRow from "../components/stats-row.jsx";
import QuickLinksGrid from "../components/quick-links-grid.jsx";
import ZaloOACard from "../components/zalo-oa-card.jsx";
import NoticeCard from "../components/notice-card.jsx";
import Icon3D from "../components/icon3d.jsx";
import API_BASE_URL from "../data/api-config.js";
import useNews from "../data/use-news.js";
import SITE from "../data/site.js";
import { openExternal } from "../utils/open-external.js";
import logo from "../static/logo-thangphu.png";
import heroArt from "../static/tranh-dau-trang.svg";
import heroPhoto1 from "../static/hero-1.jpg";
import heroPhoto2 from "../static/hero-2.jpg";

// Ảnh thật của xã (lấy từ trình chiếu trên cổng thông tin thangphu.danang.gov.vn).
const HERO_PHOTOS = [heroPhoto1, heroPhoto2];

const TAG_TONES = ["bamboo", "lake", "violet", "gold"];

const HomePage = () => {
  const navigate = useNavigate();
  const news = useNews();

  const [siteInfo, setSiteInfo] = useState({});
  const [notices, setNotices] = useState([]);
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/site-info`)
      .then((res) => res.json())
      .then((data) => setSiteInfo(data || {}))
      .catch(() => setSiteInfo({}));

    fetch(`${API_BASE_URL}/api/public/thong-bao`)
      .then((res) => res.json())
      .then((data) => setNotices((data.items || []).slice(0, 2)))
      .catch(() => setNotices([]));
  }, []);

  // Trình chiếu ảnh nền đầu trang (chuyển mờ dần mỗi 6 giây).
  useEffect(() => {
    const timer = setInterval(() => setPhoto((p) => (p + 1) % HERO_PHOTOS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const contact = siteInfo.contact || {};
  const digitalTransform = siteInfo.digitalTransform || {};

  return (
    <Page className="page-home tp-page">
      <header className="tp-hero">
        {HERO_PHOTOS.map((src, i) => (
          <img
            key={src}
            className={`tp-hero__photo ${i === photo ? "is-active" : ""}`}
            src={src}
            alt={i === 0 ? "Cảnh quan xã Thăng Phú" : ""}
            aria-hidden={i === 0 ? undefined : "true"}
          />
        ))}
        <div className="tp-hero__shade" aria-hidden="true" />
        <div className="tp-hero__content">
          <div className="tp-hero__top">
            <div className="tp-crest tp-float">
              <img src={logo} alt="Quốc huy Việt Nam" />
            </div>
            <div className="tp-hero__titles">
              <span className="tp-hero__eyebrow">UBND xã</span>
              <h1 className="tp-hero__title">{SITE.appName}</h1>
              <span className="tp-hero__sub">
                TP. Đà Nẵng · {SITE.badge}
              </span>
            </div>
            <button
              type="button"
              className="tp-bell tp-press"
              aria-label="Thông báo"
              onClick={() => navigate("/thong-bao")}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
              {notices.length > 0 && <span className="tp-bell__dot" />}
            </button>
          </div>
          <HomeSearch />
        </div>
      </header>

      <StatsRow />

      <section className="tp-section" aria-labelledby="tp-ti">
        <div className="tp-section__head">
          <h2 id="tp-ti">Tiện ích</h2>
          <button type="button" className="tp-section__link" onClick={() => navigate("/dich-vu")}>
            Tất cả
          </button>
        </div>
        <QuickLinksGrid />
      </section>

      {(digitalTransform.title || digitalTransform.tags) && (
        <section className="tp-section tp-section--tight">
          <div className="tp-banner tp-shine">
            <Icon3D name="cong-du-lieu" size={56} />
            <div className="tp-banner__body">
              <strong>{digitalTransform.title}</strong>
              <div className="tp-banner__tags">
                {(digitalTransform.tags || []).map((tag, i) => (
                  <span key={tag} className={i === 0 ? "is-gold" : ""}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="tp-section" aria-labelledby="tp-tt">
        <div className="tp-section__head">
          <h2 id="tp-tt">Tin tức mới nhất</h2>
          <button type="button" className="tp-section__link" onClick={() => navigate("/tin-tuc")}>
            Xem thêm
          </button>
        </div>
        <div className="tp-news">
          {news.slice(0, 6).map((item, index) => (
            <article
              key={item.id}
              className="tp-news__card tp-press"
              role="button"
              tabIndex={0}
              onClick={() => item.link && openExternal(item.link)}
              onKeyDown={(e) => e.key === "Enter" && item.link && openExternal(item.link)}
            >
              <div className="tp-news__media">
                {item.image ? (
                  <img src={item.image} alt="" loading="lazy" />
                ) : (
                  <img className="tp-news__art" src={heroArt} alt="" />
                )}
                {item.tag && (
                  <span className={`tp-news__tag tp-news__tag--${TAG_TONES[index % TAG_TONES.length]}`}>
                    {item.tag}
                  </span>
                )}
              </div>
              <p className="tp-news__title">{item.title}</p>
              {item.date && <span className="tp-news__date">{item.date}</span>}
            </article>
          ))}
        </div>
      </section>

      <section className="tp-section tp-section--tight">
        <ZaloOACard oa={siteInfo.zaloOA} />
      </section>

      <section className="tp-section" aria-labelledby="tp-tb">
        <div className="tp-section__head">
          <h2 id="tp-tb">Thông báo quan trọng</h2>
        </div>
        <div className="notice-list">
          <NoticeCard
            notice={{
              icon: "headset_mic",
              iconColor: "b",
              title: "Cần hỗ trợ từ UBND xã?",
              content: contact.hotline
                ? `Hotline: ${contact.hotline}`
                : "Xem thông tin liên hệ và gửi phản ánh tới xã.",
            }}
            onClick={() => navigate("/lien-he")}
          />
          {notices.map((notice) => (
            <NoticeCard
              key={notice._id}
              notice={{ icon: "warning", iconColor: "a", title: notice.title, content: notice.content }}
            />
          ))}
        </div>
      </section>
    </Page>
  );
};

export default HomePage;
