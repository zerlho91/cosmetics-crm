import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Newspaper, Sparkles, RefreshCw, Search } from 'lucide-react';
import api from '../api';

// 키워드 프리셋 (클릭 시 해당 키워드로 실제 뉴스 검색)
const PRESETS = [
  { id: 'amorepacific', label: '아모레퍼시픽', emoji: '🌸', query: '아모레퍼시픽' },
  { id: 'trend', label: '뷰티 트렌드', emoji: '💄', query: '뷰티 트렌드 스킨케어' },
  { id: 'kbeauty', label: 'K-뷰티 / 신제품', emoji: '✨', query: 'K뷰티 화장품 신제품' },
  { id: 'skincare', label: '스킨케어 / 성분', emoji: '🧴', query: '스킨케어 성분 피부' },
];

export default function NewsTab() {
  const [activeId, setActiveId] = useState('amorepacific');
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('아모레퍼시픽');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNews = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/news', { params: { q } });
      setArticles(res.data.articles || []);
      if (!res.data.articles || res.data.articles.length === 0) {
        setError('검색 결과가 없습니다. 다른 키워드를 입력해보세요.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || '뉴스를 불러오지 못했습니다.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(query); }, [query, fetchNews]);

  const selectPreset = (preset) => {
    setActiveId(preset.id);
    setKeyword('');
    setQuery(preset.query);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    setActiveId('custom');
    setQuery(q);
  };

  const openExternal = (url) => {
    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
    else window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2 mb-1">
            <Newspaper size={24} className="text-neon-pink" />
            <span>뉴스 &amp; 트렌드</span>
          </h1>
          <p className="text-gray-500 text-sm">키워드 관련 실시간 최신 뉴스를 확인하세요.</p>
        </div>
        <button
          onClick={() => fetchNews(query)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">새로고침</span>
        </button>
      </div>

      {/* 직접 검색 */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드로 뉴스 검색 (예: 설화수, 선크림, 비건 뷰티)"
          className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-11 pr-20 focus:outline-none focus:ring-2 focus:ring-neon-pink transition-all"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-neon-pink text-white rounded-xl text-sm font-semibold hover:bg-pink-600 transition-colors">
          검색
        </button>
      </form>

      {/* 키워드 프리셋 */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPreset(p)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeId === p.id ? 'bg-neon-pink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{p.emoji}</span>{p.label}
          </button>
        ))}
      </div>

      {/* 현재 검색어 */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Sparkles size={16} className="text-neon-pink" />
        <span>'<span className="font-semibold text-gray-700">{query}</span>' 관련 뉴스</span>
        {!loading && articles.length > 0 && <span className="text-gray-400">({articles.length}건)</span>}
      </div>

      {/* 결과 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw size={40} className="animate-spin mx-auto mb-4" />
          <p>최신 뉴스를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="card-container text-center py-16 text-gray-400">
          <Newspaper size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-base font-medium">{error}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, i) => (
            <button
              key={i}
              onClick={() => openExternal(article.url)}
              className="w-full card-container text-left hover:border-neon-pink border-2 border-transparent transition-all group hover:shadow-md"
            >
              <div className="flex items-start justify-between space-x-4">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Newspaper size={18} className="text-neon-pink" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-neon-pink transition-colors leading-snug mb-2">
                      {article.title}
                    </p>
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      {article.source && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">
                          {article.source}
                        </span>
                      )}
                      {article.date && <span className="text-xs text-gray-400">{article.date}</span>}
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-300 group-hover:text-neon-pink transition-colors shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        <p>실시간 Google 뉴스 검색 결과입니다. 기사 클릭 시 해당 언론사 페이지로 이동합니다.</p>
      </div>
    </div>
  );
}
