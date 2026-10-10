import React from "react";
import SITE from "../data/site.js";
import logo from "../static/ward-icon.svg";

const HeroCard = () => {
  return (
    <div className="hero-card">
      <img className="hero-card__logo" src={logo} alt="Thăng Phú Số" />
      <div className="hero-card__info">
        <div className="hero-card__title">{SITE.appName}</div>
        <div className="hero-card__subtitle">{SITE.province}</div>
      </div>
      <div className="hero-card__badge">
        <span>🌐</span> {SITE.badge}
      </div>
    </div>
  );
};

export default HeroCard;
