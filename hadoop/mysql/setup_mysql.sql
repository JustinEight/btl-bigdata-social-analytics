-- ============================================================
-- MySQL Setup — Tạo database và bảng nguồn cho Sqoop import
-- Chạy: mysql -u root -p < setup_mysql.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS social_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE social_db;

-- Bảng tweets (nguồn dữ liệu Twitter)
CREATE TABLE IF NOT EXISTS tweets (
  tweet_id      VARCHAR(20)  PRIMARY KEY,
  keyword       VARCHAR(50)  NOT NULL,
  username      VARCHAR(50)  NOT NULL,
  text          TEXT,
  hashtags      VARCHAR(200),
  retweet_count INT          DEFAULT 0,
  like_count    INT          DEFAULT 0,
  created_at    DATETIME,
  lang          VARCHAR(5)   DEFAULT 'en',
  location      VARCHAR(100),
  INDEX idx_keyword (keyword),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Bảng reddit_posts
CREATE TABLE IF NOT EXISTS reddit_posts (
  post_id      VARCHAR(20)  PRIMARY KEY,
  subreddit    VARCHAR(50)  NOT NULL,
  keyword      VARCHAR(50)  NOT NULL,
  title        VARCHAR(500),
  author       VARCHAR(50),
  score        INT          DEFAULT 0,
  num_comments INT          DEFAULT 0,
  url          VARCHAR(300),
  created_at   DATETIME,
  is_self      TINYINT(1)   DEFAULT 0,
  INDEX idx_subreddit (subreddit),
  INDEX idx_keyword (keyword)
) ENGINE=InnoDB;

-- Bảng reddit_comments
CREATE TABLE IF NOT EXISTS reddit_comments (
  comment_id VARCHAR(20)  PRIMARY KEY,
  post_id    VARCHAR(20)  NOT NULL,
  subreddit  VARCHAR(50)  NOT NULL,
  author     VARCHAR(50),
  body       TEXT,
  score      INT          DEFAULT 0,
  created_at DATETIME,
  keyword    VARCHAR(50),
  INDEX idx_post_id (post_id),
  INDEX idx_keyword (keyword)
) ENGINE=InnoDB;

-- Load dữ liệu từ CSV vào MySQL (chạy sau khi generate_csv.mjs xong)
-- Điều chỉnh đường dẫn file CSV cho đúng

LOAD DATA LOCAL INFILE 'C:/path/to/hadoop/data/tweets.csv'
INTO TABLE tweets
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tweet_id, keyword, username, text, hashtags,
 retweet_count, like_count, created_at, lang, location);

LOAD DATA LOCAL INFILE 'C:/path/to/hadoop/data/reddit_posts.csv'
INTO TABLE reddit_posts
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(post_id, subreddit, keyword, title, author,
 score, num_comments, url, created_at, is_self);

LOAD DATA LOCAL INFILE 'C:/path/to/hadoop/data/reddit_comments.csv'
INTO TABLE reddit_comments
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(comment_id, post_id, subreddit, author, body,
 score, created_at, keyword);

-- Kiểm tra số lượng bản ghi
SELECT 'tweets'          AS tbl, COUNT(*) AS rows FROM tweets
UNION ALL
SELECT 'reddit_posts'    AS tbl, COUNT(*) AS rows FROM reddit_posts
UNION ALL
SELECT 'reddit_comments' AS tbl, COUNT(*) AS rows FROM reddit_comments;
