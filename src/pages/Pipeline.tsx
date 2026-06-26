import { useEffect, useRef, useState } from 'react';
import {
  Play, RotateCcw, CheckCircle2, AlertCircle, Clock,
  Database, HardDrive, ArrowDownToLine, Grid3x3,
  BarChart3, Cpu, GitBranch, ChevronDown, ChevronUp,
  Terminal, Layers, RefreshCw, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  PIPELINE_STEPS,
  generateKeywordStats, generateHashtagStats,
  generateRedditEngagement, generateDailyTrend, generateSentimentResults,
} from '../lib/dataGenerator';
import type { PipelineLog } from '../lib/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Database, HardDrive, ArrowDownToLine, Grid3x3,
  BarChart3, Cpu, GitBranch,
};

type StepStatus = 'idle' | 'running' | 'completed' | 'error';

interface StepState {
  status: StepStatus;
  runId: string | null;
  durationMs: number | null;
  logs: PipelineLog[];
  expanded: boolean;
}

function useStepStates() {
  const [states, setStates] = useState<Record<string, StepState>>(() =>
    Object.fromEntries(
      PIPELINE_STEPS.map(s => [s.id, { status: 'idle', runId: null, durationMs: null, logs: [], expanded: false }])
    )
  );

  function update(id: string, patch: Partial<StepState>) {
    setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  return { states, update };
}

// Called when "hive" step completes — regenerates all analytics with fresh Math.random() values
async function recomputeAnalytics() {
  const now = new Date().toISOString();
  const payload = [
    { analysis_type: 'keyword_stats',     data: generateKeywordStats(),     record_count: 10,  source_rows: 100000  },
    { analysis_type: 'top_hashtags',      data: generateHashtagStats(),     record_count: 15,  source_rows: 100000  },
    { analysis_type: 'reddit_engagement', data: generateRedditEngagement(), record_count: 8,   source_rows: 195000  },
    { analysis_type: 'daily_trend',       data: generateDailyTrend(),       record_count: 30,  source_rows: 100000  },
    { analysis_type: 'sentiment',         data: generateSentimentResults(), record_count: 10,  source_rows: 100000  },
  ];
  for (const item of payload) {
    await supabase
      .from('analytics_results')
      .upsert({ ...item, computed_at: now }, { onConflict: 'analysis_type' });
  }
}

export function Pipeline({ onAnalyticsUpdated }: { onAnalyticsUpdated?: () => void }) {
  const { states, update } = useStepStates();
  const [analyticsMsg, setAnalyticsMsg] = useState<string | null>(null);
  const logRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function loadExisting() {
      const { data } = await supabase
        .from('pipeline_runs')
        .select('id, step_name, status, duration_ms, created_at')
        .order('created_at', { ascending: false });

      if (!data) return;

      const latestByStep: Record<string, typeof data[0]> = {};
      for (const run of data) {
        if (!latestByStep[run.step_name]) latestByStep[run.step_name] = run;
      }

      for (const [stepId, run] of Object.entries(latestByStep)) {
        const { data: logs } = await supabase
          .from('pipeline_logs')
          .select('*')
          .eq('run_id', run.id)
          .order('created_at', { ascending: true });

        update(stepId, {
          status: run.status as StepStatus,
          runId: run.id,
          durationMs: run.duration_ms,
          logs: logs ?? [],
          expanded: run.status === 'error',
        });
      }
    }
    loadExisting();
  }, []);

  async function runStep(stepId: string) {
    const step = PIPELINE_STEPS.find(s => s.id === stepId);
    if (!step || states[stepId].status === 'running') return;

    update(stepId, { status: 'running', logs: [], expanded: true, durationMs: null });
    setAnalyticsMsg(null);

    const startedAt = new Date().toISOString();

    const { data: runData, error: runErr } = await supabase
      .from('pipeline_runs')
      .insert({ step_name: stepId, status: 'running', started_at: startedAt })
      .select()
      .single();

    if (runErr || !runData) {
      update(stepId, { status: 'error' });
      return;
    }

    const runId = runData.id;
    update(stepId, { runId });

    const logMessages = step.logs;
    const delayPerLog = step.estimatedMs / logMessages.length;
    const newLogs: PipelineLog[] = [];

    for (let i = 0; i < logMessages.length; i++) {
      await new Promise(r => setTimeout(r, delayPerLog * (0.5 + Math.random() * 0.9)));

      const msg = logMessages[i];
      const level = msg.startsWith('[ERROR]') ? 'error'
        : msg.startsWith('[SUCCESS]') ? 'success'
        : msg.startsWith('[WARN]') ? 'warn'
        : 'info';

      const { data: logData } = await supabase
        .from('pipeline_logs')
        .insert({ run_id: runId, level, message: msg })
        .select()
        .single();

      if (logData) {
        newLogs.push(logData);
        update(stepId, { logs: [...newLogs] });
        setTimeout(() => {
          const el = logRefs.current[stepId];
          if (el) el.scrollTop = el.scrollHeight;
        }, 50);
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    await supabase
      .from('pipeline_runs')
      .update({ status: 'completed', completed_at: completedAt, duration_ms: durationMs })
      .eq('id', runId);

    update(stepId, { status: 'completed', durationMs });

    // Hive step triggers analytics recompute with fresh random data
    if (step.triggersAnalytics) {
      setAnalyticsMsg('Recomputing analytics...');
      await recomputeAnalytics();
      setAnalyticsMsg('Analytics updated! Dashboard shows new data.');
      onAnalyticsUpdated?.();
      setTimeout(() => setAnalyticsMsg(null), 4000);
    }

  }

  async function resetStep(stepId: string) {
    const runId = states[stepId].runId;
    if (runId) {
      await supabase.from('pipeline_runs').delete().eq('id', runId);
    }
    update(stepId, { status: 'idle', runId: null, durationMs: null, logs: [] });
  }

  async function runAll() {
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      const step = PIPELINE_STEPS[i];
      if (states[step.id].status !== 'completed') {
        await runStep(step.id);
      }
    }
  }

  async function resetAll() {
    for (const step of PIPELINE_STEPS) {
      await resetStep(step.id);
    }
    setAnalyticsMsg(null);
  }

  const completedCount = PIPELINE_STEPS.filter(s => states[s.id].status === 'completed').length;
  const anyRunning = PIPELINE_STEPS.some(s => states[s.id].status === 'running');
  const currentRunning = PIPELINE_STEPS.find(s => states[s.id].status === 'running');

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Pipeline Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {completedCount}/{PIPELINE_STEPS.length} bước hoàn thành
            {currentRunning && ` · Running: ${currentRunning.label}...`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            disabled={anyRunning}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200 rounded-lg transition-all disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" /> Reset All
          </button>
          <button
            onClick={runAll}
            disabled={anyRunning || completedCount === PIPELINE_STEPS.length}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            {anyRunning
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running...</>
              : <><Layers className="w-4 h-4" /> Run All Steps</>
            }
          </button>
        </div>
      </div>

      {/* Analytics notification */}
      {analyticsMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {analyticsMsg}
        </div>
      )}

      {/* Hive note */}
      <div className="flex items-start gap-3 px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          Bước <strong className="text-cyan-300">Hive Analysis</strong> sẽ tính toán lại toàn bộ analytics với dữ liệu mới — Dashboard sẽ hiển thị số liệu cập nhật sau khi bước này hoàn thành.
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Pipeline Progress</span>
          <span className="text-xs font-bold text-cyan-400">
            {Math.round((completedCount / PIPELINE_STEPS.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / PIPELINE_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="flex mt-3 gap-px">
          {PIPELINE_STEPS.map(step => (
            <div
              key={step.id}
              title={step.label}
              className={`
                flex-1 h-1.5 first:rounded-l-full last:rounded-r-full transition-all duration-300
                ${states[step.id].status === 'completed' ? 'bg-emerald-500' : ''}
                ${states[step.id].status === 'running' ? 'bg-cyan-400 animate-pulse' : ''}
                ${states[step.id].status === 'error' ? 'bg-red-500' : ''}
                ${states[step.id].status === 'idle' ? 'bg-slate-700' : ''}
              `}
            />
          ))}
        </div>
        <div className="flex mt-1">
          {PIPELINE_STEPS.map(step => (
            <div key={step.id} className="flex-1 text-center text-[9px] text-slate-700 truncate px-0.5">
              {step.id}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {PIPELINE_STEPS.map((step, idx) => {
          const state = states[step.id];
          const Icon = ICON_MAP[step.icon] ?? Database;
          const isRunning = state.status === 'running';
          const isDone = state.status === 'completed';
          const isError = state.status === 'error';

          return (
            <div
              key={step.id}
              className={`
                bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200
                ${isDone ? 'border-emerald-500/20' : ''}
                ${isRunning ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/5' : ''}
                ${isError ? 'border-red-500/20' : ''}
                ${state.status === 'idle' ? 'border-slate-800' : ''}
              `}
            >
              <div className="flex items-center gap-4 p-4">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg shrink-0
                  ${isDone ? 'bg-emerald-500/15' : ''}
                  ${isRunning ? 'bg-cyan-500/15' : ''}
                  ${isError ? 'bg-red-500/15' : ''}
                  ${state.status === 'idle' ? 'bg-slate-800' : ''}
                `}>
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-600 font-mono">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">{step.label}</span>
                    {step.triggersAnalytics && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Updates Analytics
                      </span>
                    )}
                    {isDone && state.durationMs && (
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{(state.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{step.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDone && (
                    <button
                      onClick={() => resetStep(step.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all"
                      title="Reset step"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isRunning && (
                    <button
                      onClick={() => runStep(step.id)}
                      disabled={anyRunning}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                        ${isDone
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed'
                        }
                      `}
                    >
                      <Play className="w-3 h-3" />
                      {isDone ? 'Re-run' : 'Run'}
                    </button>
                  )}
                  <button
                    onClick={() => update(step.id, { expanded: !state.expanded })}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all"
                  >
                    {state.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Log pane */}
              {state.expanded && (
                <div className="border-t border-slate-800">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60">
                    <Terminal className="w-3 h-3 text-slate-600" />
                    <span className="text-[10px] text-slate-600 font-mono">
                      pipeline.log — {step.id}
                    </span>
                    <span className="text-[10px] text-slate-700 ml-auto">
                      {state.logs.length} lines
                    </span>
                  </div>
                  <div
                    ref={el => { logRefs.current[step.id] = el; }}
                    className="font-mono text-[11px] px-4 py-3 bg-slate-950 h-52 overflow-y-auto space-y-0.5"
                  >
                    {state.logs.length === 0 && state.status === 'idle' ? (
                      <p className="text-slate-700">No logs yet. Press Run to start.</p>
                    ) : state.logs.length === 0 && isRunning ? (
                      <p className="text-cyan-600 animate-pulse">Initializing...</p>
                    ) : (
                      state.logs.map(log => (
                        <div key={log.id} className="leading-5">
                          <span className="text-slate-700 select-none mr-2">
                            {new Date(log.created_at).toLocaleTimeString('en-US', {
                              hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })}
                          </span>
                          <span className={
                            log.level === 'success' ? 'text-emerald-400' :
                            log.level === 'error' ? 'text-red-400' :
                            log.level === 'warn' ? 'text-amber-400' :
                            'text-slate-400'
                          }>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                    {isRunning && (
                      <span className="text-cyan-500 animate-pulse">▋</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
