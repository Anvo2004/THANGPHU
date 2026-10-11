import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Page, Header } from "zmp-ui";
import { getUserInfo } from "zmp-sdk/apis";
import {
  fetchProgram,
  fetchTransactions,
  formatDateTime,
  openCitizen,
  TYPE_LABELS,
} from "../data/citizen.js";

const TABS = [
  { key: "nhat-ky", label: "Nhật ký", icon: "🕘" },
  { key: "the-le", label: "Thể lệ", icon: "ℹ️" },
  { key: "quyen-loi", label: "Quyền lợi", icon: "🎖️" },
];

const RULE_ORDER = ["register", "referrer", "survey", "feedback", "event", "exam"];

const TichDiemPage = () => {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "nhat-ky");
  const [citizen, setCitizen] = useState(null);
  const [program, setProgram] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProgram()
      .then((d) => setProgram(d.program))
      .catch(() => {});

    (async () => {
      try {
        const { userInfo } = await getUserInfo({ autoRequestPermission: true });
        const data = await openCitizen({
          displayName: userInfo?.name || "",
          avatar: userInfo?.avatar || "",
          followedOA: Boolean(userInfo?.followedOA),
        });
        setCitizen(data.citizen);
        const tx = await fetchTransactions();
        setItems(tx.items || []);
      } catch (err) {
        setError(err.message || "Không tải được dữ liệu điểm");
        setItems([]);
      }
    })();
  }, []);

  const tiers = program?.tiers || [];
  const points = citizen?.points ?? 0;

  return (
    <Page className="page-citizen page-points">
      <Header title="Tích điểm công dân" />

      <div className="points-card">
        <div className="points-card__top">
          <div>
            <div className="points-card__label">Tổng điểm hiện có</div>
            <div className="points-card__value">
              {points} <span>điểm</span>
            </div>
            <span className="points-card__tier">{citizen?.tier ? citizen.tier.name : "Chưa xếp hạng"}</span>
          </div>
          {citizen?.avatar && <img className="points-card__avatar" src={citizen.avatar} alt="" />}
        </div>

        <div className="points-card__progress-head">
          <span>Tiến trình nâng hạng tiếp theo</span>
          <b>{citizen ? citizen.progress : 0}%</b>
        </div>
        <div className="points-card__bar">
          <i style={{ width: `${citizen ? citizen.progress : 0}%` }} />
        </div>
        <div className="points-card__hint">
          {citizen?.nextTier
            ? `Cần ${citizen.pointsNeeded} điểm nữa để lên ${citizen.nextTier.name}`
            : citizen
            ? "Bạn đã đạt hạng cao nhất"
            : ""}
        </div>
      </div>

      <div className="points-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`points-tabs__item ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "nhat-ky" && (
        <div className="points-panel">
          {error && <div className="points-empty">{error}</div>}
          {items === null && <div className="points-empty">Đang tải…</div>}
          {items && items.length === 0 && !error && (
            <div className="points-empty">Chưa có hoạt động nào được ghi nhận.</div>
          )}
          {(items || []).map((t, i) => (
            <div className="points-log" key={`${t.createdAt}-${i}`}>
              <span className="points-log__dot">{t.points >= 0 ? "✓" : "−"}</span>
              <div className="points-log__body">
                <div className="points-log__title">
                  {t.type === "adjust" && t.note ? t.note : TYPE_LABELS[t.type] || t.note || "Hoạt động"}
                </div>
                <div className="points-log__time">{formatDateTime(t.createdAt)}</div>
              </div>
              <span className={`points-log__pts ${t.points < 0 ? "is-neg" : ""}`}>
                {t.points > 0 ? `+${t.points}` : t.points}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "the-le" && program && (
        <div className="points-panel">
          <section className="points-section">
            <h3>
              <i>I</i> Đối tượng áp dụng
            </h3>
            <p>{program.target}</p>
          </section>

          <section className="points-section">
            <h3>
              <i>II</i> Cơ chế tích lũy điểm
            </h3>
            <p>Người dùng khi tham gia các hoạt động trên Mini App sẽ được cộng điểm Công dân số theo các mức sau:</p>
            {RULE_ORDER.map((key, idx) => {
              const r = program.rules[key];
              if (!r) return null;
              return (
                <div className="points-rule" key={key}>
                  <span className="points-rule__no">{idx + 1}</span>
                  <div className="points-rule__body">
                    <b>{r.title}</b>
                    <small>{r.desc}</small>
                  </div>
                  <span className="points-rule__pts">+{r.points} điểm</span>
                </div>
              );
            })}
          </section>

          <section className="points-section">
            <h3>
              <i>III</i> Phân hạng Công dân số
            </h3>
            <p>Căn cứ vào tổng điểm tích lũy, người dùng được xét nâng hạng Công dân số như sau:</p>
            {[...tiers].reverse().map((t) => (
              <div className="points-tier" key={t.key}>
                <b>{t.name}</b>
                <span>Từ {t.min} điểm</span>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "quyen-loi" && program && (
        <div className="points-panel">
          <section className="points-section">
            <h3>Quyền lợi và hình thức ghi nhận</h3>
            <p>Công dân số có thể sử dụng điểm tích lũy để:</p>
            {program.benefits.length === 0 && <p>Đang cập nhật.</p>}
            {program.benefits.map((b, i) => (
              <div className="points-benefit" key={i}>
                <b>
                  {i + 1}. {b.title}
                </b>
                <ul>
                  {b.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      )}
    </Page>
  );
};

export default TichDiemPage;
