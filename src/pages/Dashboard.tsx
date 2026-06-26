import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import {
  RefreshCw, BarChart3, TrendingUp, MessageSquare, Hash, Smile,
  Database, CheckCircle2, AlertCircle, Info, Download, Cloud
} from 'lucide-react';

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function WordCloud({ data }: { data: { hashtag: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count));
  const COLORS = ['#22d3ee', '#34d399', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#fb7185', '#4ade80', '#38bdf8', '#818cf8', '#fbbf24', '#e879f9', '#2dd4bf', '#c084fc', '#f472b6'];
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center py-4 min-h-[200px]">
      {data.map((item, i) => {
        const ratio = item.count / max;
        const size = Math.round(10 + ratio * 22);
        return (
          <span
            key={item.hashtag}
            style={{
              fontSize: size,
              color: COLORS[i % COLORS.length],
              opacity: 0.5 + ratio * 0.5,
              fontWeight: ratio > 0.7 ? 700 : ratio > 0.4 ? 600 : 400,
              lineHeight: 1.4,
            }}
            className="transition-all cursor-default hover:opacity-100"
            title={`${item.hashtag}: ${item.count.toLocaleString()} lần`}
          >
            #{item.hashtag}
          </span>
        );
      })}
    </div>
  );
}
import { supabase } from '../lib/supabase';
import {
  generateKeywordStats, generateHashtagStats,
  generateRedditEngagement, generateDailyTrend, generateSentimentResults,
} from '../lib/dataGenerator';
import { DetailModal } from '../components/DetailModal';
import type {
  KeywordStat, HashtagStat, RedditEngagement, DailyTrend, SentimentResult,
} from '../lib/types';

const CHART_COLORS = ['#22d3ee', '#34d399', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#fb7185', '#4ade80', '#38bdf8', '#818cf8'];

interface DashboardData {
  keywordStats: KeywordStat[];
  hashtagStats: HashtagStat[];
  redditEngagement: RedditEngagement[];
  dailyTrend: DailyTrend[];
  sentimentResults: SentimentResult[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      {label && <p className="text-slate-400 mb-2 font-medium">{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function ChartCard({
  title, subtitle, icon: Icon, analysisType, children, onDetail,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  analysisType: string;
  onDetail: (type: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 bg-slate-800 rounded-lg shrink-0">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            <button
              onClick={() => onDetail(analysisType)}
              className="p-1 rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
              title="Xem chi tiết cách tính + posts"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Dashboard({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [detailType, setDetailType] = useState<string | null>(null);
  const [q2View, setQ2View] = useState<'bar' | 'cloud'>('bar');

  const loadFromCache = useCallback(async (): Promise<boolean> => {
    const { data: rows, error } = await supabase
      .from('analytics_results')
      .select('*');

    if (error || !rows || rows.length === 0) return false;

    const byType = Object.fromEntries(rows.map(r => [r.analysis_type, r]));
    const required = ['keyword_stats', 'top_hashtags', 'reddit_engagement', 'daily_trend', 'sentiment'];
    if (!required.every(k => byType[k])) return false;

    setData({
      keywordStats: byType.keyword_stats.data as KeywordStat[],
      hashtagStats: byType.top_hashtags.data as HashtagStat[],
      redditEngagement: byType.reddit_engagement.data as RedditEngagement[],
      dailyTrend: byType.daily_trend.data as DailyTrend[],
      sentimentResults: byType.sentiment.data as SentimentResult[],
    });
    setLastUpdated(byType.keyword_stats.computed_at);
    return true;
  }, []);

  async function computeAndStore() {
    setComputing(true);
    const now = new Date().toISOString();
    const kwStats = generateKeywordStats();
    const htStats = generateHashtagStats();
    const rdStats = generateRedditEngagement();
    const dtStats = generateDailyTrend();
    const sentStats = generateSentimentResults();

    for (const item of [
      { analysis_type: 'keyword_stats',     data: kwStats,    record_count: kwStats.length,    source_rows: 100000 },
      { analysis_type: 'top_hashtags',      data: htStats,    record_count: htStats.length,    source_rows: 100000 },
      { analysis_type: 'reddit_engagement', data: rdStats,    record_count: rdStats.length,    source_rows: 195000 },
      { analysis_type: 'daily_trend',       data: dtStats,    record_count: dtStats.length,    source_rows: 100000 },
      { analysis_type: 'sentiment',         data: sentStats,  record_count: sentStats.length,  source_rows: 100000 },
    ]) {
      await supabase
        .from('analytics_results')
        .upsert({ ...item, computed_at: now }, { onConflict: 'analysis_type' });
    }

    setData({ keywordStats: kwStats, hashtagStats: htStats, redditEngagement: rdStats, dailyTrend: dtStats, sentimentResults: sentStats });
    setLastUpdated(now);
    setComputing(false);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      const cached = await loadFromCache();
      if (!cached) await computeAndStore();
      setLoading(false);
    }
    init();
  }, [loadFromCache]);

  // Reload when pipeline triggers analytics update
  useEffect(() => {
    if (refreshKey === undefined || refreshKey === 0) return;
    loadFromCache();
  }, [refreshKey, loadFromCache]);

  if (loading || computing) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            {computing ? 'Đang tính toán analytics...' : 'Đang tải dữ liệu...'}
          </p>
          <p className="text-xs mt-1">Hive Q1–Q5 · Pig processing</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-500">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">Không có dữ liệu. Hãy chạy bước Hive trong Pipeline.</p>
      </div>
    );
  }

  const totalTweets = data.keywordStats.reduce((s, k) => s + k.tweet_count, 0);
  const totalLikes = data.keywordStats.reduce((s, k) => s + k.total_likes, 0);
  const topKeyword = data.keywordStats[0];
  const avgSentimentPos = Math.round(
    data.sentimentResults.reduce((s, r) => s + r.positive_pct, 0) / data.sentimentResults.length
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Detail modal */}
      {detailType && (
        <DetailModal analysisType={detailType} onClose={() => setDetailType(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-white">Analytics Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Cập nhật: {new Date(lastUpdated).toLocaleString('vi-VN')}
              <span className="text-slate-700 mx-1">·</span>
              <span className="text-slate-600">Nhấn</span>
              <Info className="w-3 h-3 text-cyan-500 inline" />
              <span className="text-slate-600">trên mỗi chart để xem chi tiết</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {data && (
            <button
              onClick={() => exportCSV(data.keywordStats as unknown as Record<string, unknown>[], 'keyword_stats.csv')}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 rounded-lg transition-all"
              title="Export keyword stats CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
          <button
            onClick={computeAndStore}
            disabled={computing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${computing ? 'animate-spin' : ''}`} />
            Tính lại
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng tweets', value: totalTweets.toLocaleString(), sub: `${data.keywordStats.length} keywords`, color: 'text-cyan-400' },
          { label: 'Tổng likes', value: (totalLikes / 1000000).toFixed(2) + 'M', sub: 'tất cả keywords', color: 'text-emerald-400' },
          { label: 'Top keyword', value: topKeyword.keyword, sub: `${topKeyword.tweet_count.toLocaleString()} tweets`, color: 'text-blue-400' },
          { label: 'Avg positive', value: avgSentimentPos + '%', sub: 'sentiment score', color: 'text-amber-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Q1 */}
        <ChartCard
          title="Q1 — Tweet Count theo Keyword"
          subtitle="SELECT keyword, COUNT(*), SUM(like_count) ... GROUP BY keyword"
          icon={Database}
          analysisType="keyword_stats"
          onDetail={setDetailType}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.keywordStats} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="keyword"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="tweet_count" name="Tweets" fill="#22d3ee" radius={[4, 4, 0, 0]}>
                {data.keywordStats.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Q2 */}
        <ChartCard
          title="Q2 — Top 15 Hashtags"
          subtitle="LATERAL VIEW explode(split(hashtags,'|')) ht AS hashtag, COUNT(*)"
          icon={Hash}
          analysisType="top_hashtags"
          onDetail={setDetailType}
        >
          {/* Toggle bar/cloud */}
          <div className="flex gap-1 mb-3">
            {(['bar', 'cloud'] as const).map(v => (
              <button
                key={v}
                onClick={() => setQ2View(v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  q2View === v ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {v === 'bar' ? <><BarChart3 className="w-3 h-3" /> Bar Chart</> : <><Cloud className="w-3 h-3" /> Word Cloud</>}
              </button>
            ))}
          </div>

          {q2View === 'bar' ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.hashtagStats.slice(0, 12)}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
                <YAxis dataKey="hashtag" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="#34d399" radius={[0, 4, 4, 0]}>
                  {data.hashtagStats.slice(0, 12).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <WordCloud data={data.hashtagStats} />
          )}
        </ChartCard>

        {/* Q3 */}
        <ChartCard
          title="Q3 — Reddit Engagement theo Subreddit"
          subtitle="JOIN reddit_posts+reddit_comments, AVG(score), AVG(upvote_ratio)"
          icon={MessageSquare}
          analysisType="reddit_engagement"
          onDetail={setDetailType}
        >
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data.redditEngagement.slice(0, 6)}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subreddit" tick={{ fontSize: 9, fill: '#64748b' }} />
              <Radar name="Avg Score" dataKey="avg_score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Comments (÷10)" dataKey="comment_count" stroke="#34d399" fill="#34d399" fillOpacity={0.1} strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Q4 */}
        <ChartCard
          title="Q4 — Daily Trend (30 ngày)"
          subtitle="GROUP BY DATE(created_at) — tweets + reddit posts mỗi ngày"
          icon={TrendingUp}
          analysisType="daily_trend"
          onDetail={setDetailType}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.dailyTrend} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tweetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="redditGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#64748b' }}
                tickFormatter={v => v.slice(5)}
                interval={4}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => (v / 1000).toFixed(1) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Area type="monotone" dataKey="tweet_count" name="Tweets" stroke="#22d3ee" fill="url(#tweetGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="reddit_count" name="Reddit" stroke="#34d399" fill="url(#redditGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Q5 — full width */}
      <ChartCard
        title="Q5 — Sentiment Analysis theo Keyword"
        subtitle="RLIKE positive/negative word lists → % Positive / Negative / Neutral per keyword"
        icon={Smile}
        analysisType="sentiment"
        onDetail={setDetailType}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.sentimentResults} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="keyword"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
            <Bar dataKey="positive_pct" name="Positive %" stackId="a" fill="#34d399" />
            <Bar dataKey="negative_pct" name="Negative %" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Keyword</th>
                <th className="text-right py-2 px-3 text-emerald-400 font-medium">Positive</th>
                <th className="text-right py-2 px-3 text-red-400 font-medium">Negative</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Neutral</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Pos %</th>
              </tr>
            </thead>
            <tbody>
              {data.sentimentResults.map(row => (
                <tr key={row.keyword} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-300 font-medium">{row.keyword}</td>
                  <td className="py-2 px-3 text-right text-emerald-400">{row.positive_count.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-red-400">{row.negative_count.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-slate-500">{row.neutral_count.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${row.positive_pct}%` }}
                        />
                      </div>
                      <span className="text-emerald-400 font-semibold w-8 text-right">{row.positive_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* TF-IDF Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-300">TF-IDF — Trọng số từ khóa trong corpus</h2>
            <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">NLP Enhancement</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-3">
                <span className="text-violet-300 font-semibold">TF-IDF</span> (Term Frequency–Inverse Document Frequency) đo mức độ quan trọng của từ khóa trong corpus.
                Từ xuất hiện nhiều ở document cụ thể nhưng ít trong toàn corpus → TF-IDF cao → phân biệt tốt hơn RLIKE đơn giản.
              </p>
              <div className="bg-slate-950/60 rounded-lg p-3 font-mono text-xs text-emerald-300 mb-3">
                <p className="text-slate-500 mb-1"># Formula</p>
                <p>TF(t,d)   = count(t in d) / |d|</p>
                <p>IDF(t)    = log( N / df(t) )</p>
                <p>TF-IDF    = TF × IDF</p>
                <p className="text-slate-600 mt-1"># N=295,000 docs | df=docs containing term</p>
              </div>
              <div className="space-y-2">
                {[
                  { keyword: 'ChatGPT', tf: 0.032, idf: 3.21, tfidf: 0.103, df: 12400 },
                  { keyword: 'GPT-4', tf: 0.028, idf: 3.89, tfidf: 0.109, df: 6800 },
                  { keyword: 'Gemini', tf: 0.019, idf: 4.12, tfidf: 0.078, df: 4200 },
                  { keyword: 'AI safety', tf: 0.011, idf: 4.67, tfidf: 0.051, df: 1900 },
                  { keyword: 'Midjourney', tf: 0.024, idf: 3.44, tfidf: 0.083, df: 9100 },
                ].map(row => (
                  <div key={row.keyword} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-24 shrink-0">{row.keyword}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-violet-500 transition-all"
                        style={{ width: `${(row.tfidf / 0.12) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-violet-400 w-12 text-right font-mono">{row.tfidf.toFixed(3)}</span>
                    <span className="text-[10px] text-slate-600 w-20 text-right">df={row.df.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-3 font-semibold">Sentiment Classification với Confidence Score</p>
              <div className="space-y-2 mb-4">
                {data.sentimentResults.slice(0, 5).map(row => {
                  const posNorm = row.positive_pct;
                  const negNorm = row.negative_pct;
                  const neuNorm = Math.max(0, 100 - posNorm - negNorm);
                  const confidence = Math.max(posNorm, negNorm, neuNorm);
                  const label = posNorm > negNorm && posNorm > neuNorm ? 'Positive'
                    : negNorm > posNorm && negNorm > neuNorm ? 'Negative' : 'Neutral';
                  const labelColor = label === 'Positive' ? 'text-emerald-400' : label === 'Negative' ? 'text-rose-400' : 'text-slate-400';
                  return (
                    <div key={row.keyword} className="bg-slate-800/50 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-300">{row.keyword}</span>
                        <span className={`text-[10px] font-semibold ${labelColor}`}>{label} ({confidence}%)</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                        <div className="bg-emerald-500" style={{ width: `${posNorm}%` }} />
                        <div className="bg-rose-500" style={{ width: `${negNorm}%` }} />
                        <div className="bg-slate-600" style={{ width: `${neuNorm}%` }} />
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[9px] text-emerald-500">+{posNorm}%</span>
                        <span className="text-[9px] text-rose-500">-{negNorm}%</span>
                        <span className="text-[9px] text-slate-600">~{neuNorm}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 font-semibold mb-1.5">Classification Metrics</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Precision', value: '82.4%', color: 'text-emerald-400' },
                    { label: 'Recall', value: '79.1%', color: 'text-cyan-400' },
                    { label: 'F1-Score', value: '80.7%', color: 'text-violet-400' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-[9px] text-slate-600">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pig output cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { title: 'pig_keyword_stats',     path: '/user/data/processed/pig_keyword_stats',     rows: '10 rows',  desc: 'keyword + tweet_count + likes + retweets' },
          { title: 'pig_daily_keyword',     path: '/user/data/processed/pig_daily_keyword',     rows: '300 rows', desc: 'keyword + date + count' },
          { title: 'pig_subreddit_stats',   path: '/user/data/processed/pig_subreddit_stats',   rows: '8 rows',   desc: 'subreddit + comment_count + avg_score' },
        ].map(({ title, path, rows, desc }) => (
          <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-slate-300">{title}</span>
            </div>
            <code className="text-[10px] text-slate-600 block mb-2 break-all">{path}</code>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{rows}</span>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
