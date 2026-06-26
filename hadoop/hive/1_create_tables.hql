-- ============================================================
-- BƯỚC 1: Tạo database và các bảng Hive
-- Chạy: hive -f 1_create_tables.hql
-- ============================================================

CREATE DATABASE IF NOT EXISTS social_analytics
  COMMENT 'Social media big data analytics'
  LOCATION '/user/social_analytics/';

USE social_analytics;

-- Bảng 1: Tweets (100,000 rows)
CREATE EXTERNAL TABLE IF NOT EXISTS tweets (
  tweet_id      STRING,
  keyword       STRING,
  username      STRING,
  text          STRING,
  hashtags      STRING,
  retweet_count INT,
  like_count    INT,
  created_at    STRING,
  lang          STRING,
  location      STRING
)
ROW FORMAT DELIMITED
  FIELDS TERMINATED BY ','
  LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION '/user/social_analytics/raw/tweets/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Bảng 2: Reddit Posts (5,000 rows)
CREATE EXTERNAL TABLE IF NOT EXISTS reddit_posts (
  post_id      STRING,
  subreddit    STRING,
  keyword      STRING,
  title        STRING,
  author       STRING,
  score        INT,
  num_comments INT,
  url          STRING,
  created_at   STRING,
  is_self      STRING
)
ROW FORMAT DELIMITED
  FIELDS TERMINATED BY ','
  LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION '/user/social_analytics/raw/reddit_posts/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Bảng 3: Reddit Comments (190,000 rows)
CREATE EXTERNAL TABLE IF NOT EXISTS reddit_comments (
  comment_id STRING,
  post_id    STRING,
  subreddit  STRING,
  author     STRING,
  body       STRING,
  score      INT,
  created_at STRING,
  keyword    STRING
)
ROW FORMAT DELIMITED
  FIELDS TERMINATED BY ','
  LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION '/user/social_analytics/raw/reddit_comments/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Kiểm tra bảng đã tạo
SHOW TABLES;

-- Xem cấu trúc bảng
DESCRIBE tweets;
DESCRIBE reddit_posts;
DESCRIBE reddit_comments;

-- Kiểm tra số dòng
SELECT 'tweets'           AS table_name, COUNT(*) AS row_count FROM tweets
UNION ALL
SELECT 'reddit_posts'     AS table_name, COUNT(*) AS row_count FROM reddit_posts
UNION ALL
SELECT 'reddit_comments'  AS table_name, COUNT(*) AS row_count FROM reddit_comments;
