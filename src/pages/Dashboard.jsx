import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Calendar as CalendarIcon } from 'lucide-react';
import api from '../api';
import AiInsightButton from '../components/AiInsightButton';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [yearlyData, setYearlyData] = useState([]);
  const [error, setError] = useState(false);
  
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [globalYear, setGlobalYear] = useState('2026');
  const [globalMonth, setGlobalMonth] = useState('05');
  
  const [yearlyChartYear, setYearlyChartYear] = useState('2026');

  useEffect(() => {
    setUserName(localStorage.getItem('crm_user') || 'Admin');
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [globalYear, globalMonth]);

  useEffect(() => {
    fetchYearlyData();
  }, [yearlyChartYear]);

  const fetchDashboardData = async () => {
    setData(null);
    setError(false);
    try {
      const res = await api.get(`/dashboard?year=${globalYear}&month=${globalMonth}`);
      setData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      setError(true);
    }
  };

  const fetchYearlyData = async () => {
    try {
      const res = await api.get(`/dashboard/yearly?year=${yearlyChartYear}`);
      setYearlyData(res.data);
    } catch (error) {
      console.error('Error fetching yearly data', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-100 pb-4 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            <span className="text-neon-pink">{globalMonth}월</span> 대시보드
          </h1>
          <p className="text-gray-500 text-sm md:text-base">어서오세요! {userName}님, 오늘도 빛나는 하루 되세요 ✨</p>
          <div className="mt-3">
            <AiInsightButton
              label="AI 월간 요약"
              title={`${globalMonth}월 AI 요약`}
              requestBody={{ type: 'dashboard', year: globalYear, month: globalMonth }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-6 flex-wrap gap-y-2">
          {/* Global Date Toggle */}
          <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center space-x-3 border border-gray-200 shadow-sm">
            <CalendarIcon size={18} className="text-neon-pink" />
            <select 
              className="bg-transparent font-medium focus:outline-none"
              value={globalYear}
              onChange={(e) => setGlobalYear(e.target.value)}
            >
              <option value="2025">2025년</option>
              <option value="2026">2026년</option>
              <option value="2027">2027년</option>
            </select>
            <select 
              className="bg-transparent font-medium focus:outline-none"
              value={globalMonth}
              onChange={(e) => setGlobalMonth(e.target.value)}
            >
              {Array.from({length:12}, (_,i) => <option key={i+1} value={String(i+1).padStart(2,'0')}>{i+1}월</option>)}
            </select>
          </div>

          <div className="text-right">
            <p className="text-2xl font-light tracking-widest text-neon-pink">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-500">{currentTime.toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {!data ? (
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
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 5-Month Sales History */}
            <div className="card-container md:col-span-2">
              <h2 className="text-xl font-bold mb-6">최근 5개월 매출 추이</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlySalesHistory}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/10000).toFixed(0)}만원`} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} formatter={(value) => [`₩${value.toLocaleString()}`, '매출']} />
                    <Bar dataKey="sales" fill="#ff007f" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Customers */}
            <div className="card-container">
              <h2 className="text-xl font-bold mb-6">이달의 우수 고객 TOP 3</h2>
              <div className="space-y-4">
                {data.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-neon-pink text-white shadow-neon' : 'bg-gray-200 text-gray-600'}`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">₩{customer.total_spent.toLocaleString()}</span>
                  </div>
                ))}
                {data.topCustomers.length === 0 && <p className="text-gray-400 text-sm text-center py-4">구매 내역이 없습니다.</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Yearly Sales Trend */}
            <div className="card-container md:col-span-2 border-t-4 border-neon-blue">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neon-blue flex items-center">
                  연간 매출 종합 (12개월)
                </h2>
                <select 
                  className="input-field py-1 px-3 w-32 text-sm border-neon-blue focus:ring-neon-blue"
                  value={yearlyChartYear}
                  onChange={(e) => setYearlyChartYear(e.target.value)}
                >
                  <option value="2025">2025년</option>
                  <option value="2026">2026년</option>
                  <option value="2027">2027년</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/10000).toFixed(0)}만원`} tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} formatter={(value) => [`₩${value.toLocaleString()}`, '매출']} />
                    <Line type="monotone" dataKey="sales" stroke="#00f3ff" strokeWidth={3} dot={{r: 4, fill: '#00f3ff'}} activeDot={{r: 8, shadow: '0 0 10px #00f3ff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="card-container">
              <h2 className="text-xl font-bold mb-6">이달의 인기 제품 TOP 5</h2>
              <div className="space-y-3">
                {data.topProducts.map((product, index) => (
                  <div key={product.id} className="flex justify-between items-center p-2 border-b border-gray-50 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 font-medium w-4">{index + 1}.</span>
                      <span className="font-medium text-sm">{product.name}</span>
                    </div>
                    <span className="text-xs bg-neon-pink/10 text-neon-pink px-2 py-1 rounded font-medium">{product.total_sold}개 판매</span>
                  </div>
                ))}
                {data.topProducts.length === 0 && <p className="text-gray-400 text-sm text-center py-4">판매 내역이 없습니다.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
