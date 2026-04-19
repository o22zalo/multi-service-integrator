# CHANGE_LOGS_USER.md

## [2026-04-19] — Tải trang nhanh hơn đáng kể

### Cải thiện hiệu năng

**Service list load nhanh hơn khi navigate qua lại**
Trước đây mỗi lần vào trang GitHub / Cloudflare / Supabase đều phải chờ kết nối Firebase. Giờ dữ liệu được cache lại — navigate trở lại trang đã xem trong vòng 60 giây sẽ thấy ngay lập tức, không còn màn chờ nữa.

**Hiển thị data ngay khi có dữ liệu cũ**
Khi bạn đã từng xem danh sách account, lần mở lại sẽ thấy danh sách cũ hiện ra ngay. Trong lúc đó hệ thống tự động làm mới dữ liệu phía sau và cập nhật lên nếu có thay đổi — bạn thấy indicator nhỏ "syncing" trong lúc refresh, không bị gián đoạn.

**Tự động tải trước khi bạn click**
Sau khi dashboard load xong, hệ thống tự động tải trước danh sách của tất cả service phía nền. Khi bạn hover chuột vào sidebar cũng kích hoạt tải trước cho service đó. Kết quả là khi bạn thực sự click vào, data thường đã sẵn sàng.

**Không còn màn skeleton không cần thiết**
Trước đây dù đã có dữ liệu cũ từ lần duyệt trước, trang vẫn hiện loading skeleton. Giờ chỉ hiện skeleton khi thực sự chưa có data nào — còn nếu đã có data rồi thì hiện ngay với badge "syncing" nhỏ.
