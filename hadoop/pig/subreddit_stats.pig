-- ============================================================
-- Pig Script 3: Thống kê tương tác Reddit theo Subreddit
-- Chạy: pig -x mapreduce subreddit_stats.pig
-- ============================================================

comments = LOAD '/user/social_analytics/raw/reddit_comments/reddit_comments.csv'
  USING PigStorage(',')
  AS (
    comment_id:chararray, post_id:chararray, subreddit:chararray,
    author:chararray, body:chararray, score:int,
    created_at:chararray, keyword:chararray
  );

posts = LOAD '/user/social_analytics/raw/reddit_posts/reddit_posts.csv'
  USING PigStorage(',')
  AS (
    post_id:chararray, subreddit:chararray, keyword:chararray,
    title:chararray, author:chararray, score:int,
    num_comments:int, url:chararray, created_at:chararray, is_self:chararray
  );

comments_clean = FILTER comments BY comment_id != 'comment_id';
posts_clean    = FILTER posts    BY post_id    != 'post_id';

-- Thống kê comments theo subreddit
comments_grp = GROUP comments_clean BY subreddit;
comment_stats = FOREACH comments_grp GENERATE
  group                         AS subreddit,
  COUNT(comments_clean)         AS comment_count,
  AVG(comments_clean.score)     AS avg_comment_score,
  MAX(comments_clean.score)     AS max_comment_score;

-- Thống kê posts theo subreddit
posts_grp = GROUP posts_clean BY subreddit;
post_stats = FOREACH posts_grp GENERATE
  group                       AS subreddit,
  COUNT(posts_clean)          AS post_count,
  AVG(posts_clean.score)      AS avg_post_score,
  SUM(posts_clean.num_comments) AS total_comments;

-- Join hai bảng thống kê
joined = JOIN comment_stats BY subreddit, post_stats BY subreddit;

result = FOREACH joined GENERATE
  comment_stats::subreddit  AS subreddit,
  post_stats::post_count    AS post_count,
  comment_stats::comment_count AS comment_count,
  post_stats::avg_post_score   AS avg_post_score,
  comment_stats::avg_comment_score AS avg_comment_score;

sorted = ORDER result BY comment_count DESC;

STORE sorted INTO '/user/social_analytics/processed/pig_subreddit_stats'
  USING PigStorage(',');

DUMP sorted;
