import { useState } from 'react';
import {
  Twitter, MessageSquare, Hash, Search, Filter,
  ExternalLink, ArrowUpRight, Download
} from 'lucide-react';

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
import {
  generateKeywordStats,
  generateRedditEngagement, generateDailyTrend, generateSentimentResults,
  generateSamplePostsForKeyword,
  twitterSearchUrl, redditSearchUrl, redditSubredditUrl,
  KEYWORDS, SUBREDDITS,
} from '../lib/dataGenerator';
import type { SamplePost } from '../lib/dataGenerator';

type Tab = 'tweets' | 'reddit' | 'comments' | 'hive_results' | 'pig_outputs' | 'sample_posts';

const TWEET_TEMPLATES = [
  'Just tried {kw} and I am genuinely impressed — the reasoning capabilities are miles ahead of last year.',
  '{kw} benchmark results just dropped. The numbers speak for themselves. Thread 🧵',
  'Unpopular opinion: {kw} is overrated for production. Here is why...',
  'The latest {kw} update completely changed my workflow. Productivity up 3x.',
  'New paper on {kw} safety alignment — this is exactly the research we need.',
  '{kw} just passed another milestone. The pace of progress is honestly scary.',
  'Hot take: {kw} will be commoditized within 18 months. Thoughts?',
  'Using {kw} for code review saved me hours this week alone.',
  '{kw} vs the competition — I ran 50 prompts. Here are the results.',
  'The {kw} API pricing update is actually reasonable if you do the math.',
];

const COMMENT_BODIES = [
  'This is exactly what I expected from {kw}. The improvements over the previous version are significant.',
  'Has anyone else noticed that {kw} struggles with multi-step reasoning tasks? Would love to compare notes.',
  'Tried {kw} for my workflow yesterday. Not bad, but I still prefer my old setup for most tasks.',
  'The {kw} community here is really helpful. Thanks for all the resources!',
  'I think {kw} is overhyped. Real-world performance is way below the benchmarks they advertise.',
  'Just switched from GPT to {kw} for code generation. Night and day difference honestly.',
  'Anyone have good prompting strategies for {kw}? I\'m still learning.',
  'The API rate limits on {kw} are killing my project. Anyone else dealing with this?',
  'New research paper on {kw} alignment just dropped. Pretty interesting findings.',
  'I use {kw} daily and it\'s become an essential part of my workflow at this point.',
];

const SAMPLE_COMMENTS = Array.from({ length: 60 }, (_, i) => {
  const sub = SUBREDDITS[i % SUBREDDITS.length];
  const kw = KEYWORDS[i % KEYWORDS.length];
  const user = ['ml_practitioner', 'agi_observer', 'llm_tinkerer', 'ai_researcher_42',
    'deep_learning_fan', 'transformer_nerd', 'inference_optimist', 'safety_researcher'][i % 8];
  return {
    comment_id: `CM${String(i + 1).padStart(6, '0')}`,
    post_id_ref: `RD${String((i % 40) + 1).padStart(6, '0')}`,
    subreddit: sub,
    author: `u/${user}`,
    body: COMMENT_BODIES[i % COMMENT_BODIES.length].replace('{kw}', kw),
    score: 2 + i * 11 + (i % 7) * 28,
    created_at: new Date(Date.now() - (i * 1.5 + 0.5) * 86400000).toISOString().split('T')[0],
    keyword: kw,
    url: `https://www.reddit.com/r/${sub.replace('r/', '')}/search/?q=${encodeURIComponent(kw)}&sort=top`,
  };
});

const REDDIT_TITLES = [
  'Has anyone benchmarked {kw} against the latest open-source alternatives?',
  '{kw} just released an update — sharing my initial impressions after 24h',
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

function makeHandle(i: number) {
  return TWITTER_HANDLES[i % TWITTER_HANDLES.length];
}
function makeRedditUser(i: number) {
  const users = ['ml_practitioner', 'agi_observer', 'llm_tinkerer', 'ai_researcher_42',
    'deep_learning_fan', 'transformer_nerd', 'inference_optimist', 'safety_researcher'];
  return users[i % users.length];
}

const SAMPLE_TWEETS = Array.from({ length: 50 }, (_, i) => {
  const kw = KEYWORDS[i % KEYWORDS.length];
  const handle = makeHandle(i);
  return {
    tweet_id: `TW${String(i + 1).padStart(6, '0')}`,
    author: `@${handle}`,
    keyword: kw,
    text: TWEET_TEMPLATES[i % TWEET_TEMPLATES.length].replace('{kw}', kw),
    created_at: new Date(Date.now() - (i * 2 + 1) * 86400000).toISOString().split('T')[0],
    like_count: 50 + i * 97 + (i % 7) * 340,
    retweet_count: 10 + i * 23 + (i % 5) * 88,
    lang: 'en',
    // Real Twitter search URL for this keyword (synthetic data — no individual tweet ID)
    url: twitterSearchUrl(kw),
  };
});

const SAMPLE_REDDIT = Array.from({ length: 40 }, (_, i) => {
  const sub = SUBREDDITS[i % SUBREDDITS.length];
  const subClean = sub.replace('r/', '');
  const user = makeRedditUser(i);
  const kw = KEYWORDS[i % KEYWORDS.length];
  return {
    post_id: `RD${String(i + 1).padStart(6, '0')}`,
    subreddit: sub,
    author: `u/${user}`,
    title: REDDIT_TITLES[i % REDDIT_TITLES.length].replace('{kw}', kw),
    score: 15 + i * 67 + (i % 11) * 130,
    num_comments: 5 + i * 18 + (i % 9) * 45,
    upvote_ratio: Math.round((72 + (i * 3) % 25) / 100 * 100) / 100,
    created_at: new Date(Date.now() - (i * 3 + 2) * 86400000).toISOString().split('T')[0],
    keyword: kw,
    // Real Reddit search in the subreddit for this keyword
    url: `https://www.reddit.com/r/${subClean}/search/?q=${encodeURIComponent(kw)}&sort=top`,
  };
});

export function DataExplorer() {
  const [activeTab, setActiveTab] = useState<Tab>('tweets');
  const [search, setSearch] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState(KEYWORDS[0]);
  const [samplePosts, setSamplePosts] = useState<SamplePost[]>(() =>
    generateSamplePostsForKeyword(KEYWORDS[0], 12)
  );

  function selectKeyword(kw: string) {
    setSelectedKeyword(kw);
    setSamplePosts(generateSamplePostsForKeyword(kw, 12));
  }

  const kwStats = generateKeywordStats();
  const rdStats = generateRedditEngagement();
  const dtStats = generateDailyTrend();
  const sentStats = generateSentimentResults();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'tweets',      label: 'tweets.csv',         icon: Twitter },
    { id: 'reddit',      label: 'reddit_posts',       icon: MessageSquare },
    { id: 'comments',    label: 'reddit_comments',    icon: MessageSquare },
    { id: 'sample_posts',label: 'Posts + Links',      icon: ExternalLink },
    { id: 'hive_results',label: 'Hive Results',       icon: Hash },
    { id: 'pig_outputs', label: 'Pig Outputs',        icon: Filter },
  ];

  const filteredTweets = SAMPLE_TWEETS.filter(t =>
    !search ||
    t.text.toLowerCase().includes(search.toLowerCase()) ||
    t.keyword.toLowerCase().includes(search.toLowerCase()) ||
    t.author.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReddit = SAMPLE_REDDIT.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.subreddit.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Data Explorer</h1>
          <p className="text-xs text-slate-500 mt-0.5">Duyệt CSV, kết quả Hive/Pig và posts thực tế</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-full"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex-1 min-w-fit flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all
              ${activeTab === id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Tweets tab */}
      {activeTab === 'tweets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <Twitter className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-medium text-slate-300">tweets.csv</span>
              <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                100,000 rows · 21 MB · hiển thị {Math.min(filteredTweets.length, 20)}
              </span>
            </div>
            <button
              onClick={() => exportCSV(SAMPLE_TWEETS as unknown as Record<string, unknown>[], 'tweets_sample.csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  {['tweet_id', 'author', 'keyword', 'text', 'date', 'likes', 'retweets', 'link'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTweets.slice(0, 20).map(row => (
                  <tr key={row.tweet_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 text-slate-600 font-mono">{row.tweet_id}</td>
                    <td className="py-2 px-3 text-sky-400 font-medium whitespace-nowrap">{row.author}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {row.keyword}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 max-w-xs truncate">{row.text}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.created_at}</td>
                    <td className="py-2 px-3 text-emerald-400 text-right">{row.like_count.toLocaleString()}</td>
                    <td className="py-2 px-3 text-blue-400 text-right">{row.retweet_count.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Tìm kiếm keyword này trên Twitter (dữ liệu tổng hợp — không có tweet ID thật)"
                        className="flex items-center gap-1 text-sky-500 hover:text-sky-300 transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="text-[10px]">search</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Dữ liệu tổng hợp (synthetic) — link dẫn đến Twitter Search thật cho keyword tương ứng
          </div>
        </div>
      )}

      {/* Reddit tab */}
      {activeTab === 'reddit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-slate-300">reddit_posts.csv</span>
              <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                5,000 rows · 2 MB
              </span>
            </div>
            <button
              onClick={() => exportCSV(SAMPLE_REDDIT as unknown as Record<string, unknown>[], 'reddit_posts_sample.csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Subreddit quick links */}
          <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap gap-2">
            {SUBREDDITS.map(sub => (
              <a
                key={sub}
                href={redditSubredditUrl(sub)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-2 py-1 rounded-full transition-all"
              >
                {sub} <ArrowUpRight className="w-3 h-3" />
              </a>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  {['post_id', 'subreddit', 'author', 'title', 'score', 'comments', 'ratio', 'date', 'link'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReddit.slice(0, 20).map(row => (
                  <tr key={row.post_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 text-slate-600 font-mono">{row.post_id}</td>
                    <td className="py-2 px-3">
                      <a
                        href={redditSubredditUrl(row.subreddit)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-0.5 rounded-full transition-colors whitespace-nowrap inline-flex items-center gap-1"
                      >
                        {row.subreddit}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{row.author}</td>
                    <td className="py-2 px-3 text-slate-300 max-w-xs truncate">{row.title}</td>
                    <td className="py-2 px-3 text-amber-400 text-right">{row.score.toLocaleString()}</td>
                    <td className="py-2 px-3 text-blue-400 text-right">{row.num_comments}</td>
                    <td className="py-2 px-3 text-slate-400 text-right">{(row.upvote_ratio * 100).toFixed(0)}%</td>
                    <td className="py-2 px-3 text-slate-600">{row.created_at}</td>
                    <td className="py-2 px-3">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Tìm keyword trong subreddit này (dữ liệu tổng hợp — không có post ID thật)"
                        className="flex items-center gap-1 text-orange-500 hover:text-orange-300 transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="text-[10px]">search</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Dữ liệu tổng hợp (synthetic) — link dẫn đến Reddit Search thật trong subreddit tương ứng
          </div>
        </div>
      )}

      {/* Reddit Comments tab */}
      {activeTab === 'comments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-slate-300">reddit_comments.csv</span>
              <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                190,000 rows · 41 MB · hiển thị {Math.min(SAMPLE_COMMENTS.filter(c => !search || c.body.toLowerCase().includes(search.toLowerCase()) || c.subreddit.toLowerCase().includes(search.toLowerCase())).length, 20)}
              </span>
            </div>
            <button
              onClick={() => exportCSV(SAMPLE_COMMENTS as unknown as Record<string, unknown>[], 'reddit_comments_sample.csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  {['comment_id', 'post_id_ref', 'subreddit', 'author', 'body', 'score', 'date', 'link'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_COMMENTS
                  .filter(c => !search || c.body.toLowerCase().includes(search.toLowerCase()) || c.subreddit.toLowerCase().includes(search.toLowerCase()))
                  .slice(0, 20)
                  .map(row => (
                    <tr key={row.comment_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 text-slate-600 font-mono">{row.comment_id}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono">{row.post_id_ref}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {row.subreddit}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{row.author}</td>
                      <td className="py-2 px-3 text-slate-300 max-w-xs truncate">{row.body}</td>
                      <td className="py-2 px-3 text-amber-400 text-right">{row.score.toLocaleString()}</td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.created_at}</td>
                      <td className="py-2 px-3">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-rose-500 hover:text-rose-300 transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="text-[10px]">search</span>
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Dữ liệu tổng hợp (synthetic) · File thực: 190,000 rows · 41 MB
          </div>
        </div>
      )}

      {/* Sample Posts tab */}
      {activeTab === 'sample_posts' && (
        <div className="space-y-4">
          {/* Keyword selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-3">Chọn keyword để xem posts + tìm kiếm thực tế</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {KEYWORDS.map(kw => (
                <button
                  key={kw}
                  onClick={() => selectKeyword(kw)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedKeyword === kw
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>

            {/* Direct search links */}
            <div className="flex flex-wrap gap-2">
              <a
                href={twitterSearchUrl(selectedKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg text-xs text-sky-300 font-medium transition-all"
              >
                <Twitter className="w-4 h-4" />
                Tìm "{selectedKeyword}" trên Twitter/X
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={redditSearchUrl(selectedKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-xs text-orange-300 font-medium transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Tìm "{selectedKeyword}" trên Reddit
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Posts list */}
          <div className="grid gap-3">
            {samplePosts.map(post => (
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    post.platform === 'twitter' ? 'bg-sky-500/15' : 'bg-orange-500/15'
                  }`}>
                    {post.platform === 'twitter'
                      ? <Twitter className="w-4 h-4 text-sky-400" />
                      : <MessageSquare className="w-4 h-4 text-orange-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold ${
                        post.platform === 'twitter' ? 'text-sky-400' : 'text-orange-400'
                      }`}>
                        {post.author}
                      </span>
                      {post.subreddit && (
                        <span className="text-[10px] text-orange-300/70 bg-orange-500/10 px-2 py-0.5 rounded-full">
                          {post.subreddit}
                        </span>
                      )}
                      <span className="text-[10px] text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                        {post.keyword}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-auto">{post.date}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-5">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-500">
                        {post.platform === 'twitter' ? '❤' : '▲'} {post.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[260px]">
                        {post.url}
                      </span>
                      <span className="text-[10px] text-cyan-500 ml-auto flex items-center gap-1 group-hover:text-cyan-300 transition-colors shrink-0">
                        Open <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Hive Results tab */}
      {activeTab === 'hive_results' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">result_keyword_tweet_count</span>
              <code className="text-[10px] text-slate-600 ml-auto">Hive Q1 · 10 rows</code>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    {['keyword', 'tweet_count', 'total_likes', 'total_retweets', 'avg_likes', 'search_link'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kwStats.map(row => (
                    <tr key={row.keyword} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 text-cyan-300 font-semibold">{row.keyword}</td>
                      <td className="py-2 px-3 text-slate-300 text-right">{row.tweet_count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-emerald-400 text-right">{row.total_likes.toLocaleString()}</td>
                      <td className="py-2 px-3 text-blue-400 text-right">{row.total_retweets.toLocaleString()}</td>
                      <td className="py-2 px-3 text-slate-400 text-right">{row.avg_likes}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <a href={twitterSearchUrl(row.keyword)} target="_blank" rel="noopener noreferrer"
                            className="p-1 rounded text-sky-500 hover:text-sky-300 hover:bg-sky-500/10 transition-all" title="Twitter">
                            <Twitter className="w-3 h-3" />
                          </a>
                          <a href={redditSearchUrl(row.keyword)} target="_blank" rel="noopener noreferrer"
                            className="p-1 rounded text-orange-500 hover:text-orange-300 hover:bg-orange-500/10 transition-all" title="Reddit">
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <Hash className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-slate-300">result_sentiment_basic</span>
              <code className="text-[10px] text-slate-600 ml-auto">Hive Q5 · 10 rows</code>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    {['keyword', 'positive', 'negative', 'neutral', 'pos%', 'neg%'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sentStats.map(row => (
                    <tr key={row.keyword} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 text-cyan-300 font-semibold">{row.keyword}</td>
                      <td className="py-2 px-3 text-emerald-400 text-right">{row.positive_count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-red-400 text-right">{row.negative_count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-slate-500 text-right">{row.neutral_count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold text-right">{row.positive_pct}%</td>
                      <td className="py-2 px-3 text-red-400 text-right">{row.negative_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pig Outputs tab */}
      {activeTab === 'pig_outputs' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <Filter className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-slate-300">pig_subreddit_stats</span>
              <code className="text-[10px] text-slate-600 ml-auto">/user/data/processed/pig_subreddit_stats · 8 rows</code>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    {['subreddit', 'post_count', 'comment_count', 'avg_score', 'avg_upvote_ratio', 'link'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rdStats.map(row => (
                    <tr key={row.subreddit} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 text-emerald-300 font-semibold">{row.subreddit}</td>
                      <td className="py-2 px-3 text-slate-300 text-right">{row.post_count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-blue-400 text-right">{row.comment_count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-amber-400 text-right">{row.avg_score}</td>
                      <td className="py-2 px-3 text-slate-400 text-right">{(row.avg_upvote_ratio * 100).toFixed(0)}%</td>
                      <td className="py-2 px-3">
                        <a
                          href={redditSubredditUrl(row.subreddit)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-orange-500 hover:text-orange-300 text-[10px] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <Filter className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">result_daily_tweet_trend</span>
              <code className="text-[10px] text-slate-600 ml-auto">Hive Q4 · 30 rows</code>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-950">
                  <tr className="border-b border-slate-800">
                    {['date', 'tweet_count', 'reddit_count', 'total'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dtStats.map(row => (
                    <tr key={row.date} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-1.5 px-3 text-slate-400 font-mono">{row.date}</td>
                      <td className="py-1.5 px-3 text-cyan-400 text-right">{row.tweet_count.toLocaleString()}</td>
                      <td className="py-1.5 px-3 text-orange-400 text-right">{row.reddit_count.toLocaleString()}</td>
                      <td className="py-1.5 px-3 text-slate-300 font-semibold text-right">{row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
