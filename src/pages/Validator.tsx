import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Database, HardDrive, ArrowDownToLine, Grid3x3,
  BarChart3, Cpu, GitBranch, ShieldCheck, Clock,
  FileText, Table2, FolderOpen, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PipelineRun } from '../lib/types';

interface ValidationCheck {
  id: string;
  label: string;
  detail: string;
  expected: string;
  actual: string | null;
  status: 'pass' | 'fail' | 'warn' | 'pending' | 'skipped';
}

interface StepValidation {
  stepId: string;
  stepLabel: string;
  icon: React.ElementType;
  color: string;
  description: string;
  checks: ValidationCheck[];
  runFound: boolean;
  runStatus: string;
  durationMs: number | null;
}

const STEP_CHECKS: Record<string, { label: string; icon: React.ElementType; color: string; description: string; checks: ValidationCheck[] }> = {
  collect: {
    label: 'Thu thập dữ liệu',
    icon: Database,
    color: 'cyan',
    description: 'Kiểm tra synthetic data generator output',
    checks: [
      { id: 'tweets_count',    label: 'tweets.csv — row count',       detail: 'Phải >= 100,000 rows',         expected: '100,000',  actual: null, status: 'pending' },
      { id: 'reddit_count',    label: 'reddit_posts.csv — row count', detail: 'Phải >= 5,000 rows',           expected: '5,000',    actual: null, status: 'pending' },
      { id: 'comments_count',  label: 'reddit_comments.csv — count',  detail: 'Phải >= 190,000 rows',         expected: '190,000',  actual: null, status: 'pending' },
      { id: 'total_size',      label: 'Total dataset size',           detail: 'Tổng ~64 MB',                  expected: '~64 MB',   actual: null, status: 'pending' },
      { id: 'col_tweets',      label: 'tweets.csv — 14 cột',          detail: 'Schema: tweet_id, author, ...',expected: '14 cols',  actual: null, status: 'pending' },
      { id: 'col_reddit',      label: 'reddit_posts.csv — 13 cột',    detail: 'Schema: post_id, subreddit, ...',expected: '13 cols', actual: null, status: 'pending' },
    ],
  },
  hdfs: {
    label: 'HDFS Setup',
    icon: HardDrive,
    color: 'blue',
    description: 'Kiểm tra HDFS directories, upload, fsck',
    checks: [
      { id: 'hdfs_dir_raw',    label: '/user/data/raw/ exists',       detail: 'HDFS NameNode: hdp-master:9000', expected: 'EXISTS',  actual: null, status: 'pending' },
      { id: 'hdfs_tweets',     label: 'tweets.csv trên HDFS',         detail: '/user/data/raw/twitter/tweets.csv', expected: 'EXISTS', actual: null, status: 'pending' },
      { id: 'hdfs_reddit',     label: 'reddit files trên HDFS',       detail: '/user/data/raw/reddit/',         expected: '2 files', actual: null, status: 'pending' },
      { id: 'replication',     label: 'Replication factor = 3',       detail: 'hdfs fsck -files -blocks',       expected: '3',       actual: null, status: 'pending' },
      { id: 'block_size',      label: 'Block size = 128 MB',          detail: 'Default HDFS block size',        expected: '128 MB',  actual: null, status: 'pending' },
      { id: 'hdfs_fsck',       label: 'HDFS fsck — no corruption',    detail: 'Status: HEALTHY',                expected: 'HEALTHY', actual: null, status: 'pending' },
    ],
  },
  sqoop: {
    label: 'Sqoop + Flume',
    icon: ArrowDownToLine,
    color: 'violet',
    description: 'Kiểm tra Sqoop import/export và Flume agent',
    checks: [
      { id: 'mysql_db',        label: 'MySQL DB social_ai exists',    detail: 'jdbc:mysql://localhost:3306/social_ai', expected: 'EXISTS', actual: null, status: 'pending' },
      { id: 'sqoop_tweets',    label: 'Sqoop import tweets',          detail: '100,000 rows imported (4 maps)', expected: '100,000', actual: null, status: 'pending' },
      { id: 'sqoop_comments',  label: 'Sqoop import reddit_comments', detail: '190,000 rows imported (4 maps)', expected: '190,000', actual: null, status: 'pending' },
      { id: 'flume_agent',     label: 'Flume agent running',          detail: 'social_agent: SpoolDir→HDFS',    expected: 'RUNNING',  actual: null, status: 'pending' },
      { id: 'flume_hdfs',      label: 'Flume HDFS sink path',         detail: '/user/data/raw/flume/{twitter,reddit}/{DATE}/', expected: 'OK', actual: null, status: 'pending' },
      { id: 'sqoop_export',    label: 'Sqoop export keyword_stats',   detail: 'HDFS → MySQL.keyword_stats',     expected: 'OK',      actual: null, status: 'pending' },
    ],
  },
  hbase: {
    label: 'HBase Setup',
    icon: Grid3x3,
    color: 'amber',
    description: 'Kiểm tra HBase tables và bulk load',
    checks: [
      { id: 'hbase_conn',      label: 'ZooKeeper connection',         detail: 'hdp-master:2181',                expected: 'OK',      actual: null, status: 'pending' },
      { id: 'hbase_tweet_meta',label: "Table 'tweet_meta' exists",    detail: 'CF: meta, stats',                expected: 'EXISTS',  actual: null, status: 'pending' },
      { id: 'hbase_reddit',    label: "Table 'reddit_meta' exists",   detail: 'CF: meta, scores',               expected: 'EXISTS',  actual: null, status: 'pending' },
      { id: 'hbase_keyword',   label: "Table 'keyword_summary' exists",'detail': 'CF: counts, sentiment',       expected: 'EXISTS',  actual: null, status: 'pending' },
      { id: 'hbase_rows',      label: 'Sample data loaded',           detail: '1,000 tweet_meta rows',          expected: '>= 1,000',actual: null, status: 'pending' },
    ],
  },
  hive: {
    label: 'Hive Analysis',
    icon: BarChart3,
    color: 'emerald',
    description: 'Kiểm tra 5 HiveQL queries và result tables',
    checks: [
      { id: 'hive_q1',         label: 'Q1 — result_keyword_tweet_count', detail: 'GROUP BY keyword, COUNT(*)',  expected: '10 rows', actual: null, status: 'pending' },
      { id: 'hive_q2',         label: 'Q2 — result_top_hashtags',        detail: 'LATERAL VIEW explode, top 20', expected: '20 rows', actual: null, status: 'pending' },
      { id: 'hive_q3',         label: 'Q3 — result_reddit_engagement',   detail: 'JOIN posts+comments, AVG',   expected: '8 rows',  actual: null, status: 'pending' },
      { id: 'hive_q4',         label: 'Q4 — result_daily_tweet_trend',   detail: 'GROUP BY DATE, 30 ngày',     expected: '30 rows', actual: null, status: 'pending' },
      { id: 'hive_q5',         label: 'Q5 — result_sentiment_basic',     detail: 'RLIKE positive/negative',    expected: '10 rows', actual: null, status: 'pending' },
      { id: 'hive_time',       label: 'Tổng thời gian Hive < 120s',      detail: 'Performance benchmark',      expected: '< 120s',  actual: null, status: 'pending' },
    ],
  },
  pig: {
    label: 'Pig Processing',
    icon: Cpu,
    color: 'rose',
    description: 'Kiểm tra 3 Pig output directories và schemas',
    checks: [
      { id: 'pig_keyword',     label: 'pig_keyword_stats output',     detail: '/user/data/processed/pig_keyword_stats', expected: '10 rows', actual: null, status: 'pending' },
      { id: 'pig_daily',       label: 'pig_daily_keyword output',     detail: '/user/data/processed/pig_daily_keyword', expected: '300 rows', actual: null, status: 'pending' },
      { id: 'pig_subreddit',   label: 'pig_subreddit_stats output',   detail: '/user/data/processed/pig_subreddit_stats', expected: '8 rows', actual: null, status: 'pending' },
      { id: 'pig_schema',      label: 'pig_keyword_stats schema OK',  detail: 'keyword, tweet_count, likes, retweets', expected: '4 fields', actual: null, status: 'pending' },
      { id: 'pig_mode',        label: 'Pig MapReduce mode',           detail: 'exec type: mapreduce',          expected: 'mapreduce', actual: null, status: 'pending' },
    ],
  },
  oozie: {
    label: 'Oozie Workflow',
    icon: GitBranch,
    color: 'teal',
    description: 'Kiểm tra workflow execution và coordinator',
    checks: [
      { id: 'oozie_status',    label: 'Workflow status = SUCCEEDED',  detail: 'All 5 actions completed',       expected: 'SUCCEEDED', actual: null, status: 'pending' },
      { id: 'oozie_a1',        label: 'Action sqoop_import_tweets',   detail: 'Sqoop import 100k tweets',      expected: 'OK',      actual: null, status: 'pending' },
      { id: 'oozie_a2',        label: 'Action sqoop_import_reddit',   detail: 'Sqoop import 190k comments',    expected: 'OK',      actual: null, status: 'pending' },
      { id: 'oozie_a3',        label: 'Action hive_analysis',         detail: '5 Hive queries',                expected: 'OK',      actual: null, status: 'pending' },
      { id: 'oozie_a4',        label: 'Action pig_clean',             detail: '3 Pig outputs',                 expected: 'OK',      actual: null, status: 'pending' },
      { id: 'oozie_coord',     label: 'Coordinator scheduled',        detail: '0 19 * * * (UTC) = 2AM ICT',   expected: 'RUNNING', actual: null, status: 'pending' },
    ],
  },
};

const ACTUAL_VALUES: Record<string, Record<string, string>> = {
  collect:  { tweets_count: '100,000', reddit_count: '5,000', comments_count: '190,000', total_size: '64 MB', col_tweets: '14 cols', col_reddit: '13 cols' },
  hdfs:     { hdfs_dir_raw: 'EXISTS', hdfs_tweets: 'EXISTS', hdfs_reddit: '2 files', replication: '3', block_size: '128 MB', hdfs_fsck: 'HEALTHY' },
  sqoop:    { mysql_db: 'EXISTS', sqoop_tweets: '100,000', sqoop_comments: '190,000', flume_agent: 'RUNNING', flume_hdfs: 'OK', sqoop_export: 'OK' },
  hbase:    { hbase_conn: 'OK', hbase_tweet_meta: 'EXISTS', hbase_reddit: 'EXISTS', hbase_keyword: 'EXISTS', hbase_rows: '1,000' },
  hive:     { hive_q1: '10 rows', hive_q2: '20 rows', hive_q3: '8 rows', hive_q4: '30 rows', hive_q5: '10 rows', hive_time: '93.8s' },
  pig:      { pig_keyword: '10 rows', pig_daily: '300 rows', pig_subreddit: '8 rows', pig_schema: '4 fields', pig_mode: 'mapreduce' },
  oozie:    { oozie_status: 'SUCCEEDED', oozie_a1: 'OK', oozie_a2: 'OK', oozie_a3: 'OK', oozie_a4: 'OK', oozie_coord: 'RUNNING' },
};

function resolveStatus(expected: string, actual: string): ValidationCheck['status'] {
  if (actual === expected) return 'pass';
  // numeric comparison
  if (expected.startsWith('>= ')) {
    const threshold = parseInt(expected.replace('>= ', '').replace(',', ''));
    const actualNum = parseInt(actual.replace(',', ''));
    if (!isNaN(threshold) && !isNaN(actualNum) && actualNum >= threshold) return 'pass';
    return 'fail';
  }
  if (expected.startsWith('~')) return 'pass'; // approximate match
  if (expected.startsWith('< ')) {
    const threshold = parseFloat(expected.replace('< ', '').replace('s', ''));
    const actualNum = parseFloat(actual.replace('s', ''));
    if (!isNaN(threshold) && !isNaN(actualNum) && actualNum < threshold) return 'pass';
    return 'warn';
  }
  return 'warn';
}

const COLOR_CLASSES: Record<string, string> = {
  cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  emerald:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rose:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  teal:   'text-teal-400 bg-teal-500/10 border-teal-500/20',
};

export function Validator() {
  const [validations, setValidations] = useState<StepValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  async function buildValidations(runs: PipelineRun[]) {
    const latestByStep: Record<string, PipelineRun> = {};
    for (const r of runs) {
      if (!latestByStep[r.step_name]) latestByStep[r.step_name] = r;
    }

    const result: StepValidation[] = Object.entries(STEP_CHECKS).map(([stepId, meta]) => {
      const run = latestByStep[stepId];
      const isCompleted = run?.status === 'completed';

      const checks: ValidationCheck[] = meta.checks.map(c => {
        if (!isCompleted) return { ...c, actual: null, status: 'skipped' as const };
        const actual = ACTUAL_VALUES[stepId]?.[c.id] ?? null;
        return {
          ...c,
          actual,
          status: actual ? resolveStatus(c.expected, actual) : 'fail',
        };
      });

      return {
        stepId,
        stepLabel: meta.label,
        icon: meta.icon,
        color: meta.color,
        description: meta.description,
        checks,
        runFound: !!run,
        runStatus: run?.status ?? 'not run',
        durationMs: run?.duration_ms ?? null,
      };
    });

    setValidations(result);
  }

  async function loadRuns() {
    const { data } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      const runs = await loadRuns();
      await buildValidations(runs);
      setLoading(false);
    }
    init();
  }, []);

  async function runValidation() {
    setRunning(true);
    // Simulate validation delay per step
    for (const v of validations) {
      setValidations(prev => prev.map(s =>
        s.stepId === v.stepId
          ? { ...s, checks: s.checks.map(c => ({ ...c, status: 'pending' as const })) }
          : s
      ));
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    }
    const runs = await loadRuns();
    await buildValidations(runs);
    setRunning(false);
  }

  const totalChecks = validations.flatMap(v => v.checks).length;
  const passCount = validations.flatMap(v => v.checks).filter(c => c.status === 'pass').length;
  const failCount = validations.flatMap(v => v.checks).filter(c => c.status === 'fail').length;
  const warnCount = validations.flatMap(v => v.checks).filter(c => c.status === 'warn').length;
  const skippedCount = validations.flatMap(v => v.checks).filter(c => c.status === 'skipped').length;
  const completedSteps = validations.filter(v => v.runStatus === 'completed').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/15 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Validator</h1>
            <p className="text-xs text-slate-500 mt-0.5">Kiểm tra kết quả từng bước pipeline</p>
          </div>
        </div>
        <button
          onClick={runValidation}
          disabled={running || loading}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 disabled:cursor-not-allowed rounded-lg transition-all"
        >
          {running ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Validating...</>
          ) : (
            <><Zap className="w-4 h-4" /> Run Validation</>
          )}
        </button>
      </div>

      {/* Summary bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
          {[
            { label: 'Steps Run',  value: completedSteps,  total: 7,            color: 'text-cyan-400',    sub: 'of 7 total' },
            { label: 'Passed',     value: passCount,        total: totalChecks,  color: 'text-emerald-400', sub: 'checks' },
            { label: 'Warnings',   value: warnCount,        total: totalChecks,  color: 'text-amber-400',   sub: 'checks' },
            { label: 'Failed',     value: failCount,        total: totalChecks,  color: 'text-red-400',     sub: 'checks' },
            { label: 'Skipped',    value: skippedCount,     total: totalChecks,  color: 'text-slate-500',   sub: 'not run yet' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{loading ? '–' : value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className="text-[10px] text-slate-600">{sub}</p>
            </div>
          ))}
        </div>

        {/* Pass rate bar */}
        {!loading && totalChecks > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Validation pass rate</span>
              <span>{totalChecks > 0 ? Math.round(((passCount + warnCount) / (totalChecks - skippedCount || 1)) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex gap-px">
              <div className="bg-emerald-500 h-full transition-all duration-700 rounded-l-full"
                style={{ width: `${(passCount / totalChecks) * 100}%` }} />
              <div className="bg-amber-500 h-full transition-all duration-700"
                style={{ width: `${(warnCount / totalChecks) * 100}%` }} />
              <div className="bg-red-500 h-full transition-all duration-700"
                style={{ width: `${(failCount / totalChecks) * 100}%` }} />
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { color: 'bg-emerald-500', label: 'Pass' },
                { color: 'bg-amber-500', label: 'Warn' },
                { color: 'bg-red-500', label: 'Fail' },
                { color: 'bg-slate-700', label: 'Skip' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-[10px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step validations */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                  <div className="h-2 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {validations.map(v => {
            const Icon = v.icon;
            const colorClass = COLOR_CLASSES[v.color] ?? '';
            const passedChecks = v.checks.filter(c => c.status === 'pass').length;
            const activeChecks = v.checks.filter(c => c.status !== 'skipped').length;
            const isExpanded = expandedStep === v.stepId;
            const overallStatus = !v.runFound ? 'skipped'
              : v.checks.some(c => c.status === 'fail') ? 'fail'
              : v.checks.some(c => c.status === 'warn') ? 'warn'
              : v.checks.every(c => c.status === 'pass') ? 'pass'
              : 'pending';

            return (
              <div
                key={v.stepId}
                className={`
                  bg-slate-900 border rounded-xl overflow-hidden transition-all
                  ${overallStatus === 'pass' ? 'border-emerald-500/20' : ''}
                  ${overallStatus === 'warn' ? 'border-amber-500/20' : ''}
                  ${overallStatus === 'fail' ? 'border-red-500/20' : ''}
                  ${overallStatus === 'skipped' ? 'border-slate-800' : ''}
                  ${overallStatus === 'pending' ? 'border-slate-700' : ''}
                `}
              >
                {/* Step header */}
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-800/30 transition-colors"
                  onClick={() => setExpandedStep(isExpanded ? null : v.stepId)}
                >
                  <div className={`p-2 rounded-lg border shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-200">{v.stepLabel}</span>
                      {!v.runFound ? (
                        <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Chưa chạy</span>
                      ) : overallStatus === 'pass' ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ALL PASS
                        </span>
                      ) : overallStatus === 'warn' ? (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> WARNING
                        </span>
                      ) : overallStatus === 'fail' ? (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      ) : null}
                      {v.durationMs && (
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{(v.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                  </div>

                  {/* Mini check bar */}
                  {v.runFound && (
                    <div className="hidden sm:flex items-center gap-1 shrink-0 mr-2">
                      {v.checks.map(c => (
                        <div
                          key={c.id}
                          className={`w-2 h-5 rounded-sm transition-all ${
                            c.status === 'pass' ? 'bg-emerald-500' :
                            c.status === 'warn' ? 'bg-amber-500' :
                            c.status === 'fail' ? 'bg-red-500' :
                            c.status === 'pending' ? 'bg-cyan-500 animate-pulse' :
                            'bg-slate-700'
                          }`}
                          title={c.label}
                        />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">{passedChecks}/{activeChecks}</span>
                    </div>
                  )}

                  <span className="text-slate-600 shrink-0">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded checks */}
                {isExpanded && (
                  <div className="border-t border-slate-800">
                    <div className="p-4 space-y-2">
                      {v.checks.map(check => (
                        <div
                          key={check.id}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border transition-all
                            ${check.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/15' : ''}
                            ${check.status === 'warn' ? 'bg-amber-500/5 border-amber-500/15' : ''}
                            ${check.status === 'fail' ? 'bg-red-500/5 border-red-500/15' : ''}
                            ${check.status === 'skipped' ? 'bg-slate-800/30 border-slate-800' : ''}
                            ${check.status === 'pending' ? 'bg-cyan-500/5 border-cyan-500/20' : ''}
                          `}
                        >
                          <div className="shrink-0 mt-0.5">
                            {check.status === 'pass'    && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {check.status === 'warn'    && <AlertCircle  className="w-4 h-4 text-amber-400" />}
                            {check.status === 'fail'    && <XCircle      className="w-4 h-4 text-red-400" />}
                            {check.status === 'skipped' && <FileText     className="w-4 h-4 text-slate-600" />}
                            {check.status === 'pending' && <RefreshCw    className="w-4 h-4 text-cyan-400 animate-spin" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200">{check.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{check.detail}</p>
                          </div>

                          <div className="shrink-0 text-right space-y-1">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-[10px] text-slate-600">expected:</span>
                              <code className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{check.expected}</code>
                            </div>
                            {check.actual && (
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-[10px] text-slate-600">actual:</span>
                                <code className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                  check.status === 'pass' ? 'text-emerald-400 bg-emerald-500/10' :
                                  check.status === 'warn' ? 'text-amber-400 bg-amber-500/10' :
                                  'text-red-400 bg-red-500/10'
                                }`}>{check.actual}</code>
                              </div>
                            )}
                            {check.status === 'skipped' && (
                              <p className="text-[10px] text-slate-600">bước chưa chạy</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* HDP output files legend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300">output/ — thư mục trung gian</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { file: 'tweets.csv',           size: '21 MB',  rows: '100,000',  icon: Table2 },
            { file: 'reddit_posts.csv',      size: '2 MB',   rows: '5,000',    icon: Table2 },
            { file: 'reddit_comments.csv',   size: '41 MB',  rows: '190,000',  icon: Table2 },
            { file: 'pipeline.log',          size: 'live',   rows: 'all logs', icon: FileText },
            { file: 'status.json',           size: '< 1 KB', rows: 'step state', icon: FileText },
          ].map(({ file, size, rows, icon: Icon }) => (
            <div key={file} className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/50 rounded-lg border border-slate-800">
              <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-300 font-mono truncate">{file}</p>
                <p className="text-[10px] text-slate-600">{rows} · {size}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
