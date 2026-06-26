import { useState } from 'react';
import {
  LayoutDashboard, GitBranch, BarChart3, Table2,
  ChevronLeft, ChevronRight, Activity, Cpu, HardDrive,
  ArrowDownToLine, Database, Grid3x3, Menu, X, ShieldCheck,
  Gauge, Brain, Zap, Radio
} from 'lucide-react';

type Page = 'overview' | 'pipeline' | 'validator' | 'dashboard' | 'explorer' | 'benchmark' | 'ai_theory' | 'spark' | 'streaming';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const navItems: { id: Page; label: string; sublabel: string; icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Tổng quan',    sublabel: 'System Status',       icon: LayoutDashboard },
  { id: 'pipeline',   label: 'Pipeline',     sublabel: 'Step Control',        icon: GitBranch },
  { id: 'validator',  label: 'Validator',    sublabel: 'Kiểm tra bước',       icon: ShieldCheck },
  { id: 'dashboard',  label: 'Dashboard',    sublabel: 'Analytics',           icon: BarChart3 },
  { id: 'explorer',   label: 'Dữ liệu',     sublabel: 'Data Explorer',       icon: Table2 },
  { id: 'benchmark',  label: 'Benchmark',    sublabel: 'Hadoop vs Sequential', icon: Gauge },
  { id: 'spark',      label: 'Apache Spark', sublabel: 'PySpark · MapReduce', icon: Zap },
  { id: 'streaming',  label: 'Streaming',    sublabel: 'Kafka · Real-time',   icon: Radio },
  { id: 'ai_theory',  label: 'Lý thuyết AI', sublabel: 'Embedding · Vector',  icon: Brain },
];

export function Layout({ activePage, onNavigate, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-30 h-full flex flex-col
          bg-slate-900 border-r border-slate-800
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 shrink-0">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">AI Social Analytics</p>
              <p className="text-[10px] text-slate-500 truncate">HDP 2.6.5 Pipeline</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ id, label, sublabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); setMobileOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-left transition-all duration-150 group
                ${activePage === id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }
              `}
              title={collapsed ? label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${activePage === id ? 'text-cyan-400' : ''}`} />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{sublabel}</p>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Tech stack badges */}
        {!collapsed && (
          <div className="px-3 pb-4 space-y-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest px-1 mb-2">Tech Stack</p>
            {[
              { icon: HardDrive, label: 'HDFS + HBase' },
              { icon: ArrowDownToLine, label: 'Sqoop + Flume' },
              { icon: Cpu, label: 'Hive + Pig' },
              { icon: Database, label: 'MySQL / Oozie' },
              { icon: Grid3x3, label: 'HDP 2.6.5' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/50">
                <Icon className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-[10px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-4 lg:px-6 shrink-0 gap-4">
          <button
            className="lg:hidden text-slate-400 hover:text-slate-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {navItems.find(n => n.id === activePage)?.label}
            </p>
            <p className="text-xs text-slate-500">
              {navItems.find(n => n.id === activePage)?.sublabel}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HDP Simulation
            </span>
            <span className="hidden sm:block text-xs text-slate-600 bg-slate-800 rounded-full px-3 py-1">
              Hortonworks 2.6.5
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
