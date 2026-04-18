# GitHub Service Deploy Notes

Tài liệu này mô tả các lưu ý deploy riêng cho GitHub service.

## 1. Kết nối outbound

Server chạy app cần gọi được tới GitHub API:

- `https://api.github.com`

Nếu máy chủ bị giới hạn outbound, cần mở whitelist cho endpoint này.

## 2. Dependency cần có

GitHub service hiện dùng thêm:

- `libsodium-wrappers` để mã hoá Actions secrets theo public key do GitHub cấp
- `jszip` để giải nén log workflow run khi tải về

Sau khi kéo code mới, cần chạy lại:

```bash
npm install
```

hoặc khi dùng Docker thì cần build lại image.

## 3. Reverse proxy và timeout

Workflow logs có thể nặng hơn các API call thông thường. Khuyến nghị:

- tăng timeout ở reverse proxy
- tăng body / response buffer nếu proxy của bạn mặc định quá thấp
- tránh chặn response download từ route xem log

## 4. Cấu hình production cần kiểm tra

Checklist trước khi dùng GitHub service thật:

- `.env` đã có `ENCRYPTION_KEY`
- `.env` đã có `NEXTAUTH_SECRET`
- Firebase shard kết nối thành công
- outbound tới GitHub API thông suốt
- token GitHub test được với một account thật
- thao tác tạo account sinh audit log thành công
- panel repos / workflows / workflow-runs / workflow-logs / secrets hoạt động đúng

## 5. Smoke test khuyến nghị sau deploy

### 5.1 Tạo account GitHub

- tạo một account mẫu bằng email + token
- xác nhận UI hiển thị owner, profile URL và account email

### 5.2 Repo & workflow

- nhập `repo_name`
- kiểm tra panel workflows có dữ liệu
- trigger một workflow run thử
- kiểm tra panel workflow-runs có run mới
- thử stop một run đang chạy

### 5.3 Logs

- nhập `run_id`
- xác nhận route workflow-logs trả về preview text

### 5.4 Secrets

- tạo secret mới
- cập nhật lại cùng secret name với value mới
- xoá secret

## 6. Docker deploy lại khi nâng cấp GitHub service

```bash
docker compose build --no-cache
docker compose up -d
```

Nếu dùng production compose:

```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## 7. Rollback

Nếu phần GitHub service gây lỗi sau deploy:

1. rollback image hoặc commit trước đó
2. restart app
3. kiểm tra `GET /api/health`
4. test lại một account GitHub mẫu

GitHub service không làm thay đổi schema RTDB theo cách phá vỡ ngược, nên rollback ở lớp app tương đối an toàn.
