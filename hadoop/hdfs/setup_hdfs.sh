#!/bin/bash
# ============================================================
# HDFS Setup Script — Tạo cấu trúc thư mục, cấu hình replication
# Chạy: bash setup_hdfs.sh
# ============================================================

echo "=== HDFS SETUP ==="

# 1. Tạo cấu trúc thư mục
echo "[1/5] Tạo thư mục HDFS..."
hdfs dfs -mkdir -p /user/social_analytics/raw/tweets
hdfs dfs -mkdir -p /user/social_analytics/raw/reddit_posts
hdfs dfs -mkdir -p /user/social_analytics/raw/reddit_comments
hdfs dfs -mkdir -p /user/social_analytics/processed
hdfs dfs -mkdir -p /user/social_analytics/logs

# 2. Cấu hình quyền truy cập
echo "[2/5] Cấu hình permissions..."
hdfs dfs -chmod -R 755 /user/social_analytics
hdfs dfs -chown -R hdfs:hdfs /user/social_analytics

# 3. Upload dữ liệu lên HDFS
echo "[3/5] Upload data files..."
hdfs dfs -put -f tweets.csv           /user/social_analytics/raw/tweets/
hdfs dfs -put -f reddit_posts.csv     /user/social_analytics/raw/reddit_posts/
hdfs dfs -put -f reddit_comments.csv  /user/social_analytics/raw/reddit_comments/

# 4. Kiểm tra replication factor (mặc định = 3 trên cluster thật)
echo "[4/5] Kiểm tra replication..."
hdfs dfs -stat "%r" /user/social_analytics/raw/tweets/tweets.csv
# Xem block info
hdfs fsck /user/social_analytics/raw/tweets/ -files -blocks -locations

# 5. Kiểm tra kích thước và cấu trúc
echo "[5/5] Kiểm tra cấu trúc HDFS..."
hdfs dfs -ls -R /user/social_analytics/
hdfs dfs -du -h /user/social_analytics/raw/

echo ""
echo "=== HDFS SETUP HOÀN THÀNH ==="
echo "Cấu trúc thư mục:"
echo "  /user/social_analytics/"
echo "  ├── raw/"
echo "  │   ├── tweets/           (tweets.csv)"
echo "  │   ├── reddit_posts/     (reddit_posts.csv)"
echo "  │   └── reddit_comments/  (reddit_comments.csv)"
echo "  └── processed/            (kết quả Hive/Pig)"
