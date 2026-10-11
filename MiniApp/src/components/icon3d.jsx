import React from "react";
import Icon from "./icon.jsx";
import { icon3dUrl, resolve3d } from "../data/icons3d.js";

// Hiển thị icon 3D theo `name` (khóa trong bộ icon) hoặc theo một AppLink
// (`item`). Không có icon 3D phù hợp thì rơi về icon phẳng cũ.
const Icon3D = ({ name, item, size = 60, className = "", fallbackClass = "i24" }) => {
  const key = name || resolve3d(item);
  const url = key ? icon3dUrl(key) : null;

  if (!url) {
    return item?.icon ? (
      <span className={`tile tile-${item.color || "b"}`} style={{ width: size, height: size }}>
        <Icon name={item.icon} className={fallbackClass} />
      </span>
    ) : null;
  }

  return <img className={`tp-icon3d ${className}`} src={url} alt="" width={size} height={size} draggable="false" />;
};

export default Icon3D;
