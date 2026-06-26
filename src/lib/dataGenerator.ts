import type {
  KeywordStat,
  HashtagStat,
  RedditEngagement,
  DailyTrend,
  SentimentResult,
} from './types';

export const KEYWORDS = [
  'ChatGPT', 'GPT-4', 'Gemini', 'Claude AI', 'Llama',
  'Stable Diffusion', 'Midjourney', 'OpenAI', 'AI safety', 'machine learning',
];

export const SUBREDDITS = [
  'r/MachineLearning', 'r/artificial', 'r/ChatGPT', 'r/LocalLLaMA',
  'r/OpenAI', 'r/StableDiffusion', 'r/AIArt', 'r/technology',
];

export const HASHTAGS = [
  'ChatGPT', 'AI', 'MachineLearning', 'OpenAI', 'GPT4', 'ArtificialIntelligence',
  'DeepLearning', 'LLM', 'GenerativeAI', 'AIArt', 'Midjourney', 'StableDiffusion',
  'NLP', 'DataScience', 'AGI', 'Llama', 'Claude', 'Gemini', 'Bard', 'TechNews',
];

// Real Twitter search URL for a keyword
export function twitterSearchUrl(keyword: string) {
  return `https://twitter.com/search?q=${encodeURIComponent(keyword + ' AI')}&src=typed_query&f=live`;
}

// Real Reddit search URL
export function redditSearchUrl(keyword: string, subreddit?: string) {
  if (subreddit) {
    const sub = subreddit.replace('r/', '');
    return `https://www.reddit.com/r/${sub}/search/?q=${encodeURIComponent(keyword)}&sort=top`;
  }
  return `https://www.reddit.com/search/?q=${encodeURIComponent(keyword)}&sort=top&t=month`;
}

// Real Reddit subreddit URL
export function redditSubredditUrl(subreddit: string) {
  const sub = subreddit.replace('r/', '');
  return `https://www.reddit.com/r/${sub}/`;
}

function r(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate fresh analytics — uses Math.random() so numbers change each pipeline run
export function generateKeywordStats(): KeywordStat[] {
  return KEYWORDS.map(keyword => {
    const tweet_count = r(5000, 18000);
    const total_likes = tweet_count * r(8, 45);
    const total_retweets = tweet_count * r(3, 18);
    return {
      keyword,
      tweet_count,
      total_likes,
      total_retweets,
      avg_likes: Math.round(total_likes / tweet_count),
    };
  }).sort((a, b) => b.tweet_count - a.tweet_count);
}

export function generateHashtagStats(): HashtagStat[] {
  const counts = HASHTAGS.map(hashtag => ({
    hashtag,
    count: r(3000, 28000),
  })).sort((a, b) => b.count - a.count).slice(0, 15);

  const sum = counts.reduce((s, c) => s + c.count, 0);
  return counts.map(c => ({
    ...c,
    percentage: Math.round((c.count / sum) * 1000) / 10,
  }));
}

export function generateRedditEngagement(): RedditEngagement[] {
  return SUBREDDITS.map(subreddit => ({
    subreddit,
    post_count: r(200, 1200),
    comment_count: r(2000, 18000),
    avg_score: r(45, 890),
    avg_upvote_ratio: Math.round((0.72 + r(0, 25) / 100) * 100) / 100,
  })).sort((a, b) => b.avg_score - a.avg_score);
}

export function generateDailyTrend(): DailyTrend[] {
  const days: DailyTrend[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const base = r(2400, 3500);
    const spike = i % 7 === 0 ? r(400, 1200) : 0;
    const tweet_count = base + spike;
    const reddit_count = Math.round(tweet_count * (0.14 + Math.random() * 0.08));
    days.push({ date: dateStr, tweet_count, reddit_count, total: tweet_count + reddit_count });
  }
  return days;
}

export function generateSentimentResults(): SentimentResult[] {
  return KEYWORDS.map(keyword => {
    const total = r(5000, 18000);
    const pos_pct = r(38, 72);
    const neg_pct = r(8, Math.min(32, 95 - pos_pct));
    const neu_pct = 100 - pos_pct - neg_pct;
    return {
      keyword,
      positive_count: Math.round(total * pos_pct / 100),
      negative_count: Math.round(total * neg_pct / 100),
      neutral_count: Math.round(total * neu_pct / 100),
      positive_pct: pos_pct,
      negative_pct: neg_pct,
    };
  });
}

export interface SamplePost {
  id: string;
  platform: 'twitter' | 'reddit';
  author: string;
  content: string;
  keyword: string;
  date: string;
  score: number;
  url: string;
  subreddit?: string;
}

const TWEET_TEMPLATES = [
  'Just tried {kw} and I am genuinely impressed — the reasoning capabilities are miles ahead of last year.',
  '{kw} benchmark results just dropped. The numbers are hard to argue with. Thread 🧵',
  'Unpopular opinion: {kw} is overrated for production use. Here is why...',
  'The latest {kw} update completely changed my workflow. Productivity up 3x.',
  'New paper on {kw} safety alignment — this is the kind of research we need right now.',
  '{kw} just passed another milestone. The pace of progress is honestly scary.',
  'Hot take: {kw} will be commoditized within 18 months. Thoughts?',
  'Using {kw} for code review has saved me hours this week alone.',
  '{kw} vs the competition — I ran 50 prompts and here are the results.',
  'The {kw} API pricing update is actually reasonable if you do the math.',
];

const REDDIT_TEMPLATES = [
  'Has anyone benchmarked {kw} against the latest open-source alternatives?',
  '{kw} just released an update — sharing my initial impressions after 24h of testing',
  'Weekly thread: how are you using {kw} in production?',
  'Deep dive: {kw} system prompt engineering techniques that actually work',
  'I built a tool with {kw} that replaced a $500/month SaaS subscription',
  'Discussion: the alignment progress in {kw} is more significant than people realize',
  '{kw} fine-tuning guide — from zero to production in a weekend',
  'Comparing {kw} context window handling with alternatives',
];

const TWITTER_HANDLES = [
  'ai_researcher_x', 'ml_daily_news', 'tech_insider_pro', 'openai_watch',
  'llm_tracker', 'deep_learning_ai', 'ai_safety_hub', 'ml_papers_digest',
  'aiartist_pro', 'future_tech_daily', 'nnadventures', 'model_benchmarks',
];

const REDDIT_USERS = [
  'ml_practitioner', 'agi_observer', 'llm_tinkerer', 'ai_researcher_42',
  'deep_learning_fan', 'transformer_nerd', 'inference_optimist', 'safety_researcher',
];

function randomDate(daysBack = 60) {
  const d = new Date();
  d.setDate(d.getDate() - r(1, daysBack));
  return d.toISOString().split('T')[0];
}

// Generate sample posts for a specific keyword (for detail modal).
// URLs point to real search pages — individual tweet/post IDs are synthetic and not linked.
export function generateSamplePostsForKeyword(keyword: string, count = 8): SamplePost[] {
  const posts: SamplePost[] = [];

  for (let i = 0; i < count; i++) {
    const isTweet = Math.random() > 0.4;
    if (isTweet) {
      const handle = TWITTER_HANDLES[r(0, TWITTER_HANDLES.length - 1)];
      const template = TWEET_TEMPLATES[r(0, TWEET_TEMPLATES.length - 1)];
      posts.push({
        id: `TW_${i}_${keyword.replace(/\s/g, '_')}`,
        platform: 'twitter',
        author: `@${handle}`,
        content: template.replace('{kw}', keyword),
        keyword,
        date: randomDate(),
        score: r(50, 8000),
        // Link to a real Twitter search for this keyword
        url: twitterSearchUrl(keyword),
      });
    } else {
      const sub = SUBREDDITS[r(0, SUBREDDITS.length - 1)];
      const subClean = sub.replace('r/', '');
      const user = REDDIT_USERS[r(0, REDDIT_USERS.length - 1)];
      const template = REDDIT_TEMPLATES[r(0, REDDIT_TEMPLATES.length - 1)];
      posts.push({
        id: `RD_${i}_${keyword.replace(/\s/g, '_')}`,
        platform: 'reddit',
        author: `u/${user}`,
        content: template.replace('{kw}', keyword),
        keyword,
        date: randomDate(),
        score: r(10, 3000),
        subreddit: sub,
        // Link to real Reddit search within the subreddit
        url: `https://www.reddit.com/r/${subClean}/search/?q=${encodeURIComponent(keyword)}&sort=top`,
      });
    }
  }
  return posts;
}

// Metadata for each Hive query — explains the calculation
export const HIVE_QUERY_DETAILS: Record<string, {
  title: string;
  query: string;
  explanation: string;
  inputTable: string;
  outputTable: string;
  rowCount: string;
}> = {
  keyword_stats: {
    title: 'Q1 — Keyword Tweet Count',
    inputTable: 'tweets (100,000 rows)',
    outputTable: 'result_keyword_tweet_count',
    rowCount: '10 rows (1 per keyword)',
    explanation: 'Đếm số tweet, tổng likes và retweets cho mỗi keyword theo dõi. Avg_likes = total_likes / tweet_count.',
    query: `-- Hive Q1: Keyword Tweet Count
SELECT
  keyword,
  COUNT(*)                    AS tweet_count,
  SUM(like_count)             AS total_likes,
  SUM(retweet_count)          AS total_retweets,
  ROUND(AVG(like_count), 0)   AS avg_likes
FROM tweets
WHERE keyword IN (
  'ChatGPT','GPT-4','Gemini','Claude AI','Llama',
  'Stable Diffusion','Midjourney','OpenAI',
  'AI safety','machine learning'
)
GROUP BY keyword
ORDER BY tweet_count DESC;`,
  },
  top_hashtags: {
    title: 'Q2 — Top Hashtags',
    inputTable: 'tweets (100,000 rows)',
    outputTable: 'result_top_hashtags',
    rowCount: '15 rows (top hashtags)',
    explanation: 'Tách chuỗi hashtags (phân cách bằng |) thành từng hàng riêng, đếm tần suất xuất hiện, lấy top 15.',
    query: `-- Hive Q2: Top Hashtags (LATERAL VIEW explode)
SELECT
  hashtag,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage
FROM tweets
LATERAL VIEW explode(split(hashtags, '\\\\|')) ht AS hashtag
WHERE hashtag != ''
GROUP BY hashtag
ORDER BY count DESC
LIMIT 15;`,
  },
  reddit_engagement: {
    title: 'Q3 — Reddit Engagement',
    inputTable: 'reddit_posts + reddit_comments (195,000 rows)',
    outputTable: 'result_reddit_engagement',
    rowCount: '8 rows (1 per subreddit)',
    explanation: 'JOIN posts với comments, tính trung bình score và upvote_ratio của từng subreddit. Comment_count = số comments thực tế.',
    query: `-- Hive Q3: Reddit Engagement per Subreddit
SELECT
  p.subreddit,
  COUNT(DISTINCT p.post_id)   AS post_count,
  COUNT(c.comment_id)         AS comment_count,
  ROUND(AVG(p.score), 0)      AS avg_score,
  ROUND(AVG(p.upvote_ratio), 2) AS avg_upvote_ratio
FROM reddit_posts p
LEFT JOIN reddit_comments c
  ON p.post_id = c.post_id_ref
GROUP BY p.subreddit
ORDER BY avg_score DESC;`,
  },
  daily_trend: {
    title: 'Q4 — Daily Trend (30 ngày)',
    inputTable: 'tweets + reddit_posts',
    outputTable: 'result_daily_tweet_trend',
    rowCount: '30 rows (1 per day)',
    explanation: 'Group theo ngày tạo (DATE function), đếm số posts từ mỗi platform. Dùng để phát hiện spike bất thường.',
    query: `-- Hive Q4: Daily Tweet & Reddit Trend
SELECT
  DATE(t.created_at)         AS date,
  COUNT(t.tweet_id)          AS tweet_count,
  COUNT(r.post_id)           AS reddit_count,
  COUNT(t.tweet_id)
    + COUNT(r.post_id)       AS total
FROM tweets t
FULL OUTER JOIN reddit_posts r
  ON DATE(t.created_at) = DATE(r.created_at)
WHERE DATE(t.created_at) >= DATE_SUB(CURRENT_DATE, 30)
   OR DATE(r.created_at) >= DATE_SUB(CURRENT_DATE, 30)
GROUP BY DATE(t.created_at)
ORDER BY date ASC;`,
  },
  sentiment: {
    title: 'Q5 — Sentiment Analysis',
    inputTable: 'tweets (100,000 rows)',
    outputTable: 'result_sentiment_basic',
    rowCount: '10 rows (1 per keyword)',
    explanation: 'Phân loại cảm xúc bằng RLIKE với danh sách từ khóa tích cực/tiêu cực. Positive_pct = positive / total * 100.',
    query: `-- Hive Q5: Sentiment (RLIKE keyword matching)
SELECT
  keyword,
  SUM(CASE WHEN text RLIKE
    '(great|amazing|love|excellent|impressive|breakthrough|
     incredible|fantastic|useful|powerful|efficient)'
    THEN 1 ELSE 0 END)       AS positive_count,
  SUM(CASE WHEN text RLIKE
    '(terrible|awful|broken|useless|dangerous|scam|
     disappointing|failed|wrong|harmful|biased)'
    THEN 1 ELSE 0 END)       AS negative_count,
  COUNT(*) - SUM(CASE WHEN text RLIKE '(great|amazing|love|...)' THEN 1 ELSE 0 END)
           - SUM(CASE WHEN text RLIKE '(terrible|awful|...)' THEN 1 ELSE 0 END)
                             AS neutral_count,
  ROUND(SUM(CASE WHEN text RLIKE '(great|...)' THEN 1 ELSE 0 END)
    * 100.0 / COUNT(*), 0)   AS positive_pct
FROM tweets
GROUP BY keyword;`,
  },
};

export function getDatasetStats() {
  return {
    tweets_count: 100000,
    reddit_posts_count: 5000,
    reddit_comments_count: 190000,
    total_size_mb: 64,
    keywords_count: KEYWORDS.length,
    subreddits_count: SUBREDDITS.length,
    date_range: '2024-01-01 → 2024-06-30',
  };
}

export const PIPELINE_STEPS = [
  {
    id: 'collect',
    label: 'Thu thập dữ liệu',
    description: 'Sinh synthetic data: tweets, reddit posts & comments',
    icon: 'Database',
    estimatedMs: 3200,
    triggersAnalytics: false,
    logs: [
      '[INFO] Initializing synthetic data generator...',
      '[INFO] Generating tweets for keyword: ChatGPT',
      '[INFO] Generating tweets for keyword: GPT-4',
      '[INFO] Generating tweets for keyword: Gemini',
      '[INFO] Generating tweets for keyword: Claude AI',
      '[INFO] Generating tweets for keyword: Llama',
      '[INFO] Generating tweets for keyword: Stable Diffusion',
      '[INFO] Generating tweets for keyword: Midjourney',
      '[INFO] Generating tweets for keyword: OpenAI',
      '[INFO] Generating tweets for keyword: AI safety',
      '[INFO] Generating tweets for keyword: machine learning',
      '[INFO] Generating reddit posts for 8 subreddits...',
      '[INFO] Generating reddit comments...',
      '[SUCCESS] output/tweets.csv — 100,000 rows (21 MB)',
      '[SUCCESS] output/reddit_posts.csv — 5,000 rows (2 MB)',
      '[SUCCESS] output/reddit_comments.csv — 190,000 rows (41 MB)',
      '[SUCCESS] Data collection complete. Total: 295,000 rows · 64 MB',
    ],
  },
  {
    id: 'hdfs',
    label: 'HDFS Setup',
    description: 'Tạo thư mục HDFS, upload CSV, kiểm tra replication',
    icon: 'HardDrive',
    estimatedMs: 2800,
    triggersAnalytics: false,
    logs: [
      '[INFO] Connecting to HDFS NameNode hdp-master:9000...',
      '[INFO] Creating /user/data/raw/twitter/',
      '[INFO] Creating /user/data/raw/reddit/',
      '[INFO] Creating /user/data/processed/',
      '[INFO] Creating /user/data/output/',
      '[INFO] Uploading tweets.csv → /user/data/raw/twitter/ (21 MB)',
      '[INFO] Uploading reddit_posts.csv → /user/data/raw/reddit/ (2 MB)',
      '[INFO] Uploading reddit_comments.csv → /user/data/raw/reddit/ (41 MB)',
      '[INFO] Running fsck on /user/data/...',
      '[INFO] tweets.csv: OK (replication=3, blocks=1, 128MB/block)',
      '[INFO] reddit_posts.csv: OK (replication=3, blocks=1)',
      '[INFO] reddit_comments.csv: OK (replication=3, blocks=4)',
      '[SUCCESS] HDFS setup complete. 3 files · 64 MB · replication=3',
    ],
  },
  {
    id: 'sqoop',
    label: 'Sqoop + Flume',
    description: 'Import MySQL → HDFS, khởi động Flume SpoolDir agent',
    icon: 'ArrowDownToLine',
    estimatedMs: 4100,
    triggersAnalytics: false,
    logs: [
      '[INFO] Connecting to MySQL: jdbc:mysql://localhost:3306/social_ai',
      '[INFO] LOAD DATA INFILE tweets.csv → social_ai.tweets (100,000 rows)',
      '[INFO] LOAD DATA INFILE reddit_posts.csv → social_ai.reddit_posts (5,000 rows)',
      '[INFO] LOAD DATA INFILE reddit_comments.csv → social_ai.reddit_comments (190,000 rows)',
      '[INFO] Sqoop import: social_ai.tweets → /user/data/raw/twitter/',
      '[INFO]   Map tasks: 4 | Rows imported: 100,000',
      '[INFO]   Duration: 23.4s',
      '[INFO] Sqoop import: social_ai.reddit_comments → /user/data/raw/reddit/',
      '[INFO]   Map tasks: 4 | Rows imported: 190,000',
      '[INFO]   Duration: 31.2s',
      '[INFO] Starting Flume agent: social_agent',
      '[INFO]   SpoolDir → /user/data/raw/flume/twitter/{yyyy-MM-dd}/{HH}/',
      '[INFO]   Roll: 64MB or 60s',
      '[SUCCESS] Sqoop import complete. Flume agent running.',
    ],
  },
  {
    id: 'hbase',
    label: 'HBase Setup',
    description: 'Tạo bảng HBase, nạp dữ liệu mẫu',
    icon: 'Grid3x3',
    estimatedMs: 2400,
    triggersAnalytics: false,
    logs: [
      '[INFO] Connecting to HBase: ZooKeeper hdp-master:2181',
      "[INFO] create 'tweet_meta', {NAME=>'meta',VERSIONS=>3},{NAME=>'stats'}",
      '[INFO]   Table tweet_meta created OK',
      "[INFO] create 'reddit_meta', {NAME=>'meta'},{NAME=>'scores'}",
      '[INFO]   Table reddit_meta created OK',
      "[INFO] create 'keyword_summary', {NAME=>'counts'},{NAME=>'sentiment'}",
      '[INFO]   Table keyword_summary created OK',
      '[INFO] ImportTsv: loading tweet_meta (1,000 sample rows)...',
      '[INFO] ImportTsv: loading reddit_meta (500 sample rows)...',
      '[INFO] ImportTsv: loading keyword_summary (10 rows)...',
      '[SUCCESS] HBase tables ready: tweet_meta · reddit_meta · keyword_summary',
    ],
  },
  {
    id: 'hive',
    label: 'Hive Analysis',
    description: 'Chạy 5 HiveQL queries → tính toán và lưu analytics',
    icon: 'BarChart3',
    estimatedMs: 5800,
    triggersAnalytics: true,
    logs: [
      '[INFO] Initializing HiveServer2 connection...',
      '[INFO] SET hive.exec.parallel=true; SET hive.exec.dynamic.partition=true;',
      '[INFO] ── Q1: Keyword Tweet Count ──',
      '[INFO]   SELECT keyword, COUNT(*) ... GROUP BY keyword',
      '[INFO]   MapReduce jobs: 1 | Input rows: 100,000',
      '[INFO]   Completed in 12.3s → result_keyword_tweet_count (10 rows)',
      '[INFO] ── Q2: Top Hashtags (LATERAL VIEW explode) ──',
      '[INFO]   Exploding hashtag arrays... Input rows: 100,000',
      '[INFO]   Completed in 18.7s → result_top_hashtags (15 rows)',
      '[INFO] ── Q3: Reddit Engagement (JOIN posts+comments) ──',
      '[INFO]   LEFT JOIN on post_id... Input rows: 195,000',
      '[INFO]   Completed in 22.1s → result_reddit_engagement (8 rows)',
      '[INFO] ── Q4: Daily Tweet Trend (30 ngày) ──',
      '[INFO]   GROUP BY DATE(created_at)... Input rows: 105,000',
      '[INFO]   Completed in 15.4s → result_daily_tweet_trend (30 rows)',
      '[INFO] ── Q5: Sentiment Analysis (RLIKE) ──',
      '[INFO]   RLIKE positive/negative keyword lists...',
      '[INFO]   Completed in 24.8s → result_sentiment_basic (10 rows)',
      '[SUCCESS] All 5 Hive queries complete. Analytics updated.',
    ],
  },
  {
    id: 'pig',
    label: 'Pig Processing',
    description: 'Pig Latin script — 3 output thống kê bổ sung',
    icon: 'Cpu',
    estimatedMs: 4600,
    triggersAnalytics: false,
    logs: [
      '[INFO] Starting Pig in MapReduce mode...',
      '[INFO] SET default_parallel 4;',
      '[INFO] tweets = LOAD \'/user/data/raw/twitter/\' USING PigStorage(\',\');',
      '[INFO] reddit = LOAD \'/user/data/raw/reddit/\' USING PigStorage(\',\');',
      '[INFO] ── pig_keyword_stats ──',
      '[INFO]   grouped = GROUP tweets BY keyword;',
      '[INFO]   stats = FOREACH grouped GENERATE group, COUNT(tweets)...',
      '[INFO]   STORE → /user/data/processed/pig_keyword_stats (10 rows)',
      '[INFO] ── pig_daily_keyword ──',
      '[INFO]   daily = GROUP tweets BY (keyword, DATE(created_at));',
      '[INFO]   STORE → /user/data/processed/pig_daily_keyword (300 rows)',
      '[INFO] ── pig_subreddit_stats ──',
      '[INFO]   sub_stats = GROUP reddit BY subreddit;',
      '[INFO]   STORE → /user/data/processed/pig_subreddit_stats (8 rows)',
      '[SUCCESS] Pig processing complete. 3 output directories written.',
    ],
  },
  {
    id: 'oozie',
    label: 'Oozie Workflow',
    description: 'Orchestrate pipeline tự động, Coordinator 2AM ICT',
    icon: 'GitBranch',
    estimatedMs: 3500,
    triggersAnalytics: false,
    logs: [
      '[INFO] Deploying workflow to /user/oozie/apps/social_ai/',
      '[INFO] ShareLib update: oozie-sharelib-sqoop, oozie-sharelib-hive',
      '[INFO] Job submitted: 0000001-261209120000000-oozie-oozi-W',
      '[INFO] Action 1/5: sqoop_import_tweets → RUNNING → OK (23.4s)',
      '[INFO] Action 2/5: sqoop_import_reddit → RUNNING → OK (31.2s)',
      '[INFO] Action 3/5: hive_analysis → RUNNING → OK (93.8s)',
      '[INFO] Action 4/5: pig_clean → RUNNING → OK (72.1s)',
      '[INFO] Action 5/5: sqoop_export_result → RUNNING → OK (18.6s)',
      '[INFO] Coordinator deployed: frequency=daily, start=2AM ICT',
      '[INFO]   cron: 0 19 * * * (UTC) = 02:00 Asia/Ho_Chi_Minh',
      '[SUCCESS] Workflow SUCCEEDED. Status: DONE. Next run: tomorrow 02:00 ICT',
    ],
  },
];
