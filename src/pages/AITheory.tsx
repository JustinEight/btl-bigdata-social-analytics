import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Brain, Search, Layers, Zap, ArrowRight, Info } from 'lucide-react';

// Semantic 2D coordinates (simulated t-SNE projection)
const KEYWORD_VECTORS: Record<string, { x: number; y: number; group: string; color: string }> = {
  'ChatGPT':          { x: 78, y: 72, group: 'Language Model', color: '#22d3ee' },
  'GPT-4':            { x: 82, y: 65, group: 'Language Model', color: '#22d3ee' },
  'Claude AI':        { x: 65, y: 75, group: 'Language Model', color: '#22d3ee' },
  'Gemini':           { x: 70, y: 58, group: 'Language Model', color: '#22d3ee' },
  'OpenAI':           { x: 75, y: 45, group: 'Language Model', color: '#60a5fa' },
  'Llama':            { x: 55, y: 80, group: 'Language Model', color: '#22d3ee' },
  'Stable Diffusion': { x: 22, y: 72, group: 'Image Generation', color: '#f59e0b' },
  'Midjourney':       { x: 18, y: 65, group: 'Image Generation', color: '#f59e0b' },
  'machine learning': { x: 45, y: 28, group: 'Meta Concept', color: '#a78bfa' },
  'AI safety':        { x: 35, y: 20, group: 'Meta Concept', color: '#a78bfa' },
};

// Pre-computed cosine similarities (against each "query concept")
const QUERIES: Record<string, { label: string; description: string; similarities: Record<string, number> }> = {
  language_model: {
    label: 'Language Model Query',
    description: '"Mô hình ngôn ngữ lớn tạo văn bản"',
    similarities: {
      'ChatGPT': 0.96, 'GPT-4': 0.94, 'Claude AI': 0.91, 'Llama': 0.88,
      'Gemini': 0.86, 'OpenAI': 0.79, 'machine learning': 0.52, 'AI safety': 0.44,
      'Midjourney': 0.21, 'Stable Diffusion': 0.18,
    },
  },
  image_gen: {
    label: 'Image Generation Query',
    description: '"Tạo ảnh từ văn bản AI"',
    similarities: {
      'Midjourney': 0.95, 'Stable Diffusion': 0.93, 'Gemini': 0.61,
      'OpenAI': 0.55, 'ChatGPT': 0.43, 'GPT-4': 0.40, 'Claude AI': 0.38,
      'machine learning': 0.32, 'AI safety': 0.25, 'Llama': 0.22,
    },
  },
  safety: {
    label: 'AI Safety Query',
    description: '"An toàn và kiểm soát rủi ro AI"',
    similarities: {
      'AI safety': 0.97, 'OpenAI': 0.68, 'Claude AI': 0.65, 'machine learning': 0.60,
      'GPT-4': 0.52, 'ChatGPT': 0.48, 'Gemini': 0.44, 'Llama': 0.38,
      'Midjourney': 0.20, 'Stable Diffusion': 0.18,
    },
  },
};

const EMBEDDING_EXAMPLE = {
  'ChatGPT': [0.82, -0.14, 0.57, 0.31, -0.22, 0.68, 0.19, -0.45],
  'Midjourney': [-0.23, 0.76, -0.31, 0.55, 0.62, -0.18, 0.44, 0.28],
  'AI safety': [0.11, 0.24, -0.67, -0.38, 0.51, 0.33, -0.58, 0.72],
};

function EmbeddingBar({ values, color }: { values: number[]; color: string }) {
  return (
    <div className="flex gap-1 items-end h-14">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-sm transition-all"
            style={{
              height: `${Math.abs(v) * 48}px`,
              background: v >= 0 ? color : '#f87171',
              opacity: 0.85,
              marginTop: v >= 0 ? 'auto' : 0,
              marginBottom: v < 0 ? 'auto' : 0,
            }}
          />
          <span className="text-[8px] text-slate-600 font-mono">{v.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function AITheory() {
  const [selectedQuery, setSelectedQuery] = useState<keyof typeof QUERIES>('language_model');
  const [selectedKw, setSelectedKw] = useState<keyof typeof EMBEDDING_EXAMPLE>('ChatGPT');

  const query = QUERIES[selectedQuery];
  const sortedSims = Object.entries(query.similarities).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-bold text-white">Lý thuyết AI — Embedding & Vector Store</h1>
        </div>
        <p className="text-xs text-slate-500">
          Chương 2 báo cáo · Cơ sở lý thuyết trí tuệ nhân tạo ứng dụng trong hệ thống
        </p>
      </div>

      {/* Concept cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Layers,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/20',
            title: 'Embedding',
            desc: 'Ánh xạ văn bản thành vector số thực trong không gian n chiều. Từ/câu có nghĩa tương đồng sẽ có vector gần nhau.',
          },
          {
            icon: Zap,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
            title: 'Cosine Similarity',
            desc: 'Đo độ tương đồng giữa hai vector. Giá trị 1.0 = hoàn toàn giống, 0.0 = không liên quan, -1 = đối lập.',
          },
          {
            icon: Search,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            title: 'Vector Store',
            desc: 'Cơ sở dữ liệu lưu trữ embedding. Cho phép tìm kiếm ngữ nghĩa (semantic search) thay vì tìm kiếm từ khóa đơn thuần.',
          },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className={`border rounded-xl p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-sm font-semibold text-slate-200">{title}</span>
            </div>
            <p className="text-xs text-slate-400 leading-5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Section 1: Embedding visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">1. Biểu diễn Embedding</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Mỗi từ khóa được mã hóa thành vector 8 chiều (thực tế thường 768–1536 chiều với các mô hình như BERT, ada-002)
        </p>

        {/* Keyword selector */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.keys(EMBEDDING_EXAMPLE) as Array<keyof typeof EMBEDDING_EXAMPLE>).map(kw => (
            <button
              key={kw}
              onClick={() => setSelectedKw(kw)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedKw === kw
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {kw}
            </button>
          ))}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 font-mono mb-3">
            embedding("{selectedKw}") → float32[8]
          </p>
          <EmbeddingBar
            values={EMBEDDING_EXAMPLE[selectedKw]}
            color="#22d3ee"
          />
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-cyan-500" />
              <span className="text-[10px] text-slate-500">Dương (+)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-[10px] text-slate-500">Âm (−)</span>
            </div>
            <code className="text-[10px] text-slate-600 ml-auto">
              [{EMBEDDING_EXAMPLE[selectedKw].join(', ')}]
            </code>
          </div>
        </div>

        {/* Formula */}
        <div className="mt-4 bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Cosine Similarity
          </p>
          <div className="font-mono text-sm text-center py-2">
            <span className="text-violet-300">cos(θ)</span>
            <span className="text-slate-400"> = </span>
            <span className="text-cyan-300">A · B</span>
            <span className="text-slate-500"> / </span>
            <span className="text-emerald-300">‖A‖ · ‖B‖</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Tích vô hướng chia cho tích độ dài hai vector
          </p>
        </div>
      </div>

      {/* Section 2: Semantic Search Demo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200">2. Tìm kiếm ngữ nghĩa (Semantic Search)</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Nhập câu truy vấn → Vector Store tính cosine similarity → trả về kết quả gần nhất về ngữ nghĩa
        </p>

        {/* Query selector */}
        <div className="flex flex-col gap-2 mb-6">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Chọn câu truy vấn</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {(Object.entries(QUERIES) as Array<[keyof typeof QUERIES, typeof QUERIES[keyof typeof QUERIES]]>).map(([key, q]) => (
              <button
                key={key}
                onClick={() => setSelectedQuery(key)}
                className={`flex-1 text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedQuery === key
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <p className="text-xs font-semibold">{q.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{q.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Kết quả ranked by cosine similarity</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={sortedSims.map(([kw, sim]) => ({ kw, sim: Math.round(sim * 100) / 100 }))}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis dataKey="kw" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={110} />
              <Tooltip
                formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(2) : String(v), 'Similarity']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="sim" radius={[0, 4, 4, 0]}>
                {sortedSims.map(([, sim], i) => (
                  <Cell
                    key={i}
                    fill={sim >= 0.85 ? '#34d399' : sim >= 0.6 ? '#22d3ee' : sim >= 0.35 ? '#60a5fa' : '#475569'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-2 text-slate-500">#</th>
                  <th className="text-left py-2 px-2 text-slate-500">Keyword</th>
                  <th className="text-right py-2 px-2 text-slate-500">Similarity</th>
                  <th className="text-left py-2 px-2 text-slate-500">Mức độ</th>
                </tr>
              </thead>
              <tbody>
                {sortedSims.map(([kw, sim], i) => (
                  <tr key={kw} className="border-b border-slate-800/50">
                    <td className="py-2 px-2 text-slate-600">{i + 1}</td>
                    <td className="py-2 px-2 text-slate-300 font-medium">{kw}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold"
                      style={{ color: sim >= 0.85 ? '#34d399' : sim >= 0.6 ? '#22d3ee' : sim >= 0.35 ? '#60a5fa' : '#64748b' }}>
                      {sim.toFixed(2)}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        sim >= 0.85 ? 'bg-emerald-500/15 text-emerald-400' :
                        sim >= 0.6  ? 'bg-cyan-500/15 text-cyan-400' :
                        sim >= 0.35 ? 'bg-blue-500/15 text-blue-400' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {sim >= 0.85 ? 'Rất gần' : sim >= 0.6 ? 'Gần' : sim >= 0.35 ? 'Có liên quan' : 'Xa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: 2D Embedding Space */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-200">3. Không gian Embedding 2D (t-SNE projection)</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Chiếu từ không gian cao chiều xuống 2D để trực quan hóa. Điểm gần nhau = nghĩa tương đồng. Màu sắc phản ánh mức độ khớp với truy vấn hiện tại.
        </p>

        {/* SVG scatter plot */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden" style={{ height: 320 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Grid */}
            {[20, 40, 60, 80].map(v => (
              <g key={v}>
                <line x1={v} y1={0} x2={v} y2={100} stroke="#1e293b" strokeWidth={0.3} />
                <line x1={0} y1={v} x2={100} y2={v} stroke="#1e293b" strokeWidth={0.3} />
              </g>
            ))}

            {/* Group labels */}
            <text x="68" y="92" fill="#22d3ee" fontSize="3.5" opacity={0.4} textAnchor="middle">Language Models</text>
            <text x="20" y="92" fill="#f59e0b" fontSize="3.5" opacity={0.4} textAnchor="middle">Image Gen</text>
            <text x="40" y="10" fill="#a78bfa" fontSize="3.5" opacity={0.4} textAnchor="middle">Meta Concepts</text>

            {/* Points */}
            {Object.entries(KEYWORD_VECTORS).map(([kw, pos]) => {
              const sim = query.similarities[kw] ?? 0;
              const r = 3 + sim * 3;
              return (
                <g key={kw}>
                  <circle
                    cx={pos.x}
                    cy={100 - pos.y}
                    r={r}
                    fill={pos.color}
                    opacity={0.3 + sim * 0.6}
                  />
                  <circle
                    cx={pos.x}
                    cy={100 - pos.y}
                    r={1.5}
                    fill={pos.color}
                    opacity={0.9}
                  />
                  <text
                    x={pos.x}
                    y={100 - pos.y - r - 1}
                    fill="#94a3b8"
                    fontSize="2.8"
                    textAnchor="middle"
                  >
                    {kw}
                  </text>
                  {sim >= 0.85 && (
                    <circle
                      cx={pos.x}
                      cy={100 - pos.y}
                      r={r + 2}
                      fill="none"
                      stroke={pos.color}
                      strokeWidth={0.5}
                      opacity={0.5}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 space-y-1">
            {[
              { color: '#22d3ee', label: 'Language Model' },
              { color: '#f59e0b', label: 'Image Generation' },
              { color: '#a78bfa', label: 'Meta Concept' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[9px] text-slate-500">{label}</span>
              </div>
            ))}
            <div className="text-[9px] text-slate-600 mt-1">Kích thước ∝ similarity</div>
          </div>
        </div>
      </div>

      {/* Section 4: Vector Store Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200">4. Kiến trúc Vector Store trong hệ thống</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              step: '01',
              title: 'Ingest',
              color: 'border-cyan-500/30 bg-cyan-500/5',
              badge: 'text-cyan-400',
              items: ['Thu thập text từ Twitter/Reddit', 'Tiền xử lý: lowercase, loại bỏ noise', 'Batch hoặc streaming (Flume/Kafka)'],
            },
            {
              step: '02',
              title: 'Encode',
              color: 'border-violet-500/30 bg-violet-500/5',
              badge: 'text-violet-400',
              items: ['Model: BERT / text-embedding-ada-002', 'Output: float32[768] per document', 'Lưu vào Vector Store (FAISS/Chroma)'],
            },
            {
              step: '03',
              title: 'Retrieve',
              color: 'border-emerald-500/30 bg-emerald-500/5',
              badge: 'text-emerald-400',
              items: ['Query → encode → query vector', 'ANN search: top-K nearest neighbors', 'Trả về kết quả ranked by cosine sim'],
            },
          ].map(({ step, title, color, badge, items }) => (
            <div key={step} className={`border rounded-xl p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold ${badge}`}>{step}</span>
                <span className="text-sm font-semibold text-slate-200">{title}</span>
              </div>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${badge.replace('text-', 'bg-')}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
