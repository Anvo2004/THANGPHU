import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import Icon3D from "./icon3d.jsx";

// Lưới "Tiện ích" 4 cột với icon 3D. Nội dung vẫn do cán bộ quản lý qua AdminWeb
// (AppLink); chưa tải xong thì hiện khung chờ thay vì để trống.
const QuickLinksGrid = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/app-links?section=quick_link`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="tp-grid" aria-busy="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="tp-tile">
            <span className="tp-skeleton tp-tile__ghost" />
            <span className="tp-skeleton tp-tile__ghost-label" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tp-grid">
      {items.map((item, index) => (
        <button
          key={item._id}
          type="button"
          className="tp-tile tp-lift tp-rise"
          style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}
          onClick={() => (item.href ? openExternal(item.href) : navigate(item.path))}
        >
          <Icon3D item={item} size={60} />
          <span className="tp-tile__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickLinksGrid;
