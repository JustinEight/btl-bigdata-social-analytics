import { useState } from 'react';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Pipeline } from './pages/Pipeline';
import { Validator } from './pages/Validator';
import { Dashboard } from './pages/Dashboard';
import { DataExplorer } from './pages/DataExplorer';
import { Benchmark } from './pages/Benchmark';
import { AITheory } from './pages/AITheory';
import { Spark } from './pages/Spark';
import { Streaming } from './pages/Streaming';

type Page = 'overview' | 'pipeline' | 'validator' | 'dashboard' | 'explorer' | 'benchmark' | 'ai_theory' | 'spark' | 'streaming';

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  // Increments each time Pipeline's Hive step completes → Dashboard reloads
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);

  function handleAnalyticsUpdated() {
    setAnalyticsRefreshKey(k => k + 1);
  }

  function renderPage() {
    switch (page) {
      case 'overview':
        return <Overview onNavigate={p => setPage(p)} />;
      case 'pipeline':
        return <Pipeline onAnalyticsUpdated={handleAnalyticsUpdated} />;
      case 'validator':
        return <Validator />;
      case 'dashboard':
        return <Dashboard refreshKey={analyticsRefreshKey} />;
      case 'explorer':
        return <DataExplorer />;
      case 'benchmark':
        return <Benchmark />;
      case 'ai_theory':
        return <AITheory />;
      case 'spark':
        return <Spark />;
      case 'streaming':
        return <Streaming />;
    }
  }

  return (
    <Layout activePage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}
