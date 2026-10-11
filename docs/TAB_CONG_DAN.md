# Tab Công dân & Tích điểm

Tham chiếu: `docs/Giao diện khi chọn liên kết xong ở tab Công dân.pdf` (Đại Lộc).

## Chức năng (giai đoạn 1)

| Chức năng | Cách hoạt động |
|---|---|
| Hồ sơ | Mở tab Công dân: lấy tên/ảnh Zalo, tự đăng ký lần đầu (+5 điểm), sinh mã giới thiệu 6 ký tự |
| Số điện thoại | `getPhoneNumber()` → Backend đổi token qua `graph.zalo.me/v2.0/me/info`; hỏi một lần, "Liên kết lại" để hỏi lại. Cần quyền ID 100 trong Mini App Console |
| Chọn thôn/tổ | Danh sách lấy từ `/api/public/thon-xom` (cán bộ nhập ở AdminWeb) |
| Quan tâm OA | `followOA` / `unfollowOA` với `ZALO_OA_ID`; trống thì ẩn nút |
| Chia sẻ | `openShareSheet` kiểu `zmp_deep_link`, đường dẫn `/?ref=MÃ`; người mở link được áp mã khi đăng ký lần đầu |
| Nhập mã giới thiệu | Mỗi người một lần, không tự nhập mã mình; người mời +2, người nhập +2 |
| Ghim ứng dụng | `createShortcut()` (iOS hiện hướng dẫn, Android tạo shortcut) |
| Tích điểm | Sổ cái `PointTransaction`; điểm = tổng sổ cái; hạng tính theo ngưỡng |

## Điểm và hạng (mặc định theo Đại Lộc, sửa được ở AdminWeb → Công dân & Tích điểm)

Đăng ký +5 · Giới thiệu +2 · Khảo sát +5 · Phản ánh +2 (khi được phản hồi) · Check-in sự kiện +5 · Thi trực tuyến +5.
Hạng: Công dân từ 5 · Hội viên từ 20 · Công dân số từ 50. Không giới hạn số phản ánh được cộng điểm.

Phản ánh được cộng điểm một lần khi lãnh đạo duyệt trả lời hoặc 1022 trả kết quả (`awardFeedbackResolved`).

## API

Công khai: `GET /api/public/citizen/program`.
Cần access token Zalo (`x-zalo-access-token`): `POST /me`, `PUT /me/profile`, `POST /me/phone`, `POST /me/referral`, `GET /me/transactions`.
AdminWeb (JWT): `GET /api/citizens`, `/stats`, `/program`, `/:zaloUserId`; `PUT /program` và `POST /:id/adjust` chỉ superadmin.

## Giai đoạn 2 (chưa làm)

Khảo sát, check-in sự kiện, thi trực tuyến: mỗi cái cần module riêng; điểm đã có sẵn kiểu giao dịch `survey`, `event`, `exam`.
