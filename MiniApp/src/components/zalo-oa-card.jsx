import React, { useEffect, useState } from "react";
import { followOA, getUserInfo } from "zmp-sdk/apis";
import API_BASE_URL from "../data/api-config.js";
import { isLinked, updateProfile } from "../data/citizen.js";
import Icon3D from "./icon3d.jsx";

// Thẻ mời quan tâm Zalo OA. ID OA lấy từ Backend (ZALO_OA_ID) — chưa cấu hình
// thì ẩn nút để không gọi followOA với ID rỗng.
//
// Trạng thái "đã quan tâm" lấy từ Zalo (getUserInfo().followedOA) mỗi lần mở app,
// KHÔNG chỉ nhớ trong phiên — nếu không, tắt app mở lại sẽ lại hiện "Quan tâm"
// dù người dùng đã quan tâm (đồng bộ với tab Công dân, cũng dùng cùng nguồn này).
const FOLLOWED_KEY = "thangphu_oa_followed";

function readFlag() {
  try {
    return localStorage.getItem(FOLLOWED_KEY) === "1";
  } catch {
    return false;
  }
}
function writeFlag(on) {
  try {
    if (on) localStorage.setItem(FOLLOWED_KEY, "1");
    else localStorage.removeItem(FOLLOWED_KEY);
  } catch {
    /* WebView có thể chặn localStorage */
  }
}

const ZaloOACard = ({ oa }) => {
  const name = oa?.name || "Zalo OA xã Thăng Phú";
  const description = oa?.description || "Nhận thông báo, tin tức mới từ chính quyền";
  const [oaId, setOaId] = useState("");
  // Khởi tạo bằng cờ đã lưu để không nháy "Quan tâm" trong lúc chờ Zalo trả lời.
  const [followed, setFollowed] = useState(readFlag());

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/citizen/program`)
      .then((res) => res.json())
      .then((data) => setOaId(data.oaId || ""))
      .catch(() => setOaId(""));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Không tự bật hộp xin quyền ở trang chủ: chỉ đọc nếu người dùng đã cho phép.
        const { userInfo } = await getUserInfo({ autoRequestPermission: false });
        if (alive && typeof userInfo?.followedOA === "boolean") {
          setFollowed(userInfo.followedOA);
          writeFlag(userInfo.followedOA);
        }
      } catch {
        /* chưa cấp quyền hoặc đang chạy ngoài Zalo — dùng cờ đã lưu */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const follow = async () => {
    try {
      await followOA({ id: oaId });
      setFollowed(true);
      writeFlag(true);
      // Đồng bộ hồ sơ công dân (nếu đã liên kết) để tab Công dân khớp ngay.
      if (isLinked()) updateProfile({ followedOA: true }).catch(() => {});
    } catch {
      /* người dùng từ chối hoặc đang chạy ngoài Zalo */
    }
  };

  return (
    <section className="tp-oa">
      <Icon3D name="thong-bao" size={52} className="tp-float" />
      <div className="tp-oa__body">
        <strong className="tp-oa__title">
          {followed ? `Đã quan tâm ${name}` : `Theo dõi ${name}`}
        </strong>
        <span className="tp-oa__desc">
          {followed ? "Bạn sẽ nhận thông báo và tin tức mới từ chính quyền" : description}
        </span>
      </div>
      {oaId && (
        <button type="button" className="tp-oa__btn tp-press" onClick={follow} disabled={followed}>
          {followed ? "Đã quan tâm ✓" : "Quan tâm"}
        </button>
      )}
    </section>
  );
};

export default ZaloOACard;
