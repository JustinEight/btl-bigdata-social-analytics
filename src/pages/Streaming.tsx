import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Radio, Play, Square, Layers } from 'lucide-react';

interface StreamPoint {
  t: string;
  tweets: number;
  reddit: number;
  total: number;
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function nowStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const WINDOW_DATA = [
  {
    type: 'Tumbling Window',
    icon: '⬜',
    desc: 'Window cố định, không overlap. Mỗi event thuộc đúng 1 window.',
    example: '[0-10s] [10-20s] [20-30s]',
    useCase: 'Đếm tweets mỗi 10 giây',
    color: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-300',
  },
  {
    type: 'Sliding Window',
    icon: '📐',
    desc: 'Window có kích thước cố định nhưng slide theo interval nhỏ hơn. Events có thể thuộc nhiều windows.',
    example: '[0-30s] [10-40s] [20-50s] (slide 10s)',
    useCase: 'Trending hashtags trong 30 giây gần nhất',
    color: 'border-violet-500/40 bg-violet-500/5 text-violet-300',
  },
  {
    type: 'Session Window',
    icon: '🔗',
    desc: 'Window dựa trên activity. Đóng lại sau khoảng inactivity (gap). Kích thước không cố định.',
    example: '[activity...gap...] [activity...gap...]',
    useCase: 'Phiên thảo luận về một topic',
    color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300',
  },
];

const KAFKA_VS_FLUME = [
  { criterion: 'Mục đích', kafka: 'Distributed message queue', flume: 'Log/event ingestion vào HDFS' },
  { criterion: 'Throughput', kafka: 'Hàng triệu msg/giây', flume: 'Hàng nghìn events/giây' },
  { criterion: 'Retention', kafka: 'Giữ messages (configurable)', flume: 'Pass-through, không store' },
  { criterion: 'Consumer model', kafka: 'Pull-based (consumer tự lấy)', flume: 'Push-based (sink đẩy ra)' },
  { criterion: 'Replay', kafka: 'Có thể replay từ offset', flume: 'Không hỗ trợ replay' },
  { criterion: 'Dùng với Spark', kafka: 'Spark Structured Streaming', flume: 'Spark Streaming (deprecated)' },
  { criterion: 'Project này', kafka: 'Thu thập Twitter stream real-time', flume: 'Thu thập Reddit logs theo batch' },
];

const SPARK_STREAMING_CODE = `# Spark Structured Streaming từ Kafka
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, window, count, from_json
from pyspark.sql.types import StructType, StringType

spark = SparkSession.builder \\
    .appName("SocialMediaStream") \\
    .getOrCreate()

schema = StructType() \\
    .add("keyword", StringType()) \\
    .add("hashtag", StringType()) \\
    .add("text", StringType()) \\
    .add("timestamp", StringType())

# Đọc stream từ Kafka topic "tweets-stream"
raw = spark.readStream \\
    .format("kafka") \\
    .option("kafka.bootstrap.servers", "localhost:9092") \\
    .option("subscribe", "tweets-stream") \\
    .load()

tweets = raw.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")

# Sliding window: đếm keywords trong 30s, slide mỗi 10s
windowed = (tweets
    .withWatermark("timestamp", "5 seconds")
    .groupBy(
        window(col("timestamp"), "30 seconds", "10 seconds"),
        col("keyword")
    )
    .count()
    .orderBy(col("count").desc())
)

# Ghi kết quả ra console (hoặc Kafka output topic)
query = windowed.writeStream \\
    .outputMode("update") \\
    .format("console") \\
    .trigger(processingTime="10 seconds") \\
    .start()

query.awaitTermination()`;

export function Streaming() {
  const [isRunning, setIsRunning] = useState(false);
  const [streamData, setStreamData] = useState<StreamPoint[]>([]);
  const [metrics, setMetrics] = useState({
    msgPerSec: 0, totalMessages: 0, kafkaLag: 0, partitions: 3,
  });
  const totalRef = useRef(0);

  useEffect(() => {
    if (!isRunning) return;

    // generate initial seed data
    if (streamData.length === 0) {
      const seed: StreamPoint[] = [];
      const now = Date.now();
      for (let i = 29; i >= 1; i--) {
        const d = new Date(now - i * 1000);
        const tw = Math.floor(60 + Math.random() * 100);
        const re = Math.floor(15 + Math.random() * 50);
        seed.push({ t: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`, tweets: tw, reddit: re, total: tw + re });
        totalRef.current += tw + re;
      }
      setStreamData(seed);
      setMetrics(m => ({ ...m, totalMessages: totalRef.current }));
    }

    const interval = setInterval(() => {
      const tw = Math.floor(60 + Math.random() * 100);
      const re = Math.floor(15 + Math.random() * 50);
      totalRef.current += tw + re;
      const pt: StreamPoint = { t: nowStr(), tweets: tw, reddit: re, total: tw + re };
      setStreamData(prev => [...prev.slice(-59), pt]);
      setMetrics({
        msgPerSec: tw + re,
        totalMessages: totalRef.current,
        kafkaLag: Math.floor(Math.random() * 300),
        partitions: 3,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  function handleToggle() {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  }

  function handleReset() {
    setIsRunning(false);
    setStreamData([]);
    totalRef.current = 0;
    setMetrics({ msgPerSec: 0, totalMessages: 0, kafkaLag: 0, partitions: 3 });
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Radio className="w-7 h-7 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">Kafka Streaming</h1>
              <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Real-time</span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">Big Data Velocity</span>
            </div>
            <p className="text-slate-400 text-sm">
              Big Data Velocity: xử lý dữ liệu <span className="text-violet-400 font-semibold">liên tục theo stream</span> thay vì batch.
              Apache Kafka làm message broker; Spark Structured Streaming xử lý với window operations.
            </p>
          </div>
        </div>
      </div>

      {/* Kafka Architecture SVG */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Kiến trúc Kafka trong Pipeline</h2>
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between gap-2 min-w-[700px]">
            {/* Producers */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-slate-500 text-center mb-1 font-semibold">PRODUCERS</div>
              {['Twitter API\nStreaming', 'Reddit\nPusher API', 'Flume Agent\n(Log Relay)'].map(p => (
                <div key={p} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center">
                  <p className="text-[10px] text-cyan-300 font-mono whitespace-pre">{p}</p>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1 text-violet-400">
              <div className="text-[10px] font-semibold">Produce →</div>
              <div className="h-0.5 w-12 bg-violet-500/50" />
            </div>

            {/* Kafka Broker */}
            <div className="bg-violet-900/30 border border-violet-500/40 rounded-xl p-4 text-center min-w-[160px]">
              <p className="text-xs font-bold text-violet-300 mb-2">Kafka Broker</p>
              {['tweets-stream', 'reddit-stream', 'comments-stream'].map(t => (
                <div key={t} className="bg-slate-900 rounded px-2 py-1 text-[10px] text-violet-200 font-mono mb-1">
                  topic: {t}
                </div>
              ))}
              <p className="text-[9px] text-slate-600 mt-2">3 partitions · replication=2</p>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1 text-emerald-400">
              <div className="text-[10px] font-semibold">→ Consume</div>
              <div className="h-0.5 w-12 bg-emerald-500/50" />
            </div>

            {/* Consumers */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-slate-500 text-center mb-1 font-semibold">CONSUMERS</div>
              {['Spark Structured\nStreaming', 'HDFS Sink\n(raw storage)', 'Dashboard\nReal-time'].map(c => (
                <div key={c} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center">
                  <p className="text-[10px] text-emerald-300 font-mono whitespace-pre">{c}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE Streaming Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <h2 className="text-sm font-semibold text-slate-300">Live Message Throughput</h2>
            {isRunning && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">LIVE</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isRunning
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : 'bg-violet-500/10 text-violet-400 border border-violet-500/30 hover:bg-violet-500/20'
              }`}
            >
              {isRunning ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start Stream</>}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs text-slate-500 border border-slate-700 hover:border-slate-600 rounded-lg transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-0 border-b border-slate-800">
          {[
            { label: 'msg/sec', value: metrics.msgPerSec.toLocaleString(), color: 'text-violet-400' },
            { label: 'Total ingested', value: metrics.totalMessages.toLocaleString(), color: 'text-cyan-400' },
            { label: 'Consumer lag', value: `${metrics.kafkaLag} ms`, color: metrics.kafkaLag > 200 ? 'text-amber-400' : 'text-emerald-400' },
            { label: 'Partitions', value: metrics.partitions, color: 'text-slate-400' },
          ].map(m => (
            <div key={m.label} className="px-4 py-3 border-r border-slate-800 last:border-0">
              <p className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="p-5">
          {streamData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-600">
              <Radio className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Nhấn Start Stream để xem real-time data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={streamData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="tweets" stroke="#06b6d4" fill="url(#gt)" strokeWidth={1.5} name="Twitter" dot={false} />
                <Area type="monotone" dataKey="reddit" stroke="#f97316" fill="url(#gr)" strokeWidth={1.5} name="Reddit" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Window Operations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-300">Window Operations trong Streaming</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {WINDOW_DATA.map(w => (
            <div key={w.type} className={`border rounded-xl p-4 ${w.color.split(' ').slice(0, 2).join(' ')}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{w.icon}</span>
                <p className={`text-sm font-semibold ${w.color.split(' ')[2]}`}>{w.type}</p>
              </div>
              <p className="text-xs text-slate-400 mb-2">{w.desc}</p>
              <div className="bg-slate-950/60 rounded px-2 py-1.5 font-mono text-[10px] text-slate-400 mb-2">{w.example}</div>
              <p className="text-[10px] text-slate-500"><span className="text-slate-400">Use case:</span> {w.useCase}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PySpark Structured Streaming Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">PySpark Structured Streaming + Kafka</h2>
          <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">Sliding Window 30s/10s</span>
        </div>
        <pre className="p-5 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed bg-slate-950/50">
          {SPARK_STREAMING_CODE}
        </pre>
      </div>

      {/* Kafka vs Flume comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300">Kafka vs Apache Flume — Tại sao dùng cả hai?</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-left py-2.5 px-4 text-slate-500">Tiêu chí</th>
                <th className="text-left py-2.5 px-4 text-violet-400">Apache Kafka</th>
                <th className="text-left py-2.5 px-4 text-amber-400">Apache Flume</th>
              </tr>
            </thead>
            <tbody>
              {KAFKA_VS_FLUME.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-2 px-4 text-slate-400 font-medium">{row.criterion}</td>
                  <td className="py-2 px-4 text-slate-300">{row.kafka}</td>
                  <td className="py-2 px-4 text-slate-300">{row.flume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
          ✅ Project dùng <span className="text-amber-400">Flume</span> cho batch log ingestion và <span className="text-violet-400">Kafka</span> cho real-time Twitter stream — kết hợp Lambda Architecture (batch + speed layer)
        </div>
      </div>
    </div>
  );
}
