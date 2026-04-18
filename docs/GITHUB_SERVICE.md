# GitHub Service Guide

Tài liệu này mô tả riêng phần GitHub service trong dự án `multi-service-integrator`.

## 1. Mục tiêu

GitHub service được thiết kế để quản lý tập trung các account GitHub và các thao tác vận hành phổ biến ở mức repository và GitHub Actions.

Phạm vi hiện tại:

- lưu danh sách account GitHub
- lưu email account và token truy cập
- lưu thêm metadata như owner, avatar, profile URL, plan, số lượng repo
- liệt kê repo theo từng account
- liệt kê workflow theo từng repo
- chạy workflow theo `workflow_id`
- xem danh sách workflow run gần đây
- dừng workflow run đang chạy
- xem log của workflow run
- quản lý GitHub Actions secrets ở mức repo
- quản lý webhook ở mức repo

## 2. Dữ liệu lưu cho một account GitHub

### 2.1 Trường nhập tay

- `account_email`: email quản lý account GitHub
- `token`: personal access token
- `webhook_secret`: tuỳ chọn

### 2.2 Trường hydrate từ GitHub API

- `owner`
- `avatar_url`
- `html_url`
- `plan`
- `public_repos`
- `private_repos`
- `followers`
- `following`

## 3. Cách tạo account GitHub

### Từ giao diện

Vào:

- `Dashboard`
- chọn service `GitHub`
- chọn `Add account`

Điền:

- `Account email`
- `Personal access token`
- `Webhook secret` nếu có

Khi lưu thành công, hệ thống sẽ:

1. validate token với GitHub API
2. lấy metadata account
3. mã hoá token trước khi ghi RTDB
4. ghi audit log cho thao tác tạo account

## 4. Những gì UI GitHub hiện hỗ trợ

### 4.1 Repositories

Panel `Repositories` dùng để liệt kê toàn bộ repo mà token có thể truy cập.

### 4.2 Workflows

Panel `Workflows` dùng để:

- nhập `repo_name`
- xem danh sách workflow YAML của repo đó
- trigger chạy workflow bằng các trường:
  - `repo_name`
  - `workflow_id`
  - `ref`

### 4.3 Workflow Runs

Panel `Workflow Runs` dùng để:

- nhập `repo_name`
- nhập `workflow_id` nếu muốn lọc theo workflow cụ thể
- xem các run gần nhất
- bấm `Stop run` để hủy một run đang chạy

### 4.4 Workflow Logs

Panel `Workflow Logs` dùng để:

- nhập `repo_name`
- nhập `run_id`
- tải và preview nội dung log của workflow run đó

### 4.5 Actions Secrets

Panel `Actions Secrets` dùng để:

- nhập `repo_name`
- xem danh sách secret name hiện có
- thêm mới secret
- cập nhật secret nếu trùng tên
- xoá secret theo tên

Lưu ý: GitHub không trả lại giá trị secret đã lưu. UI chỉ xem được **tên secret**, không xem lại value.

### 4.6 Webhooks

Panel `Webhooks` dùng để:

- nhập `repo_name`
- xem danh sách webhook
- tạo webhook
- xoá webhook

## 5. API routes liên quan đến GitHub

GitHub service đi qua generic routes của hệ thống:

```text
GET    /api/services/github
POST   /api/services/github
GET    /api/services/github/{accountId}
PUT    /api/services/github/{accountId}
DELETE /api/services/github/{accountId}
POST   /api/services/github/{accountId}/fetch
GET    /api/services/github/{accountId}/sub/repos
GET    /api/services/github/{accountId}/sub/workflows?repo_name=<repo>
POST   /api/services/github/{accountId}/sub/workflows
GET    /api/services/github/{accountId}/sub/workflow-runs?repo_name=<repo>&workflow_id=<id>
DELETE /api/services/github/{accountId}/sub/workflow-runs/{runId}?repo_name=<repo>
GET    /api/services/github/{accountId}/sub/workflow-logs?repo_name=<repo>&run_id=<runId>
GET    /api/services/github/{accountId}/sub/secrets?repo_name=<repo>
POST   /api/services/github/{accountId}/sub/secrets
DELETE /api/services/github/{accountId}/sub/secrets/{secretName}?repo_name=<repo>
GET    /api/services/github/{accountId}/sub/webhooks?repo_name=<repo>
POST   /api/services/github/{accountId}/sub/webhooks
DELETE /api/services/github/{accountId}/sub/webhooks/{hookId}?repo_name=<repo>
```

## 6. Ví dụ payload

### 6.1 Tạo account GitHub

```json
{
  "name": "GitHub Main",
  "config": {
    "account_email": "owner@example.com"
  },
  "credentials": {
    "token": "ghp_xxxxxxxxxxxxxxxxx",
    "webhook_secret": "optional-secret"
  }
}
```

### 6.2 Trigger workflow

```json
{
  "data": {
    "repo_name": "my-repo",
    "workflow_id": 123456,
    "ref": "main"
  }
}
```

### 6.3 Save repo secret

```json
{
  "data": {
    "repo_name": "my-repo",
    "secret_name": "MY_API_KEY",
    "secret_value": "super-secret-value"
  }
}
```

## 7. Bảo mật

- token GitHub được mã hoá trước khi lưu RTDB
- webhook secret cũng được mã hoá
- secret value chỉ được gửi một chiều lên GitHub, không lưu lại plain text từ phía GitHub
- UI detail chỉ hiển thị token dạng masked

## 8. Khuyến nghị sử dụng token

Nên dùng token chỉ có quyền đúng với phạm vi repo cần vận hành. Với các tính năng workflow, secret, webhook, token cần được cấp quyền tương ứng trên những repo mục tiêu.

## 9. Hướng triển khai tiếp theo nên làm

Các bước nâng cấp tiếp theo phù hợp cho GitHub service:

- thêm bộ lọc repo theo organization / visibility
- xem chi tiết jobs và step logs thay vì chỉ preview log tổng
- thêm thao tác rerun workflow
- thêm quản lý variables ngoài secrets
- thêm environment secrets / environment variables
- thêm permissions matrix rõ ràng theo role người dùng trong app
