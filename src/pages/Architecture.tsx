import { useState } from 'react';
import { Map, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'overview',  label: 'Kiến trúc tổng thể' },
  { id: 'flume',     label: 'Flume Pipeline' },
  { id: 'oozie',     label: 'Oozie Workflow' },
  { id: 'storage',   label: 'HDFS & HBase Schema' },
];

/* ── helpers ──────────────────────────────────────────────── */
function Arrow({ x1, y1, x2, y2, color = '#475569' }: { x1:number;y1:number;x2:number;y2:number;color?:string }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const ux = dx/len, uy = dy/len;
  const hx = x2 - ux*10, hy = y2 - uy*10;
  const px = -uy*5, py = ux*5;
  return (
    <g>
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={1.5} />
      <polygon
        points={`${x2},${y2} ${hx+px},${hy+py} ${hx-px},${hy-py}`}
        fill={color}
      />
    </g>
  );
}

function Box({
  x, y, w = 110, h = 38, label, sub, fill = '#1e293b', stroke = '#334155', textColor = '#e2e8f0', subColor = '#64748b',
}: { x:number;y:number;w?:number;h?:number;label:string;sub?:string;fill?:string;stroke?:string;textColor?:string;subColor?:string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w/2} y={y + (sub ? h/2 - 3 : h/2 + 1)} textAnchor="middle" fill={textColor} fontSize={11} fontWeight="600" dominantBaseline="middle">{label}</text>
      {sub && <text x={x + w/2} y={y + h/2 + 10} textAnchor="middle" fill={subColor} fontSize={9} dominantBaseline="middle">{sub}</text>}
    </g>
  );
}

function SectionLabel({ x, y, label, color = '#94a3b8' }: { x:number;y:number;label:string;color?:string }) {
  return (
    <text x={x} y={y} fill={color} fontSize={9} fontWeight="700" letterSpacing="1.5" dominantBaseline="middle">{label.toUpperCase()}</text>
  );
}

/* ── Diagram 1: Tổng thể ──────────────────────────────────── */
function DiagramOverview() {
  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-x-auto">
      <p className="text-xs text-slate-500 mb-3 font-semibold">SƠ ĐỒ KIẾN TRÚC HỆ THỐNG — Social Media Big Data Analytics</p>
      <svg width="820" height="480" viewBox="0 0 820 480" className="min-w-[820px]">

        {/* ── Layer labels ── */}
        <SectionLabel x={10} y={55}  label="Thu thập"   color="#22d3ee" />
        <SectionLabel x={10} y={155} label="Lưu trữ"    color="#34d399" />
        <SectionLabel x={10} y={265} label="Xử lý"      color="#f59e0b" />
        <SectionLabel x={10} y={365} label="Điều phối"  color="#a78bfa" />
        <SectionLabel x={10} y={435} label="Trình bày"  color="#f472b6" />

        {/* ── Layer backgrounds ── */}
        <rect x={80} y={30}  width={720} height={90}  rx={8} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
        <rect x={80} y={130} width={720} height={90}  rx={8} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
        <rect x={80} y={235} width={720} height={90}  rx={8} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
        <rect x={80} y={340} width={720} height={50}  rx={8} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
        <rect x={80} y={410} width={720} height={50}  rx={8} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />

        {/* ── Layer 1: Thu thập (Data Sources + Ingestion) ── */}
        {/* Twitter API */}
        <Box x={95}  y={48} w={110} h={42} label="Twitter API" sub="Streaming data" fill="#0c4a6e" stroke="#0ea5e9" textColor="#7dd3fc" />
        {/* Reddit API */}
        <Box x={220} y={48} w={110} h={42} label="Reddit API" sub="REST API" fill="#431407" stroke="#f97316" textColor="#fdba74" />
        {/* CSV Files */}
        <Box x={345} y={48} w={120} h={42} label="CSV Files" sub="1 tỷ rows · 131 GB" fill="#1a1a2e" stroke="#6366f1" textColor="#a5b4fc" />
        {/* Flume */}
        <Box x={490} y={48} w={130} h={42} label="Apache Flume" sub="SpoolDir → HDFS" fill="#064e3b" stroke="#10b981" textColor="#6ee7b7" />
        {/* MySQL */}
        <Box x={640} y={48} w={110} h={42} label="MySQL DB" sub="social_db · 3 tables" fill="#1c1917" stroke="#d97706" textColor="#fcd34d" />

        {/* ── Layer 2: Lưu trữ ── */}
        {/* HDFS */}
        <Box x={95}  y={148} w={200} h={42} label="HDFS Raw Layer" sub="/user/social_analytics/raw/" fill="#0a1628" stroke="#3b82f6" textColor="#93c5fd" />
        {/* Sqoop */}
        <Box x={315} y={148} w={120} h={42} label="Sqoop Import" sub="MySQL → HDFS · 4 mappers" fill="#1a1a2e" stroke="#8b5cf6" textColor="#c4b5fd" />
        {/* HBase */}
        <Box x={455} y={148} w={170} h={42} label="Apache HBase" sub="keywords_index · social_stats" fill="#0c2340" stroke="#06b6d4" textColor="#67e8f9" />
        {/* HDFS Processed */}
        <Box x={645} y={148} w={145} h={42} label="HDFS Processed" sub="/processed/ · Hive+Pig output" fill="#0a1628" stroke="#3b82f6" textColor="#93c5fd" />

        {/* ── Layer 3: Xử lý ── */}
        {/* Hive */}
        <Box x={95}  y={253} w={250} h={42} label="Apache Hive (HiveQL)" sub="Q1 Keywords · Q2 Hashtags · Q3 Reddit · Q4 Daily · Q5 Sentiment" fill="#1c1212" stroke="#f59e0b" textColor="#fde68a" />
        {/* Pig */}
        <Box x={365} y={253} w={240} h={42} label="Apache Pig (Pig Latin)" sub="keyword_stats · daily_keyword · subreddit_stats" fill="#1c1212" stroke="#ef4444" textColor="#fca5a5" />
        {/* YARN */}
        <Box x={625} y={253} w={165} h={42} label="YARN / MapReduce" sub="Resource management" fill="#131a2e" stroke="#6366f1" textColor="#a5b4fc" />

        {/* ── Layer 4: Oozie ── */}
        <Box x={95}  y={355} w={700} h={30} label="Apache Oozie — Workflow Orchestration (coordinator: daily 2:00 AM)" fill="#1a0a2e" stroke="#a78bfa" textColor="#c4b5fd" />

        {/* ── Layer 5: Output ── */}
        <Box x={95}  y={423} w={200} h={30} label="Supabase (PostgreSQL)" fill="#0a1a14" stroke="#34d399" textColor="#6ee7b7" />
        <Box x={315} y={423} w={300} h={30} label="React Dashboard · vercel.app" fill="#1a0a1a" stroke="#f472b6" textColor="#f9a8d4" />
        <Box x={635} y={423} w={160} h={30} label="Báo cáo PDF / Demo" fill="#1a1a0a" stroke="#fbbf24" textColor="#fde68a" />

        {/* ── Arrows Layer 1 → Layer 2 ── */}
        <Arrow x1={150} y1={90} x2={175} y2={148} color="#0ea5e9" />
        <Arrow x1={275} y1={90} x2={200} y2={148} color="#f97316" />
        <Arrow x1={405} y1={90} x2={375} y2={148} color="#6366f1" />
        <Arrow x1={555} y1={90} x2={220} y2={148} color="#10b981" />
        <Arrow x1={695} y1={90} x2={375} y2={148} color="#d97706" />

        {/* ── Arrows Layer 2 → Layer 3 ── */}
        <Arrow x1={200} y1={190} x2={220} y2={253} color="#3b82f6" />
        <Arrow x1={375} y1={190} x2={300} y2={253} color="#8b5cf6" />
        <Arrow x1={540} y1={190} x2={480} y2={253} color="#06b6d4" />
        <Arrow x1={718} y1={190} x2={710} y2={253} color="#3b82f6" />

        {/* ── Arrows Layer 3 → Layer 4 ── */}
        <Arrow x1={300} y1={295} x2={400} y2={355} color="#f59e0b" />
        <Arrow x1={485} y1={295} x2={450} y2={355} color="#ef4444" />

        {/* ── Arrows Layer 4 → Layer 5 ── */}
        <Arrow x1={250} y1={385} x2={195} y2={423} color="#a78bfa" />
        <Arrow x1={445} y1={385} x2={465} y2={423} color="#a78bfa" />
        <Arrow x1={600} y1={385} x2={715} y2={423} color="#a78bfa" />

        {/* Legend */}
        <text x={90} y={468} fill="#475569" fontSize={8}>★ HDP 2.6.5 · Single Node Cluster · YARN Resource Manager</text>
      </svg>
    </div>
  );
}

/* ── Diagram 2: Flume ─────────────────────────────────────── */
function DiagramFlume() {
  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-x-auto">
      <p className="text-xs text-slate-500 mb-3 font-semibold">SƠ ĐỒ FLUME AGENT — flume-agent.conf</p>
      <svg width="760" height="320" viewBox="0 0 760 320" className="min-w-[760px]">

        {/* Column labels */}
        <SectionLabel x={60}  y={25} label="Sources"  color="#22d3ee" />
        <SectionLabel x={280} y={25} label="Channels" color="#34d399" />
        <SectionLabel x={490} y={25} label="Sinks"    color="#f59e0b" />
        <SectionLabel x={660} y={25} label="HDFS"     color="#a78bfa" />

        {/* ── SOURCE 1: twitter_source ── */}
        <rect x={40} y={50} width={170} height={95} rx={8} fill="#0c2a3a" stroke="#0ea5e9" strokeWidth={1.5} />
        <text x={125} y={68} textAnchor="middle" fill="#7dd3fc" fontSize={11} fontWeight="700">twitter_source</text>
        <text x={125} y={85} textAnchor="middle" fill="#475569" fontSize={9}>type: spooldir</text>
        <text x={125} y={99} textAnchor="middle" fill="#475569" fontSize={9}>/incoming/tweets</text>
        <text x={125} y={113} textAnchor="middle" fill="#475569" fontSize={9}>batchSize: 1,000</text>
        <text x={125} y={127} textAnchor="middle" fill="#64748b" fontSize={8}>fileSuffix: .COMPLETED</text>

        {/* ── SOURCE 2: reddit_source ── */}
        <rect x={40} y={165} width={170} height={95} rx={8} fill="#1a1208" stroke="#f97316" strokeWidth={1.5} />
        <text x={125} y={183} textAnchor="middle" fill="#fdba74" fontSize={11} fontWeight="700">reddit_source</text>
        <text x={125} y={200} textAnchor="middle" fill="#475569" fontSize={9}>type: spooldir</text>
        <text x={125} y={214} textAnchor="middle" fill="#475569" fontSize={9}>/incoming/reddit</text>
        <text x={125} y={228} textAnchor="middle" fill="#475569" fontSize={9}>batchSize: 500</text>
        <text x={125} y={242} textAnchor="middle" fill="#64748b" fontSize={8}>fileSuffix: .COMPLETED</text>

        {/* ── CHANNEL 1: mem_channel ── */}
        <rect x={255} y={50} width={160} height={95} rx={8} fill="#0a2818" stroke="#10b981" strokeWidth={1.5} />
        <text x={335} y={68} textAnchor="middle" fill="#6ee7b7" fontSize={11} fontWeight="700">mem_channel</text>
        <text x={335} y={85} textAnchor="middle" fill="#475569" fontSize={9}>type: memory</text>
        <text x={335} y={99} textAnchor="middle" fill="#475569" fontSize={9}>capacity: 100,000</text>
        <text x={335} y={113} textAnchor="middle" fill="#475569" fontSize={9}>txCapacity: 5,000</text>
        <text x={335} y={127} textAnchor="middle" fill="#34d399" fontSize={8}>⚡ High speed</text>

        {/* ── CHANNEL 2: file_channel ── */}
        <rect x={255} y={165} width={160} height={95} rx={8} fill="#1a1228" stroke="#8b5cf6" strokeWidth={1.5} />
        <text x={335} y={183} textAnchor="middle" fill="#c4b5fd" fontSize={11} fontWeight="700">file_channel</text>
        <text x={335} y={200} textAnchor="middle" fill="#475569" fontSize={9}>type: file</text>
        <text x={335} y={214} textAnchor="middle" fill="#475569" fontSize={9}>capacity: 500,000</text>
        <text x={335} y={228} textAnchor="middle" fill="#475569" fontSize={9}>checkpoint: enabled</text>
        <text x={335} y={242} textAnchor="middle" fill="#a78bfa" fontSize={8}>🔒 Durable</text>

        {/* ── SINK 1: hdfs_sink_tweets ── */}
        <rect x={460} y={50} width={170} height={95} rx={8} fill="#0a1628" stroke="#3b82f6" strokeWidth={1.5} />
        <text x={545} y={68} textAnchor="middle" fill="#93c5fd" fontSize={10} fontWeight="700">hdfs_sink_tweets</text>
        <text x={545} y={84} textAnchor="middle" fill="#475569" fontSize={9}>type: hdfs</text>
        <text x={545} y={98} textAnchor="middle" fill="#475569" fontSize={9}>rollInterval: 3600s</text>
        <text x={545} y={112} textAnchor="middle" fill="#475569" fontSize={9}>rollSize: 128 MB</text>
        <text x={545} y={126} textAnchor="middle" fill="#64748b" fontSize={8}>batchSize: 1,000</text>

        {/* ── SINK 2: hdfs_sink_reddit ── */}
        <rect x={460} y={165} width={170} height={95} rx={8} fill="#0a1628" stroke="#06b6d4" strokeWidth={1.5} />
        <text x={545} y={183} textAnchor="middle" fill="#67e8f9" fontSize={10} fontWeight="700">hdfs_sink_reddit</text>
        <text x={545} y={199} textAnchor="middle" fill="#475569" fontSize={9}>type: hdfs</text>
        <text x={545} y={213} textAnchor="middle" fill="#475569" fontSize={9}>rollInterval: 7200s</text>
        <text x={545} y={227} textAnchor="middle" fill="#475569" fontSize={9}>rollSize: 128 MB</text>
        <text x={545} y={241} textAnchor="middle" fill="#64748b" fontSize={8}>batchSize: 500</text>

        {/* ── HDFS paths ── */}
        <rect x={660} y={55} width={88} height={38} rx={5} fill="#0f1729" stroke="#3b82f6" strokeWidth={1} />
        <text x={704} y={70} textAnchor="middle" fill="#93c5fd" fontSize={8} fontWeight="600">/raw/tweets/</text>
        <text x={704} y={83} textAnchor="middle" fill="#475569" fontSize={7}>%Y-%m-%d/tweets_*.csv</text>

        <rect x={660} y={170} width={88} height={38} rx={5} fill="#0f1729" stroke="#06b6d4" strokeWidth={1} />
        <text x={704} y={185} textAnchor="middle" fill="#67e8f9" fontSize={8} fontWeight="600">/raw/reddit/</text>
        <text x={704} y={198} textAnchor="middle" fill="#475569" fontSize={7}>%Y-%m-%d/reddit_*.csv</text>

        {/* ── Arrows ── */}
        <Arrow x1={210} y1={97}  x2={255} y2={97}  color="#0ea5e9" />
        <Arrow x1={210} y1={212} x2={255} y2={212} color="#f97316" />
        <Arrow x1={415} y1={97}  x2={460} y2={97}  color="#10b981" />
        <Arrow x1={415} y1={212} x2={460} y2={212} color="#8b5cf6" />
        <Arrow x1={630} y1={97}  x2={660} y2={74}  color="#3b82f6" />
        <Arrow x1={630} y1={212} x2={660} y2={189} color="#06b6d4" />

        {/* note */}
        <text x={40} y={300} fill="#475569" fontSize={8}>Agent: social_agent | Sources: 2 (SpoolDir) | Channels: 2 (Memory+File) | Sinks: 2 (HDFS)</text>
        <text x={40} y={312} fill="#475569" fontSize={8}>twitter_source → mem_channel → hdfs_sink_tweets | reddit_source → file_channel → hdfs_sink_reddit</text>
      </svg>
    </div>
  );
}

/* ── Diagram 3: Oozie Workflow ────────────────────────────── */
function DiagramOozie() {
  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-x-auto">
      <p className="text-xs text-slate-500 mb-3 font-semibold">SƠ ĐỒ OOZIE WORKFLOW — workflow.xml + coordinator.xml</p>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Workflow SVG */}
        <div>
          <p className="text-[10px] text-slate-600 mb-2 font-semibold uppercase">workflow.xml — Action sequence</p>
          <svg width="380" height="460" viewBox="0 0 380 460">
            {/* START */}
            <rect x={155} y={20} width={80} height={30} rx={15} fill="#14532d" stroke="#22c55e" strokeWidth={1.5} />
            <text x={195} y={35} textAnchor="middle" fill="#86efac" fontSize={11} fontWeight="700" dominantBaseline="middle">START</text>

            {/* sqoop-import */}
            <rect x={80} y={72} width={230} height={44} rx={6} fill="#1a1228" stroke="#8b5cf6" strokeWidth={1.5} />
            <text x={195} y={88} textAnchor="middle" fill="#c4b5fd" fontSize={11} fontWeight="700">sqoop-import</text>
            <text x={195} y={103} textAnchor="middle" fill="#64748b" fontSize={9}>MySQL social_db → HDFS · 4 mappers</text>

            {/* hive-create-tables */}
            <rect x={80} y={138} width={230} height={44} rx={6} fill="#1c1212" stroke="#f59e0b" strokeWidth={1.5} />
            <text x={195} y={154} textAnchor="middle" fill="#fde68a" fontSize={11} fontWeight="700">hive-create-tables</text>
            <text x={195} y={169} textAnchor="middle" fill="#64748b" fontSize={9}>1_create_tables.hql · 3 EXTERNAL TABLEs</text>

            {/* hive-queries */}
            <rect x={80} y={204} width={230} height={44} rx={6} fill="#1c1212" stroke="#f59e0b" strokeWidth={1.5} />
            <text x={195} y={220} textAnchor="middle" fill="#fde68a" fontSize={11} fontWeight="700">hive-queries</text>
            <text x={195} y={235} textAnchor="middle" fill="#64748b" fontSize={9}>2_queries.hql · Q1 Keywords → Q5 Sentiment</text>

            {/* pig 3 nodes side by side */}
            <rect x={10}  y={272} width={110} height={44} rx={6} fill="#1a0808" stroke="#ef4444" strokeWidth={1.5} />
            <text x={65}  y={288} textAnchor="middle" fill="#fca5a5" fontSize={9} fontWeight="700">pig-keyword</text>
            <text x={65}  y={302} textAnchor="middle" fill="#64748b" fontSize={8}>keyword_stats.pig</text>

            <rect x={135} y={272} width={110} height={44} rx={6} fill="#1a0808" stroke="#ef4444" strokeWidth={1.5} />
            <text x={190} y={288} textAnchor="middle" fill="#fca5a5" fontSize={9} fontWeight="700">pig-daily</text>
            <text x={190} y={302} textAnchor="middle" fill="#64748b" fontSize={8}>daily_keyword.pig</text>

            <rect x={260} y={272} width={110} height={44} rx={6} fill="#1a0808" stroke="#ef4444" strokeWidth={1.5} />
            <text x={315} y={288} textAnchor="middle" fill="#fca5a5" fontSize={9} fontWeight="700">pig-subreddit</text>
            <text x={315} y={302} textAnchor="middle" fill="#64748b" fontSize={8}>subreddit_stats.pig</text>

            {/* END */}
            <rect x={135} y={342} width={120} height={30} rx={15} fill="#1e3a5f" stroke="#3b82f6" strokeWidth={1.5} />
            <text x={195} y={357} textAnchor="middle" fill="#93c5fd" fontSize={11} fontWeight="700" dominantBaseline="middle">END</text>

            {/* FAIL */}
            <rect x={295} y={138} width={80} height={44} rx={6} fill="#3b0a0a" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 2" />
            <text x={335} y={156} textAnchor="middle" fill="#fca5a5" fontSize={9} fontWeight="700">FAIL</text>
            <text x={335} y={170} textAnchor="middle" fill="#64748b" fontSize={8}>(kill node)</text>

            {/* Arrows ok path */}
            <Arrow x1={195} y1={50}  x2={195} y2={72}  color="#22c55e" />
            <Arrow x1={195} y1={116} x2={195} y2={138} color="#8b5cf6" />
            <Arrow x1={195} y1={182} x2={195} y2={204} color="#f59e0b" />
            <Arrow x1={155} y1={248} x2={65}  y2={272} color="#f59e0b" />
            <Arrow x1={195} y1={248} x2={190} y2={272} color="#f59e0b" />
            <Arrow x1={235} y1={248} x2={315} y2={272} color="#f59e0b" />
            <Arrow x1={65}  y1={316} x2={165} y2={342} color="#ef4444" />
            <Arrow x1={190} y1={316} x2={190} y2={342} color="#ef4444" />
            <Arrow x1={315} y1={316} x2={225} y2={342} color="#ef4444" />

            {/* Error arrows */}
            <Arrow x1={310} y1={94}  x2={335} y2={138} color="#ef4444" />
            <Arrow x1={310} y1={160} x2={335} y2={160} color="#ef4444" />

            {/* ok/error labels */}
            <text x={198} y={66}  fill="#22c55e" fontSize={8}>✓ ok</text>
            <text x={198} y={132} fill="#22c55e" fontSize={8}>✓ ok</text>
            <text x={198} y={198} fill="#22c55e" fontSize={8}>✓ ok</text>
            <text x={313} y={86}  fill="#ef4444" fontSize={8}>✗ error</text>

            {/* Coordinator note */}
            <rect x={10} y={392} width={360} height={55} rx={6} fill="#1a0a2e" stroke="#a78bfa" strokeWidth={1} />
            <text x={190} y={410} textAnchor="middle" fill="#c4b5fd" fontSize={10} fontWeight="700">coordinator.xml</text>
            <text x={190} y={425} textAnchor="middle" fill="#64748b" fontSize={9}>frequency: ${"{coord:days(1)}"} | timezone: Asia/Ho_Chi_Minh</text>
            <text x={190} y={438} textAnchor="middle" fill="#64748b" fontSize={9}>start: 2024-01-01T02:00Z (2:00 AM mỗi ngày)</text>
          </svg>
        </div>

        {/* Timeline + config detail */}
        <div className="space-y-3">
          <p className="text-[10px] text-slate-600 font-semibold uppercase">Chi tiết từng action</p>
          {[
            { step: '1', name: 'sqoop-import',        type: 'Sqoop',   color: 'border-violet-500/40 bg-violet-500/5', tc: 'text-violet-300',  desc: 'Connect jdbc:mysql://localhost/social_db, import table tweets, --num-mappers 4, target-dir HDFS' },
            { step: '2', name: 'hive-create-tables',  type: 'Hive',    color: 'border-amber-500/40 bg-amber-500/5',   tc: 'text-amber-300',   desc: 'Chạy 1_create_tables.hql: CREATE DATABASE social_analytics, 3 EXTERNAL TABLE, LOCATION HDFS' },
            { step: '3', name: 'hive-queries',        type: 'Hive',    color: 'border-amber-500/40 bg-amber-500/5',   tc: 'text-amber-300',   desc: 'Chạy 2_queries.hql: Q1 COUNT keyword, Q2 LATERAL VIEW hashtags, Q3 AVG score, Q4 daily, Q5 RLIKE sentiment' },
            { step: '4', name: 'pig-keyword-stats',   type: 'Pig',     color: 'border-red-500/40 bg-red-500/5',       tc: 'text-red-300',     desc: 'LOAD tweets → GROUP BY keyword → COUNT/SUM/AVG → STORE /processed/pig_keyword_stats' },
            { step: '5', name: 'pig-daily-keyword',   type: 'Pig',     color: 'border-red-500/40 bg-red-500/5',       tc: 'text-red-300',     desc: 'LOAD tweets → SUBSTRING(created_at,0,10) → GROUP (day,keyword) → STORE /processed/pig_daily_keyword' },
            { step: '6', name: 'pig-subreddit-stats', type: 'Pig',     color: 'border-red-500/40 bg-red-500/5',       tc: 'text-red-300',     desc: 'LOAD comments + posts → GROUP BY subreddit → JOIN → STORE /processed/pig_subreddit_stats' },
          ].map(a => (
            <div key={a.step} className={`border rounded-lg p-2.5 ${a.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500 w-4">{a.step}</span>
                <span className={`text-xs font-semibold ${a.tc}`}>{a.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${a.tc} bg-slate-800`}>{a.type}</span>
              </div>
              <p className="text-[10px] text-slate-500 ml-6">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Diagram 4: Storage Schema ────────────────────────────── */
function DiagramStorage() {
  return (
    <div className="space-y-4">
      {/* HDFS */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
        <p className="text-xs text-slate-500 mb-4 font-semibold">HDFS DIRECTORY STRUCTURE — setup_hdfs.sh</p>
        <svg width="700" height="200" viewBox="0 0 700 200" className="min-w-[700px]">
          {/* Root */}
          <Box x={10} y={75} w={200} h={38} label="/user/social_analytics/" fill="#0a1628" stroke="#3b82f6" textColor="#93c5fd" />

          {/* raw/ */}
          <Box x={260} y={30} w={160} h={38} label="raw/" fill="#0a1a10" stroke="#22c55e" textColor="#86efac" sub="Input data" />
          {/* processed/ */}
          <Box x={260} y={120} w={160} h={38} label="processed/" fill="#1a100a" stroke="#f59e0b" textColor="#fde68a" sub="Hive+Pig output" />

          {/* raw sub-dirs */}
          <Box x={475} y={0}   w={210} h={38} label="tweets/" sub="500M rows · ~70 GB · block 128MB" fill="#0c1a28" stroke="#3b82f6" textColor="#93c5fd" />
          <Box x={475} y={48}  w={210} h={38} label="reddit_posts/" sub="10M rows · ~1.5 GB" fill="#0c1a28" stroke="#3b82f6" textColor="#93c5fd" />
          <Box x={475} y={96}  w={210} h={38} label="reddit_comments/" sub="490M rows · ~60 GB" fill="#0c1a28" stroke="#3b82f6" textColor="#93c5fd" />

          {/* processed sub-dirs */}
          <Box x={475} y={144} w={210} h={16} label="pig_keyword_stats/  pig_daily_keyword/  pig_subreddit_stats/" fill="#1a120a" stroke="#f59e0b" textColor="#fde68a" />

          {/* Arrows */}
          <Arrow x1={210} y1={88}  x2={260} y2={49}  color="#3b82f6" />
          <Arrow x1={210} y1={94}  x2={260} y2={139} color="#f59e0b" />
          <Arrow x1={420} y1={49}  x2={475} y2={19}  color="#22c55e" />
          <Arrow x1={420} y1={49}  x2={475} y2={67}  color="#22c55e" />
          <Arrow x1={420} y1={49}  x2={475} y2={115} color="#22c55e" />
          <Arrow x1={420} y1={139} x2={475} y2={152} color="#f59e0b" />

          {/* replication note */}
          <text x={10}  y={165} fill="#475569" fontSize={8}>Replication factor: 1 (single node) | Block size: 128 MB | chmod: 755 | chown: hdfs:hdfs</text>
          <text x={10}  y={178} fill="#475569" fontSize={8}>Kiểm tra: hdfs fsck /user/social_analytics/ -files -blocks -locations</text>
          <text x={10}  y={191} fill="#475569" fontSize={8}>Kích thước: hdfs dfs -du -h /user/social_analytics/raw/</text>
        </svg>
      </div>

      {/* HBase */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
        <p className="text-xs text-slate-500 mb-4 font-semibold">HBASE SCHEMA — setup_hbase.sh</p>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Table 1 */}
          <div className="border border-cyan-500/30 rounded-xl overflow-hidden">
            <div className="bg-cyan-500/10 px-4 py-2 border-b border-cyan-500/20">
              <p className="text-xs font-bold text-cyan-300">Table: keywords_index</p>
              <p className="text-[10px] text-slate-500">Row Key: {'{keyword}_{tweet_id}'}  —  VD: ChatGPT_t_0000001</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-800">
              {[
                { cf: 'tweet_info', ver: 'VERSIONS=1', cols: ['keyword', 'username', 'text'], color: 'text-cyan-400' },
                { cf: 'metrics',    ver: 'VERSIONS=3', cols: ['retweet_count', 'like_count'],  color: 'text-emerald-400' },
                { cf: 'metadata',   ver: 'VERSIONS=1', cols: ['created_at'],                  color: 'text-amber-400' },
              ].map(cf => (
                <div key={cf.cf} className="p-3">
                  <p className={`text-[10px] font-bold ${cf.color} mb-1`}>CF: {cf.cf}</p>
                  <p className="text-[9px] text-slate-600 mb-2">{cf.ver}</p>
                  {cf.cols.map(c => (
                    <div key={c} className="text-[10px] text-slate-400 bg-slate-800/50 rounded px-1.5 py-0.5 mb-1 font-mono">{c}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Table 2 */}
          <div className="border border-violet-500/30 rounded-xl overflow-hidden">
            <div className="bg-violet-500/10 px-4 py-2 border-b border-violet-500/20">
              <p className="text-xs font-bold text-violet-300">Table: social_stats</p>
              <p className="text-[10px] text-slate-500">Row Key: {'{keyword}'}  —  VD: ChatGPT</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-800">
              {[
                { cf: 'keyword_stats', ver: 'VERSIONS=5', cols: ['mention_count', 'total_retweets'], color: 'text-violet-400' },
                { cf: 'daily_stats',   ver: 'VERSIONS=1', cols: ['date', 'daily_count'],              color: 'text-rose-400' },
                { cf: 'sentiment',     ver: 'VERSIONS=1', cols: ['positive_pct', 'label'],            color: 'text-pink-400' },
              ].map(cf => (
                <div key={cf.cf} className="p-3">
                  <p className={`text-[10px] font-bold ${cf.color} mb-1`}>CF: {cf.cf}</p>
                  <p className="text-[9px] text-slate-600 mb-2">{cf.ver}</p>
                  {cf.cols.map(c => (
                    <div key={c} className="text-[10px] text-slate-400 bg-slate-800/50 rounded px-1.5 py-0.5 mb-1 font-mono">{c}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-3">
          Compression: SNAPPY | HBase Shell: create, put, get, scan, count | Truy cập: hbase shell → describe 'keywords_index'
        </p>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export function Architecture() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Map className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Kiến trúc hệ thống</h1>
            <p className="text-slate-400 text-sm">
              Sơ đồ đầy đủ pipeline Big Data — từ thu thập đến trình bày kết quả trên HDP 2.6.5
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['HDFS','HBase','Flume','Sqoop','Hive','Pig','Oozie','YARN'].map(t => (
                <span key={t} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === t.id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <DiagramOverview />}
      {tab === 'flume'    && <DiagramFlume />}
      {tab === 'oozie'    && <DiagramOozie />}
      {tab === 'storage'  && <DiagramStorage />}

      {/* Pipeline summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-500 font-semibold mb-3 uppercase">Luồng dữ liệu tổng hợp</p>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { label: 'Twitter/Reddit API', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
            { label: '→', color: 'text-slate-600' },
            { label: 'Flume SpoolDir', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
            { label: '→', color: 'text-slate-600' },
            { label: 'HDFS Raw', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
            { label: '←', color: 'text-slate-600' },
            { label: 'Sqoop (MySQL)', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
            { label: '→', color: 'text-slate-600' },
            { label: 'HBase Index', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
            { label: '→', color: 'text-slate-600' },
            { label: 'Hive (5 queries)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
            { label: '+', color: 'text-slate-600' },
            { label: 'Pig (3 scripts)', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
            { label: '→', color: 'text-slate-600' },
            { label: 'Oozie (daily 2AM)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
            { label: '→', color: 'text-slate-600' },
            { label: 'Dashboard', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
          ].map((item, i) => (
            item.label.startsWith('→') || item.label.startsWith('←') || item.label === '+'
              ? <span key={i} className={item.color + ' font-bold'}>{item.label}</span>
              : <span key={i} className={`border rounded-full px-2 py-0.5 ${item.color}`}>{item.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
