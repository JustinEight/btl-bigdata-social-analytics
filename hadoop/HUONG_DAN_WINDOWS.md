# Hướng dẫn Setup Windows — BTL Big Data Social Analytics

> Dùng file này để setup từ đầu trên máy Windows với HDP 2.6.5 Sandbox

---

## YÊU CẦU MÁY TÍNH

| Thứ | Tối thiểu | Khuyến nghị |
|-----|-----------|-------------|
| RAM | 12 GB | 16 GB |
| CPU | 4 cores | 8 cores |
| Ổ đĩa | 50 GB trống | 200 GB trống |
| OS | Windows 10 64-bit | Windows 10/11 64-bit |

---

## PHẦN 1 — CÀI ĐẶT PHẦN MỀM (làm 1 lần)

### 1.1 Tải về

| Phần mềm | Link | Ghi chú |
|---|---|---|
| **VirtualBox 6.1** | https://www.virtualbox.org/wiki/Downloads | Chọn "Windows hosts" |
| **VirtualBox Extension Pack** | Cùng trang trên | Cùng version với VirtualBox |
| **HDP 2.6.5 Sandbox (.ova)** | https://archive.cloudera.com/hwx-sandbox/hdp/hdp-2.6.5/ | File ~12GB, tải lâu |
| **Node.js LTS** | https://nodejs.org | Để chạy script sinh CSV |
| **Git** | https://git-scm.com | Để clone project |

### 1.2 Cài VirtualBox

1. Chạy file cài VirtualBox → **Next → Next → Install**
2. Chạy file **Extension Pack** → **Install** → Đồng ý license
3. Mở VirtualBox → đảm bảo chạy được

### 1.3 Import HDP Sandbox

1. Mở VirtualBox → **File → Import Appliance**
2. Chọn file `.ova` đã tải → **Next**
3. **Cấu hình RAM: 8192 MB** (bắt buộc, tối thiểu 8GB)
4. CPU: 2-4 cores nếu có
5. Nhấn **Import** → chờ 10-15 phút
6. Sau khi import xong, VÀO SETTINGS trước khi khởi động:
   - **Settings → Network → Adapter 1 → Port Forwarding**
   - Đảm bảo có các rule:
     ```
     SSH:    Host 2222  → Guest 22
     Ambari: Host 8080  → Guest 8080
     Oozie:  Host 11000 → Guest 11000
     ```

### 1.4 Khởi động Sandbox lần đầu

1. Chọn HDP Sandbox → **Start** (mũi tên xanh)
2. Chờ 10-15 phút (lần đầu lâu)
3. Khi màn hình VM hiện thông báo sandbox sẵn sàng:
   - Mở browser: **http://localhost:8080**
   - Login: `admin` / `admin`
4. **Đổi mật khẩu root** (cần cho SSH):
   - Trong màn hình VM, đăng nhập: `root` / `hadoop`
   - Nếu bị yêu cầu đổi pass → đổi thành `hadoop`

---

## PHẦN 2 — LẤY PROJECT (làm 1 lần)

Mở **PowerShell** hoặc **Command Prompt**, chạy:

```powershell
# Clone project từ GitHub
git clone https://github.com/JustinEight/btl-bigdata-social-analytics.git
cd btl-bigdata-social-analytics
```

---

## PHẦN 3 — CHẠY TỰ ĐỘNG (khuyến nghị)

> Cách nhanh nhất: dùng script PowerShell có sẵn

```powershell
# Trong thư mục project:
cd btl-bigdata-social-analytics
.\hadoop\setup_windows.ps1
```

Script sẽ:
- Sinh file CSV tự động
- Copy tất cả file lên Sandbox
- Chạy từng bước pipeline (hỏi trước khi chạy)
- Nhắc chụp màn hình đúng lúc

> **Nếu bị lỗi** "cannot be loaded because running scripts is disabled":
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

## PHẦN 4 — CHẠY THỦ CÔNG (từng bước)

Nếu muốn chạy từng lệnh một để chụp màn hình rõ hơn.

### Bước 1: Sinh dữ liệu CSV

```powershell
cd btl-bigdata-social-analytics\hadoop\data
node generate_csv.mjs
```

Chờ hoàn thành. Kiểm tra 3 file xuất hiện:
- `tweets.csv`
- `reddit_posts.csv`
- `reddit_comments.csv`

> **Ghi chú**: File mặc định là 1 tỷ dòng (~131GB, mất 3-5 tiếng). Để test nhanh, mở `generate_csv.mjs` và đổi:
> ```js
> const TWEET_COUNT   = 100_000;   // thay vì 500_000_000
> const POST_COUNT    = 5_000;     // thay vì 10_000_000
> const COMMENT_COUNT = 50_000;    // thay vì 490_000_000
> ```

### Bước 2: Copy files lên Sandbox

Mở **PowerShell**, chạy từng lệnh (password: `hadoop`):

```powershell
# Chuyển vào thư mục project
cd btl-bigdata-social-analytics

# Copy 3 file CSV
scp -P 2222 hadoop\data\tweets.csv          root@localhost:~/
scp -P 2222 hadoop\data\reddit_posts.csv    root@localhost:~/
scp -P 2222 hadoop\data\reddit_comments.csv root@localhost:~/

# Copy toàn bộ scripts
scp -P 2222 hadoop\mysql\setup_mysql.sql       root@localhost:~/
scp -P 2222 hadoop\hdfs\setup_hdfs.sh          root@localhost:~/
scp -P 2222 hadoop\hbase\setup_hbase.sh        root@localhost:~/
scp -P 2222 hadoop\sqoop\import_commands.sh    root@localhost:~/
scp -P 2222 hadoop\hive\1_create_tables.hql    root@localhost:~/
scp -P 2222 hadoop\hive\2_queries.hql          root@localhost:~/
scp -P 2222 hadoop\pig\keyword_stats.pig       root@localhost:~/
scp -P 2222 hadoop\pig\daily_keyword.pig       root@localhost:~/
scp -P 2222 hadoop\pig\subreddit_stats.pig     root@localhost:~/
scp -P 2222 hadoop\flume\flume-agent.conf      root@localhost:~/
scp -P 2222 hadoop\oozie\workflow.xml          root@localhost:~/
scp -P 2222 hadoop\oozie\coordinator.xml       root@localhost:~/
scp -P 2222 hadoop\oozie\job.properties        root@localhost:~/
```

### Bước 3: SSH vào Sandbox

```powershell
ssh root@localhost -p 2222
# Password: hadoop
```

**Từ đây tất cả lệnh chạy bên trong Sandbox (Linux).**

### Bước 4: Setup HDFS

```bash
bash setup_hdfs.sh
```

Kiểm tra:
```bash
hdfs dfs -ls /user/social_analytics/raw/
hdfs dfs -du -h /user/social_analytics/raw/
```

📸 **CHỤP MÀN HÌNH**: kết quả `hdfs dfs -du -h`

### Bước 5: Setup MySQL

```bash
mysql -u root -phadoop < setup_mysql.sql
```

Kiểm tra:
```bash
mysql -u root -phadoop -e "
  USE social_db;
  SELECT 'tweets' AS tbl, COUNT(*) AS rows FROM tweets
  UNION ALL
  SELECT 'reddit_posts', COUNT(*) FROM reddit_posts
  UNION ALL
  SELECT 'reddit_comments', COUNT(*) FROM reddit_comments;
"
```

📸 **CHỤP MÀN HÌNH**: bảng kết quả COUNT(*)

### Bước 6: Setup HBase

```bash
bash setup_hbase.sh
```

Kiểm tra trong HBase shell:
```bash
hbase shell
list
describe 'keywords_index'
get 'keywords_index', 'ChatGPT_t_0000001'
exit
```

📸 **CHỤP MÀN HÌNH**: kết quả `describe 'keywords_index'`

### Bước 7: Sqoop Import

```bash
bash import_commands.sh
```

> Sqoop sẽ tạo MapReduce jobs để import từ MySQL → HDFS. Có thể mất 5-15 phút.

📸 **CHỤP MÀN HÌNH**: log Sqoop hiện "Retrieved X records from MySQL"

### Bước 8: Hive — Tạo bảng

```bash
hive -f 1_create_tables.hql
```

Kiểm tra:
```bash
hive -e "USE social_analytics; SHOW TABLES;"
hive -e "USE social_analytics; SELECT COUNT(*) FROM tweets;"
```

### Bước 9: Hive — 5 Queries phân tích

```bash
# Chạy tất cả 5 queries
hive -f 2_queries.hql 2>&1 | tee hive_results.txt

# Hoặc chạy từng query để dễ chụp màn hình:

# Q1: Top keywords
hive -e "USE social_analytics;
SELECT keyword, COUNT(*) AS mention_count
FROM tweets
GROUP BY keyword
ORDER BY mention_count DESC
LIMIT 10;"

# Q5: Sentiment
hive -e "USE social_analytics;
SELECT keyword,
  SUM(CASE WHEN LOWER(body) RLIKE 'great|love|excellent|amazing|good' THEN 1 ELSE 0 END) AS positive,
  SUM(CASE WHEN LOWER(body) RLIKE 'bad|terrible|hate|awful|worst' THEN 1 ELSE 0 END) AS negative,
  COUNT(*) AS total
FROM reddit_comments
GROUP BY keyword
ORDER BY total DESC
LIMIT 10;"
```

📸 **CHỤP MÀN HÌNH**: kết quả mỗi query (Q1 → Q5)

### Bước 10: Pig Scripts

```bash
# Script 1
pig -x mapreduce keyword_stats.pig
hdfs dfs -cat /user/social_analytics/processed/pig_keyword_stats/part-r-00000 | head -10

# Script 2
pig -x mapreduce daily_keyword.pig
hdfs dfs -cat /user/social_analytics/processed/pig_daily_keyword/part-r-00000 | head -10

# Script 3
pig -x mapreduce subreddit_stats.pig
hdfs dfs -cat /user/social_analytics/processed/pig_subreddit_stats/part-r-00000 | head -10
```

📸 **CHỤP MÀN HÌNH**: mỗi lần `hdfs dfs -cat` có kết quả

### Bước 11: Flume (demo thu thập)

```bash
# Tạo thư mục input cho Flume
mkdir -p /home/user/data/incoming/tweets
mkdir -p /home/user/data/incoming/reddit

# Copy file vào để Flume thu thập
cp ~/tweets.csv /home/user/data/incoming/tweets/tweets_demo.csv

# Chạy Flume agent (Ctrl+C để dừng sau khi chụp màn hình)
flume-ng agent \
  --conf /etc/flume/conf \
  --conf-file ~/flume-agent.conf \
  --name social_agent \
  -Dflume.root.logger=INFO,console
```

📸 **CHỤP MÀN HÌNH**: log hiện "Appending to file: /user/social_analytics/raw/tweets/..."

### Bước 12: Oozie Workflow

```bash
# Upload workflow lên HDFS
hdfs dfs -mkdir -p /user/oozie/social_analytics
hdfs dfs -put workflow.xml    /user/oozie/social_analytics/
hdfs dfs -put coordinator.xml /user/oozie/social_analytics/

# Chạy pipeline qua Oozie
oozie job -config job.properties -run
```

Xem trạng thái:
```bash
oozie jobs -jobtype wf
# Hoặc mở browser: http://localhost:11000/oozie
```

📸 **CHỤP MÀN HÌNH**: Oozie UI hiện workflow RUNNING/SUCCEEDED

---

## PHẦN 5 — AMBARI UI (demo đẹp)

Mở browser trên Windows: **http://localhost:8080**
- Login: `admin` / `admin`

Các màn hình cần chụp:
- **Dashboard** → tất cả services màu xanh (HDFS, YARN, Hive, Pig, HBase, Oozie)
- **HDFS → Files** → duyệt `/user/social_analytics/`
- **MapReduce → Jobs** → xem các job vừa chạy
- **Hive → Query Editor** → chạy lại Q1 và xem kết quả

---

## XỬ LÝ LỖI THƯỜNG GẶP

### SSH không kết nối được
```
ssh: connect to host localhost port 2222: Connection refused
```
→ Sandbox chưa boot xong, chờ thêm 3-5 phút  
→ Kiểm tra Port Forwarding trong VirtualBox settings

### SCP báo lỗi đường dẫn (Windows)
```
scp: ambiguous target
```
→ Dùng dấu `/` thay vì `\` trong đường dẫn  
→ Hoặc dùng `.\hadoop\data\tweets.csv`

### MySQL: Access denied
```bash
# Đổi lại mật khẩu MySQL trong sandbox:
mysqladmin -u root password 'hadoop'
```

### Hive: Could not connect to meta store
```bash
# Khởi động lại Hive Metastore:
ambari-agent restart
# Hoặc qua Ambari UI: Hive → Service Actions → Restart All
```

### Pig: ERROR 2997
```bash
# Kiểm tra YARN đang chạy:
yarn node -list
# Nếu không có node → restart YARN qua Ambari
```

### HDFS: Disk space full
```bash
# Xóa trash và dọn dẹp:
hdfs dfs -rm -r /user/root/.Trash
hdfs dfsadmin -report
```

---

## THỨ TỰ CHỤP MÀN HÌNH CHO BÁO CÁO

| # | Màn hình | Bước |
|---|---|---|
| 1 | Ambari Dashboard — tất cả services xanh | Trước khi bắt đầu |
| 2 | `hdfs dfs -du -h` — kích thước 3 file CSV | Sau Bước 4 |
| 3 | MySQL COUNT(*) — số dòng 3 bảng | Sau Bước 5 |
| 4 | HBase `describe 'keywords_index'` | Sau Bước 6 |
| 5 | Sqoop log — "Retrieved X records" | Sau Bước 7 |
| 6 | Hive Q1 — bảng keyword count | Bước 9 |
| 7 | Hive Q5 — bảng sentiment | Bước 9 |
| 8 | Pig DUMP keyword_stats | Bước 10 |
| 9 | Flume log — "Appending to file..." | Bước 11 |
| 10 | Oozie UI — workflow SUCCEEDED | Bước 12 |
