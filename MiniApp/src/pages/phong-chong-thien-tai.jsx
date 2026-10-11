import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header } from "zmp-ui";
import Icon3D from "../components/icon3d.jsx";
import { openExternal } from "../utils/open-external.js";

// Biểu tượng 3D lớn thay cho emoji nhỏ cũ; SOS vẽ bằng CSS vì bộ icon không có.
const ITEMS = [
  { key: "sos", label: "SOS", desc: "Gọi cứu hộ khẩn cấp", sos: true },
  { key: "danh-ba", label: "Danh bạ điện thoại PCTT", desc: "Số điện thoại ứng phó thiên tai", icon: "lien-he" },
  { key: "ky-nang", label: "Kỹ năng PCTT", desc: "Video và hướng dẫn kỹ năng", icon: "binh-dan-so-hoc", path: "/pctt-ky-nang" },
  { key: "ban-do", label: "Bản đồ số", desc: "Bản đồ số thành phố Đà Nẵng", icon: "ban-do", href: "https://bando.danang.gov.vn/" },
];

// "Bản đồ mưa ngập" vẫn ẩn: domain của công ty tư nhân, Zalo từ chối kiểm duyệt
// (mục 4.1 điều hướng liên kết trang thứ 3). Chỉ bật lại khi có nguồn .gov.vn.

const PhongChongThienTaiPage = () => {
  const navigate = useNavigate();
  const [notice, setNotice] = useState(false);

  const handleClick = (item) => {
    if (item.href) openExternal(item.href);
    else if (item.path) navigate(item.path);
    else setNotice(true);
  };

  return (
    <Page className="page-pctt tp-page">
      <Header title="Phòng chống thiên tai" />

      <div className="tp-subhero">
        <div className="tp-subhero__row">
          <Icon3D name="thien-tai" size={72} className="tp-float" />
          <div>
            <h1 className="tp-subhero__title">Phòng chống thiên tai</h1>
            <p className="tp-subhero__desc">
              Thông tin, kỹ năng và cảnh báo phòng chống thiên tai cho người dân xã Thăng Phú
            </p>
          </div>
        </div>
      </div>

      <div className="tp-cards tp-cards--lift">
        {ITEMS.map((item, index) => (
          <button
            key={item.key}
            type="button"
            className="tp-card tp-card--big tp-press tp-rise"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleClick(item)}
          >
            {item.sos ? (
              <span className="tp-sos" aria-hidden="true">
                SOS
              </span>
            ) : (
              <Icon3D name={item.icon} size={68} />
            )}
            <h3 className="tp-card__title">{item.label}</h3>
            <p className="tp-card__desc">{item.desc}</p>
          </button>
        ))}
      </div>

      {notice && (
        <div className="tp-notice" role="status">
          <b>Tính năng đang được hoàn thiện</b>
          <span>Vui lòng quay lại sau. Trong lúc chờ, bạn có thể xem “Kỹ năng PCTT”.</span>
        </div>
      )}
    </Page>
  );
};

export default PhongChongThienTaiPage;
