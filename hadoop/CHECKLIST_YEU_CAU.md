# CHECKLIST — Đối chiếu Yêu cầu BTL với File thực tế

> Dùng tài liệu này khi viết báo cáo và khi thầy hỏi
> GitHub: https://github.com/JustinEight/btl-bigdata-social-analytics

---

## PHẦN 1 — Lưu trữ dữ liệu (HDFS / HBase)

### ✅ 1.1 Cài đặt và cấu hình HDFS
**Yêu cầu:** Cài đặt và cấu hình HDFS trên HDP 2.6.5

**File:** `hadoop/hdfs/setup_hdfs.sh`
**Nội dung cụ thể:**
- Dòng 9–14: Tạo cấu trúc thư mục HDFS (`hdfs dfs -mkdir`)
- Dòng 17–18: Cấu hình quyền truy cập (`chmod 755`, `chown`)
- Dòng 26–27: Kiểm tra replication factor (`hdfs -stat "%r"`)
- Dòng 28: Kiểm tra block distribution (`hdfs fsck ... -files -blocks -locations`)

**Lệnh chứng minh với thầy:**
```bash
hdfs fsck /user/social_analytics/raw/tweets/ -files -blocks -locations
hdfs dfs -du -h /user/social_analytics/raw/
```

**Screenshot cần chụp:** Kết quả `hdfs fsck` hiển thị số blocks và replication

---

### ✅ 1.2 Lưu trữ dữ liệu vào HDFS
**Yêu cầu:** Lưu trữ bộ dữ liệu đã chọn vào hệ thống

**File:** `hadoop/hdfs/setup_hdfs.sh`
**Nội dung cụ thể:**
- Dòng 21–23: Upload 3 file CSV lên HDFS (`hdfs dfs -put`)
  - `tweets.csv` → `/user/social_analytics/raw/tweets/`
  - `reddit_posts.csv` → `/user/social_analytics/raw/reddit_posts/`
  - `reddit_comments.csv` → `/user/social_analytics/raw/reddit_comments/`
- Dòng 30–31: Kiểm tra cấu trúc (`hdfs dfs -ls -R`, `hdfs dfs -du -h`)

**Dataset:** `hadoop/data/generate_csv.mjs` → tạo ra 1 tỷ dòng tổng cộng
- `tweets.csv`: 500 triệu dòng
- `reddit_posts.csv`: 10 triệu dòng
- `reddit_comments.csv`: 490 triệu dòng

**Screenshot cần chụp:** `hdfs dfs -ls -R /user/social_analytics/` và `hdfs dfs -du -h`

---

### ✅ 1.3 HBase — Cấu trúc bảng
**Yêu cầu:** Cấu trúc thư mục hoặc bảng HBase

**File:** `hadoop/hbase/setup_hbase.sh`
**Nội dung cụ thể:**
- Dòng 12–17: Tạo bảng `keywords_index` với 3 column families:
  - `tweet_info` (VERSIONS=1): lưu keyword, username, text
  - `metrics` (VERSIONS=3): retweet_count, like_count
  - `metadata` (VERSIONS=1): created_at
- Dòng 19–23: Tạo bảng `social_stats` với 3 column families:
  - `keyword_stats` (VERSIONS=5): mention_count, total_retweets
  - `daily_stats` (VERSIONS=1): xu hướng theo ngày
  - `sentiment` (VERSIONS=1): phân tích cảm xúc
- Dòng 26–39: Thêm dữ liệu mẫu (`put`) và đọc lại (`get`)

**Row key design:**
- `keywords_index`: `{keyword}_{tweet_id}` (VD: `ChatGPT_t_0000001`)
- `social_stats`: `{keyword}` (VD: `ChatGPT`)

**Screenshot cần chụp:** `describe 'keywords_index'` và `get 'keywords_index', 'ChatGPT_t_0000001'`

---

## PHẦN 2 — Thu thập dữ liệu (Data Ingestion)

### ✅ 2.1 Sqoop — Import từ MySQL vào HDFS
**Yêu cầu:** Sử dụng Sqoop để nhập dữ liệu từ MySQL vào HDFS

**File:** `hadoop/sqoop/import_commands.sh`
**Nội dung cụ thể:**
- Dòng 8–12: Khai báo biến kết nối MySQL (host, db, user, pass)
- Dòng 22–32: Sqoop import bảng `tweets` → HDFS (4 mappers)
- Dòng 35–42: Sqoop import bảng `reddit_posts` → HDFS (2 mappers)
- Dòng 45–52: Sqoop import bảng `reddit_comments` → HDFS (4 mappers)

**File nguồn MySQL:** `hadoop/mysql/setup_mysql.sql`
- Tạo database `social_db`
- Tạo 3 bảng với đầy đủ index
- Load dữ liệu từ CSV vào MySQL (`LOAD DATA LOCAL INFILE`)

**Lệnh Sqoop chứng minh:**
```bash
sqoop import --connect jdbc:mysql://localhost/social_db \
  --username root --password hadoop --table tweets \
  --target-dir /user/social_analytics/raw/tweets --num-mappers 4
```

**Screenshot cần chụp:** Log Sqoop chạy hiển thị số records imported

---

### ✅ 2.2 Flume — Thu thập log và đẩy vào HDFS
**Yêu cầu:** Sử dụng Flume để thu thập dữ liệu dạng log và chuyển đến HDFS

**File:** `hadoop/flume/flume-agent.conf`
**Nội dung cụ thể:**

*Sources (2 nguồn):*
- Dòng 14: `twitter_source` — SpoolDir source theo dõi `/home/user/data/incoming/tweets`
- Dòng 24: `reddit_source` — SpoolDir source theo dõi `/home/user/data/incoming/reddit`
- Dòng 20–21: `batchSize=1000`, `fileSuffix=.COMPLETED` (đánh dấu file đã xử lý)

*Channels (2 kênh):*
- Dòng 33–36: `mem_channel` — Memory Channel capacity=100,000 (tốc độ cao cho tweets)
- Dòng 39–44: `file_channel` — File Channel có checkpoint (an toàn hơn cho reddit)

*Sinks (2 đích):*
- Dòng 47–58: `hdfs_sink_tweets` → ghi vào `hdfs://.../raw/tweets/%Y-%m-%d/`
  - `rollInterval=3600` (cuộn file mỗi 1 giờ)
  - `rollSize=134217728` (cuộn khi file đạt 128 MB)
- Dòng 61–72: `hdfs_sink_reddit` → ghi vào `hdfs://.../raw/reddit_posts/%Y-%m-%d/`

**Lệnh khởi động Flume:**
```bash
flume-ng agent --conf /etc/flume/conf \
  --conf-file flume-agent.conf \
  --name social_agent \
  -Dflume.root.logger=INFO,console
```

**Screenshot cần chụp:** Log Flume hiển thị "Appending to file..." và file xuất hiện trên HDFS

---

## PHẦN 3 — Xử lý dữ liệu (Data Processing)

### ✅ 3.1 Hive — Tạo bảng và 5 queries phân tích
**Yêu cầu:** Thực hiện truy vấn phân tích bằng Hive (SQL-on-Hadoop)

**File 1:** `hadoop/hive/1_create_tables.hql`
- Dòng 7–9: Tạo database `social_analytics`
- Dòng 12–26: Tạo EXTERNAL TABLE `tweets` (10 cột, TEXTFILE, skip header)
- Dòng 29–42: Tạo EXTERNAL TABLE `reddit_posts`
- Dòng 45–57: Tạo EXTERNAL TABLE `reddit_comments`
- Dòng 60–66: Kiểm tra số dòng (UNION ALL COUNT)

**File 2:** `hadoop/hive/2_queries.hql`
- **Q1** (Dòng 10–18): Keyword frequency — COUNT, SUM retweets/likes, AVG, GROUP BY keyword
- **Q2** (Dòng 21–31): Top hashtags — `LATERAL VIEW explode(split(hashtags,'\\|'))`, LIMIT 15
- **Q3** (Dòng 34–44): Reddit engagement — AVG score, AVG comments, GROUP BY subreddit
- **Q4** (Dòng 47–56): Daily trend — `SUBSTR(created_at,1,10)`, DATE_SUB 30 ngày, GROUP BY day
- **Q5** (Dòng 59–79): Sentiment — `RLIKE` positive/negative keywords, tính `positive_pct`

**Lệnh chạy:**
```bash
hive -f 1_create_tables.hql
hive -f 2_queries.hql 2>&1 | tee hive_results.txt
```

**Screenshot cần chụp:** Kết quả bảng của từng query (Q1–Q5)

---

### ✅ 3.2 Pig — 3 scripts xử lý dữ liệu
**Yêu cầu:** Thực hiện xử lý bằng Pig Script

**Script 1:** `hadoop/pig/keyword_stats.pig`
- LOAD tweets từ HDFS → FILTER bỏ header → GROUP BY keyword
- FOREACH: COUNT, SUM retweets, SUM likes, AVG, MAX → ORDER DESC
- STORE → `/user/social_analytics/processed/pig_keyword_stats`

**Script 2:** `hadoop/pig/daily_keyword.pig`
- LOAD tweets → FOREACH lấy `SUBSTRING(created_at,0,10)` làm ngày
- GROUP BY (day, keyword) → COUNT + SUM retweets theo ngày
- ORDER ASC theo ngày → STORE

**Script 3:** `hadoop/pig/subreddit_stats.pig`
- LOAD cả `reddit_comments` VÀ `reddit_posts`
- Thống kê riêng từng bảng → JOIN hai bảng theo subreddit
- Kết quả: post_count, comment_count, avg_post_score, avg_comment_score

**Lệnh chạy:**
```bash
pig -x mapreduce keyword_stats.pig
pig -x mapreduce daily_keyword.pig
pig -x mapreduce subreddit_stats.pig
```

**Screenshot cần chụp:** `DUMP result` hiển thị kết quả cuối mỗi script

---

## PHẦN 4 — Điều phối luồng công việc (Oozie)

### ✅ 4.1 Oozie Workflow — Pipeline tự động
**Yêu cầu:** Oozie pipeline gồm thu thập → lưu trữ → xử lý

**File:** `hadoop/oozie/workflow.xml`
**Sơ đồ workflow:**
```
START
  ↓
[sqoop-import]  — Import từ MySQL vào HDFS
  ↓
[hive-create-tables]  — Tạo Hive tables trên data vừa import
  ↓
[hive-queries]  — Chạy 5 queries phân tích
  ↓
[pig-keyword-stats]  — Pig script 1
  ↓
[pig-daily-keyword]  — Pig script 2
  ↓
[pig-subreddit-stats]  — Pig script 3
  ↓
END
```

**Actions trong workflow.xml:**
- `sqoop-import` (dòng 7–18): Sqoop action import tweets
- `hive-create-tables` (dòng 21–29): Hive action tạo bảng
- `hive-queries` (dòng 32–40): Hive action chạy queries
- `pig-keyword-stats` (dòng 43–50): Pig action script 1
- `pig-daily-keyword` (dòng 53–60): Pig action script 2
- `pig-subreddit-stats` (dòng 63–70): Pig action script 3

---

### ✅ 4.2 Oozie Job Properties
**File:** `hadoop/oozie/job.properties`
- `oozie.url`: http://localhost:11000/oozie
- `nameNode`: hdfs://localhost:8020
- `jobTracker`: localhost:8050
- `oozie.wf.application.path`: đường dẫn workflow trên HDFS
- MySQL connection, output directories

---

### ✅ 4.3 Oozie Coordinator — Lên lịch tự động
**File:** `hadoop/oozie/coordinator.xml`
- `frequency="${coord:days(1)}"`: chạy mỗi ngày
- `start="2024-01-01T02:00Z"`: bắt đầu từ 2:00 AM
- `timezone="Asia/Ho_Chi_Minh"`: múi giờ VN
- Dataset `tweets_dataset`: theo dõi dữ liệu mới theo ngày
- Tự động gọi `workflow.xml` khi có data mới

**Lệnh chạy:**
```bash
# Upload lên HDFS trước
hdfs dfs -put workflow.xml /user/oozie/social_analytics/
hdfs dfs -put coordinator.xml /user/oozie/social_analytics/

# Chạy pipeline
oozie job -config job.properties -run

# Theo dõi trạng thái
oozie job -info <job-id>
```

**Screenshot cần chụp:** Ambari Oozie UI hiển thị workflow SUCCEEDED

---

## PHẦN NỘP KÈM

### ✅ Dataset
**File:** `hadoop/data/generate_csv.mjs`
- Cấu hình: 1 tỷ dòng tổng (500M tweets + 10M posts + 490M comments)
- Chạy `node generate_csv.mjs` trên Windows để sinh data (~3–5 tiếng)
- Kích thước ước tính: ~131 GB

### ✅ Tất cả config files (.conf, .xml, .properties, .pig, .sql, .sh)
```
hadoop/
├── flume/flume-agent.conf      ← Flume agent config
├── hdfs/setup_hdfs.sh          ← HDFS setup + replication check
├── hbase/setup_hbase.sh        ← HBase table creation
├── mysql/setup_mysql.sql       ← MySQL source tables
├── sqoop/import_commands.sh    ← Sqoop import commands
├── hive/1_create_tables.hql    ← Hive DDL
├── hive/2_queries.hql          ← 5 HiveQL queries
├── pig/keyword_stats.pig       ← Pig script 1
├── pig/daily_keyword.pig       ← Pig script 2
├── pig/subreddit_stats.pig     ← Pig script 3
├── oozie/workflow.xml          ← Oozie workflow
├── oozie/coordinator.xml       ← Oozie scheduler
└── oozie/job.properties        ← Oozie connection config
```

---

## ⚠️ PHẦN CÒN THIẾU — Bạn phải tự làm

### ❌ Phân công công việc (bắt buộc trong báo cáo)
Thầy sẽ hỏi trực tiếp. Cần điền vào báo cáo PDF:

| Thành viên | MSSV | Phần đảm nhận |
|---|---|---|
| [Tên 1] | [MSSV] | Thu thập dữ liệu, Flume, HDFS |
| [Tên 2] | [MSSV] | Sqoop, MySQL, HBase |
| [Tên 3] | [MSSV] | Hive queries, phân tích kết quả |
| [Tên 4] | [MSSV] | Pig scripts, Oozie workflow |
| [Tên 5] | [MSSV] | Báo cáo, web dashboard |

### ❌ Screenshots từ HDP Sandbox (chứng minh chạy thật)
Cần chụp sau khi chạy trên Windows:
- [ ] Ambari dashboard — tất cả services màu xanh
- [ ] HDFS browser — thấy 3 file data
- [ ] `hdfs fsck` — block + replication info
- [ ] HBase shell — `describe 'keywords_index'`
- [ ] Sqoop log — số records imported
- [ ] Flume log — data flowing to HDFS
- [ ] Hive Q1–Q5 — bảng kết quả
- [ ] Pig DUMP — kết quả 3 scripts
- [ ] Oozie UI — workflow SUCCEEDED
