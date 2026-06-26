# AI Social Media Analysis — Hướng dẫn Setup

Dashboard mô phỏng pipeline phân tích mạng xã hội AI & Công nghệ (Twitter + Reddit), gồm các bước: Collect → HDFS → Sqoop → HBase → Hive → Pig → Oozie.

**Tech stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase · Recharts

---

## Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu |
|----------|---------------------|
| **Node.js** | 18.x trở lên (khuyên dùng LTS) |
| **npm** | Đi kèm Node.js |
| **Git** | Bất kỳ (để clone repo) |
| **Trình duyệt** | Chrome, Edge, Firefox (bản mới) |

> Kiểm tra phiên bản:
> ```bash
> node -v
> npm -v
> ```

---

## 1. Cài đặt Node.js

### Windows

1. Vào [https://nodejs.org](https://nodejs.org) → tải bản **LTS**.
2. Chạy file `.msi`, bấm Next cho đến khi xong.
3. **Quan trọng:** tick ô **"Add to PATH"** nếu installer hỏi.
4. Mở **Command Prompt** hoặc **PowerShell** mới, chạy:
   ```cmd
   node -v
   npm -v
   ```
   Nếu hiện số phiên bản là OK.

**Lỗi thường gặp trên Windows:**
- `'node' is not recognized` → Cài lại Node.js, chọn "Add to PATH", rồi **đóng/mở lại terminal**.
- PowerShell chặn script → Chạy lệnh với quyền admin:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```

### macOS / Linux

```bash
# macOS (Homebrew)
brew install node

# Ubuntu/Debian
sudo apt update && sudo apt install -y nodejs npm
```

---

## 2. Clone & cài dependencies

### Windows (CMD hoặc PowerShell)

```cmd
cd C:\Users\<TenBan>\Downloads
git clone <URL-repo> project
cd project
npm install
```

### macOS / Linux

```bash
cd ~/Downloads
git clone <URL-repo> project
cd project
npm install
```

> Nếu không dùng Git, giải nén file `.zip` project rồi `cd` vào thư mục đó và chạy `npm install`.

---

## 3. Cấu hình biến môi trường (`.env`)

Tạo file `.env` ở **thư mục gốc** project (cùng cấp với `package.json`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Cách lấy giá trị Supabase

1. Đăng nhập [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Chọn project → **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

> **Lưu ý:** Hỏi team lead để lấy file `.env` sẵn nếu dùng chung project Supabase. Không commit file `.env` lên Git.

### Tạo file `.env` trên Windows

**Cách 1 — Notepad:**
```cmd
notepad .env
```
Dán nội dung ở trên, Save.

**Cách 2 — PowerShell:**
```powershell
@"
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
"@ | Out-File -Encoding utf8 .env
```

---

## 4. Setup database Supabase (chỉ lần đầu)

Project cần các bảng: `pipeline_runs`, `pipeline_logs`, `analytics_results`, `system_config`.

1. Vào Supabase Dashboard → **SQL Editor**
2. Mở file `supabase/migrations/20260608200256_ai_social_analytics_schema.sql` trong project
3. Copy toàn bộ nội dung → dán vào SQL Editor → **Run**

Nếu migration chạy thành công, dashboard sẽ đọc/ghi dữ liệu bình thường.

---

## 5. Chạy project

### Development (dev server)

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:5173/**

Dừng server: `Ctrl + C` trong terminal.

### Build production

```bash
npm run build
npm run preview
```

Preview chạy tại **http://localhost:4173/** (mặc định Vite).

### Các lệnh khác

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev server (hot reload) |
| `npm run build` | Build ra thư mục `dist/` |
| `npm run preview` | Xem bản build local |
| `npm run lint` | Kiểm tra ESLint |
| `npm run typecheck` | Kiểm tra TypeScript |

---

## 6. Cấu trúc project

```
project/
├── src/
│   ├── pages/
│   │   ├── Overview.tsx      # Trang tổng quan pipeline
│   │   ├── Pipeline.tsx      # Chạy & theo dõi pipeline
│   │   ├── Validator.tsx     # Kiểm tra từng bước
│   │   ├── Dashboard.tsx     # Biểu đồ phân tích
│   │   └── DataExplorer.tsx  # Khám phá dữ liệu
│   ├── components/           # Layout, Modal...
│   └── lib/
│       ├── supabase.ts       # Kết nối Supabase
│       └── dataGenerator.ts  # Sinh dữ liệu mô phỏng
├── supabase/migrations/      # SQL schema
├── .env                      # Biến môi trường (tự tạo, không commit)
└── package.json
```

---

## 7. Xử lý lỗi thường gặp

### `npm install` báo lỗi quyền (Windows)

Chạy terminal **Run as Administrator**, hoặc cài lại Node.js cho user hiện tại (không dùng `sudo` trên Windows).

### Port 5173 đã bị chiếm

```bash
# Windows — tìm process đang dùng port
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

Hoặc chạy port khác:
```bash
npm run dev -- --port 3000
```

### Trang trắng / lỗi Supabase

- Kiểm tra file `.env` có đúng tên biến (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Restart dev server sau khi sửa `.env` (`Ctrl+C` rồi `npm run dev` lại)
- Kiểm tra đã chạy migration SQL chưa (mục 4)

### `EACCES` / permission denied (macOS/Linux)

```bash
sudo chown -R $(whoami) ~/.npm
```

### Cảnh báo `caniuse-lite is outdated`

Không ảnh hưởng chạy app. Muốn fix:
```bash
npx update-browserslist-db@latest
```

---

## 8. Checklist setup nhanh (Windows)

- [ ] Cài Node.js LTS từ nodejs.org
- [ ] Mở CMD/PowerShell mới, `node -v` OK
- [ ] Clone/giải nén project, `cd` vào thư mục
- [ ] `npm install`
- [ ] Tạo file `.env` với URL + anon key Supabase
- [ ] Chạy migration SQL trên Supabase (lần đầu)
- [ ] `npm run dev`
- [ ] Mở http://localhost:5173/

---

## Liên hệ

Gặp lỗi setup, liên hệ người quản lý repo hoặc gửi screenshot terminal + trình duyệt (F12 → Console) để debug nhanh hơn.
