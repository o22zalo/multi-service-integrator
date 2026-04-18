# Multi-Service Integrator

Webapp quản trị tập trung nhiều loại cấu hình, credentials và metadata dịch vụ trên cùng một dashboard, xây bằng **Next.js 15 + React 19 + TypeScript**, lưu dữ liệu trên **Firebase Realtime Database** theo mô hình **multi-shard**, có định hướng **backend parity**, **local-first**, **audit logging**, và **an toàn cho multi-instance**.

## 1. Mục tiêu dự án

Dự án này hướng đến một bảng điều khiển tập trung để:

- quản lý nhiều owner email
- mỗi owner có nhiều account / service account
- mỗi account có nhiều service và sub-resource đi kèm
- nhập dữ liệu tay trước, sau đó gọi API để hydrate / enrich rồi lưu lại
- hỗ trợ tạo, sửa, xóa, đồng bộ, re-fetch, import, export theo từng nghiệp vụ
- ghi nhận audit log và operation log rõ ràng
- đảm bảo frontend có gì thì backend có API tương ứng
- hoạt động đúng khi nhiều node chạy song song

## 2. Các service đang được định nghĩa trong codebase

- **GitHub**: accounts, repositories, workflows, workflow runs/logs, webhooks, actions secrets
- **Cloudflare**: zones, tunnels, DNS records
- **Supabase**: projects, tables, edge functions
- **Resend**: domains, API keys
- **Google Credentials**: OAuth app, service account, API key

## GitHub service nổi bật

GitHub hiện là service được làm sâu hơn để phục vụ nhu cầu vận hành tài khoản và repository:

- lưu account GitHub theo **email + token**
- hydrate metadata tài khoản như owner, avatar, profile URL, plan, số lượng repo
- liệt kê repository theo từng account
- liệt kê workflow theo từng repo
- trigger chạy workflow theo `workflow_id` + `ref`
- liệt kê workflow run gần nhất theo repo / workflow
- dừng workflow run đang chạy
- tải và preview workflow logs
- liệt kê, tạo, cập nhật và xoá GitHub Actions secrets
- liệt kê, tạo, xoá webhooks

Tài liệu riêng cho phần GitHub:

- `docs/GITHUB_SERVICE.md`
- `docs/GITHUB_DEPLOY.md`

## 3. Nguyên tắc kiến trúc cốt lõi

### Backend parity
Mọi luồng có trên UI phải có route handler hoặc service logic tương ứng ở backend. Không đặt business logic quan trọng trong component React.

### Multi-instance safe
State quan trọng không nằm ở RAM của một node. Dữ liệu nguồn được lưu trong RTDB; local cache chỉ là lớp tăng tốc.

### Modular theo service
Mỗi service được tách riêng theo hướng:

- types
- schema
- external API adapter
- service logic
- registry
- UI dùng lại qua generic dashboard

### Performance-first
Ứng dụng ưu tiên:

- tải danh sách nhẹ trước
- lazy load chi tiết
- local cache qua Dexie
- optimistic/local-first sync queue
- hooks tách riêng khỏi UI

## 4. Stack kỹ thuật

### Frontend
- Next.js 15 App Router
- React 19
- TypeScript strict
- Tailwind CSS
- lucide-react
- Zustand

### Backend / data
- Next.js Route Handlers
- Firebase Admin SDK
- Firebase Realtime Database multi-shard
- AES-256-GCM để mã hóa secret
- Dexie / IndexedDB cho local cache

### Tích hợp ngoài
- GitHub REST API
- Cloudflare API
- Supabase REST / Management API
- Resend API
- Google APIs

## 5. Cấu trúc thư mục chính

```text
.
├── src/
│   ├── app/                  # App Router + route handlers
│   ├── components/           # layout, services, logs, ui
│   ├── lib/                  # firebase, crypto, db, logger, export, hooks, store
│   ├── services/             # service framework + modules theo service
│   └── types/                # global/shared types
├── tests/                    # unit tests
├── scripts/                  # helper scripts
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── STANDARDS.md
├── PROJECT_MEMORY.md
├── README.md
└── DEPLOY.md
```


## 5.1 Chuẩn thư mục App Router

Project này đã được chuẩn hoá để **không dùng route-group folder** trong `src/app`.

Dùng cấu trúc vật lý thật:
- `src/app/login`
- `src/app/dashboard`
- `src/app/dashboard/services/[type]`
- `src/app/api/...`

Không dùng các thư mục kiểu `(auth)`, `(dashboard)`. Quy tắc này cũng đã được đưa vào `AGENTS.md` để agent không tạo sai cấu trúc nữa.

## 6. Luồng dữ liệu tổng quát

```text
UI → Route Handler → BaseService / Service Module → External API
UI → Local Store / Dexie → SyncManager → Firebase RTDB
Write operations → AuditLogger / OperationLogger
Sensitive fields → AES-256-GCM encrypt trước khi ghi DB
```

## 7. Data model mức cao

### RTDB
```text
/users/{uid}
/{uid}/services/{service_type}/{record_id}
/shard_index/{uid}/{service_type}/{record_id}
/audit_logs/{uid}/{log_id}
/meta/load
```

### Mỗi service record
- `_meta`
- `credentials` (đã mã hóa)
- `config`
- `sub_resources`

## 8. Bảo mật

- secret được mã hóa bằng **AES-256-GCM** trước khi lưu
- UI không nên đọc secret raw trực tiếp từ client
- external API call phải đi qua server-side route handler
- thao tác write/delete cần đi qua audit log
- auth thiết kế theo hướng multi-provider

## 9. Biến môi trường chính

Repo đã có file `.env.example` để làm mẫu. Ngoài ra, xem thêm `env.requirements.md` để biết cách lấy từng giá trị, link console, link docs và checklist triển khai môi trường.

Repo đã có file `.env.example` để làm mẫu. Tối thiểu bạn cần điền:

```bash
AUTH_PROVIDERS=google,supabase,custom
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

FIREBASE_SHARD_COUNT=1
FIREBASE_SHARD_1_PROJECT_ID=
FIREBASE_SHARD_1_DATABASE_URL=
FIREBASE_SHARD_1_SERVICE_ACCOUNT=

ENCRYPTION_KEY=
ENCRYPTION_IV_SALT=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 10. Chạy local nhanh

### 1) Cài dependency
```bash
npm install
```

### 2) Tạo file môi trường
```bash
cp .env.example .env
```

### 3) Sinh key mã hóa
```bash
bash scripts/generate-encryption-key.sh
```

Copy kết quả vào `.env`.

### 4) Chạy development
```bash
npm run dev
```

### 5) Kiểm tra health
Mở `GET /api/health`.

## 11. Các script có sẵn

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:unit
npm run test:integration
```

## 12. API surface đang định hướng

### Generic service routes
```text
GET    /api/services/[type]
POST   /api/services/[type]
GET    /api/services/[type]/[id]
PUT    /api/services/[type]/[id]
DELETE /api/services/[type]/[id]
POST   /api/services/[type]/[id]/fetch
GET    /api/services/[type]/[id]/sub/[subType]
POST   /api/services/[type]/[id]/sub/[subType]
DELETE /api/services/[type]/[id]/sub/[subType]/[resourceId]
```

### Admin / utility
```text
GET  /api/health
GET  /api/admin/logs
POST /api/services/export
POST /api/services/import
```

## 13. Docker

Chạy local bằng Docker:

```bash
docker compose up --build
```

Chạy production compose:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Chi tiết triển khai nằm trong `DEPLOY.md`. Riêng GitHub service xem thêm `docs/GITHUB_SERVICE.md` và `docs/GITHUB_DEPLOY.md`.

## 14. Tình trạng hiện tại của repo

Repo này đang ở trạng thái **implementation-oriented scaffold** theo plan kiến trúc, phù hợp để tiếp tục phát triển và kiểm thử thật với môi trường của bạn.

Điểm cần lưu ý trước khi đưa production:

- cần cài dependency và chạy lại `typecheck`, `test`, `build` trong môi trường Node/npm thực tế
- cần bổ sung `.env` thật cho Firebase, auth providers và các dịch vụ ngoài
- cần verify end-to-end các flow auth, CRUD service, sub-resource và import/export với credentials thật
- nên rà lại lần cuối các phần scaffold theo plan để bảo đảm tất cả module tham chiếu đều hiện diện và build sạch

## 15. Lộ trình nên làm tiếp

1. hoàn thiện và verify auth flow end-to-end
2. kiểm thử thật từng service provider
3. bổ sung RTDB rules và hardening production
4. thêm monitoring / alerting
5. thêm CI step cho build + typecheck + test + docker image
6. mở rộng thêm service module mới theo BaseService

## 16. Tài liệu liên quan

- `STANDARDS.md`: coding standards và quy ước lỗi
- `PROJECT_MEMORY.md`: trạng thái task và ghi chú triển khai
- `DEPLOY.md`: hướng dẫn deploy chi tiết

