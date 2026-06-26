import { useEffect, useState } from 'react';
import {
  Activity, Database, HardDrive, Cpu, GitBranch,
  ArrowDownToLine, Grid3x3, BarChart3, RefreshCw,
  MessageSquare, Twitter, Users, Clock,
  CheckCircle2, AlertCircle, Circle, Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PipelineRun, SystemConfig } from '../lib/types';

const STEP_META: Record<string, { icon: React.ElementType; color: string }> = {
  collect:  { icon: Database,        color: 'text-cyan-400' },
  hdfs:     { icon: HardDrive,       color: 'text-blue-400' },
  sqoop:    { icon: ArrowDownToLine, color: 'text-violet-400' },
  hbase:    { icon: Grid3x3,         color: 'text-amber-400' },
  hive:     { icon: BarChart3,       color: 'text-emerald-400' },
  pig:      { icon: Cpu,             color: 'text-rose-400' },
  oozie:    { icon: GitBranch,       color: 'text-teal-400' },
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> DONE
    </span>
  );
  if (status === 'running') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
      <RefreshCw className="w-3 h-3 animate-spin" /> RUNNING
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> ERROR
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
      <Circle className="w-3 h-3" /> PENDING
    </span>
  );
}

export function Overview({ onNavigate }: { onNavigate: (p: 'pipeline' | 'validator' | 'dashboard') => void }) {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [runsRes, cfgRes] = await Promise.all([
        supabase
          .from('pipeline_runs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('system_config').select('*'),
      ]);

      if (!runsRes.error && runsRes.data) setRuns(runsRes.data);
      if (!cfgRes.error && cfgRes.data) setConfigs(cfgRes.data);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('pipeline_overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_runs' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stepOrder = ['collect', 'hdfs', 'sqoop', 'hbase', 'hive', 'pig', 'oozie'];
  const latestByStep: Record<string, PipelineRun> = {};
  for (const run of runs) {
    if (!latestByStep[run.step_name]) latestByStep[run.step_name] = run;
  }

  const completedCount = Object.values(latestByStep).filter(r => r.status === 'completed').length;
  const totalSteps = stepOrder.length;
  const pipelineProgress = Math.round((completedCount / totalSteps) * 100);

  const cfgMap = Object.fromEntries(configs.map(c => [c.key, c.value]));

  const dataStats = [
    { label: 'Tweets', value: '100,000', icon: Twitter, color: 'text-cyan-400' },
    { label: 'Reddit Posts', value: '5,000', icon: MessageSquare, color: 'text-emerald-400' },
    { label: 'Reddit Comments', value: '190,000', icon: Users, color: 'text-blue-400' },
    { label: 'Total Size', value: '64 MB', icon: Database, color: 'text-amber-400' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold tracking-widest text-cyan-500 uppercase bg-cyan-500/10 px-2 py-0.5 rounded">
                  Big Data Project
                </span>
                <span className="text-[10px] text-slate-500">Hortonworks HDP 2.6.5</span>
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight mb-1">
                Phân tích mạng xã hội
              </h1>
              <p className="text-slate-400 text-sm">
                AI & Công nghệ — Twitter + Reddit Pipeline
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Môn: Lưu trữ và Xử lý Dữ liệu Lớn &nbsp;·&nbsp; HDFS · Sqoop · Flume · Hive · Pig · Oozie
              </p>
            </div>

            {/* Progress ring */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="8" fill="none" />
                  <circle
                    cx="40" cy="40" r="32"
                    stroke="#22d3ee" strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - pipelineProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-white">{pipelineProgress}%</span>
                  <span className="text-[9px] text-slate-500">complete</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">{completedCount}/{totalSteps} steps</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => onNavigate('pipeline')}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-semibold rounded-lg transition-colors"
            >
              <GitBranch className="w-4 h-4" /> Chạy Pipeline
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> Xem Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Dataset stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dataStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg bg-slate-800 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">synthetic dataset</p>
          </div>
        ))}
      </div>

      {/* Pipeline steps grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">Trạng thái Pipeline</h2>
          <button
            onClick={() => onNavigate('pipeline')}
            className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
          >
            Quản lý <GitBranch className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {stepOrder.map(s => (
              <div key={s} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
                <div className="w-8 h-8 bg-slate-800 rounded-lg mb-3" />
                <div className="h-3 bg-slate-800 rounded w-2/3 mb-1" />
                <div className="h-2 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {stepOrder.map(stepId => {
              const meta = STEP_META[stepId];
              const Icon = meta.icon;
              const run = latestByStep[stepId];
              const status = run?.status ?? 'pending';
              const durationSec = run?.duration_ms ? (run.duration_ms / 1000).toFixed(1) : null;

              return (
                <div
                  key={stepId}
                  className={`
                    bg-slate-900 border rounded-xl p-4 transition-all
                    ${status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' : ''}
                    ${status === 'running' ? 'border-cyan-500/30 bg-cyan-500/5' : ''}
                    ${status === 'error' ? 'border-red-500/20 bg-red-500/5' : ''}
                    ${status === 'pending' ? 'border-slate-800' : ''}
                  `}
                >
                  <div className={`p-2 rounded-lg bg-slate-800 w-fit mb-3 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200 capitalize mb-1">{stepId}</p>
                  <StatusBadge status={status} />
                  {durationSec && (
                    <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{durationSec}s
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Config + recent runs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current config */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300">Cấu hình hệ thống</h2>
          </div>
          <div className="space-y-2">
            {[
              { key: 'db_mode', label: 'DB Mode' },
              { key: 'data_source', label: 'Data Source' },
              { key: 'web_port', label: 'Web Port' },
              { key: 'hdfs_replication', label: 'HDFS Replication' },
              { key: 'hdfs_block_size_mb', label: 'Block Size' },
              { key: 'oozie_schedule', label: 'Oozie Schedule' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-500">{label}</span>
                <code className="text-xs text-cyan-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                  {cfgMap[key] ?? '—'}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Recent runs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300">Lịch sử chạy gần đây</h2>
          </div>
          {runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <Circle className="w-8 h-8 mb-2" />
              <p className="text-sm">Chưa có lần chạy nào</p>
              <p className="text-xs mt-1">Mở Pipeline để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {runs.slice(0, 12).map(run => {
                const meta = STEP_META[run.step_name];
                const Icon = meta?.icon ?? Activity;
                const color = meta?.color ?? 'text-slate-400';
                return (
                  <div key={run.id} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    <span className="text-xs text-slate-300 flex-1 capitalize">{run.step_name}</span>
                    <StatusBadge status={run.status} />
                    {run.duration_ms && (
                      <span className="text-[10px] text-slate-600 shrink-0">{(run.duration_ms / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Keywords được theo dõi</h2>
        <div className="flex flex-wrap gap-2">
          {(cfgMap.keywords ?? '').split(',').map(k => (
            <span key={k} className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              {k.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
