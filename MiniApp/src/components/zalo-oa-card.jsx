import React, { useEffect, useState } from "react";
import { followOA } from "zmp-sdk/apis";
import API_BASE_URL from "../data/api-config.js";
import Icon3D from "./icon3d.jsx";

// Thẻ mời quan tâm Zalo OA. ID OA lấy từ Backend (ZALO_OA_ID) — chưa cấu hình
// thì ẩn nút để không gọi followOA với ID rỗng.
const ZaloOACard = ({ oa }) => {
  const name = oa?.name || "Zalo OA xã Thăng Phú";
  const description = oa?.description || "Nhận thông báo, tin tức mới từ chính quyền";
  const [oaId, setOaId] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/citizen/program`)
      .then((res) => res.json())
      .then((data) => setOaId(data.oaId || ""))
      .catch(() => setOaId(""));
  }, []);

  const follow = async () => {
    try {
      await followOA({ id: oaId });
      setDone(true);
    } catch {
      /* người dùng từ chối hoặc đang chạy ngoài Zalo */
    }
  };

  return (
    <section className="tp-oa">
      <Icon3D name="thong-bao" size={52} className="tp-float" />
      <div className="tp-oa__body">
        <strong className="tp-oa__title">Theo dõi {name}</strong>
        <span className="tp-oa__desc">{description}</span>
      </div>
      {oaId && (
        <button type="button" className="tp-oa__btn tp-press" onClick={follow} disabled={done}>
          {done ? "Đã quan tâm" : "Quan tâm"}
        </button>
      )}
    </section>
  );
};

export default ZaloOACard;
