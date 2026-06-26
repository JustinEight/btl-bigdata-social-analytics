-- ============================================================
-- Pig Script 2: Xu hướng keyword theo ngày
-- Chạy: pig -x mapreduce daily_keyword.pig
-- ============================================================

tweets = LOAD '/user/social_analytics/raw/tweets/tweets.csv'
  USING PigStorage(',')
  AS (
    tweet_id:chararray, keyword:chararray, username:chararray,
    text:chararray, hashtags:chararray, retweet_count:int,
    like_count:int, created_at:chararray, lang:chararray, location:chararray
  );

tweets_clean = FILTER tweets BY tweet_id != 'tweet_id';

-- Lấy ngày (10 ký tự đầu của created_at: YYYY-MM-DD)
with_date = FOREACH tweets_clean GENERATE
  SUBSTRING(created_at, 0, 10) AS day,
  keyword,
  retweet_count,
  like_count;

-- Group theo keyword + ngày
grouped = GROUP with_date BY (day, keyword);

daily_stats = FOREACH grouped GENERATE
  FLATTEN(group)              AS (day, keyword),
  COUNT(with_date)            AS daily_count,
  SUM(with_date.retweet_count) AS daily_retweets;

result = ORDER daily_stats BY day ASC, daily_count DESC;

STORE result INTO '/user/social_analytics/processed/pig_daily_keyword'
  USING PigStorage(',');

DUMP result;
