import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X, Gift } from 'lucide-react';
import api from '../api';

export default function CalendarView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('05');

  // Modals
  const [selectedDaySales, setSelectedDaySales] = useState(null);
  const [selectedDayBdays, setSelectedDayBdays] = useState(null);

  const fetchDashboardData = async () => {
    setData(null);
    setError(false);
    try {
      const res = await api.get(`/calendar?year=${year}&month=${month}`);
      setData(res.data);
    } catch (error) {
      console.error('Error fetching calendar data', error);
      setError(true);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [year, month]);

  if (!data) return (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
      {error ? (
        <>
          <p className="text-red-500 font-medium">서버에 연결할 수 없습니다.</p>
          <p className="text-gray-400 text-sm">잠시 후 다시 시도해주세요. (DB 연결 또는 네트워크 확인)</p>
          <button onClick={fetchDashboardData} className="btn-primary w-auto px-6 py-2 text-sm">다시 시도</button>
        </>
      ) : (
        <p className="text-gray-500 animate-pulse">데이터를 불러오는 중입니다...</p>
      )}
    </div>
  );

  const y = parseInt(year);
  const m = parseInt(month);
  
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay(); // 0(Sun) ~ 6(Sat)

  const emptyDays = Array.from({ length: firstDayOfWeek }, () => null);
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = String(i + 1).padStart(2, '0');
    const dateStr = `${year}-${month.padStart(2, '0')}-${dayNum}`;
    
    const dailySales = data.sales.filter(s => s.date === dateStr);
    const dayTotal = dailySales.reduce((sum, s) => sum + s.total_amount, 0);
    
    // Check birthdays (birth_date format: YYYY-MM-DD)
    const bdayMatchStr = `-${month.padStart(2, '0')}-${dayNum}`;
    const dailyBdays = data.birthdays.filter(b => b.birth_date && b.birth_date.endsWith(bdayMatchStr));

    return { day: i + 1, dateStr, sales: dailySales, dayTotal, birthdays: dailyBdays };
  });

  const allCells = [...emptyDays, ...calendarDays];
  const weeks = [];
  for (let i = 0; i < allCells.length; i += 7) {
    weeks.push(allCells.slice(i, i + 7));
  }

  return (
    <div className="space-y-6 relative">
      <div className="card-container">
        <div className="flex flex-col xl:flex-row justify-between items-center mb-6 space-y-4 xl:space-y-0">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="text-neon-pink" size={24} />
            <h2 className="text-xl font-bold">월간 판매/고객 캘린더</h2>
            <div className="flex space-x-2 ml-4">
              <select value={year} onChange={e => setYear(e.target.value)} className="input-field py-1 px-3 w-24">
                <option value="2025">2025년</option>
                <option value="2026">2026년</option>
                <option value="2027">2027년</option>
              </select>
              <select value={month} onChange={e => setMonth(e.target.value)} className="input-field py-1 px-3 w-20">
                {Array.from({length:12}, (_,i) => <option key={i+1} value={String(i+1).padStart(2,'0')}>{i+1}월</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`p-3 text-center font-bold text-sm ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="flex flex-col">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 border-b last:border-b-0 border-gray-100">
                {week.map((cell, cIdx) => {
                  if (!cell) return <div key={`empty-${cIdx}`} className="min-h-[140px] bg-gray-50/50 p-2 border-r last:border-r-0 border-gray-100"></div>;
                  
                  return (
                    <div 
                      key={cell.day} 
                      className={`min-h-[140px] p-2 border-r last:border-r-0 border-gray-100 relative group transition-colors ${cell.dayTotal > 0 ? 'hover:bg-pink-50/30 cursor-pointer' : 'hover:bg-gray-50'}`}
                      onClick={() => { if(cell.dayTotal > 0) setSelectedDaySales(cell); }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-medium ${cIdx === 0 ? 'text-red-500' : cIdx === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                          {cell.day}
                        </span>
                        
                        {cell.birthdays.length > 0 && (
                          <button 
                            className="text-yellow-500 hover:text-yellow-600 animate-bounce p-1"
                            onClick={(e) => { e.stopPropagation(); setSelectedDayBdays(cell); }}
                            title={`${cell.birthdays.length}명의 생일자가 있습니다!`}
                          >
                            <Gift size={18} fill="currentColor" />
                          </button>
                        )}
                      </div>

                      {cell.dayTotal > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-neon-pink mb-1">₩{cell.dayTotal.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-500 bg-gray-100 rounded px-1 py-0.5 inline-block">
                            {cell.sales.length}건
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Fill remaining empty cells in last row */}
                {Array.from({ length: 7 - week.length }).map((_, idx) => (
                  <div key={`fill-${idx}`} className="min-h-[140px] bg-gray-50/50 p-2 border-r last:border-r-0 border-gray-100"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Detail Modal */}
      {selectedDaySales && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <CalendarIcon className="text-neon-pink" size={20} />
                <span>{selectedDaySales.dateStr} 판매 상세 내역</span>
              </h2>
              <button onClick={() => setSelectedDaySales(null)} className="p-2 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                {selectedDaySales.sales.map((sale, idx) => (
                  <div key={sale.sale_id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 font-medium">#{idx + 1}</span>
                        <span className="font-bold text-gray-800">{sale.name}</span>
                        <span className="text-xs text-gray-400">({sale.customer_no})</span>
                      </div>
                      <span className="font-bold text-neon-pink">₩{sale.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {sale.items.map((item, i) => (
                        <div key={i} className="text-sm flex justify-between text-gray-600">
                          <span>- {item.name}</span>
                          <span className="text-gray-400">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-medium text-gray-600">총 결제 금액 합계</span>
              <span className="text-2xl font-bold text-neon-pink">₩{selectedDaySales.dayTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Birthdays Modal */}
      {selectedDayBdays && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-yellow-50">
              <h2 className="text-xl font-bold text-yellow-600 flex items-center space-x-2">
                <Gift size={20} />
                <span>{selectedDayBdays.day}일 생일자 명단</span>
              </h2>
              <button onClick={() => setSelectedDayBdays(null)} className="p-2 rounded-full hover:bg-yellow-200 text-yellow-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {selectedDayBdays.birthdays.map((b) => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-xs">
                      {b.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">{b.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">{b.birth_date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
