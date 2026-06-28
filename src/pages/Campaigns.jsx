import { useState, useEffect } from 'react';
import { Megaphone, Plus, X, Trash2, Package, Users, ChevronRight, Check } from 'lucide-react';
import api from '../api';

const SEGMENTS = [
  { value: 'overdue', label: '즉시 연락 필요', desc: '재구매 주기를 넘긴 고객' },
  { value: 'soon', label: '재구매 임박', desc: '곧 재구매 시점이 오는 고객' },
  { value: 'overdue_soon', label: '연락필요 + 임박', desc: '두 그룹 모두' },
  { value: 'birthday', label: '이번 달 생일', desc: '이번 달 생일인 고객' },
];
const segLabel = (v) => SEGMENTS.find((s) => s.value === v)?.label || v;

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', segment: 'overdue', message: '{name}님, 안녕하세요! 추천 상품과 함께 다시 찾아주세요 😊' });
  const [creating, setCreating] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const createCampaign = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/campaigns', form);
      setShowCreate(false);
      setForm({ name: '', segment: 'overdue', message: '{name}님, 안녕하세요! 추천 상품과 함께 다시 찾아주세요 😊' });
      await fetchCampaigns();
      openDetail(res.data.id);
    } catch (e) {
      alert('캠페인 생성 중 오류가 발생했습니다.');
    } finally { setCreating(false); }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetail({ campaign: null, targets: [] });
    try {
      const res = await api.get(`/campaigns/${id}`);
      setDetail(res.data);
    } catch (e) { alert('상세 조회 실패'); setDetail(null); } finally { setDetailLoading(false); }
  };

  const updateTarget = async (targetId, patch) => {
    setDetail((d) => ({ ...d, targets: d.targets.map((t) => (t.id === targetId ? { ...t, ...patch } : t)) }));
    const t = detail.targets.find((x) => x.id === targetId);
    try {
      await api.put(`/campaigns/${detail.campaign.id}/targets/${targetId}`, {
        contacted: patch.contacted ?? t.contacted,
        result: patch.result ?? t.result,
      });
      fetchCampaigns(); // 진행률 갱신
    } catch (e) { /* ignore */ }
  };

  const deleteCampaign = async (id) => {
    if (!confirm('이 캠페인을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setDetail(null);
      fetchCampaigns();
    } catch (e) { alert('삭제 실패'); }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2 mb-1">
            <Megaphone size={24} className="text-neon-pink" />
            <span>재구매 캠페인</span>
          </h1>
          <p className="text-gray-500 text-sm">타깃 고객을 자동 추출하고 연락 진행을 관리하세요.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary w-auto px-5 text-sm flex items-center space-x-2">
          <Plus size={16} /><span>새 캠페인</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      ) : campaigns.length === 0 ? (
        <div className="card-container text-center py-16 text-gray-400">
          <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">아직 캠페인이 없습니다.</p>
          <p className="text-sm">"새 캠페인"으로 재구매 독려 대상을 자동으로 모아보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const pct = c.target_count ? Math.round((c.contacted_count / c.target_count) * 100) : 0;
            return (
              <button key={c.id} onClick={() => openDetail(c.id)} className="card-container text-left hover:border-neon-pink border-2 border-transparent transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900 mb-1">{c.name}</p>
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">{segLabel(c.segment)}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 mt-1" />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span className="flex items-center space-x-1"><Users size={14} /><span>대상 {c.target_count}명</span></span>
                  <span className="font-semibold text-gray-700">{c.contacted_count}/{c.target_count} 연락완료</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neon-pink transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">{c.created_at}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* 생성 모달 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">새 캠페인</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400"><X size={22} /></button>
            </div>
            <form onSubmit={createCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">캠페인 이름</label>
                <input required type="text" className="input-field" placeholder="예: 5월 재구매 독려" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">대상 그룹 (자동 추출)</label>
                <div className="space-y-2">
                  {SEGMENTS.map((s) => (
                    <label key={s.value} className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.segment === s.value ? 'border-neon-pink bg-pink-50' : 'border-gray-200 hover:border-neon-pink'}`}>
                      <input type="radio" name="segment" checked={form.segment === s.value} onChange={() => setForm({ ...form, segment: s.value })} className="text-neon-pink" />
                      <div>
                        <p className="font-medium text-sm text-gray-800">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">메시지 템플릿</label>
                <textarea className="input-field min-h-[80px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1"><code>{'{name}'}</code> 은 고객 이름으로 자동 치환됩니다.</p>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary w-full py-3">취소</button>
                <button type="submit" disabled={creating} className="btn-primary py-3 disabled:opacity-60">{creating ? '생성 중...' : '캠페인 생성'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-end md:items-center justify-center z-50 md:p-4" onClick={() => setDetail(null)}>
          <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold">{detail.campaign?.name || '...'}</h2>
                {detail.campaign && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">{segLabel(detail.campaign.segment)}</span>
                    <span className="text-xs text-gray-400">대상 {detail.targets.length}명</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {detail.campaign && (
                  <button onClick={() => deleteCampaign(detail.campaign.id)} className="p-2 text-gray-400 hover:text-red-500" title="캠페인 삭제"><Trash2 size={18} /></button>
                )}
                <button onClick={() => setDetail(null)} className="p-2 text-gray-400"><X size={22} /></button>
              </div>
            </div>

            {detail.campaign?.message && (
              <div className="px-5 pt-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-600">
                  <span className="text-xs font-semibold text-gray-400">메시지 템플릿</span>
                  <p className="mt-1 whitespace-pre-wrap">{detail.campaign.message}</p>
                </div>
              </div>
            )}

            <div className="p-5 overflow-y-auto space-y-2">
              {detailLoading ? (
                <p className="text-center text-gray-400 py-10">불러오는 중...</p>
              ) : detail.targets.length === 0 ? (
                <p className="text-center text-gray-400 py-10">대상 고객이 없습니다.</p>
              ) : detail.targets.map((t) => (
                <div key={t.id} className={`rounded-xl border p-3 ${t.contacted ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-neon-pink text-white flex items-center justify-center font-bold text-sm">{t.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{t.name} <span className="text-xs text-gray-400 font-normal">{t.customer_no}</span></p>
                        {t.rec_product && (
                          <p className="text-xs text-gray-500 flex items-center space-x-1"><Package size={11} /><span>추천: {t.rec_product}</span></p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => updateTarget(t.id, { contacted: !t.contacted })}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${t.contacted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      <Check size={14} /><span>{t.contacted ? '연락완료' : '연락하기'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    defaultValue={t.result || ''}
                    onBlur={(e) => { if ((e.target.value || '') !== (t.result || '')) updateTarget(t.id, { result: e.target.value }); }}
                    placeholder="결과 메모 (예: 통화완료, 방문예약, 부재중...)"
                    className="w-full mt-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-pink"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
