# Deploy Guide

Tài liệu này hướng dẫn triển khai `multi-service-integrator` từ local đến production. Nội dung được viết theo hướng thực chiến để bạn có thể dùng cho máy dev, VPS đơn lẻ, hoặc nhiều instance phía sau reverse proxy.

## 1. Mô hình triển khai khuyến nghị

### Mức 1: single instance
Phù hợp để dev hoặc pilot nội bộ.

```text
Browser
  ↓
Reverse Proxy (tuỳ chọn)
  ↓
Next.js App
  ↓
Firebase RTDB
```

### Mức 2: multi-instance
Phù hợp khi scale ngang.

```text
Browser
  ↓
Load Balancer / Reverse Proxy
  ↓
App Instance A
App Instance B
App Instance C
  ↓
Firebase RTDB multi-shard
```

Vì dữ liệu nguồn nằm ở RTDB, các instance không phụ thuộc state RAM của nhau. Tuy nhiên, mọi flow write vẫn cần kiểm soát idempotency, audit log và queue logic cẩn thận.

## 2. Yêu cầu trước khi deploy

Cần có sẵn:

- Node.js 20+
- npm
- Docker và Docker Compose nếu deploy bằng container
- 1 hoặc nhiều Firebase project / RTDB shard
- service account JSON cho từng shard
- encryption key
- domain hoặc reverse proxy nếu public ra internet
- credentials thật cho các provider bạn bật

## 3. Chuẩn bị `.env`

Trước khi điền biến môi trường, nên đọc thêm file `env.requirements.md` ở root project để biết cách lấy từng giá trị, link console và docs tham khảo.


### 3.1 Tạo file môi trường
```bash
cp .env.example .env
```

### 3.2 Sinh key mã hóa
```bash
bash scripts/generate-encryption-key.sh
```

Dán 2 giá trị sinh ra vào `.env`:

```bash
ENCRYPTION_KEY=<64-char-hex>
ENCRYPTION_IV_SALT=<32-char-hex>
```

### 3.3 Khai báo Firebase shard
Ví dụ 1 shard:

```bash
FIREBASE_SHARD_COUNT=1
FIREBASE_SHARD_1_PROJECT_ID=my-project-id
FIREBASE_SHARD_1_DATABASE_URL=https://my-project-id-default-rtdb.firebaseio.com
FIREBASE_SHARD_1_SERVICE_ACCOUNT=<base64-json>
```

### 3.4 Encode service account sang base64
Linux/macOS:

```bash
base64 -w 0 service-account.json
```

macOS nếu máy không hỗ trợ `-w 0`:

```bash
base64 service-account.json | tr -d '\n'
```

PowerShell:

```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("service-account.json"))
```

### 3.5 Auth providers
Bật provider nào thì điền biến tương ứng cho provider đó.

Ví dụ:

```bash
AUTH_PROVIDERS=google,supabase,custom
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 4. Chạy local không dùng Docker

### Cài dependency
```bash
npm install
```

### Kiểm tra chất lượng code
```bash
npm run typecheck
npm run test
npm run build
```

### Chạy app
```bash
npm run dev
```

### Kiểm tra nhanh
```bash
curl http://localhost:3000/api/health
```

Kỳ vọng:

```json
{ "ok": true, "timestamp": "..." }
```

## 5. Deploy bằng Docker

## 5.1 Local / staging
```bash
docker compose up --build
```

App chạy ở cổng `3000`.

## 5.2 Production compose
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Xem log:
```bash
docker compose -f docker-compose.prod.yml logs -f app
```

Dừng:
```bash
docker compose -f docker-compose.prod.yml down
```

## 5.3 Build image thủ công
```bash
docker build -t multi-service-integrator:latest .
```

Chạy container:
```bash
docker run -d \
  --name multi-service-integrator \
  --env-file .env \
  -p 3000:3000 \
  multi-service-integrator:latest
```

## 6. Reverse proxy

Bạn có thể đặt app sau Nginx, Caddy hoặc Cloudflare Tunnel. Điều quan trọng là:

- forward đúng host/proto header
- `NEXTAUTH_URL` phải là URL public thật
- bật HTTPS ở tầng ngoài
- giới hạn truy cập admin nếu cần

### Ví dụ lưu ý khi đặt sau reverse proxy
- public app qua `https://your-domain.com`
- đặt `NEXTAUTH_URL=https://your-domain.com`
- đặt `NEXT_PUBLIC_APP_URL=https://your-domain.com`

## 7. Health check và smoke test sau deploy

### 7.1 Health endpoint
```bash
curl https://your-domain.com/api/health
```

### 7.2 Checklist smoke test
- trang chủ redirect đúng
- dashboard mở được
- health endpoint 200
- thêm thử 1 service account mẫu
- xem audit log ghi nhận write operation
- test export JSON/CSV
- test 1 sub-resource call

## 8. Khuyến nghị production

## 8.1 Bảo mật
- không commit `.env`
- chỉ lưu `.env.example`
- rotate encryption key theo chính sách nội bộ nếu cần
- hạn chế người có quyền đọc host env
- tách secret theo môi trường dev/staging/prod
- dùng HTTPS bắt buộc
- giới hạn egress/IP nếu hệ thống nội bộ yêu cầu

## 8.2 Vận hành
- thêm log collector ở ngoài app
- thêm restart policy
- thêm backup chính sách cho RTDB
- thêm monitor cho health endpoint
- thêm alert khi provider API lỗi liên tiếp
- theo dõi request duration và error code distribution

## 8.3 Multi-instance
- mọi instance dùng cùng cấu hình env tương ứng
- không phụ thuộc local memory cho state nguồn
- local cache chỉ là lớp tăng tốc
- cần test kỹ optimistic sync khi có nhiều node ghi cùng lúc
- nên dùng reverse proxy hoặc load balancer phía trước

## 9. CI/CD tối thiểu

Repo đã có workflow CI cơ bản. Trước khi đưa production, nên bảo đảm pipeline chạy được các bước:

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --passWithNoTests
npm run build
```

Nên bổ sung thêm:
- build Docker image
- scan image
- deploy theo môi trường
- smoke test sau deploy

## 10. Quy trình deploy khuyến nghị

### Bản ngắn gọn
1. cập nhật code
2. cập nhật `.env`
3. chạy `npm run typecheck && npm test && npm run build`
4. build image hoặc chạy compose
5. kiểm tra `/api/health`
6. test login và 1 flow CRUD thật
7. theo dõi logs 15–30 phút đầu

## 11. Rollback

Nếu deploy lỗi:

### Với Docker Compose
```bash
docker compose -f docker-compose.prod.yml down
```

Khởi động lại image/tag ổn định trước đó.

### Với triển khai thủ công
- rollback sang commit hoặc image tag trước đó
- giữ nguyên `.env`
- kiểm tra lại schema / env / provider credentials

## 12. Known deployment caveats

Hiện trạng repo phù hợp để tiếp tục hoàn thiện và test thật, nhưng trước production bạn nên xác nhận lại toàn bộ các điểm sau trong môi trường build chuẩn:

- `npm install` chạy sạch
- `npm run typecheck` chạy sạch
- `npm run build` chạy sạch
- toàn bộ module tham chiếu trong code đều hiện diện
- auth flow hoạt động đúng với provider thật
- Firebase shard config đọc đúng từ env
- import/export và logging chạy đúng với dữ liệu thật

## 13. Mẫu lệnh triển khai nhanh trên VPS

```bash
git clone <repo>
cd multi-service-integrator
cp .env.example .env
bash scripts/generate-encryption-key.sh
# sửa .env
npm install
npm run build
npm run start
```

Hoặc bằng Docker:

```bash
git clone <repo>
cd multi-service-integrator
cp .env.example .env
# sửa .env
docker compose -f docker-compose.prod.yml up --build -d
```

## 14. Tài liệu nên đọc kèm

- `README.md`
- `STANDARDS.md`
- `PROJECT_MEMORY.md`



## 11. GitHub service deployment notes

Nếu bạn bật và sử dụng GitHub service ở production, cần lưu ý thêm:

- token GitHub phải có quyền đủ để đọc repo và thao tác với Actions / secrets trên các repo mục tiêu
- hệ thống chỉ lưu **token đã mã hoá**, không hiển thị lại raw token ở UI
- log workflow có thể khá lớn; nên đặt giới hạn reverse proxy và timeout đủ rộng cho các request tải log
- secret GitHub được gửi lên qua public-key encryption của GitHub API, vì vậy build production cần cài đủ dependency Node trong `package.json`
- nếu môi trường bị chặn outbound, cần mở kết nối tới `api.github.com`

Tài liệu vận hành riêng cho GitHub nằm ở:

- `docs/GITHUB_SERVICE.md`
- `docs/GITHUB_DEPLOY.md`
