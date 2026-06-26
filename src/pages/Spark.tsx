import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Zap, Code2, GitCompare, CheckCircle2, Clock } from 'lucide-react';

const PYSPARK_QUERIES = [
  {
    id: 'Q1',
    title: 'Keyword Frequency (Mentions)',
    hive: `SELECT keyword, COUNT(*) AS mention_count,
       AVG(retweet_count) AS avg_rt
FROM tweets
GROUP BY keyword
ORDER BY mention_count DESC;`,
    spark: `from pyspark.sql.functions import col, count, avg

df_tweets = spark.read.parquet("/data/tweets")

result = (df_tweets
  .groupBy("keyword")
  .agg(
    count("*").alias("mention_count"),
    avg("retweet_count").alias("avg_rt")
  )
  .orderBy(col("mention_count").desc())
)
result.show()`,
    time_spark: 1.2, time_hive: 9.8, time_mr: 45.2,
    speedupVsHive: 8.2,
  },
  {
    id: 'Q2',
    title: 'Top Hashtags & Trending',
    hive: `SELECT hashtag, COUNT(*) AS cnt
FROM tweets LATERAL VIEW
  explode(split(hashtags,'\\,')) ht AS hashtag
WHERE hashtag != ''
GROUP BY hashtag
ORDER BY cnt DESC
LIMIT 20;`,
    spark: `from pyspark.sql.functions import explode, split, col

result = (df_tweets
  .select(explode(split(col("hashtags"), ",")).alias("hashtag"))
  .filter(col("hashtag") != "")
  .groupBy("hashtag").count()
  .orderBy(col("count").desc())
  .limit(20)
)
result.show()`,
    time_spark: 0.8, time_hive: 7.4, time_mr: 38.1,
    speedupVsHive: 9.3,
  },
  {
    id: 'Q3',
    title: 'Sentiment Analysis',
    hive: `SELECT keyword,
  SUM(CASE WHEN text RLIKE 'great|excellent|love'
       THEN 1 ELSE 0 END) AS positive,
  SUM(CASE WHEN text RLIKE 'bad|terrible|hate'
       THEN 1 ELSE 0 END) AS negative,
  COUNT(*) - positive - negative AS neutral
FROM tweets
GROUP BY keyword;`,
    spark: `from pyspark.sql.functions import when, col, sum as _sum

pos_kw = "great|excellent|amazing|love|best"
neg_kw = "bad|terrible|hate|worst|awful"

result = (df_tweets
  .withColumn("sentiment",
    when(col("text").rlike(pos_kw), "positive")
    .when(col("text").rlike(neg_kw), "negative")
    .otherwise("neutral"))
  .groupBy("keyword", "sentiment").count()
  .orderBy("keyword", "sentiment")
)
result.show()`,
    time_spark: 2.1, time_hive: 14.2, time_mr: 67.3,
    speedupVsHive: 6.8,
  },
  {
    id: 'Q4',
    title: 'Daily Trend Over Time',
    hive: `SELECT DATE(created_at) AS day,
       COUNT(*) AS daily_count,
       SUM(retweet_count) AS total_rt
FROM tweets
WHERE created_at >= '2024-01-01'
GROUP BY DATE(created_at)
ORDER BY day;`,
    spark: `from pyspark.sql.functions import to_date, col, sum as _sum

result = (df_tweets
  .filter(col("created_at") >= "2024-01-01")
  .withColumn("day", to_date(col("created_at")))
  .groupBy("day")
  .agg(
    count("*").alias("daily_count"),
    _sum("retweet_count").alias("total_rt")
  )
  .orderBy("day")
)
result.show()`,
    time_spark: 0.6, time_hive: 6.1, time_mr: 29.4,
    speedupVsHive: 10.2,
  },
  {
    id: 'Q5',
    title: 'Reddit Engagement Score',
    hive: `SELECT subreddit, keyword,
       AVG(score) AS avg_score,
       AVG(num_comments) AS avg_comments,
       COUNT(*) AS post_count
FROM reddit_posts r
JOIN hbase_keywords k ON r.keyword = k.keyword
GROUP BY subreddit, keyword
ORDER BY avg_score DESC;`,
    spark: `from pyspark.sql.functions import avg, count

df_reddit = spark.read.parquet("/data/reddit_posts")
df_kw = spark.table("hbase_keywords")

result = (df_reddit.alias("r")
  .join(df_kw.alias("k"), "keyword")
  .groupBy("subreddit", "keyword")
  .agg(
    avg("score").alias("avg_score"),
    avg("num_comments").alias("avg_comments"),
    count("*").alias("post_count")
  )
  .orderBy(col("avg_score").desc())
)
result.show()`,
    time_spark: 1.8, time_hive: 11.3, time_mr: 52.8,
    speedupVsHive: 6.3,
  },
];

const PERF_DATA = PYSPARK_QUERIES.map(q => ({
  query: q.id,
  Spark: q.time_spark,
  Hive: q.time_hive,
  MapReduce: q.time_mr,
}));

const MAPREDUCE_STEPS = [
  {
    phase: 'Input Split',
    color: 'bg-slate-700',
    text: 'text-slate-300',
    desc: 'HDFS đọc file và chia thành các input splits (128 MB mỗi block)',
    data: ['"ChatGPT is amazing, AI is the future"', '"Bad day with GPT-4 error"', '"Love Midjourney AI art"'],
  },
  {
    phase: 'Map',
    color: 'bg-cyan-900/60',
    text: 'text-cyan-300',
    desc: 'Mỗi mapper xử lý 1 split → emit (word, 1) cho mỗi từ',
    data: ['(ChatGPT,1) (is,1) (amazing,1)', '(Bad,1) (day,1) (GPT-4,1)', '(Love,1) (Midjourney,1) (AI,1)'],
  },
  {
    phase: 'Shuffle & Sort',
    color: 'bg-violet-900/60',
    text: 'text-violet-300',
    desc: 'Framework group tất cả values cùng key → ghi vào disk',
    data: ['(AI, [1,1,1]) (amazing, [1])', '(Bad, [1]) (ChatGPT, [1,1])', '(GPT-4, [1,1]) (Love, [1])'],
  },
  {
    phase: 'Reduce',
    color: 'bg-emerald-900/60',
    text: 'text-emerald-300',
    desc: 'Mỗi reducer nhận (word, [1,1,...]) → sum và ghi kết quả',
    data: ['AI → 3', 'ChatGPT → 2', 'GPT-4 → 2', 'amazing → 1'],
  },
];

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 text-[10px] text-slate-600 font-mono uppercase">{lang}</div>
      <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export function Spark() {
  const [activeQuery, setActiveQuery] = useState(0);
  const [mrStep, setMrStep] = useState(0);

  const q = PYSPARK_QUERIES[activeQuery];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Zap className="w-7 h-7 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">Apache Spark</h1>
              <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">v3.5.x</span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">In-Memory Processing</span>
            </div>
            <p className="text-slate-400 text-sm">
              Unified engine cho batch processing, streaming, ML và graph — thay thế MapReduce với tốc độ <span className="text-orange-400 font-semibold">100× nhanh hơn</span> nhờ xử lý in-memory
            </p>
          </div>
        </div>

        {/* Spark vs MapReduce quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Nhanh hơn MR', value: '100×', color: 'text-orange-400' },
            { label: 'Avg speedup vs Hive', value: '8.2×', color: 'text-amber-400' },
            { label: 'Processing model', value: 'In-memory', color: 'text-cyan-400' },
            { label: 'APIs', value: 'RDD · DF · SQL', color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spark vs Hive vs MapReduce architecture comparison */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            name: 'MapReduce',
            badge: 'Hadoop 1.x era',
            badgeColor: 'text-slate-500 bg-slate-800',
            icon: '💾',
            pros: ['Mature, stable', 'Fault tolerant', 'Simple programming model'],
            cons: ['Disk I/O sau mỗi step', 'Iterative jobs rất chậm', 'Chỉ batch, không streaming'],
            speed: 'baseline',
            speedColor: 'text-slate-400',
          },
          {
            name: 'Apache Hive',
            badge: 'SQL-on-Hadoop',
            badgeColor: 'text-amber-400 bg-amber-500/10',
            icon: '🐝',
            pros: ['HiveQL như SQL chuẩn', 'Schema-on-read', 'Tích hợp Metastore'],
            cons: ['Biên dịch thành MapReduce', 'Latency cao (minutes)', 'Không real-time'],
            speed: '5-10× faster than MR',
            speedColor: 'text-amber-400',
          },
          {
            name: 'Apache Spark',
            badge: 'Modern Big Data',
            badgeColor: 'text-orange-400 bg-orange-500/10',
            icon: '⚡',
            pros: ['In-memory: 100× nhanh hơn MR', 'Batch + Streaming + ML', 'Lazy evaluation + DAG'],
            cons: ['RAM usage cao', 'Cần tune bộ nhớ', 'Shuffle overhead'],
            speed: '80-100× faster than MR',
            speedColor: 'text-orange-400',
          },
        ].map(eng => (
          <div key={eng.name} className={`bg-slate-900 border rounded-xl p-4 ${eng.name === 'Apache Spark' ? 'border-orange-500/30' : 'border-slate-800'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{eng.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{eng.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${eng.badgeColor}`}>{eng.badge}</span>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              {eng.pros.map(p => (
                <div key={p} className="flex items-start gap-1.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  {p}
                </div>
              ))}
              {eng.cons.map(c => (
                <div key={c} className="flex items-start gap-1.5 text-xs text-slate-500">
                  <span className="w-3 h-3 flex items-center justify-center mt-0.5 shrink-0 text-rose-500">✕</span>
                  {c}
                </div>
              ))}
            </div>
            <div className={`text-xs font-semibold ${eng.speedColor}`}>{eng.speed}</div>
          </div>
        ))}
      </div>

      {/* Performance comparison chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-slate-300">Performance: Spark vs Hive vs MapReduce (giây)</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={PERF_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="query" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              formatter={(v: unknown) => [`${v}s`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Spark" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Hive" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="MapReduce" fill="#475569" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PySpark Query Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <Code2 className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-slate-300">HiveQL → PySpark: 5 Queries So Sánh</h2>
        </div>
        {/* Query tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800">
          {PYSPARK_QUERIES.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setActiveQuery(i)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                i === activeQuery
                  ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {q.id}: {q.title.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{q.id}: {q.title}</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-orange-400">
                <Clock className="w-3 h-3" /> Spark: {q.time_spark}s
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3 h-3" /> Hive: {q.time_hive}s
              </span>
              <span className="text-emerald-400 font-semibold">↑ {q.speedupVsHive}× faster</span>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-amber-400 font-semibold uppercase mb-2">🐝 HiveQL</p>
              <CodeBlock code={q.hive} lang="HiveQL" />
            </div>
            <div>
              <p className="text-[10px] text-orange-400 font-semibold uppercase mb-2">⚡ PySpark DataFrame API</p>
              <CodeBlock code={q.spark} lang="Python" />
            </div>
          </div>
        </div>
      </div>

      {/* MapReduce WordCount step-by-step */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">⚙️</span>
            <h2 className="text-sm font-semibold text-slate-300">MapReduce: WordCount Step-by-Step</h2>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Nền tảng của Hadoop</span>
          </div>
          <div className="flex gap-1">
            {MAPREDUCE_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setMrStep(i)}
                className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                  i === mrStep ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className={`rounded-xl border ${MAPREDUCE_STEPS[mrStep].color} border-slate-700 p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-bold ${MAPREDUCE_STEPS[mrStep].text}`}>
                Phase {mrStep + 1}: {MAPREDUCE_STEPS[mrStep].phase}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">{MAPREDUCE_STEPS[mrStep].desc}</p>
            <div className="space-y-1.5">
              {MAPREDUCE_STEPS[mrStep].data.map((line, i) => (
                <div key={i} className="font-mono text-xs text-slate-300 bg-slate-950/50 rounded px-3 py-1.5">
                  {line}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {MAPREDUCE_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setMrStep(i)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  i === mrStep
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.phase}
              </button>
            ))}
          </div>
          <div className="mt-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
            <p className="text-xs text-orange-300 font-semibold mb-1">⚡ Spark làm điều này tốt hơn như thế nào?</p>
            <p className="text-xs text-slate-400">
              Spark thay thế Disk I/O giữa Map và Reduce bằng <span className="text-orange-400">in-memory RDD</span>.
              DAG Scheduler tối ưu toàn bộ job graph trước khi chạy, tránh ghi disk trung gian.
              Với iterative algorithms (ML training), Spark nhanh hơn MR <span className="text-orange-400">100×</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Spark architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Kiến trúc Spark Cluster</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {[
            { name: 'Driver Program', sub: 'SparkContext + DAGScheduler', color: 'border-orange-500/40 bg-orange-500/5 text-orange-300' },
            { name: '→ Cluster Manager', sub: 'YARN / Standalone / Mesos', color: 'border-slate-700 bg-slate-800 text-slate-400' },
            { name: 'Worker Node 1', sub: 'Executor: Tasks + Cache', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
            { name: 'Worker Node 2', sub: 'Executor: Tasks + Cache', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
            { name: 'Worker Node N', sub: 'Executor: Tasks + Cache', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
          ].map((node, i) => (
            <div key={i} className={`border rounded-xl px-3 py-2.5 text-center min-w-[120px] ${node.color}`}>
              <p className="text-xs font-semibold">{node.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{node.sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {[
            { title: 'RDD (Resilient Distributed Dataset)', desc: 'API cấp thấp, immutable distributed collection, fault-tolerant qua lineage', badge: 'Spark 1.x' },
            { title: 'DataFrame / Dataset', desc: 'Schema-aware, tối ưu với Catalyst Optimizer, Tungsten execution engine', badge: 'Spark 2.x' },
            { title: 'Spark SQL', desc: 'SQL interface, tích hợp Hive Metastore, hỗ trợ đọc Parquet/ORC/JSON', badge: 'Spark 2-3.x' },
          ].map(api => (
            <div key={api.title} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-white">{api.title}</p>
                <span className="text-[9px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">{api.badge}</span>
              </div>
              <p className="text-[11px] text-slate-400">{api.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
