# Đánh giá chức năng MINIAPP_THANGPHU

Ngày đánh giá: **02/10/2026**. Căn cứ: 5 nhóm yêu cầu trong ảnh người dùng cung cấp và mã nguồn hiện có.

## Kết luận

**Chưa đáp ứng đầy đủ để nghiệm thu hoặc vận hành chính thức.** Đã có mã nguồn cho cả 5 nhóm nhưng còn thiếu chức năng, có lỗi trong luồng phản ánh và thiếu cấu hình/dữ liệu Thăng Phú. Build thành công không chứng minh tích hợp đã hoạt động.

Phạm vi: đọc mã nguồn, build hai frontend, kiểm tra cú pháp Backend, HTTP local không dùng DB, mô phỏng luồng kết quả 1022. Chưa kết nối MongoDB, chưa thử Zalo/1022/AI/nguồn điện thật hoặc giao diện trên thiết bị Zalo. Bình luận về lần thử ở địa phương khác không được coi là bằng chứng nghiệm thu Thăng Phú.

## 1. Đối chiếu yêu cầu

| Yêu cầu trong ảnh | Hiện có | Phần thiếu/chưa xác nhận |
|---|---|---|
| **1. Tự đăng, gửi tin tức, chủ trương, chính sách, cảnh báo thiên tai tới người quan tâm OA** | Cào tin, tạo bài OA, broadcast; AdminWeb gửi tin thủ công. | **Một phần.** Tự động chỉ đọc `News`; tạo `Notice` hoặc cập nhật văn bản chưa tự vào luồng OA. Chưa có nguồn/quy trình riêng cho cảnh báo thiên tai. Nguồn tin và OA để trống, hai cờ tự đăng/tự gửi đang tắt. Cần xác nhận các loại tin có cùng nguồn hay phải tích hợp thêm. |
| **2a. Gửi phản ánh trong MiniApp** | Form nội dung, điện thoại, ảnh, vị trí; lưu và quản trị phản ánh. | **Có mã nguồn, chưa thử thực tế.** POST tin `userId` do client gửi, chưa xác thực token Zalo và chưa giới hạn tần suất tạo phản ánh. |
| **2b. Đồng bộ phản ánh lên Cổng góp ý thành phố** | Gửi 1022, lưu mã `gopyId`, thử lại mỗi 10 phút tối đa 10 lần. | **Chờ tích hợp.** Thiếu tài khoản, nguồn góp ý, ánh xạ lĩnh vực và mẫu phản hồi thật; cần thử cấp mã, lỗi mạng và chống gửi trùng. |
| **2c. Báo phản ánh tới nhóm tiếp nhận qua Zalo** | Gắn nhóm theo lĩnh vực, gửi nội dung và mã; cờ chống gửi lặp. | **Chờ tích hợp.** Thiếu nhóm/cán bộ/quyền OA; chưa xác nhận API phù hợp loại nhóm. Khi chưa gắn nhóm, code vẫn chốt cờ đã thông báo, cần xử lý lại sau khi cấu hình. |
| **2d. Theo dõi tình trạng theo mã** | “Phản ánh của tôi”, tra cứu mã 1022, timeline và kết quả. | **Một phần.** Job chỉ cập nhật khi 1022 đã xử lý xong và có nội dung; bỏ qua trạng thái trung gian. “Đang xử lý” suy ra từ luồng nội bộ. Chỉ quét 20 bản cũ nhất nên có thể bỏ đói các bản phía sau. |
| **2e. Báo kết quả từ Cổng góp ý cho người dân và nhóm cán bộ** | Đọc kết quả 1022, lưu `finalResponse`, gửi người dân. | **Chưa đủ.** Chưa gửi kết quả cho nhóm. Gửi Zalo lỗi không có cơ chế gửi lại riêng; không kiểm tra `error != 0` trong body tại luồng này. Đã hoàn tất nội bộ thì bị loại khỏi quét, có thể bỏ kết quả 1022 về sau. |
| **3. Link DVC, đăng ký hộ kinh doanh, bình dân học vụ số, bản đồ, cổng dữ liệu, khảo sát, QR quản lý tài liệu** | AppLink quản lý qua AdminWeb; seed có DVCQG, bản đồ, bình dân học vụ số, cổng dữ liệu, khảo sát, tạo QR bài viết. | **Một phần.** Chưa có mục đăng ký hộ kinh doanh trong seed. “Tạo QR bài viết” chưa đủ căn cứ tương đương QR quản lý tài liệu. Link khảo sát dạng chia sẻ và các link địa phương cần xác nhận. Chưa kiểm chứng URL ngoài trong đợt này. |
| **4. Chatbot hướng dẫn TTHC và FAQ** | Giao diện, API Anthropic, ngữ cảnh một số lịch/thông báo. | **Một phần.** Key/model trống; `assistantService` không đọc `ThuTucHanhChinh`, chưa có kho FAQ được duyệt. Câu hỏi thủ tục thường dùng kiến thức chung; cần dữ liệu chính thức và bộ câu hỏi nghiệm thu. |
| **5. Hai tiện ích an sinh như lịch cúp điện, lịch y tế** | Lịch điện có đồng bộ/tra cứu; lịch y tế CRUD AdminWeb, lọc tháng/năm; có thêm trợ cấp. | **Đủ hai module về cấu trúc, chưa nghiệm thu dữ liệu.** Thiếu nguồn điện đúng xã và lịch y tế thật. Cron Backend cào `XENVN_URL`; EVN qua Actions chỉ chạy thủ công. Lịch y tế do cán bộ nhập, chưa đồng bộ hệ thống ngoài. |

### Mã nguồn làm căn cứ

- Nhóm 1: [zaloNewsService.js](../Backend/src/services/zaloNewsService.js), [broadcastService.js](../Backend/src/services/broadcastService.js), [notices.js](../Backend/src/routes/notices.js).
- Nhóm 2: [publicFeedback.js](../Backend/src/routes/publicFeedback.js), [cgy1022RetryService.js](../Backend/src/services/cgy1022RetryService.js), [feedbackNotifyService.js](../Backend/src/services/feedbackNotifyService.js), [cgy1022StatusService.js](../Backend/src/services/cgy1022StatusService.js), [feedbackPublicView.js](../Backend/src/services/feedbackPublicView.js).
- Nhóm 3: [seed-app-links.js](../Backend/scripts/seed-app-links.js), [services.jsx](../MiniApp/src/pages/services.jsx).
- Nhóm 4: [assistantService.js](../Backend/src/services/assistantService.js), [assistant.js](../Backend/src/routes/assistant.js).
- Nhóm 5: [catDienService.js](../Backend/src/services/catDienService.js), [lichYTe.js](../Backend/src/routes/lichYTe.js), [publicLookup.js](../Backend/src/routes/publicLookup.js).

## 2. Việc cần sửa trong mã nguồn

Đợt này ghi nhận vấn đề, chưa sửa logic nghiệp vụ.

### Ưu tiên trước khi sử dụng

1. **Thông báo kết quả 1022:** gửi cả công dân và nhóm; lưu trạng thái gửi riêng từng nơi; kiểm tra lỗi HTTP/body Zalo và thử lại. Hiện ghi `resolved` trước khi gửi nên lượt sau bỏ qua. Mô phỏng đã tái hiện lỗi.
2. **Đồng bộ tiến trình:** ánh xạ trạng thái trung gian; phân trang/luân phiên theo thời điểm kiểm tra. Hơn 20 bản đang chờ có thể khiến chỉ 20 bản cũ được quét mãi. Tách kết quả nội bộ với 1022 để không bỏ cập nhật về sau.
3. **Xác thực tạo phản ánh:** lấy danh tính từ access token ở Backend, giới hạn tần suất, kiểm tra upload. `/mine` đã xác thực nhưng POST tạo mới chưa có.
4. **Phân quyền theo bản ghi:** danh sách lọc cán bộ/lĩnh vực, nhưng GET/PUT `/:id` và thao tác chi tiết trong [feedbacks.js](../Backend/src/routes/feedbacks.js) chưa kiểm tra quyền trên phản ánh. Cán bộ biết ID có thể truy cập ngoài phạm vi danh sách; cần kiểm tra người được giao/lĩnh vực ở mọi thao tác.
5. **Hạn mức chatbot:** rate-limit dùng `userId` tự khai; đổi ID có thể tránh giới hạn. Cần định danh được xác thực hoặc giới hạn thêm theo IP, độ dài câu hỏi, ngân sách.

### Hoàn thiện nội dung

6. Bổ sung link hộ kinh doanh, QR quản lý tài liệu, khảo sát. `section=service` chỉ xử lý `path`, chưa mở `href`; cần sửa nếu thêm dịch vụ ngoài tại đây. `quick_link` và `portal` đã hỗ trợ link ngoài.
7. Chatbot tra TTHC/FAQ đã duyệt, có nguồn và đầu mối khi thiếu dữ liệu. Rà soát nhãn “100% Mức độ 4” ghi cố định trên trang dịch vụ vì chưa có dữ liệu chứng minh.
8. Chốt nguồn/quy trình gửi chính sách, cảnh báo. Nếu chung nguồn `News`, chứng minh bằng dữ liệu thử; nếu khác nguồn, bổ sung tích hợp và duyệt nội dung.
9. Chốt phạm vi công khai phản ánh: tra cứu mã trả nội dung, ảnh, địa chỉ không cần đăng nhập; bản đồ trả nội dung/tọa độ. Xác định trường công khai và trường chỉ chủ phản ánh/cán bộ được xem.

## 3. Thông tin cần bạn cung cấp

Điền bí mật vào `.env` trên máy hoặc GitHub Secrets khi triển khai, không cần gửi mật khẩu/token trong hội thoại. Biến `VITE_*` sẽ công khai trong bundle frontend.

| Nhóm | Thông tin cần cung cấp |
|---|---|
| **Hạ tầng** | MongoDB riêng; tên admin đầu tiên; domain HTTPS Backend/AdminWeb; VPS/hosting. JWT và mật khẩu có thể tự sinh riêng khi cấu hình. |
| **Zalo** | Mini App ID; OA ID/link; App ID ứng dụng liên kết; quyền được cấp và môi trường thử. App secret, OA token/refresh token, webhook secret điền tại máy. |
| **1022** | Endpoint/tài liệu hiện hành; tài khoản riêng; user ID, nguồn góp ý, mã lĩnh vực; JSON mẫu các trạng thái và kết quả; mã thử được phép kiểm tra. |
| **Cán bộ/nhóm** | Lĩnh vực → cán bộ → Zalo user ID/group ID; loại nhóm; quyền; thời hạn và quy tắc chuyển/đóng/mở lại phản ánh. Deadline hiện cố định 5 ngày, cần xác nhận. |
| **Tin/cảnh báo** | URL tin/văn bản chính thức; nguồn cảnh báo thiên tai; loại tin tự gửi; người duyệt, lịch gửi, nội dung mẫu, ảnh cover. |
| **Link tiện ích** | URL chính thức DVC, hộ kinh doanh, bình dân học vụ số, bản đồ xã, cổng dữ liệu, khảo sát, QR quản lý tài liệu. QR: mẫu tài liệu/mã và phạm vi mở link hay lưu trữ, phân quyền, tìm kiếm. |
| **TTHC/FAQ** | Thủ tục được duyệt: hồ sơ, trình tự, phí, thời hạn, nơi nhận, nguồn; FAQ/câu trả lời chuẩn; người cập nhật; API key/model AI tại máy. |
| **Hai tiện ích an sinh** | Xác nhận chọn lịch điện + lịch y tế; nguồn điện được chấp thuận, mã đơn vị/trạm/phạm vi xã; lịch khám/tiêm chủng mẫu, người cập nhật, tần suất. |
| **Nội dung xã** | Tên đơn vị hành chính, logo/banner, địa chỉ/tọa độ, liên hệ, thôn, dữ liệu địa phương, phạm vi công khai phản ánh. |

IOCTC cần nếu nghiệm thu thêm tra cứu hồ sơ hành chính. Cloudinary/Upstash tùy phương án vận hành. Chi tiết biến môi trường: [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md).

## 4. Các ca nghiệm thu cần chạy

1. Tin thường/chính sách/cảnh báo → bài OA → người quan tâm nhận; kiểm tra gửi lặp và lỗi quyền.
2. Phản ánh kèm ảnh/vị trí → mã thật 1022 → nhóm nhận → tra cứu → trạng thái → kết quả tới cả công dân và nhóm.
3. Zalo/1022 lỗi hoặc timeout: không mất phản ánh, không cấp mã giả, gửi lại được; thử hơn 20 phản ánh.
4. Mọi link mở đúng trên thiết bị Zalo, nhất là hộ kinh doanh, khảo sát đúng xã và QR đúng tài liệu.
5. Câu hỏi TTHC/FAQ đối chiếu đáp án được duyệt, nguồn và hướng dẫn khi thiếu dữ liệu.
6. Lịch điện đúng nguồn/địa bàn; nhập/sửa/xóa lịch y tế rồi kiểm tra MiniApp; thử bộ lọc, dữ liệu trống/lỗi.
7. Cán bộ khác lĩnh vực không đọc/sửa ngoài quyền; không giả mạo người gửi hoặc lộ trường nội bộ.

## 5. Kỹ thuật và GitHub

- Hai frontend build thành công trên Node.js 20.19.5. Còn cảnh báo Vite/Sass cũ và bundle AdminWeb lớn.
- 72 file JavaScript Backend qua kiểm tra cú pháp; 71 file manifest media có trên máy.
- Chi tiết HTTP/mô phỏng: [VERIFICATION.md](VERIFICATION.md).
- Git bỏ qua `.env`, dependency, build, ảnh upload và `Backend/media`; triển khai từ GitHub cần cấu hình môi trường/chuyển media riêng.
- Tài liệu API `.docx` gốc có chuỗi JWT: giữ trên máy, bỏ qua khỏi Git. Chưa xác định token còn hiệu lực hay chỉ là ví dụ; chỉ công bố tài liệu đã loại bỏ thông tin truy cập.
- Push GitHub chưa đồng nghĩa deploy Backend/phát hành Zalo. Workflow deploy/sync chỉ chạy thủ công sau khi cấu hình và bật biến tương ứng.
