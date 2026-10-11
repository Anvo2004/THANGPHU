import React, { useEffect, useState } from "react";
import API_BASE_URL from "../data/api-config.js";

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("vi-VN");
}

// Thẻ số liệu xã (nổi lên đè mép tranh đầu trang). Mật độ tự tính từ dân số và
// diện tích — không lưu riêng nên luôn khớp số liệu quản trị nhập.
const StatsRow = () => {
  const [danSo, setDanSo] = useState({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/dan-so`)
      .then((res) => res.json())
      .then((data) => setDanSo(data || {}))
      .catch(() => setDanSo({}));
  }, []);

  const density =
    danSo.tongDanSo && danSo.dienTichKm2
      ? (danSo.tongDanSo / danSo.dienTichKm2).toLocaleString("vi-VN", { maximumFractionDigits: 1 })
      : "—";

  const stats = [
    { label: "Dân số", value: fmt(danSo.tongDanSo), tone: "lake" },
    { label: "Thôn", value: fmt(danSo.soThon), tone: "bamboo" },
    {
      label: "km² diện tích",
      value: danSo.dienTichKm2 != null ? String(danSo.dienTichKm2).replace(".", ",") : "—",
      tone: "gold",
    },
    { label: "người/km²", value: density, tone: "violet" },
  ];

  return (
    <section className="tp-stats tp-rise" aria-label="Số liệu xã">
      {stats.map((stat) => (
        <div key={stat.label} className="tp-stats__item">
          <strong className={`tp-stats__value tp-stats__value--${stat.tone}`}>{stat.value}</strong>
          <span className="tp-stats__label">{stat.label}</span>
        </div>
      ))}
    </section>
  );
};

export default StatsRow;
