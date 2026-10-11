import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header, Sheet } from "zmp-ui";
import {
  getUserInfo,
  getPhoneNumber,
  followOA,
  unfollowOA,
  openShareSheet,
  createShortcut,
} from "zmp-sdk/apis";
import API_BASE_URL from "../data/api-config.js";
import logo from "../static/logo-thangphu.png";
import {
  clearPendingReferral,
  fetchProgram,
  fetchVillages,
  markPhoneAsked,
  openCitizen,
  pendingReferral,
  resetPhoneAsked,
  sendPhoneToken,
  submitReferral,
  updateProfile,
  wasPhoneAsked,
} from "../data/citizen.js";

const CitizenPage = () => {
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState(null);
  const [program, setProgram] = useState(null);
  const [oaId, setOaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const [villageSheet, setVillageSheet] = useState(false);
  const [villages, setVillages] = useState(null);
  const [referralSheet, setReferralSheet] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [referralError, setReferralError] = useState("");

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  // Lấy tên/ảnh Zalo → tự đăng ký (lần đầu +điểm) → trả hồ sơ công dân.
  const load = useCallback(async () => {
    setError("");
    try {
      const { userInfo } = await getUserInfo({ autoRequestPermission: true });
      const data = await openCitizen({
        displayName: userInfo?.name || "",
        avatar: userInfo?.avatar || "",
        followedOA: Boolean(userInfo?.followedOA),
        referralCode: pendingReferral(),
      });
      clearPendingReferral();
      setCitizen(data.citizen);
      return data.citizen;
    } catch (err) {
      setError(err.message || "Không tải được thông tin công dân");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // SĐT: xin tự động một lần sau khi đăng ký; người dùng từ chối thì không hỏi lại
  // cho tới khi bấm "Liên kết lại".
  const askPhone = useCallback(async (force = false) => {
    if (!force && wasPhoneAsked()) return;
    markPhoneAsked();
    try {
      const { token } = await getPhoneNumber();
      if (!token) return;
      const data = await sendPhoneToken(token);
      setCitizen(data.citizen);
    } catch {
      /* từ chối hoặc chưa được cấp quyền — bỏ qua, không chặn dùng app */
    }
  }, []);

  useEffect(() => {
    (async () => {
      fetchProgram()
        .then((d) => {
          setProgram(d.program);
          setOaId(d.oaId || "");
        })
        .catch(() => {});
      const c = await load();
      if (c && !c.phone) askPhone(false);
    })();
  }, [load, askPhone]);

  const relink = async () => {
    setBusy(true);
    resetPhoneAsked();
    const c = await load();
    if (c) await askPhone(true);
    setBusy(false);
    if (c) notify("Đã liên kết lại thông tin Zalo");
  };

  const openVillages = async () => {
    setVillageSheet(true);
    if (villages === null) {
      try {
        setVillages(await fetchVillages());
      } catch {
        setVillages([]);
      }
    }
  };

  const chooseVillage = async (v) => {
    setBusy(true);
    try {
      const data = await updateProfile({ villageId: v._id });
      setCitizen(data.citizen);
      setVillageSheet(false);
      notify(`Đã chọn ${v.ten}`);
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFollow = async () => {
    if (!oaId) return;
    try {
      if (citizen.followedOA) {
        await unfollowOA({ id: oaId });
        const data = await updateProfile({ followedOA: false });
        setCitizen(data.citizen);
      } else {
        await followOA({ id: oaId });
        const data = await updateProfile({ followedOA: true });
        setCitizen(data.citizen);
        notify("Đã quan tâm Zalo OA");
      }
    } catch {
      /* người dùng huỷ trong hộp thoại của Zalo */
    }
  };

  const share = async () => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: "Thăng Phú Số",
          description: `Ứng dụng của UBND xã Thăng Phú. Nhập mã giới thiệu ${citizen.referralCode} để nhận điểm thưởng.`,
          thumbnail: `${API_BASE_URL}/brand/logo-thangphu.png`,
          path: `/?ref=${citizen.referralCode}`,
        },
      });
    } catch {
      /* đóng cửa sổ chia sẻ */
    }
  };

  const pin = async () => {
    try {
      await createShortcut();
    } catch {
      notify("Thiết bị chưa hỗ trợ ghim ứng dụng");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(citizen.referralCode);
      notify("Đã sao chép mã giới thiệu");
    } catch {
      notify("Giữ vào mã để sao chép");
    }
  };

  const redeem = async () => {
    setReferralError("");
    setBusy(true);
    try {
      const data = await submitReferral(referralInput);
      setCitizen(data.citizen);
      setReferralSheet(false);
      setReferralInput("");
      notify(data.points ? `Nhập mã thành công, +${data.points} điểm` : "Nhập mã thành công");
    } catch (err) {
      setReferralError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const referrerPoints = program?.rules?.referrer?.points ?? 2;

  if (loading) {
    return (
      <Page className="page-citizen">
        <Header title="Cá nhân" />
        <div className="citizen-state">Đang tải thông tin…</div>
      </Page>
    );
  }

  if (!citizen) {
    return (
      <Page className="page-citizen">
        <Header title="Cá nhân" />
        <div className="citizen-state">
          <img className="citizen-state__logo" src={logo} alt="Thăng Phú Số" />
          <p>{error || "Cần liên kết tài khoản Zalo để dùng tab Công dân."}</p>
          <button type="button" className="citizen-btn" onClick={relink} disabled={busy}>
            Liên kết tài khoản Zalo
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page className="page-citizen">
      <Header title="Cá nhân" subTitle="Quản lý thông tin và điểm thưởng" />

      <div className="citizen-card">
        <div className="citizen-card__avatar">
          {citizen.avatar ? <img src={citizen.avatar} alt="" /> : <img src={logo} alt="" />}
        </div>
        <div className="citizen-card__name">{citizen.displayName || "Công dân"}</div>
        <div className="citizen-card__meta">ID: {citizen.zaloUserId}</div>
        {citizen.phone && <div className="citizen-card__meta">SĐT: {citizen.phone}</div>}
        <button type="button" className="citizen-card__village" onClick={openVillages}>
          Địa phương: {citizen.village ? citizen.village.name : "Chưa chọn thôn/tổ"} <span aria-hidden>✏️</span>
        </button>
        <button type="button" className="citizen-chip" onClick={() => navigate("/tich-diem")}>
          {citizen.tier ? citizen.tier.name : "Chưa xếp hạng"} · {citizen.points} điểm
        </button>
      </div>

      {oaId && (
        <div className={`citizen-oa ${citizen.followedOA ? "is-followed" : ""}`}>
          <div className="citizen-oa__body">
            <div className="citizen-oa__title">
              {citizen.followedOA ? "Đã quan tâm Zalo OA" : "Chưa quan tâm Zalo OA"}
            </div>
            <div className="citizen-oa__desc">
              {citizen.followedOA
                ? "Bạn đang theo dõi Zalo OA UBND xã Thăng Phú để nhận tin chỉ đạo & TTHC."
                : "Quan tâm Zalo OA để nhận tin chỉ đạo, thông báo và kết quả xử lý phản ánh."}
            </div>
          </div>
          <button type="button" className="citizen-oa__btn" onClick={toggleFollow}>
            {citizen.followedOA ? "Bỏ quan tâm" : "Quan tâm"}
          </button>
        </div>
      )}

      <div className="citizen-code" onClick={copyCode} role="button" tabIndex={0}>
        <div className="citizen-code__label">Mã giới thiệu của tôi</div>
        <div className="citizen-code__value">{citizen.referralCode}</div>
      </div>

      <div className="citizen-menu">
        <button type="button" className="citizen-menu__item" onClick={() => navigate("/tich-diem")}>
          <span className="citizen-menu__icon">🏅</span>
          <span className="citizen-menu__text">
            <b>Tích điểm công dân</b>
            <small>
              {citizen.points} điểm
              {citizen.nextTier ? ` · cần ${citizen.pointsNeeded} điểm để lên ${citizen.nextTier.name}` : ""}
            </small>
          </span>
          <span className="citizen-menu__arrow">›</span>
        </button>
        <button type="button" className="citizen-menu__item" onClick={share}>
          <span className="citizen-menu__icon">📤</span>
          <span className="citizen-menu__text">
            <b>Chia sẻ Mini App</b>
            <small>Mời bạn bè và nhận thêm +{referrerPoints} điểm</small>
          </span>
          <span className="citizen-menu__arrow">›</span>
        </button>
        <button
          type="button"
          className="citizen-menu__item"
          onClick={() => {
            setReferralError("");
            setReferralSheet(true);
          }}
        >
          <span className="citizen-menu__icon">🎁</span>
          <span className="citizen-menu__text">
            <b>Nhập mã giới thiệu ứng dụng</b>
            <small>{citizen.referredBy ? "Bạn đã nhập mã giới thiệu" : "Nhận điểm thưởng từ bạn bè"}</small>
          </span>
          <span className="citizen-menu__arrow">›</span>
        </button>
        <button type="button" className="citizen-menu__item" onClick={() => navigate("/phan-anh-cua-toi")}>
          <span className="citizen-menu__icon">📣</span>
          <span className="citizen-menu__text">
            <b>Phản ánh của bạn</b>
            <small>Theo dõi kết quả xử lý</small>
          </span>
          <span className="citizen-menu__arrow">›</span>
        </button>
        <button type="button" className="citizen-menu__item" onClick={pin}>
          <span className="citizen-menu__icon">📌</span>
          <span className="citizen-menu__text">
            <b>Ghim ứng dụng ra màn hình</b>
            <small>Mở nhanh Thăng Phú Số từ màn hình chính</small>
          </span>
          <span className="citizen-menu__arrow">›</span>
        </button>
        <button
          type="button"
          className="citizen-menu__item"
          onClick={() => navigate("/tich-diem", { state: { tab: "the-le" } })}
        >
          <span className="citizen-menu__icon">ℹ️</span>
          <span className="citizen-menu__text">
            <b>Giới thiệu chung</b>
            <small>Thể lệ tích điểm và quyền lợi</small>
          </span>
          <span className="citizen-menu__arrow">›</span>
        </button>
      </div>

      <button type="button" className="citizen-btn citizen-btn--block" onClick={relink} disabled={busy}>
        ↻ Liên kết lại
      </button>

      {toast && <div className="citizen-toast">{toast}</div>}

      <Sheet visible={villageSheet} onClose={() => setVillageSheet(false)} autoHeight swipeToClose>
        <div className="citizen-sheet">
          <div className="citizen-sheet__title">Chọn Thôn/Tổ</div>
          <p className="citizen-sheet__desc">Vui lòng chọn Thôn/Tổ bạn đang sinh sống tại UBND xã Thăng Phú.</p>
          {villages === null && <div className="citizen-sheet__empty">Đang tải…</div>}
          {villages && villages.length === 0 && (
            <div className="citizen-sheet__empty">Danh sách thôn đang được cập nhật.</div>
          )}
          <div className="citizen-sheet__list">
            {(villages || []).map((v) => (
              <button
                key={v._id}
                type="button"
                className={`citizen-sheet__option ${citizen.village?.id === v._id ? "is-active" : ""}`}
                onClick={() => chooseVillage(v)}
                disabled={busy}
              >
                {v.ten}
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet visible={referralSheet} onClose={() => setReferralSheet(false)} autoHeight swipeToClose>
        <div className="citizen-sheet">
          <div className="citizen-sheet__title">Nhập mã giới thiệu</div>
          <p className="citizen-sheet__desc">Nhập mã giới thiệu của bạn bè để nhận điểm thưởng.</p>
          {citizen.referredBy ? (
            <div className="citizen-sheet__empty">Bạn đã nhập mã giới thiệu trước đó.</div>
          ) : (
            <>
              <input
                className="citizen-input"
                value={referralInput}
                maxLength={6}
                placeholder="Ví dụ: ABC123"
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              />
              {referralError && <div className="citizen-sheet__error">{referralError}</div>}
              <div className="citizen-sheet__actions">
                <button type="button" className="citizen-btn citizen-btn--ghost" onClick={() => setReferralSheet(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="citizen-btn"
                  onClick={redeem}
                  disabled={busy || referralInput.trim().length !== 6}
                >
                  Xác nhận
                </button>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </Page>
  );
};

export default CitizenPage;
