# 🛠️ EduCloud Lite - Developer & Setup Guide

Tài liệu kỹ thuật hướng dẫn cài đặt môi trường phát triển cục bộ (Local Development), cấu hình dịch vụ AWS và dọn dẹp tài nguyên cho dự án **EduCloud Lite**.

---

## 🏗️ 1. Kiến Trúc Môi Trường (System Architecture)

* **Backend:** FastAPI (Python 3.12) - RESTful API server (`/api/...`).
* **Frontend:** React (TypeScript) + Vite + TailwindCSS.
* **Database:** PostgreSQL (Supabase / AWS RDS PostgreSQL).
* **Cloud Services:** AWS S3 (Storage), AWS CloudWatch (Logging), AWS Cognito (Auth) / Local bcrypt Auth.

---

## 📋 2. Yêu Cầu Tiền Trạm (Prerequisites)

* **Node.js:** v18.0 trở lên.
* **Python:** v3.12 (khuyên dùng; tránh sử dụng Python 3.14 do chưa tương thích binary wheels).
* **AWS CLI:** Khuyến nghị cài đặt nếu cần làm việc với AWS S3/CloudWatch.

---

## 🚀 3. Hướng Dẫn Cài Đặt Chi Tiết (Step-by-Step)

### Bước 1: Thiết lập Backend (FastAPI)

1. Mở cửa sổ Terminal và di chuyển vào thư mục backend:
   ```powershell
   cd backend
   ```

2. Tạo và kích hoạt môi trường ảo Python 3.12:
   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Cài đặt các gói thư viện phụ thuộc:
   ```powershell
   pip install -r requirements-dev.txt
   ```

4. Cấu hình biến môi trường (`.env`):
   ```powershell
   Copy-Item .env.example .env
   ```
   * Mở file `.env` và cập nhật thông số:
     ```env
     # Database (Chép chuỗi URI từ Supabase/RDS, nhớ XÓA dấu [] ở password)
     DATABASE_URL=postgresql://postgres:MatKhauThat@db.xxxx.supabase.co:5432/postgres

     # AWS S3 Config (Tùy chọn cho Local Dev / Bắt buộc khi test Upload File)
     AWS_ACCESS_KEY_ID=your_access_key
     AWS_SECRET_ACCESS_KEY=your_secret_key
     AWS_REGION=ap-southeast-1
     S3_BUCKET_NAME=educloud-lite-media-bucket
     ```

5. Khởi tạo dữ liệu và tài khoản thử nghiệm:
   *(Giúp vượt qua các Test Cases TC-01 đến TC-09 trong kịch bản kiểm thử)*
   ```powershell
   python -m scripts.check_database
   python -m scripts.seed_dev_accounts
   ```

6. Khởi chạy Backend Server:
   ```powershell
   uvicorn main:app --reload --port 8001
   ```
   * **Backend API Base:** `http://127.0.0.1:8001`
   * **Swagger Interactive Docs:** `http://127.0.0.1:8001/docs`

---

### Bước 2: Thiết lập Frontend (React + Vite)

1. Mở cửa sổ Terminal thứ 2 và di chuyển vào thư mục frontend:
   ```powershell
   cd frontend
   ```

2. Tạo file cấu hình môi trường `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   * Đảm bảo đường dẫn Backend trỏ đúng port `8001`:
     ```env
     VITE_API_URL=http://localhost:8001
     ```

3. Cài đặt các gói thư viện Node.js:
   ```powershell
   npm install
   ```

4. Khởi chạy Frontend Server:
   ```powershell
   npm run dev
   ```
   * **Giao diện Web:** `http://localhost:5173`

---

## 🔑 4. Danh Sách Tài Khoản Thử Nghiệm (Dev Accounts)

Hệ thống hỗ trợ cơ chế Đăng nhập Dev/Legacy qua API `/api/auth/login` với mật khẩu mặc định **`Demo123!`**:

| Vai Trò (Role) | Email | Mật Khẩu | Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Student** | `student@educloud.local` | `Demo123!` | Test Đăng ký học, Xem tiến độ, Làm bài Assessment |
| **Instructor** | `instructor@educloud.local` | `Demo123!` | Test Tạo khóa học, Thêm bài học, Upload file lên S3 |
| **Admin** | `admin@educloud.local` | `Demo123!` | Test Duyệt đơn Instructor, Xem Dashboard & Health Metric |

---

## ❓ 5. Xử Lý Lỗi Kỹ Thuật Thường Gặp (Troubleshooting)

* **Lỗi Build `pydantic-core` / `psycopg2` khi `pip install`:**
  * *Nguyên nhân:* Môi trường mặc định chọn phiên bản Python quá mới (Python 3.14).
  * *Khắc phục:* Xóa folder `.venv`, đảm bảo đã cài Python 3.12 (`winget install --id Python.Python.3.12`) và tạo lại môi trường bằng lệnh `py -3.12 -m venv .venv`.

* **Lỗi `psycopg2.OperationalError` / Không kết nối được Database:**
  * *Nguyên nhân:* Mật khẩu trong `DATABASE_URL` còn giữ nguyên ngoặc vuông `[YOUR-PASSWORD]`, hoặc mạng nhà bạn chặn IPv6 Direct Connection.
  * *Khắc phục:* Kiểm tra lại mật khẩu (xóa dấu `[` và `]`). Nếu dùng Supabase, chuyển mode từ *Direct connection* sang **Session pooler** trong cài đặt kết nối.

---

## 🧹 6. Quy Trình Dọn Dẹp Tài Nguyên AWS (AWS Clean-up Guide)

Để tránh phát sinh chi phí ngoài ý muốn sau khi kết thúc đợt báo cáo/demo:

1. **AWS S3:** Empty toàn bộ objects trong bucket `educloud-lite-media-bucket` và tiến hành Delete Bucket.
2. **AWS RDS / Supabase:** Tắt hoặc xóa RDS Instance nếu không sử dụng lâu dài.
3. **AWS EC2 / App Runner:** Terminate instance backend nếu đã deploy thử nghiệm trên Cloud.
4. **AWS CloudWatch:** Delete Log Groups liên quan đến ứng dụng.
5. Kiểm tra lại **AWS Billing & Cost Management Dashboard** để đảm bảo không có chi phí phát sinh.