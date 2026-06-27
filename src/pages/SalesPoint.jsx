import { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle, AlertCircle, TrendingUp, Users, RefreshCw, Package } from 'lucide-react';
import api from '../api';
import AiInsightButton from '../components/AiInsightButton';

const STATUS_CONFIG = {
  overdue: {
    label: '즉시 연락 필요',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: <AlertCircle size={18} className="text-red-500" />,
    dot: 'bg-red-500',
  },
  soon: {
    label: '재구매 시점 임박',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: <Clock size={18} className="text-yellow-500" />,
    dot: 'bg-yellow-400',
  },
  good: {
    label: '양호',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    icon: <CheckCircle size={18} className="text-green-500" />,
    dot: 'bg-green-500',
  },
  no_data: {
    label: '구매 이력 없음',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    icon: <Users size={18} className="text-gray-400" />,
    dot: 'bg-gray-400',
  },
};

export default function SalesPoint() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales-point');
      setCustomers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = customers
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !searchTerm || c.name.includes(searchTerm) || c.customer_no.includes(searchTerm));

  const counts = {
    all: customers.length,
    overdue: customers.filter(c => c.status === 'overdue').length,
    soon: customers.filter(c => c.status === 'soon').length,
    good: customers.filter(c => c.status === 'good').length,
    no_data: customers.filter(c => c.status === 'no_data').length,
  };

  const generateInsight = (c) => {
    const lines = [];
    if (c.status === 'overdue') {
      lines.push(`마지막 구매 후 ${c.daysSinceLast}일이 지났습니다. 재구매를 독려할 시점입니다.`);
      if (c.topProducts.length > 0) lines.push(`주요 구매 제품: ${c.topProducts.join(', ')}`);
    } else if (c.status === 'soon') {
      const remaining = c.predictedNextDate ? Math.round((new Date(c.predictedNextDate) - new Date('2026-05-14')) / 86400000) : null;
      if (remaining !== null) lines.push(`약 ${remaining}일 후 재구매 예정입니다. 사전 연락을 준비하세요.`);
      if (c.topProducts.length > 0) lines.push(`추천 상품: ${c.topProducts.join(', ')}`);
    } else if (c.status === 'good') {
      lines.push(`정기적으로 구매하는 우수 고객입니다.`);
      if (c.avgInterval) lines.push(`평균 구매 주기: ${c.avgInterval}일`);
    } else {
      lines.push('아직 구매 이력이 없는 고객입니다. 첫 구매를 유도해보세요.');
    }
    return lines;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2 mb-1">
            <Zap size={24} className="text-neon-pink" />
            <span>Sales Point</span>
          </h1>
          <p className="text-gray-500 text-sm">AI 기반 재구매 시점 예측 및 고객별 인사이트</p>
        </div>
        <div className="flex items-center space-x-2">
          <AiInsightButton
            label="AI 액션 제안"
            title="오늘의 AI 액션 제안"
            requestBody={{ type: 'sales_point' }}
          />
          <button onClick={fetchData} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'overdue', label: '즉시 연락', emoji: '🔴' },
          { key: 'soon', label: '임박', emoji: '🟡' },
          { key: 'good', label: '양호', emoji: '🟢' },
          { key: 'no_data', label: '이력 없음', emoji: '⚪' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(filter === item.key ? 'all' : item.key)}
            className={`card-container text-center py-4 transition-all border-2 ${filter === item.key ? 'border-neon-pink shadow-neon' : 'border-transparent'}`}
          >
            <p className="text-2xl mb-1">{item.emoji}</p>
            <p className="text-2xl font-bold text-gray-800">{counts[item.key]}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="고객 이름 또는 번호 검색..."
          className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-neon-pink transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {['all', 'overdue', 'soon', 'good', 'no_data'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f ? 'bg-neon-pink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `전체 (${counts.all})` : f === 'overdue' ? `즉시 연락 (${counts.overdue})` : f === 'soon' ? `임박 (${counts.soon})` : f === 'good' ? `양호 (${counts.good})` : `이력없음 (${counts.no_data})`}
          </button>
        ))}
      </div>

      {/* Customer Cards */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw size={40} className="animate-spin mx-auto mb-4" />
          <p>분석 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-container text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">해당 조건의 고객이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.no_data;
            const insight = generateInsight(c);
            const daysUntilNext = c.predictedNextDate
              ? Math.round((new Date(c.predictedNextDate) - new Date('2026-05-14')) / 86400000)
              : null;

            return (
              <div key={c.id} className={`card-container border-l-4 ${cfg.border} ${cfg.bg} transition-all hover:shadow-md`}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-neon-pink text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <span className="text-xs text-gray-400">{c.customer_no}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`}></div>
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-neon-pink">₩{(c.totalSpent || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{c.totalVisits}회 방문</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white rounded-xl px-3 py-2 text-center border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">마지막 구매</p>
                    <p className="text-xs font-bold text-gray-700">{c.lastSaleDate || '-'}</p>
                  </div>
                  <div className="bg-white rounded-xl px-3 py-2 text-center border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">평균 주기</p>
                    <p className="text-xs font-bold text-gray-700">{c.avgInterval ? `${c.avgInterval}일` : '-'}</p>
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-center border ${c.status === 'overdue' ? 'bg-red-100 border-red-200' : c.status === 'soon' ? 'bg-yellow-100 border-yellow-200' : 'bg-white border-gray-100'}`}>
                    <p className="text-xs text-gray-400 mb-0.5">예상 다음</p>
                    <p className={`text-xs font-bold ${c.status === 'overdue' ? 'text-red-600' : c.status === 'soon' ? 'text-yellow-700' : 'text-gray-700'}`}>
                      {daysUntilNext !== null ? (daysUntilNext < 0 ? `${Math.abs(daysUntilNext)}일 초과` : `${daysUntilNext}일 후`) : '-'}
                    </p>
                  </div>
                </div>

                {/* Top Products */}
                {c.topProducts && c.topProducts.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {c.topProducts.map((p, i) => (
                      <span key={i} className="inline-flex items-center space-x-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                        <Package size={10} />
                        <span>{p}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Insight */}
                <div className={`rounded-xl px-3 py-2 border ${cfg.border} bg-white`}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">💡 AI 인사이트</p>
                  {insight.map((line, i) => (
                    <p key={i} className={`text-xs ${cfg.color}`}>{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
