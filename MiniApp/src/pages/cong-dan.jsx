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
import Icon3D from "../components/icon3d.jsx";
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
      <Page className="page-citizen tp-page">
        <Header title="Công dân số" />
        <div className="citizen-state">Đang tải thông tin…</div>
      </Page>
    );
  }

  if (!citizen) {
    return (
      <Page className="page-citizen tp-page">
        <Header title="Công dân số" />
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
    <Page className="page-citizen tp-page">
      <Header title="Công dân số" />

      <section className="tp-profile tp-rise">
        <div className="tp-profile__top">
          <div className="tp-avatar">
            <img src={citizen.avatar || logo} alt="" />
          </div>
          <div className="tp-profile__id">
            <h1 className="tp-profile__name">{citizen.displayName || "Công dân"}</h1>
            <button type="button" className="tp-profile__village" onClick={openVillages}>
              Địa phương: {citizen.village ? citizen.village.name : "Chưa chọn thôn/tổ"}
              <span aria-hidden="true"> ✎</span>
            </button>
            {citizen.phone && <span className="tp-profile__phone">SĐT: {citizen.phone}</span>}
          </div>
        </div>

        <button type="button" className="tp-rank" onClick={() => navigate("/tich-diem")}>
          <Icon3D name="tich-diem" size={54} />
          <span className="tp-rank__body">
            <span className="tp-rank__row">
              <b>Hạng {citizen.tier ? citizen.tier.name : "chưa xếp"}</b>
              <span>
                <strong>{citizen.points}</strong> điểm
              </span>
            </span>
            <span className="tp-rank__bar">
              <i style={{ width: `${citizen.progress}%` }} />
            </span>
            <span className="tp-rank__hint">
              {citizen.nextTier
                ? `Cần ${citizen.pointsNeeded} điểm nữa để lên ${citizen.nextTier.name}`
                : "Bạn đã đạt hạng cao nhất"}
            </span>
          </span>
        </button>
      </section>

      {oaId && (
        <section className={`tp-oastate tp-rise ${citizen.followedOA ? "is-on" : ""}`}>
          <Icon3D name="thong-bao" size={44} className="tp-float" />
          <div className="tp-oastate__body">
            <strong>{citizen.followedOA ? "Đã quan tâm Zalo OA" : "Chưa quan tâm Zalo OA"}</strong>
            <span>
              {citizen.followedOA
                ? "Nhận tin chỉ đạo & TTHC từ UBND xã"
                : "Quan tâm để nhận tin chỉ đạo, thông báo và kết quả phản ánh"}
            </span>
          </div>
          <button type="button" className="tp-oastate__btn tp-press" onClick={toggleFollow}>
            {citizen.followedOA ? "Bỏ quan tâm" : "Quan tâm"}
          </button>
        </section>
      )}

      <section className="tp-code tp-rise">
        <div className="tp-code__body">
          <span className="tp-code__label">Mã giới thiệu của tôi</span>
          <strong className="tp-code__value">{citizen.referralCode}</strong>
        </div>
        <button type="button" className="tp-code__btn tp-press" onClick={copyCode}>
          Sao chép
        </button>
      </section>

      <section className="tp-menu tp-rise">
        <button type="button" className="tp-menu__item tp-press" onClick={() => navigate("/tich-diem")}>
          <Icon3D name="tich-diem" size={44} />
          <span className="tp-menu__text">
            <b>Tích điểm công dân</b>
            <small>
              {citizen.points} điểm
              {citizen.nextTier ? ` · cần ${citizen.pointsNeeded} điểm để lên ${citizen.nextTier.name}` : ""}
            </small>
          </span>
          <span className="tp-menu__arrow" aria-hidden="true">›</span>
        </button>
        <button type="button" className="tp-menu__item tp-press" onClick={share}>
          <Icon3D name="chia-se" size={44} />
          <span className="tp-menu__text">
            <b>Chia sẻ Mini App</b>
            <small>Mời bạn bè và nhận thêm +{referrerPoints} điểm</small>
          </span>
          <span className="tp-menu__arrow" aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          className="tp-menu__item tp-press"
          onClick={() => {
            setReferralError("");
            setReferralSheet(true);
          }}
        >
          <Icon3D name="tao-qr" size={44} />
          <span className="tp-menu__text">
            <b>Nhập mã giới thiệu</b>
            <small>{citizen.referredBy ? "Bạn đã nhập mã giới thiệu" : "Nhận điểm thưởng từ bạn bè"}</small>
          </span>
          <span className="tp-menu__arrow" aria-hidden="true">›</span>
        </button>
        <button type="button" className="tp-menu__item tp-press" onClick={() => navigate("/phan-anh-cua-toi")}>
          <Icon3D name="phan-anh" size={44} />
          <span className="tp-menu__text">
            <b>Phản ánh của bạn</b>
            <small>Theo dõi kết quả xử lý</small>
          </span>
          <span className="tp-menu__arrow" aria-hidden="true">›</span>
        </button>
        <button type="button" className="tp-menu__item tp-press" onClick={pin}>
          <Icon3D name="ban-do" size={44} />
          <span className="tp-menu__text">
            <b>Ghim ứng dụng ra màn hình</b>
            <small>Mở nhanh Thăng Phú Số từ màn hình chính</small>
          </span>
          <span className="tp-menu__arrow" aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          className="tp-menu__item tp-press"
          onClick={() => navigate("/tich-diem", { state: { tab: "the-le" } })}
        >
          <Icon3D name="van-ban" size={44} />
          <span className="tp-menu__text">
            <b>Giới thiệu chung</b>
            <small>Thể lệ tích điểm và quyền lợi</small>
          </span>
          <span className="tp-menu__arrow" aria-hidden="true">›</span>
        </button>
      </section>

      <button type="button" className="tp-relink tp-press" onClick={relink} disabled={busy}>
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
