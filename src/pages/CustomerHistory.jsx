import { useState } from 'react';
import { Search, User, ShoppingBag, TrendingUp, Award, ChevronDown, ChevronUp, Package } from 'lucide-react';
import api from '../api';
import AiInsightButton from '../components/AiInsightButton';

export default function CustomerHistory() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [expandedSales, setExpandedSales] = useState({});

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSelectedCustomer(null);
    setHistoryData(null);
    setCandidates([]);
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(query.trim())}`);
      if (res.data.length === 0) {
        alert('검색된 고객이 없습니다.');
      } else if (res.data.length === 1) {
        await loadHistory(res.data[0]);
      } else {
        setCandidates(res.data);
      }
    } catch (e) {
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (customer) => {
    setLoading(true);
    setSelectedCustomer(customer);
    setCandidates([]);
    try {
      const res = await api.get(`/customers/${customer.id}/history`);
      setHistoryData(res.data);
    } catch (e) {
      alert('히스토리 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSale = (saleId) => {
    setExpandedSales(prev => ({ ...prev, [saleId]: !prev[saleId] }));
  };

  const getDiscountLabel = (type, value) => {
    if (!type || type === 'none') return null;
    if (type === 'rate') return `${value}% 할인`;
    if (type === 'amount') return `₩${Number(value).toLocaleString()} 할인`;
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-2xl font-bold mb-1">고객 히스토리 조회</h1>
        <p className="text-gray-500 text-sm">이름 또는 고객번호로 전체 거래 내역을 확인하세요.</p>
      </div>

      <form onSubmit={handleSearch}>
        <label htmlFor="history-search-input" className="card-container border-b-4 border-neon-pink flex items-center space-x-3 p-4 cursor-text block">
          <User className="text-neon-pink shrink-0" size={22} />
          <input
            id="history-search-input"
            type="text"
            placeholder="고객 이름 또는 고객번호 입력 (예: 홍길동 / CUST-001)"
            className="flex-1 bg-transparent outline-none text-base placeholder-gray-400 w-full"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary w-auto px-6 flex items-center space-x-2 text-sm py-2">
            <Search size={16} />
            <span>{loading ? '검색 중...' : '검색'}</span>
          </button>
        </label>
      </form>

      {candidates.length > 1 && (
        <div className="card-container border-l-4 border-yellow-400">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-yellow-500 font-bold text-lg">⚠</span>
            <h2 className="font-bold text-gray-800">동명이인이 {candidates.length}명 검색되었습니다. 고객을 선택해주세요.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidates.map(c => (
              <button
                key={c.id}
                onClick={() => loadHistory(c)}
                className="flex items-center space-x-4 p-4 bg-gray-50 hover:bg-neon-pink hover:text-white rounded-xl border border-gray-200 hover:border-neon-pink transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-neon-pink text-white group-hover:bg-white group-hover:text-neon-pink flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-sm opacity-70">고객번호: {c.customer_no} | 가입: {c.join_date}</p>
                  {c.region && <p className="text-xs opacity-60">{c.region}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {historyData && selectedCustomer && (
        <div className="space-y-6">
          <div className="card-container bg-gradient-to-br from-white to-pink-50 border border-pink-100">
            <div className="flex items-start space-x-5">
              <div className="w-16 h-16 rounded-2xl bg-neon-pink text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <span className="px-3 py-1 bg-neon-pink text-white text-xs rounded-full font-semibold">{selectedCustomer.customer_no}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {selectedCustomer.birth_date && <span>🎂 {selectedCustomer.birth_date}</span>}
                  {selectedCustomer.region && <span>📍 {selectedCustomer.region}</span>}
                  {selectedCustomer.skin_type && <span>✨ {selectedCustomer.skin_type}</span>}
                  <span>📅 가입: {selectedCustomer.join_date}</span>
                </div>
                {selectedCustomer.memo && (
                  <p className="mt-2 text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">📝 {selectedCustomer.memo}</p>
                )}
                <div className="mt-3">
                  <AiInsightButton
                    label="AI 추천 / 응대 가이드"
                    title={`${selectedCustomer.name} 고객 AI 분석`}
                    requestBody={{ type: 'customer', customerId: selectedCustomer.id }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-pink-100">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp size={16} className="text-neon-pink" />
                  <span className="text-xs text-gray-500">총 구매금액</span>
                </div>
                <p className="text-xl font-bold text-neon-pink">₩{historyData.summary.totalSpent.toLocaleString()}</p>
              </div>
              <div className="text-center border-x border-pink-100">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <ShoppingBag size={16} className="text-neon-pink" />
                  <span className="text-xs text-gray-500">총 구매횟수</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{historyData.summary.totalVisits}회</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Award size={16} className="text-neon-pink" />
                  <span className="text-xs text-gray-500">보유 마일리지</span>
                </div>
                <p className="text-xl font-bold text-gray-800">₩{historyData.summary.currentMileage.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <ShoppingBag size={20} className="text-neon-pink" />
              <span>전체 거래 내역 ({historyData.sales.length}건)</span>
            </h3>

            {historyData.sales.length === 0 ? (
              <div className="card-container text-center py-16 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">거래 내역이 없습니다.</p>
              </div>
            ) : (
              historyData.sales.map((sale, idx) => {
                const isExpanded = expandedSales[sale.sale_id];
                const discountLabel = getDiscountLabel(sale.discount_type, sale.discount_value);
                return (
                  <div key={sale.sale_id} className="card-container p-0 overflow-hidden border border-gray-100 hover:border-neon-pink transition-colors">
                    <button
                      onClick={() => toggleSale(sale.sale_id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-neon-pink flex items-center justify-center font-bold text-sm shrink-0">
                          #{historyData.sales.length - idx}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{sale.date}</p>
                          <p className="text-sm text-gray-500">
                            {sale.items.length > 0 ? sale.items.map(i => `${i.product_name} x${i.quantity}`).join(', ') : '제품 정보 없음'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-neon-pink">₩{sale.total_amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 font-medium">결제수단: {sale.payment_method}</p>
                          {discountLabel && <p className="text-xs text-green-600 font-medium">{discountLabel}</p>}
                          {sale.used_mileage > 0 && <p className="text-xs text-blue-500">마일리지 -₩{sale.used_mileage.toLocaleString()}</p>}
                        </div>
                        {isExpanded ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-2 flex items-center space-x-1">
                              <Package size={12} /><span>구매 제품</span>
                            </p>
                            {sale.items.length > 0 ? (
                              <div className="space-y-2">
                                {sale.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center bg-white rounded-xl px-4 py-3 border border-gray-100">
                                    <div>
                                      <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                                      <p className="text-xs text-gray-400">단가: ₩{item.product_price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-gray-700">x {item.quantity}</p>
                                      <p className="text-xs text-neon-pink font-semibold">₩{(item.product_price * item.quantity).toLocaleString()}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">제품 정보 없음</p>
                            )}
                          </div>
                          <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 space-y-1 text-sm">
                            {discountLabel && (
                              <div className="flex justify-between text-green-600">
                                <span>할인</span><span>- {discountLabel}</span>
                              </div>
                            )}
                            {sale.used_mileage > 0 && (
                              <div className="flex justify-between text-blue-500">
                                <span>마일리지 사용</span><span>- ₩{sale.used_mileage.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-100">
                              <span>최종 결제금액</span>
                              <span className="text-neon-pink">₩{sale.total_amount.toLocaleString()}</span>
                            </div>
                          </div>
                          {sale.memo && (
                            <div className="bg-yellow-50 rounded-xl px-4 py-3 border border-yellow-100">
                              <p className="text-xs text-yellow-600 font-semibold mb-1">📝 메모</p>
                              <p className="text-sm text-gray-700">{sale.memo}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
