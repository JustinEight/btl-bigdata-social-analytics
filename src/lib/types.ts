export interface PipelineRun {
  id: string;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  log_output: string;
  data_stats: Record<string, unknown>;
  created_at: string;
}

export interface PipelineLog {
  id: string;
  run_id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  created_at: string;
}

export interface AnalyticsResult {
  id: string;
  analysis_type: string;
  data: unknown[];
  computed_at: string;
  record_count: number;
  source_rows: number;
}

export interface SystemConfig {
  key: string;
  value: string;
  updated_at: string;
}

// Analytics data shapes
export interface KeywordStat {
  keyword: string;
  tweet_count: number;
  total_likes: number;
  total_retweets: number;
  avg_likes: number;
}

export interface HashtagStat {
  hashtag: string;
  count: number;
  percentage: number;
}

export interface RedditEngagement {
  subreddit: string;
  post_count: number;
  comment_count: number;
  avg_score: number;
  avg_upvote_ratio: number;
}

export interface DailyTrend {
  date: string;
  tweet_count: number;
  reddit_count: number;
  total: number;
}

export interface SentimentResult {
  keyword: string;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  positive_pct: number;
  negative_pct: number;
}

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  estimatedMs: number;
  logs: string[];
}
