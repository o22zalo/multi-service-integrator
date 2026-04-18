# ENV Requirements

Tài liệu này mô tả **toàn bộ biến môi trường cần có để dựng môi trường chạy cho `multi-service-integrator`**, cách lấy từng giá trị, link console, và link docs chính thức nếu cần tra cứu thêm.

Mục tiêu của file này là để bạn có thể:

1. dựng môi trường local / staging / production nhanh hơn
2. biết **biến nào là bắt buộc**, biến nào là tùy chọn
3. biết **lấy thông tin ở đâu**
4. tránh nhầm giữa **env deploy** và **credentials nhập trong UI**

---

## 1. Phân loại biến môi trường

### 1.1 Bắt buộc cho app chạy cơ bản

Các biến này gần như luôn phải có:

- `AUTH_PROVIDERS`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `FIREBASE_SHARD_COUNT`
- `FIREBASE_SHARD_1_PROJECT_ID`
- `FIREBASE_SHARD_1_DATABASE_URL`
- `FIREBASE_SHARD_1_SERVICE_ACCOUNT`
- `ENCRYPTION_KEY`
- `ENCRYPTION_IV_SALT`
- `NEXT_PUBLIC_APP_URL`

### 1.2 Bắt buộc nếu bật provider tương ứng

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Không phải env deploy, mà là dữ liệu nhập trong UI

Các thông tin sau **không nằm trong `.env` mặc định của app**, mà thường được nhập vào app theo từng account/service:

- GitHub account email
- GitHub token
- Cloudflare API token / API key
- Supabase project token / management token
- Resend API key
- Google service account JSON / API key / OAuth app secret theo từng account

---

## 2. Bảng biến môi trường

| Variable | Bắt buộc | Dùng cho | Lấy ở đâu | Ghi chú |
|---|---|---|---|---|
| `AUTH_PROVIDERS` | Có | Bật/tắt auth providers | Tự khai báo | Ví dụ: `google,supabase,custom` |
| `NEXTAUTH_SECRET` | Có | Ký session/JWT | Tự sinh | Phải là chuỗi random mạnh |
| `NEXTAUTH_URL` | Có | Callback/auth absolute URL | Domain deploy | Ví dụ `https://app.example.com` |
| `FIREBASE_SHARD_COUNT` | Có | Số shard RTDB | Tự khai báo | Ví dụ `1`, `2`, `3` |
| `FIREBASE_SHARD_1_PROJECT_ID` | Có | Firebase shard #1 | Firebase Console | Project ID |
| `FIREBASE_SHARD_1_DATABASE_URL` | Có | Firebase shard #1 | Firebase Console | URL RTDB đầy đủ |
| `FIREBASE_SHARD_1_SERVICE_ACCOUNT` | Có | Firebase Admin SDK | Firebase Console | Base64 của JSON service account |
| `FIREBASE_SHARD_2_*` trở lên | Tùy | Multi-shard | Firebase Console | Chỉ cần nếu dùng nhiều shard |
| `ENCRYPTION_KEY` | Có | AES-256-GCM encrypt secrets | Tự sinh | 64 ký tự hex |
| `ENCRYPTION_IV_SALT` | Có | Salt/phụ trợ crypto | Tự sinh | 32 ký tự hex |
| `GOOGLE_CLIENT_ID` | Tùy | Auth provider Google | Google Cloud Console | Chỉ cần khi bật `google` |
| `GOOGLE_CLIENT_SECRET` | Tùy | Auth provider Google | Google Cloud Console | Chỉ cần khi bật `google` |
| `SUPABASE_URL` | Tùy | Auth provider Supabase | Supabase Dashboard | Chỉ cần khi bật `supabase` |
| `SUPABASE_ANON_KEY` | Tùy | Auth provider Supabase | Supabase Dashboard | Có thể là `anon` hoặc publishable key theo project |
| `SUPABASE_SERVICE_ROLE_KEY` | Tùy | Server-side Supabase ops | Supabase Dashboard | Không dùng ở browser |
| `NEXT_PUBLIC_APP_URL` | Có | URL public cho frontend | Domain deploy | Nên trùng `NEXTAUTH_URL` |

---

## 3. File `.env` mẫu hoàn chỉnh

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

---

## 4. Cách lấy từng biến

## 4.1 `AUTH_PROVIDERS`

Biến này là danh sách provider đăng nhập được bật trong app.

Ví dụ:

```bash
AUTH_PROVIDERS=custom
AUTH_PROVIDERS=google,custom
AUTH_PROVIDERS=google,supabase,custom
```

### Quy ước dùng thực tế

- `custom`: luôn dễ dùng để test nội bộ
- `google`: dùng khi cần đăng nhập Google OAuth
- `supabase`: dùng khi muốn đăng nhập bằng Supabase auth

### Khuyến nghị

- local/dev: `custom`
- staging: `google,custom`
- production: provider nào dùng thật thì mới bật

---

## 4.2 `NEXTAUTH_SECRET`

Dùng để ký session/JWT cho Auth.js / NextAuth.

### Cách lấy

Tự sinh bằng một chuỗi random mạnh.

Ví dụ:

```bash
openssl rand -base64 32
```

hoặc dùng secret manager của hạ tầng.

### Yêu cầu

- không commit vào git
- không dùng chuỗi ngắn, dễ đoán
- production nên lưu ở secret manager

### Docs

- Auth.js: https://authjs.dev/
- NextAuth.js: https://next-auth.js.org/

---

## 4.3 `NEXTAUTH_URL`

Đây là URL public đầy đủ mà app auth của bạn đang chạy.

### Ví dụ

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://multi-service.example.com
```

### Cách xác định

- local: URL dev local
- production: domain public thật đứng trước reverse proxy / load balancer

### Lưu ý

- nếu domain public là `https://app.example.com` thì `NEXTAUTH_URL` phải là đúng domain đó
- callback Google thường sẽ nằm dưới dạng:

```text
https://your-domain.com/api/auth/callback/google
```

---

## 4.4 `NEXT_PUBLIC_APP_URL`

URL public cho frontend. Trong đa số case nên để **giống `NEXTAUTH_URL`**.

Ví dụ:

```bash
NEXT_PUBLIC_APP_URL=https://multi-service.example.com
```

### Lưu ý

- nếu đặt sai domain public thì các link render ra UI có thể sai
- khi đi qua reverse proxy / CDN, giá trị này nên là domain cuối cùng người dùng truy cập

---

## 4.5 Firebase shard vars

### 4.5.1 `FIREBASE_SHARD_COUNT`

Số shard RTDB mà app sẽ sử dụng.

Ví dụ:

```bash
FIREBASE_SHARD_COUNT=1
FIREBASE_SHARD_COUNT=2
```

### 4.5.2 `FIREBASE_SHARD_<N>_PROJECT_ID`

Firebase project ID của shard tương ứng.

Ví dụ:

```bash
FIREBASE_SHARD_1_PROJECT_ID=my-firebase-project
```

### 4.5.3 `FIREBASE_SHARD_<N>_DATABASE_URL`

URL đầy đủ của Realtime Database.

Ví dụ:

```bash
FIREBASE_SHARD_1_DATABASE_URL=https://my-firebase-project-default-rtdb.firebaseio.com
```

hoặc region-specific:

```bash
FIREBASE_SHARD_1_DATABASE_URL=https://my-db.asia-southeast1.firebasedatabase.app
```

### 4.5.4 `FIREBASE_SHARD_<N>_SERVICE_ACCOUNT`

Là **base64 của file JSON service account** dùng cho Firebase Admin SDK.

Bạn không lưu path file trong repo này, mà lưu **nội dung JSON đã encode base64**.

---

## 4.6 Cách lấy thông tin Firebase

### Bước 1: vào Firebase Console

- Console: https://console.firebase.google.com/

### Bước 2: lấy `PROJECT_ID`

- mở project cần dùng
- vào **Project settings**
- lấy **Project ID**

### Bước 3: tạo/lấy Realtime Database URL

- vào **Build > Realtime Database**
- mở database instance đang dùng
- lấy URL database

### Bước 4: tạo service account JSON

- vào **Project settings > Service accounts**
- chọn **Generate new private key**
- tải file JSON về

### Bước 5: encode JSON sang base64

#### Linux

```bash
base64 -w 0 service-account.json
```

#### macOS

```bash
base64 service-account.json | tr -d '\n'
```

#### PowerShell

```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("service-account.json"))
```

Dán kết quả vào:

```bash
FIREBASE_SHARD_1_SERVICE_ACCOUNT=<base64-json>
```

### Docs chính thức

- Firebase Admin setup: https://firebase.google.com/docs/admin/setup
- Firebase Admin ServiceAccount reference: https://firebase.google.com/docs/reference/admin/node/firebase-admin.serviceaccount
- Realtime Database locations / URL formats: https://firebase.google.com/docs/database/locations

### Console links hữu ích

- Firebase Console: https://console.firebase.google.com/
- Service Accounts page: `https://console.firebase.google.com/project/<project-id>/settings/serviceaccounts/adminsdk`
- Realtime Database page: `https://console.firebase.google.com/project/<project-id>/database`

### Lưu ý quan trọng

- service account key là secret cấp cao, không commit git
- nếu dùng nhiều shard thì mỗi shard nên có service account riêng tương ứng project đó
- `FIREBASE_SHARD_COUNT` nên match với số block shard bạn khai báo thật trong `.env`

---

## 4.7 `ENCRYPTION_KEY` và `ENCRYPTION_IV_SALT`

Repo này dùng AES-256-GCM để mã hóa secret trước khi lưu.

### Cách sinh nhanh

Repo đã có script:

```bash
bash scripts/generate-encryption-key.sh
```

Kết quả kỳ vọng:

```bash
ENCRYPTION_KEY=<64-char-hex>
ENCRYPTION_IV_SALT=<32-char-hex>
```

### Yêu cầu định dạng

- `ENCRYPTION_KEY`: 32 bytes hex = 64 ký tự hex
- `ENCRYPTION_IV_SALT`: 16 bytes hex = 32 ký tự hex

### Lưu ý

- đổi key sẽ làm dữ liệu cũ đã mã hóa không giải mã được nếu không có migration/re-encryption
- production phải backup secret này rất cẩn thận
- không rotate bừa khi hệ thống đã có dữ liệu thật

---

## 4.8 `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`

Chỉ cần nếu bạn bật provider `google` trong `AUTH_PROVIDERS`.

### Dùng để làm gì

Đây là OAuth client của app để cho người dùng đăng nhập Google vào hệ thống.

### Cách lấy

1. vào Google Cloud Console / Google Auth Platform Clients
2. chọn đúng project
3. tạo OAuth client cho loại **Web application**
4. thêm redirect URI của app
5. copy **Client ID** và **Client secret**

### Redirect URI thường dùng

```text
http://localhost:3000/api/auth/callback/google
https://your-domain.com/api/auth/callback/google
```

### Docs / hướng dẫn

- Google OAuth client management: https://support.google.com/cloud/answer/6158849?hl=en
- Firebase Google sign-in (tham khảo luồng và Credentials page): https://firebase.google.com/docs/auth/web/google-signin

### Console links hữu ích

- Google Cloud Console: https://console.cloud.google.com/
- Credentials / Clients: https://console.cloud.google.com/auth/clients

### Lưu ý

- client secret có thể chỉ hiển thị đầy đủ lúc mới tạo; cần lưu an toàn ngay
- localhost được phép dùng HTTP trong nhiều trường hợp dev, production nên dùng HTTPS
- nếu redirect URI sai, đăng nhập Google sẽ lỗi callback mismatch

---

## 4.9 `SUPABASE_URL`

Chỉ cần nếu bật `supabase` trong `AUTH_PROVIDERS` hoặc server cần kết nối Supabase.

### Giá trị là gì

URL project, dạng:

```text
https://<project-ref>.supabase.co
```

### Cách lấy

- vào Supabase Dashboard
- mở project
- lấy **Project URL** từ **Connect** dialog hoặc API settings

### Docs

- Supabase Data API / project URL format: https://supabase.com/docs/guides/api
- Project URL and keys from Connect dialog: https://supabase.com/docs/guides/api/creating-routes

---

## 4.10 `SUPABASE_ANON_KEY`

Dùng cho auth/client side flow với Supabase.

### Cách lấy

- vào Supabase project
- mở **Connect** hoặc **API** section
- copy key public/client-side phù hợp

### Lưu ý

- trong tài liệu Supabase hiện có giai đoạn chuyển tiếp giữa `anon` key cũ và publishable key mới
- codebase hiện dùng tên env `SUPABASE_ANON_KEY`, nên hãy map đúng giá trị client-safe mà project của bạn đang cấp phát

### Docs

- API keys overview: https://supabase.com/docs/guides/api/api-keys
- Environment variables / default secrets overview: https://supabase.com/docs/guides/functions/secrets

---

## 4.11 `SUPABASE_SERVICE_ROLE_KEY`

Dùng cho server-side, quyền cao, không được đưa xuống browser.

### Cách lấy

- vào Supabase project
- mở **API** / **Connect**
- copy service role / server-side key tương ứng

### Lưu ý

- key này có thể bypass nhiều lớp bảo vệ server-side nếu dùng sai
- chỉ dùng trong backend / route handlers / server jobs
- tuyệt đối không expose ra frontend

### Docs

- API keys: https://supabase.com/docs/guides/api/api-keys
- Secrets guide: https://supabase.com/docs/guides/functions/secrets

---

## 5. GitHub token có phải env deploy không?

**Không, theo thiết kế hiện tại thì GitHub account/token là dữ liệu vận hành nhập trong UI**, không phải env deploy mặc định.

Tuy nhiên vì module GitHub là phần quan trọng của project, bạn nên chuẩn bị sẵn hướng dẫn lấy token cho người vận hành.

## 5.1 GitHub account data nhập trong app

Thông thường mỗi account GitHub sẽ nhập:

- email
- token
- có thể thêm note / owner / extra metadata nếu cần

## 5.2 Cách lấy GitHub token

### Khuyến nghị

Ưu tiên **fine-grained personal access token** nếu phù hợp.

### Docs chính thức

- Managing personal access tokens: https://docs.github.com/github/extending-github/git-automation-with-oauth-tokens
- Fine-grained PAT permissions: https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens
- Actions secrets endpoints: https://docs.github.com/en/rest/actions/secrets

### Link tạo token

- GitHub token settings: https://github.com/settings/tokens

## 5.3 Quyền token nên cân nhắc cho module GitHub này

Vì app hỗ trợ:

- xem repo
- xem workflow
- trigger workflow
- cancel/stop workflow run
- xem workflow logs
- thêm/sửa/xóa Actions secrets

nên token thường sẽ cần tối thiểu các quyền liên quan đến:

- Metadata
- Actions / Workflows
- Secrets
- quyền truy cập repository tương ứng

### Lưu ý cực quan trọng

GitHub thay đổi mô hình permission theo endpoint và loại token. Vì vậy trước khi chốt permission set cho production, hãy kiểm tra lại bằng tài liệu permissions chính thức ở trên và dùng response header `X-Accepted-GitHub-Permissions` nếu cần debug.

---

## 6. Supabase Management token có phải env deploy không?

Mặc định **không nằm trong `.env.example`** hiện tại.

Trong codebase/service flow, management token thường là dữ liệu **nhập theo account/service** khi cần gọi Management API, không phải global deploy env.

### Cách lấy

Supabase Management API dùng access token ở header `Authorization: Bearer <access_token>`.

### Docs

- Management API reference: https://supabase.com/docs/reference/api/introduction

### Link quản lý token

- Supabase account/project dashboard: https://supabase.com/dashboard

---

## 7. Profile `.env` theo từng môi trường

## 7.1 Local tối thiểu

```bash
AUTH_PROVIDERS=custom
NEXTAUTH_SECRET=<random>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

FIREBASE_SHARD_COUNT=1
FIREBASE_SHARD_1_PROJECT_ID=
FIREBASE_SHARD_1_DATABASE_URL=
FIREBASE_SHARD_1_SERVICE_ACCOUNT=

ENCRYPTION_KEY=
ENCRYPTION_IV_SALT=
```

## 7.2 Local có Google login

```bash
AUTH_PROVIDERS=google,custom
NEXTAUTH_SECRET=<random>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FIREBASE_SHARD_COUNT=1
FIREBASE_SHARD_1_PROJECT_ID=
FIREBASE_SHARD_1_DATABASE_URL=
FIREBASE_SHARD_1_SERVICE_ACCOUNT=

ENCRYPTION_KEY=
ENCRYPTION_IV_SALT=
```

## 7.3 Local/production có Supabase login

```bash
AUTH_PROVIDERS=supabase,custom
NEXTAUTH_SECRET=<random>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

FIREBASE_SHARD_COUNT=1
FIREBASE_SHARD_1_PROJECT_ID=
FIREBASE_SHARD_1_DATABASE_URL=
FIREBASE_SHARD_1_SERVICE_ACCOUNT=

ENCRYPTION_KEY=
ENCRYPTION_IV_SALT=
```

---

## 8. Checklist dựng môi trường

## 8.1 Tối thiểu để app boot được

- [ ] copy `.env.example` thành `.env`
- [ ] điền `AUTH_PROVIDERS`
- [ ] điền `NEXTAUTH_SECRET`
- [ ] điền `NEXTAUTH_URL`
- [ ] điền `NEXT_PUBLIC_APP_URL`
- [ ] điền ít nhất 1 Firebase shard
- [ ] sinh `ENCRYPTION_KEY`
- [ ] sinh `ENCRYPTION_IV_SALT`

## 8.2 Nếu dùng Google login

- [ ] tạo OAuth client loại Web application
- [ ] thêm callback `/api/auth/callback/google`
- [ ] điền `GOOGLE_CLIENT_ID`
- [ ] điền `GOOGLE_CLIENT_SECRET`

## 8.3 Nếu dùng Supabase login

- [ ] lấy project URL
- [ ] lấy client-safe key cho `SUPABASE_ANON_KEY`
- [ ] lấy server-side key cho `SUPABASE_SERVICE_ROLE_KEY`

## 8.4 Nếu dùng GitHub service module

- [ ] chuẩn bị account email
- [ ] tạo GitHub PAT/fine-grained PAT
- [ ] cấp quyền repo/actions/secrets phù hợp
- [ ] nhập token vào app qua UI, không nhét vào `.env` deploy global trừ khi bạn tự mở rộng cơ chế seed riêng

---

## 9. Các lỗi thường gặp

## 9.1 `AUTH-JWT-001` hoặc session lỗi

Nguyên nhân thường gặp:

- `NEXTAUTH_SECRET` đổi giữa các instance
- `NEXTAUTH_URL` sai domain
- reverse proxy không forward đúng scheme/host

## 9.2 Không đọc được Firebase

Nguyên nhân thường gặp:

- `FIREBASE_SHARD_1_SERVICE_ACCOUNT` chưa encode base64 đúng
- project ID không khớp service account
- database URL không đúng region/instance

## 9.3 Google login callback mismatch

Nguyên nhân thường gặp:

- thiếu redirect URI `.../api/auth/callback/google`
- `NEXTAUTH_URL` khác domain khai báo trên OAuth client

## 9.4 Supabase auth lỗi key

Nguyên nhân thường gặp:

- nhầm publishable/anon key với service role key
- `SUPABASE_URL` sai project ref

## 9.5 Dữ liệu secret cũ không giải mã được

Nguyên nhân thường gặp:

- đã thay `ENCRYPTION_KEY` sau khi dữ liệu đã được lưu

---

## 10. Khuyến nghị production

- dùng secret manager thay vì file `.env` thuần nếu có thể
- không rotate `ENCRYPTION_KEY` khi chưa có kế hoạch re-encrypt dữ liệu
- giữ `NEXTAUTH_SECRET` giống nhau trên mọi instance
- tách Firebase shard theo môi trường: dev / staging / prod
- dùng domain HTTPS thật cho `NEXTAUTH_URL` và `NEXT_PUBLIC_APP_URL`
- kiểm tra lại quyền token GitHub tối thiểu trước khi đưa production
- bật audit log và backup secret store

---

## 11. Link tổng hợp nhanh

### App/Auth

- Auth.js: https://authjs.dev/
- NextAuth.js: https://next-auth.js.org/

### Firebase

- Firebase Console: https://console.firebase.google.com/
- Firebase Admin setup: https://firebase.google.com/docs/admin/setup
- Realtime Database locations: https://firebase.google.com/docs/database/locations
- ServiceAccount reference: https://firebase.google.com/docs/reference/admin/node/firebase-admin.serviceaccount

### Google OAuth

- Google Cloud Console: https://console.cloud.google.com/
- OAuth Clients help: https://support.google.com/cloud/answer/6158849?hl=en
- Firebase Google sign-in: https://firebase.google.com/docs/auth/web/google-signin

### Supabase

- Dashboard: https://supabase.com/dashboard
- API docs: https://supabase.com/docs/guides/api
- API keys: https://supabase.com/docs/guides/api/api-keys
- Management API: https://supabase.com/docs/reference/api/introduction

### GitHub

- Token settings: https://github.com/settings/tokens
- PAT docs: https://docs.github.com/github/extending-github/git-automation-with-oauth-tokens
- Fine-grained permissions: https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens
- Actions secrets docs: https://docs.github.com/en/rest/actions/secrets

---

## 12. Kết luận sử dụng trong project này

Để deploy project này thực tế, bạn nên làm theo thứ tự:

1. dựng Firebase shard trước
2. sinh encryption keys
3. cấu hình `NEXTAUTH_*`
4. quyết định có bật `google` / `supabase` hay không
5. deploy app lên domain thật
6. sau đó mới nhập account GitHub / Cloudflare / Supabase / Resend / Google credentials vào UI theo từng service

Như vậy bạn sẽ tách bạch được:

- **deploy environment** = `.env`, hạ tầng, auth nền tảng, DB, crypto
- **operational service credentials** = dữ liệu account nhập trong dashboard
