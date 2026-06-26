# Hướng dẫn chạy Hadoop Pipeline trên HDP 2.6.5 Sandbox

## Chuẩn bị (làm 1 lần)

### Bước 1 — Tải phần mềm

| Phần mềm | Link tải | Ghi chú |
|---|---|---|
| VirtualBox 6.1 | virtualbox.org/wiki/Downloads | Chọn Windows hosts |
| HDP 2.6.5 Sandbox | cloudera.com/downloads/hortonworks-sandbox | Chọn VirtualBox (.ova) ~12GB |

> HDP Sandbox có thể tải từ link thay thế: https://archive.cloudera.com/hwx-sandbox/hdp/hdp-2.6.5/

### Bước 2 — Cài VirtualBox và Import Sandbox

1. Cài VirtualBox → Next → Next → Install
2. Mở VirtualBox → **File → Import Appliance**
3. Chọn file `.ova` vừa tải
4. Cấu hình RAM: **tối thiểu 8192 MB (8GB)**
5. Nhấn **Import** → chờ 5-10 phút

### Bước 3 — Khởi động Sandbox

1. Trong VirtualBox, chọn HDP → nhấn **Start**
2. Chờ máy ảo boot (5-10 phút lần đầu)
3. Khi thấy màn hình hiện địa chỉ IP và port → ghi lại

```
Sandbox đã khởi động thành công khi terminal hiện:
  Started HDP Sandbox
  Ambari: http://localhost:8080
  Shell: ssh root@localhost -p 2222
```

4. Mở browser → truy cập **http://localhost:8080** (Ambari UI)
   - Username: `admin`
   - Password: `admin`

---

## Chạy Pipeline (làm mỗi lần)

### Bước 4 — Copy data vào Sandbox

Mở **Command Prompt** trên Windows, chạy từng lệnh:

```bash
# Copy 3 file CSV vào trong Sandbox
scp -P 2222 hadoop/data/tweets.csv           root@localhost:~/ 
scp -P 2222 hadoop/data/reddit_posts.csv     root@localhost:~/
scp -P 2222 hadoop/data/reddit_comments.csv  root@localhost:~/
```

> Khi hỏi password: gõ `hadoop`

### Bước 5 — SSH vào Sandbox

```bash
ssh root@localhost -p 2222
# password: hadoop
```

Từ đây tất cả lệnh chạy trong terminal của Sandbox.

### Bước 6 — Tạo thư mục HDFS và Upload data

```bash
# Tạo cấu trúc thư mục trên HDFS
hdfs dfs -mkdir -p /user/social_analytics/raw/tweets
hdfs dfs -mkdir -p /user/social_analytics/raw/reddit_posts
hdfs dfs -mkdir -p /user/social_analytics/raw/reddit_comments
hdfs dfs -mkdir -p /user/social_analytics/processed

# Upload 3 file CSV lên HDFS
hdfs dfs -put ~/tweets.csv           /user/social_analytics/raw/tweets/
hdfs dfs -put ~/reddit_posts.csv     /user/social_analytics/raw/reddit_posts/
hdfs dfs -put ~/reddit_comments.csv  /user/social_analytics/raw/reddit_comments/

# Kiểm tra đã upload thành công
hdfs dfs -ls /user/social_analytics/raw/
hdfs dfs -du -h /user/social_analytics/raw/
```

**Kết quả mong đợi:**
```
/user/social_analytics/raw/reddit_comments   23M
/user/social_analytics/raw/reddit_posts     800K
/user/social_analytics/raw/tweets            14M
```

> CHỤP MÀN HÌNH lệnh này → dùng trong báo cáo (minh chứng HDFS)

### Bước 7 — Copy scripts vào Sandbox

Từ Windows CMD (không phải trong SSH):
```bash
scp -P 2222 hadoop/hive/1_create_tables.hql  root@localhost:~/
scp -P 2222 hadoop/hive/2_queries.hql        root@localhost:~/
scp -P 2222 hadoop/pig/keyword_stats.pig     root@localhost:~/
scp -P 2222 hadoop/pig/daily_keyword.pig     root@localhost:~/
scp -P 2222 hadoop/pig/subreddit_stats.pig   root@localhost:~/
```

### Bước 8 — Chạy Hive (tạo bảng + 5 queries)

```bash
# Vào lại SSH
ssh root@localhost -p 2222

# Tạo bảng
hive -f 1_create_tables.hql

# Chạy 5 queries phân tích
hive -f 2_queries.hql 2>&1 | tee hive_results.txt
```

> CHỤP MÀN HÌNH kết quả → đặc biệt phần Q1-Q5 có bảng số liệu

Hoặc chạy từng query riêng để dễ chụp màn hình:
```bash
# Chỉ chạy Q1
hive -e "USE social_analytics; SELECT keyword, COUNT(*) AS cnt FROM tweets GROUP BY keyword ORDER BY cnt DESC;"

# Chỉ chạy Q5 (Sentiment)
hive -e "USE social_analytics; SELECT keyword, SUM(CASE WHEN LOWER(body) RLIKE 'great|excellent|amazing|love' THEN 1 ELSE 0 END) AS positive, COUNT(*) AS total FROM reddit_comments GROUP BY keyword ORDER BY total DESC;"
```

### Bước 9 — Chạy Pig Scripts

```bash
# Pig script 1: Keyword stats
pig -x mapreduce keyword_stats.pig 2>&1 | tail -30

# Pig script 2: Daily trend  
pig -x mapreduce daily_keyword.pig 2>&1 | tail -30

# Pig script 3: Subreddit stats
pig -x mapreduce subreddit_stats.pig 2>&1 | tail -30

# Xem kết quả đã lưu trên HDFS
hdfs dfs -cat /user/social_analytics/processed/pig_keyword_stats/part-r-00000
```

> CHỤP MÀN HÌNH mỗi script chạy xong

### Bước 10 — Xem Ambari UI (cho demo)

Mở browser → http://localhost:8080

- **HDFS** → Files → duyệt thư mục /user/social_analytics/
- **MapReduce** → Jobs → xem các job vừa chạy
- **Hive** → Query Editor → chạy lại queries

> Ambari Web UI rất đẹp → chụp màn hình để demo cho thầy

---

## Checklist chụp màn hình cho báo cáo

- [ ] Ambari dashboard với các service xanh (HDFS, YARN, Hive, Pig)
- [ ] HDFS file browser hiển thị 3 file data
- [ ] `hdfs dfs -du -h` hiển thị kích thước file
- [ ] Hive Q1: bảng kết quả keyword count
- [ ] Hive Q2: bảng top hashtags
- [ ] Hive Q3: bảng reddit engagement
- [ ] Hive Q4: bảng daily trend
- [ ] Hive Q5: bảng sentiment analysis
- [ ] Pig script chạy xong (DUMP result)
- [ ] MapReduce jobs history

---

## Troubleshooting thường gặp

**Máy ảo boot chậm / treo:**
→ Tăng RAM lên 10GB trong VirtualBox settings

**SSH không kết nối được:**
→ Chờ thêm 2-3 phút, sandbox chưa boot xong

**Hive báo lỗi "Table not found":**
→ Chạy lại bước 6 (upload CSV) và bước 8 (tạo bảng)

**HDFS: Permission denied:**
```bash
hdfs dfs -chmod 777 /user/social_analytics
```

**Pig chạy quá lâu (> 10 phút):**
→ Bình thường, Pig chạy MapReduce jobs thật sự, cần thời gian
