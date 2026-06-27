import { useState } from 'react';
import { Sparkles, X, RefreshCw } from 'lucide-react';
import api from '../api';

// 재사용 AI 버튼: 클릭 시 /api/ai 호출 후 결과를 모달로 표시
// props: label, requestBody, title, className
export default function AiInsightButton({ label = 'AI 분석', requestBody, title = 'AI 인사이트', className = '' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const run = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    setText('');
    try {
      const res = await api.post('/ai', requestBody);
      if (res.data && res.data.ok === false) {
        setError(res.data.text || 'AI 응답을 가져오지 못했습니다.');
      } else {
        setText(res.data?.text || '');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'AI 호출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={run}
        className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-neon-pink to-neon-purple shadow-md hover:shadow-neon transition-all ${className}`}
      >
        <Sparkles size={16} />
        <span>{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <Sparkles size={20} className="text-neon-pink" />
                <span>{title}</span>
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 p-1"><X size={22} /></button>
            </div>

            <div className="p-5 overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  <RefreshCw size={36} className="animate-spin mx-auto mb-3" />
                  <p>AI가 분석 중입니다...</p>
                </div>
              ) : error ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">{error}</div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{text}</div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end space-x-2">
              <button onClick={run} disabled={loading} className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50">다시 생성</button>
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-xl bg-text text-white hover:bg-neon-pink">닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
