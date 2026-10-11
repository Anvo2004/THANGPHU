import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header } from "zmp-ui";
import Icon from "../components/icon.jsx";
import Icon3D from "../components/icon3d.jsx";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import logo from "../static/logo-thangphu.png";
import SITE from "../data/site.js";

// Suy ra trạng thái "đang làm việc" từ chuỗi workHours dạng
// "Thứ 2 - Thứ 6 · 07:30-11:30, 13:30-17:00". Trả về null nếu không tách
// được khung giờ — khi đó KHÔNG hiển thị badge, tránh báo sai giờ làm việc
// cho người dân (an toàn hơn là đoán bừa).
function getOpenStatus(workHours) {
  if (!workHours) return null;
  const ranges = [...workHours.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)];
  if (!ranges.length) return null;

  const day = new Date().getDay(); // 0 = CN
  if (day === 0 || day === 6) return { open: false };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const [, h1, m1, h2, m2] of ranges) {
    const start = Number(h1) * 60 + Number(m1);
    const end = Number(h2) * 60 + Number(m2);
    if (nowMinutes >= start && nowMinutes <= end) {
      return { open: true, closeLabel: `${h2.padStart(2, "0")}:${m2}` };
    }
  }
  return { open: false };
}

const ContactPage = () => {
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/site-info`)
      .then((res) => res.json())
      .then((data) => setContact(data?.contact || {}))
      .catch(() => setContact({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Page className="page-contact">
        <Header title="Liên hệ" />
        <div className="lookup-empty">Đang tải...</div>
      </Page>
    );
  }

  const c = contact || {};
  const openStatus = getOpenStatus(c.workHours);
  // Mở bản đồ số Đà Nẵng theo tên xã.
  const mapEmbedUrl = `https://bando.danang.gov.vn/?ward=${encodeURIComponent(SITE.wardName)}`;
  const mapsHref = mapEmbedUrl;

  return (
    <Page className="page-contact tp-page">
      <Header title="Liên hệ" />

      <div className="tp-subhero tp-subhero--compact">
        <h1 className="tp-subhero__title">Liên hệ</h1>
        <p className="tp-subhero__desc">Kết nối trực tiếp với chính quyền xã</p>
      </div>

      <section className="tp-contact tp-rise">
        <div className="tp-contact__head">
          <div className="tp-crest tp-crest--sm">
            <img src={logo} alt="Quốc huy Việt Nam" />
          </div>
          <div>
            <div className="tp-contact__name">{c.officeName || "UBND xã Thăng Phú"}</div>
            <div className="tp-contact__sub">
              {openStatus
                ? openStatus.open
                  ? `Đang làm việc · đến ${openStatus.closeLabel}`
                  : "Ngoài giờ làm việc"
                : "Thành phố Đà Nẵng"}
            </div>
          </div>
        </div>

        <div className="tp-contact__row">
          <span className="tp-contact__key">Địa chỉ</span>
          <span className="tp-contact__value">{c.address || "Đang cập nhật"}</span>
        </div>
        <div className="tp-contact__row">
          <span className="tp-contact__key">Website</span>
          {c.website ? (
            <button
              type="button"
              className="tp-contact__value tp-contact__value--link"
              onClick={() => openExternal(`https://${c.website}`)}
            >
              {c.website}
            </button>
          ) : (
            <span className="tp-contact__value">Đang cập nhật</span>
          )}
        </div>
        <div className="tp-contact__row">
          <span className="tp-contact__key">Email</span>
          <span className="tp-contact__value">{c.email || "Đang cập nhật"}</span>
        </div>
        <div className="tp-contact__row">
          <span className="tp-contact__key">Giờ làm việc</span>
          <span className="tp-contact__value tp-contact__value--pre">{c.workHours || "Đang cập nhật"}</span>
        </div>

        {c.hotline && (
          <a className="tp-callbtn tp-press" href={`tel:${c.hotline.replace(/\s+/g, "")}`}>
            <Icon name="call" className="i20" />
            Gọi ngay {c.hotline}
          </a>
        )}
        {c.hotline2 && (
          <a className="tp-callbtn tp-callbtn--ghost tp-press" href={`tel:${c.hotline2.replace(/\s+/g, "")}`}>
            <Icon name="call" className="i16" />
            Hoặc gọi số {c.hotline2}
          </a>
        )}
      </section>

      {c.policeStation?.address && (
        <section className="tp-contact tp-contact--police">
          <div className="tp-contact__head">
            <span className="tp-shield" aria-hidden="true">
              <Icon name="local_police" className="i22" />
            </span>
            <div>
              <div className="tp-contact__name">{c.policeStation.name || "Công an xã"}</div>
              <div className="tp-contact__sub">{c.policeStation.address}</div>
            </div>
          </div>
          {c.policeStation.phone && (
            <a
              className="tp-hotline tp-press"
              href={`tel:${c.policeStation.phone.replace(/\s+/g, "")}`}
            >
              <span>
                <small>Điện thoại trực ban</small>
                <b>{c.policeStation.phone}</b>
              </span>
              <span className="tp-hotline__call" aria-hidden="true">
                <Icon name="call" className="i20" />
              </span>
            </a>
          )}
        </section>
      )}

      <section className="tp-section" aria-labelledby="tp-hotro">
        <div className="tp-section__head">
          <h2 id="tp-hotro">Kênh hỗ trợ nhanh</h2>
        </div>
        <div className="tp-cards tp-cards--three">
          <div className="tp-card tp-card--static">
            <Icon3D name="thong-bao" size={48} />
            <h3 className="tp-card__title">Zalo OA</h3>
            <p className="tp-card__desc">Chat trực tiếp với cán bộ xã</p>
          </div>
          <button type="button" className="tp-card tp-press" onClick={() => navigate("/phan-anh")}>
            <Icon3D name="phan-anh" size={48} />
            <h3 className="tp-card__title">Gửi phản ánh</h3>
            <p className="tp-card__desc">Kèm ảnh, vị trí hiện tại</p>
          </button>
          <button type="button" className="tp-card tp-press" onClick={() => navigate("/tro-ly-so")}>
            <Icon3D name="tro-ly-ai" size={48} />
            <h3 className="tp-card__title">Hỏi đáp AI</h3>
            <p className="tp-card__desc">Giải đáp thủ tục 24/7</p>
          </button>
        </div>
      </section>

      <div className="mapcard">
        <div className="mapcard__img">
          <iframe
            className="mapcard__iframe"
            src={mapEmbedUrl}
            title="Bản đồ vị trí UBND xã Thăng Phú"
            loading="lazy"
          />
        </div>
        <div className="mapcard__row">
          <Icon name="location_on" className="i20 pink" />
          <span className="mapcard__address">{c.address}</span>
          <a
            className="pill-soft"
            href={mapsHref}
            onClick={(e) => {
              e.preventDefault();
              openExternal(mapsHref);
            }}
          >
            Chỉ đường
          </a>
        </div>
      </div>
    </Page>
  );
};

export default ContactPage;
