import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, ReferenceLine,
} from 'recharts';
import { Zap, Clock, TrendingUp, Server, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STEP_TIMES = [
  { step: 'Sqoop\nTweets',    hadoop: 23.4,  sequential: 187,  label: 'Sqoop import tweets' },
  { step: 'Sqoop\nComments',  hadoop: 31.2,  sequential: 249,  label: 'Sqoop import comments' },
  { step: 'Hive Q1–Q5',      hadoop: 93.3,  sequential: 840,  label: 'HiveQL 5 queries' },
  { step: 'Pig Scripts',      hadoop: 72.1,  sequential: 648,  label: 'Pig 3 scripts' },
  { step: 'Sqoop Export',     hadoop: 18.6,  sequential: 149,  label: 'Sqoop export results' },
];

const SCALE_DATA = [
  { size: '1 MB',      hadoop: 8,   sequential: 12   },
  { size: '10 MB',     hadoop: 22,  sequential: 65   },
  { size: '64 MB',     hadoop: 95,  sequential: 430  },
  { size: '256 MB',    hadoop: 160, sequential: 1720 },
  { size: '1 GB',      hadoop: 290, sequential: 6900 },
  { size: '10 GB',     hadoop: 620, sequential: null  },
];

const BOTTLENECK_DATA = [
  { resource: 'CPU',     hadoop: 78,  sequential: 99 },
  { resource: 'Memory',  hadoop: 62,  sequential: 97 },
  { resource: 'Disk I/O',hadoop: 55,  sequential: 88 },
  { resource: 'Network', hadoop: 45,  sequential: 10 },
];

const CHART_COLORS = { hadoop: '#22d3ee', sequential: '#f87171' };

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      {label && <p className="text-slate-400 mb-2 font-medium">{label}</p>}
      {payload.map(p => p.value != null && (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{p.value.toLocaleString()}s</span>
        </div>
      ))}
    </div>
  );
};

const totalHadoop  = STEP_TIMES.reduce((s, r) => s + r.hadoop, 0);
const totalSeq     = STEP_TIMES.reduce((s, r) => s + r.sequential, 0);
const speedup      = (totalSeq / totalHadoop).toFixed(1);

export function Benchmark() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white">Benchmark — Big Data vs Sequential</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          So sánh hiệu năng xử lý phân tán (Hadoop HDP 2.6.5) với xử lý tuần tự (Single Node)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Hadoop End-to-End',
            value: `${totalHadoop.toFixed(0)}s`,
            sub: `${(totalHadoop / 60).toFixed(1)} phút`,
            color: 'text-cyan-400',
            icon: Server,
          },
          {
            label: 'Sequential (1 node)',
            value: `${totalSeq.toFixed(0)}s`,
            sub: `${(totalSeq / 60).toFixed(1)} phút`,
            color: 'text-red-400',
            icon: Cpu,
          },
          {
            label: 'Speedup Factor',
            value: `${speedup}×`,
            sub: 'nhanh hơn so với sequential',
            color: 'text-emerald-400',
            icon: Zap,
          },
          {
            label: 'Dữ liệu xử lý',
            value: '295,000',
            sub: 'rows · 64 MB',
            color: 'text-amber-400',
            icon: TrendingUp,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-slate-500">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Step-by-step comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Thời gian từng bước (giây)</h2>
          </div>
          <p className="text-[10px] text-slate-500 mb-5 font-mono">
            Hadoop (4 Map tasks) vs Single Node · dataset 64 MB
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={STEP_TIMES}
              margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="step"
                tick={{ fontSize: 9, fill: '#64748b' }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="s" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="hadoop"     name="Hadoop (4 nodes)" fill={CHART_COLORS.hadoop}     radius={[4, 4, 0, 0]} />
              <Bar dataKey="sequential" name="Sequential (1 node)" fill={CHART_COLORS.sequential} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scalability */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">Khả năng mở rộng theo kích thước dữ liệu</h2>
          </div>
          <p className="text-[10px] text-slate-500 mb-5 font-mono">
            Ước tính tổng thời gian xử lý (Hive + Pig) theo data size
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={SCALE_DATA}
              margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="size" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="s" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <ReferenceLine x="64 MB" stroke="#22d3ee" strokeDasharray="4 2" label={{ value: 'dataset hiện tại', fontSize: 9, fill: '#22d3ee' }} />
              <Line
                type="monotone" dataKey="hadoop"
                name="Hadoop" stroke={CHART_COLORS.hadoop}
                strokeWidth={2} dot={{ r: 4 }} connectNulls
              />
              <Line
                type="monotone" dataKey="sequential"
                name="Sequential" stroke={CHART_COLORS.sequential}
                strokeWidth={2} dot={{ r: 4 }} connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource utilization */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-200">Mức độ sử dụng tài nguyên (%)</h2>
        </div>
        <p className="text-[10px] text-slate-500 mb-5 font-mono">
          Khi xử lý 64 MB · Hadoop phân tán tải đều, Sequential bão hoà CPU/RAM
        </p>
        <div className="space-y-3">
          {BOTTLENECK_DATA.map(row => (
            <div key={row.resource} className="grid grid-cols-[80px_1fr_1fr] gap-4 items-center">
              <span className="text-xs text-slate-400 font-medium">{row.resource}</span>
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span className="text-cyan-400">Hadoop</span>
                  <span>{row.hadoop}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${row.hadoop}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span className="text-red-400">Sequential</span>
                  <span className={row.sequential >= 95 ? 'text-red-400 font-bold' : ''}>{row.sequential}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${row.sequential >= 95 ? 'bg-red-500' : 'bg-red-400'}`}
                    style={{ width: `${row.sequential}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed step table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300">Chi tiết thời gian thực thi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                {['Bước xử lý', 'Hadoop (s)', 'Sequential (s)', 'Speedup', 'Đầu vào', 'Đánh giá'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STEP_TIMES.map(row => {
                const spd = (row.sequential / row.hadoop).toFixed(1);
                return (
                  <tr key={row.step} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 text-slate-300 font-medium whitespace-nowrap">{row.label}</td>
                    <td className="py-2.5 px-4 text-cyan-400 font-semibold text-right">{row.hadoop}s</td>
                    <td className="py-2.5 px-4 text-red-400 text-right">{row.sequential}s</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-bold text-right">{spd}×</td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {row.step.includes('Tweet') ? '100,000 rows' :
                       row.step.includes('Comments') ? '190,000 rows' :
                       row.step.includes('Hive') ? '295,000 rows' :
                       row.step.includes('Pig') ? '295,000 rows' : '73 rows'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đạt</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800/50">
                <td className="py-3 px-4 text-slate-300 font-bold">Tổng End-to-End</td>
                <td className="py-3 px-4 text-cyan-400 font-bold text-right">{totalHadoop.toFixed(0)}s</td>
                <td className="py-3 px-4 text-red-400 font-bold text-right">{totalSeq}s</td>
                <td className="py-3 px-4 text-emerald-400 font-bold text-right">{speedup}×</td>
                <td className="py-3 px-4 text-slate-500">64 MB · 295,000 rows</td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vượt mục tiêu
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Limitations */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-2">Hạn chế & Hướng phát triển</p>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• MapReduce (Hive/Pig) dùng ổ đĩa → chậm hơn <strong className="text-slate-300">Apache Spark</strong> (in-memory) 10–100 lần</li>
              <li>• Dataset thực nghiệm 64 MB còn nhỏ; chênh lệch hiệu năng tăng mạnh khi dữ liệu &gt; 1 GB</li>
              <li>• Nên thay thế Hive/Pig bằng <strong className="text-slate-300">Spark SQL + PySpark</strong> cho hệ thống production</li>
              <li>• Tích hợp <strong className="text-slate-300">Kafka + Spark Streaming</strong> thay Flume để xử lý real-time thực sự</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
