-- ============================================================
-- Pig Script 1: Thống kê từ khóa từ tweets
-- Chạy: pig -x mapreduce keyword_stats.pig
-- ============================================================

-- Bước 1: Load dữ liệu từ HDFS
tweets = LOAD '/user/social_analytics/raw/tweets/tweets.csv'
  USING PigStorage(',')
  AS (
    tweet_id:chararray,
    keyword:chararray,
    username:chararray,
    text:chararray,
    hashtags:chararray,
    retweet_count:int,
    like_count:int,
    created_at:chararray,
    lang:chararray,
    location:chararray
  );

-- Bước 2: Bỏ dòng header
tweets_clean = FILTER tweets BY tweet_id != 'tweet_id';

-- Bước 3: Group theo keyword
grouped = GROUP tweets_clean BY keyword;

-- Bước 4: Tính toán thống kê
keyword_stats = FOREACH grouped GENERATE
  group                              AS keyword,
  COUNT(tweets_clean)                AS mention_count,
  SUM(tweets_clean.retweet_count)    AS total_retweets,
  SUM(tweets_clean.like_count)       AS total_likes,
  AVG(tweets_clean.retweet_count)    AS avg_retweets,
  MAX(tweets_clean.retweet_count)    AS max_retweets;

-- Bước 5: Sắp xếp theo số lần đề cập
result = ORDER keyword_stats BY mention_count DESC;

-- Bước 6: Ghi kết quả ra HDFS
STORE result INTO '/user/social_analytics/processed/pig_keyword_stats'
  USING PigStorage(',');

DUMP result;
