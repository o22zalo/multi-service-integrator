# AGENTS.md — Project Agent Rules

# Path: /AGENTS.md

Áp dụng cho mọi AI agent làm việc trong repository này. File này là bản chuẩn hoá nội bộ của project, kế thừa các nguyên tắc từ spec gốc và bổ sung quy tắc để tránh sai lệch cấu trúc thư mục.

---

## 0. Golden workflow

**Đọc plan.md → chọn task → đọc STANDARDS.md → kiểm tra PROJECT_MEMORY.md → code đúng scope → test/verify → cập nhật PROJECT_MEMORY.md**

Không bỏ qua bước nào. Không tự bẻ cấu trúc project ngoài spec đã chốt.

---

## 1. Folder policy bắt buộc

### 1.1 App Router phải dùng thư mục thật, không dùng route group

**Cấm tạo thư mục kiểu:**
- `src/app/(auth)`
- `src/app/(dashboard)`
- `src/app/(marketing)`

**Bắt buộc dùng thư mục thật:**
- `src/app/login`
- `src/app/dashboard`
- `src/app/dashboard/services/[type]`
- `src/app/api/...`

Lý do: route group dễ làm lệch project memory, lệch đường dẫn trong comment header, và dễ gây nhầm khi người dùng yêu cầu replace file theo cấu trúc vật lý.

### 1.2 Header comment phải khớp path vật lý thật

Mỗi file mới phải có header:
```ts
// Path: /src/app/dashboard/page.tsx
// Module: Dashboard Page
// Depends on: ...
// Description: ...
```

Không được ghi path ảo hoặc path cũ đã rename.

### 1.3 Chỉ ghi vào PROJECT_MEMORY.md các file thực sự đang tồn tại

Trước khi thêm `files_changed`, agent phải kiểm tra file tồn tại thật trong repo. Không được lưu path lịch sử không còn tồn tại.

### 1.4 Không commit file generated

Cấm commit các file sinh tự động như:
- `tsconfig.tsbuildinfo`
- cache build
- temporary artifacts
- editor state cục bộ

---

## 2. Project structure chuẩn

```
/
├── AGENTS.md
├── STANDARDS.md
├── plan.md
├── PROJECT_MEMORY.md
├── README.md
├── DEPLOY.md
├── env.requirements.md
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── dashboard/
│   │   │   ├── services/[type]/
│   │   │   └── logs/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   │   ├── auth/
│   │   ├── crypto/
│   │   ├── db/
│   │   ├── firebase/
│   │   ├── logger/
│   │   ├── store/
│   │   └── utils/
│   ├── services/
│   └── types/
└── tests/
```

---

## 3. Coding rules

- Public function nên có JSDoc ngắn.
- API route phải validate input ở boundary.
- Secret không đọc trực tiếp ở client.
- Ghi log cho mọi write operation có persistence.
- Không sửa ngoài scope nếu chưa ghi nhận vào PROJECT_MEMORY.md.
- Không tạo import path giả chỉ để “khớp spec”.

---

## 4. Standardization checklist

Khi chuẩn hoá project, agent phải kiểm tra tối thiểu:

- [ ] Không còn route-group folder trong `src/app`
- [ ] Không còn path route-group trong `PROJECT_MEMORY.md`
- [ ] `.cursorrules` trỏ đúng workflow mới
- [ ] `.gitignore` ignore file generated
- [ ] README/DEPLOY phản ánh đúng cấu trúc vật lý hiện tại
- [ ] Header `// Path:` khớp file thật

---

## 5. Nếu user yêu cầu “replace toàn bộ”

Ưu tiên bàn giao:
1. project folder hoàn chỉnh
2. file ZIP full replace
3. docs cập nhật đồng bộ

Không để tình trạng docs nói một cấu trúc nhưng thư mục thật lại khác.
