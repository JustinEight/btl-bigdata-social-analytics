#!/bin/bash
# ============================================================
# Sqoop Import: MySQL → HDFS
# Sqoop mô phỏng việc collect data từ MySQL vào HDFS
# Chạy từ trong HDP Sandbox (terminal hoặc Ambari Shell)
# ============================================================

MYSQL_HOST="localhost"
MYSQL_DB="social_db"
MYSQL_USER="root"
MYSQL_PASS="hadoop"
HDFS_BASE="/user/social_analytics/raw"

echo "=== SQOOP IMPORT: MySQL → HDFS ==="

# Tạo database MySQL (chạy 1 lần)
mysql -u$MYSQL_USER -p$MYSQL_PASS -e "
  CREATE DATABASE IF NOT EXISTS $MYSQL_DB;
  USE $MYSQL_DB;
  CREATE TABLE IF NOT EXISTS tweets LIKE hive_tweets;
"

# Import bảng tweets từ MySQL vào HDFS
sqoop import \
  --connect jdbc:mysql://$MYSQL_HOST/$MYSQL_DB \
  --username $MYSQL_USER \
  --password $MYSQL_PASS \
  --table tweets \
  --target-dir $HDFS_BASE/tweets \
  --fields-terminated-by ',' \
  --lines-terminated-by '\n' \
  --num-mappers 4 \
  --delete-target-dir \
  --verbose

echo "✅ tweets imported"

# Import bảng reddit_posts
sqoop import \
  --connect jdbc:mysql://$MYSQL_HOST/$MYSQL_DB \
  --username $MYSQL_USER \
  --password $MYSQL_PASS \
  --table reddit_posts \
  --target-dir $HDFS_BASE/reddit_posts \
  --fields-terminated-by ',' \
  --num-mappers 2 \
  --delete-target-dir

echo "✅ reddit_posts imported"

# Import bảng reddit_comments
sqoop import \
  --connect jdbc:mysql://$MYSQL_HOST/$MYSQL_DB \
  --username $MYSQL_USER \
  --password $MYSQL_PASS \
  --table reddit_comments \
  --target-dir $HDFS_BASE/reddit_comments \
  --fields-terminated-by ',' \
  --num-mappers 4 \
  --delete-target-dir

echo "✅ reddit_comments imported"
echo "=== SQOOP IMPORT COMPLETE ==="
