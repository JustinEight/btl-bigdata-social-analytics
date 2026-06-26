-- ============================================================
-- BƯỚC 2: 5 HiveQL Queries phân tích chính
-- Chạy: hive -f 2_queries.hql
-- ============================================================

USE social_analytics;

-- ────────────────────────────────────────────────────────────
-- Q1: Đếm số lần đề cập của từng keyword trên Twitter
-- ────────────────────────────────────────────────────────────
SELECT
  keyword,
  COUNT(*)              AS mention_count,
  SUM(retweet_count)    AS total_retweets,
  SUM(like_count)       AS total_likes,
  AVG(retweet_count)    AS avg_retweets
FROM tweets
GROUP BY keyword
ORDER BY mention_count DESC;

-- ────────────────────────────────────────────────────────────
-- Q2: Top 15 Hashtag phổ biến nhất (dùng LATERAL VIEW explode)
-- ────────────────────────────────────────────────────────────
SELECT
  hashtag,
  COUNT(*) AS usage_count
FROM tweets
LATERAL VIEW explode(split(hashtags, '\\|')) ht AS hashtag
WHERE hashtag != ''
GROUP BY hashtag
ORDER BY usage_count DESC
LIMIT 15;

-- ────────────────────────────────────────────────────────────
-- Q3: Mức độ tương tác Reddit theo Subreddit
-- ────────────────────────────────────────────────────────────
SELECT
  subreddit,
  COUNT(*)              AS post_count,
  SUM(score)            AS total_score,
  AVG(score)            AS avg_score,
  SUM(num_comments)     AS total_comments,
  AVG(num_comments)     AS avg_comments
FROM reddit_posts
GROUP BY subreddit
ORDER BY avg_score DESC;

-- ────────────────────────────────────────────────────────────
-- Q4: Xu hướng tweet theo ngày (30 ngày gần nhất)
-- ────────────────────────────────────────────────────────────
SELECT
  SUBSTR(created_at, 1, 10)   AS day,
  COUNT(*)                     AS tweet_count,
  SUM(retweet_count)           AS total_retweets,
  COUNT(DISTINCT keyword)      AS active_keywords
FROM tweets
WHERE created_at >= DATE_SUB(FROM_UNIXTIME(UNIX_TIMESTAMP()), 30)
GROUP BY SUBSTR(created_at, 1, 10)
ORDER BY day ASC;

-- ────────────────────────────────────────────────────────────
-- Q5: Phân tích Sentiment theo Keyword (RLIKE matching)
-- ────────────────────────────────────────────────────────────
SELECT
  keyword,
  COUNT(*) AS total_posts,
  SUM(CASE WHEN LOWER(body) RLIKE
    'great|excellent|amazing|love|best|awesome|fantastic|incredible|perfect|brilliant'
    THEN 1 ELSE 0 END) AS positive_count,
  SUM(CASE WHEN LOWER(body) RLIKE
    'bad|terrible|hate|worst|awful|horrible|poor|useless|disappointing|broken'
    THEN 1 ELSE 0 END) AS negative_count,
  SUM(CASE WHEN LOWER(body) NOT RLIKE
    'great|excellent|amazing|love|best|awesome|bad|terrible|hate|worst|awful'
    THEN 1 ELSE 0 END) AS neutral_count,
  ROUND(SUM(CASE WHEN LOWER(body) RLIKE
    'great|excellent|amazing|love|best|awesome|fantastic|incredible|perfect|brilliant'
    THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS positive_pct
FROM reddit_comments
GROUP BY keyword
ORDER BY total_posts DESC;
