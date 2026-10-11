import React, { useEffect, useState } from "react";

// Hiển thị ảnh thật (item.image) nếu có và tải được, ngược lại dùng fallback
// (icon/emoji). Ảnh lỗi/404 tự rơi về fallback để không hiện chữ thay thế vỡ
// bố cục. Dùng cho mọi ô ảnh/icon ở trang Văn hóa và Du lịch: khi UBND bổ sung
// ảnh qua API, ảnh tự hiện lên mà không cần sửa code.
const CardMedia = ({ item, fallback }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [item.image]);

  if (item.image && !failed) {
    return (
      <img
        src={item.image}
        alt={item.title || item.name || ""}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return fallback;
};

export default CardMedia;
