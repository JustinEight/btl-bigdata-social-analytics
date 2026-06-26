import { useEffect, useState } from 'react';
import {
  X, ExternalLink, Twitter, MessageSquare, Code2,
  BookOpen, Database, Hash, ArrowUpRight
} from 'lucide-react';
import {
  generateSamplePostsForKeyword, HIVE_QUERY_DETAILS,
  twitterSearchUrl, redditSearchUrl,
  KEYWORDS,
} from '../lib/dataGenerator';
import type { SamplePost } from '../lib/dataGenerator';

interface Props {
  analysisType: string;
  onClose: () => void;
}

type Tab = 'query' | 'posts';

export function DetailModal({ analysisType, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('query');
  const [selectedKeyword, setSelectedKeyword] = useState(KEYWORDS[0]);
  const [posts, setPosts] = useState<SamplePost[]>([]);

  const meta = HIVE_QUERY_DETAILS[analysisType];

  useEffect(() => {
    setPosts(generateSamplePostsForKeyword(selectedKeyword, 10));
  }, [selectedKeyword]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!meta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-slate-800 shrink-0">
          <div className="p-2 bg-cyan-500/15 rounded-lg shrink-0">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white">{meta.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{meta.explanation}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 px-5 pt-4 shrink-0">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
            <Hash className="w-3 h-3 text-cyan-400" /> Input: {meta.inputTable}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3" /> Output: {meta.outputTable}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Kết quả: {meta.rowCount}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-5 mt-4 bg-slate-800/50 rounded-lg p-1 shrink-0">
          <button
            onClick={() => setActiveTab('query')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'query' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Code2 className="w-3.5 h-3.5" /> HiveQL Query
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'posts' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Sample Posts
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">

          {activeTab === 'query' && (
            <div className="space-y-4">
              {/* SQL */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">HiveQL</p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-auto">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/60" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono ml-2">{meta.outputTable}.hql</span>
                  </div>
                  <pre className="p-4 text-xs text-slate-300 font-mono leading-6 overflow-x-auto whitespace-pre">
                    {meta.query}
                  </pre>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-300 mb-2">Cách tính</p>
                <p className="text-xs text-slate-400 leading-5">{meta.explanation}</p>
              </div>

              {/* Search links */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Tìm kiếm thực tế trên mạng xã hội</p>
                <div className="grid grid-cols-2 gap-2">
                  {KEYWORDS.slice(0, 6).map(kw => (
                    <div key={kw} className="flex gap-2">
                      <a
                        href={twitterSearchUrl(kw)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-sky-500/15 border border-slate-700 hover:border-sky-500/30 rounded-lg text-xs text-slate-400 hover:text-sky-300 transition-all group"
                      >
                        <Twitter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{kw}</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 shrink-0" />
                      </a>
                      <a
                        href={redditSearchUrl(kw)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-orange-500/15 border border-slate-700 hover:border-orange-500/30 rounded-lg text-xs text-slate-400 hover:text-orange-300 transition-all group"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="truncate">{kw}</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 shrink-0" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {/* Keyword selector */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Chọn keyword</p>
                <div className="flex flex-wrap gap-2">
                  {KEYWORDS.map(kw => (
                    <button
                      key={kw}
                      onClick={() => setSelectedKeyword(kw)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedKeyword === kw
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search on real platforms */}
              <div className="flex gap-2">
                <a
                  href={twitterSearchUrl(selectedKeyword)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg text-xs text-sky-300 font-medium transition-all"
                >
                  <Twitter className="w-4 h-4" />
                  Tìm "{selectedKeyword}" trên Twitter
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={redditSearchUrl(selectedKeyword)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-xs text-orange-300 font-medium transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Tìm trên Reddit
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Sample posts */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Sample posts — dữ liệu synthetic
                  </p>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Link → Search thật, không phải post cụ thể
                  </span>
                </div>
                {posts.map(post => (
                  <a
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Tìm "${post.keyword}" trên ${post.platform === 'twitter' ? 'Twitter' : 'Reddit'}`}
                    className="block bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        post.platform === 'twitter'
                          ? 'bg-sky-500/15'
                          : 'bg-orange-500/15'
                      }`}>
                        {post.platform === 'twitter'
                          ? <Twitter className="w-3.5 h-3.5 text-sky-400" />
                          : <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold ${
                            post.platform === 'twitter' ? 'text-sky-400' : 'text-orange-400'
                          }`}>
                            {post.author}
                          </span>
                          {post.subreddit && (
                            <span className="text-[10px] text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                              {post.subreddit}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-600 ml-auto">{post.date}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-5">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-500">
                            {post.platform === 'twitter' ? '❤' : '▲'} {post.score.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                            {post.keyword}
                          </span>
                          <span className="text-[10px] text-slate-600 ml-auto flex items-center gap-1 group-hover:text-slate-400 transition-colors">
                            Tìm kiếm <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
