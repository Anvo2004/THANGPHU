import React, { useEffect, useMemo, useState } from "react";
import { Page, Header } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";
import Icon3D from "../components/icon3d.jsx";
import { openExternal } from "../utils/open-external.js";
import { callPhone } from "../utils/call-phone.js";

const MUC_DO_LABEL = { "3": "Mức độ 3", "4": "Mức độ 4 (trực tuyến toàn trình)" };

// Bỏ dấu + hạ chữ thường để gõ "khai sinh" vẫn tìm ra "Đăng ký khai sinh".
function fold(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

const ThuTucHanhChinhPage = () => {
  const [all, setAll] = useState(null); // null = đang tải
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [field, setField] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [hotline, setHotline] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/thu-tuc-hanh-chinh`)
      .then((res) => res.json())
      .then((data) => setAll(data.items || []))
      .catch(() => {
        setAll([]);
        setError("Không thể tải danh mục thủ tục. Vui lòng thử lại sau.");
      });

    fetch(`${API_BASE_URL}/api/public/site-info`)
      .then((res) => res.json())
      .then((data) => setHotline(data?.contact?.hotline || data?.contact?.phone || ""))
      .catch(() => setHotline(""));
  }, []);

  const fields = useMemo(() => {
    const set = new Set((all || []).map((x) => x.linhVuc).filter(Boolean));
    return [...set];
  }, [all]);

  const items = useMemo(() => {
    const kw = fold(q.trim());
    return (all || []).filter((x) => {
      if (field !== "all" && x.linhVuc !== field) return false;
      if (!kw) return true;
      return fold(x.tenThuTuc).includes(kw) || fold(x.linhVuc).includes(kw);
    });
  }, [all, q, field]);

  const loading = all === null;
  const noData = !loading && all.length === 0 && !error;

  return (
    <Page className="page-tthc tp-page">
      <Header title="Thủ tục hành chính" />

      <div className="tp-subhero">
        <div className="tp-subhero__row">
          <Icon3D name="tthc" size={64} className="tp-float" />
          <div>
            <h1 className="tp-subhero__title">Danh mục thủ tục hành chính</h1>
            <p className="tp-subhero__desc">
              Xem trước giấy tờ cần chuẩn bị, thời gian xử lý trước khi đi làm thủ tục tại xã Thăng Phú
            </p>
          </div>
        </div>
      </div>

      <div className="tp-tthc">
        <input
          className="tp-tthc__search"
          type="search"
          placeholder="Tìm theo tên thủ tục, lĩnh vực…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {fields.length > 1 && (
          <div className="tp-tthc__chips">
            {["all", ...fields].map((f) => (
              <button
                key={f}
                type="button"
                className={field === f ? "is-active" : ""}
                onClick={() => setField(f)}
              >
                {f === "all" ? "Tất cả" : f}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="tp-tthc__list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="tp-skeleton tp-tthc__ghost" />
            ))}
          </div>
        )}

        {error && <div className="tp-empty">{error}</div>}

        {noData && (
          <div className="tp-empty">
            <b>Danh mục đang được cập nhật</b>
            <span>UBND xã Thăng Phú đang hoàn thiện danh mục thủ tục. Vui lòng liên hệ Bộ phận một cửa để được hướng dẫn.</span>
          </div>
        )}

        {!loading && all.length > 0 && (
          <>
            <div className="tp-tthc__count">
              {items.length} thủ tục
              {q.trim() || field !== "all" ? " phù hợp" : ""}
            </div>
            <div className="tp-tthc__list">
              {items.map((item) => {
                const isOpen = openId === item._id;
                const docs = String(item.giayToCanNop || "")
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                return (
                  <article key={item._id} className={`tp-tthc__card ${isOpen ? "is-open" : ""}`}>
                    <button
                      type="button"
                      className="tp-tthc__head"
                      onClick={() => setOpenId(isOpen ? null : item._id)}
                      aria-expanded={isOpen}
                    >
                      <span className="tp-tthc__title">{item.tenThuTuc}</span>
                      <span className="tp-tthc__meta">
                        {item.linhVuc && <span className="tp-tthc__tag">{item.linhVuc}</span>}
                        {item.mucDo && (
                          <span className={`tp-tthc__tag tp-tthc__tag--lv${item.mucDo}`}>
                            {MUC_DO_LABEL[item.mucDo] || `Mức độ ${item.mucDo}`}
                          </span>
                        )}
                      </span>
                      <span className="tp-tthc__chev" aria-hidden="true">
                        {isOpen ? "–" : "+"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="tp-tthc__body">
                        {item.thoiGianXuLy && (
                          <div className="tp-tthc__block">
                            <b>Thời gian xử lý</b>
                            <p>{item.thoiGianXuLy}</p>
                          </div>
                        )}
                        {docs.length > 0 && (
                          <div className="tp-tthc__block">
                            <b>Giấy tờ cần nộp</b>
                            <ul>
                              {docs.map((d, i) => (
                                <li key={i}>{d}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.ghiChu && (
                          <div className="tp-tthc__block">
                            <b>Ghi chú</b>
                            <p>{item.ghiChu}</p>
                          </div>
                        )}
                        <div className="tp-tthc__actions">
                          {item.linkNopTrucTuyen && (
                            <button
                              type="button"
                              className="tp-tthc__btn"
                              onClick={() => openExternal(item.linkNopTrucTuyen)}
                            >
                              Nộp trực tuyến
                            </button>
                          )}
                          {hotline && (
                            <a
                              className="tp-tthc__btn tp-tthc__btn--ghost"
                              href={`tel:${hotline.replace(/\s+/g, "")}`}
 onClick={(ev) => {
 ev.preventDefault();
 callPhone(hotline);
 }}
                            >
                              Gọi Bộ phận một cửa
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
              {items.length === 0 && <div className="tp-empty">Không tìm thấy thủ tục phù hợp.</div>}
            </div>

            <p className="tp-tthc__disclaimer">
              Thông tin mang tính tham khảo theo quy định chung. Thời gian và hồ sơ cụ thể do Bộ phận một cửa
              UBND xã hướng dẫn khi tiếp nhận.
            </p>
          </>
        )}
      </div>
    </Page>
  );
};

export default ThuTucHanhChinhPage;
