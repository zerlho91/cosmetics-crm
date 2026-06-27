import { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, BarChart2, X, Image as ImageIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';

const COLORS = ['#ff007f', '#00f3ff', '#9d00ff', '#ffb800', '#00ff88'];

export default function Search() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/analytics/compare', { productIds: selectedIds });
      setAnalyticsData(res.data);
      setShowAnalytics(true);
    } catch (e) {
      alert('분석 데이터를 불러오는데 실패했습니다.');
    }
  };

  const filteredProducts = products.filter(p => p.name.includes(searchTerm));
  const selectedProductNames = selectedIds.map(id => products.find(p => p.id === id)?.name).filter(Boolean);

  return (
    <div className="space-y-6 pb-24 relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">제품 탐색 및 분석</h1>
          <p className="text-gray-500">제품을 선택하여 실시간 분석을 진행하세요.</p>
        </div>
      </div>

      <div className="card-container border-b-4 border-neon-blue">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="제품명 검색 (예: 에센스)" 
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          const hasSelection = selectedIds.length > 0;
          
          return (
            <div 
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                isSelected 
                  ? 'border-neon-pink bg-white shadow-neon' 
                  : hasSelection 
                    ? 'border-gray-200 bg-gray-50 opacity-60 grayscale' 
                    : 'border-gray-200 bg-white hover:border-neon-pink'
              }`}
            >
              <div className="w-full h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center border border-gray-100 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-gray-300" size={32} />
                )}
              </div>
              <h3 className={`font-bold mb-1 truncate ${isSelected ? 'text-neon-pink' : 'text-gray-800'}`}>{p.name}</h3>
              <p className="text-sm font-semibold text-gray-500 mb-2">₩{p.price.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Floating Compare Action Bar */}
      {selectedIds.length > 0 && !showAnalytics && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center space-x-6 z-40 animate-[slideUp_0.3s_ease-out]">
          <span className="font-medium">{selectedIds.length}개 제품 선택됨</span>
          <button 
            onClick={handleCompare}
            className="bg-neon-pink hover:bg-pink-600 text-white px-6 py-2 rounded-full font-bold flex items-center space-x-2 transition-colors shadow-neon"
          >
            <BarChart2 size={18} />
            <span>비교 분석하기</span>
          </button>
        </div>
      )}

      {/* Analytics Modal/Panel */}
      {showAnalytics && analyticsData && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-end z-50">
          <div className="w-full max-w-4xl bg-background h-full overflow-y-auto shadow-2xl animate-[slideLeft_0.3s_ease-out]">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <BarChart2 className="text-neon-pink" size={24} />
                  <span>선택 제품 다차원 분석</span>
                </h2>
                <button onClick={() => setShowAnalytics(false)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Monthly Sales Comparison */}
                <div className="card-container">
                  <h3 className="text-lg font-bold mb-4">월별 판매량 비교</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.monthly}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{borderRadius: '12px'}} />
                        <Legend />
                        {selectedProductNames.map((name, i) => (
                          <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{r: 4}} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Age Group Analysis */}
                  <div className="card-container">
                    <h3 className="text-lg font-bold mb-4">연령대별 선호도</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.age}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="ageGroup" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{borderRadius: '12px'}} />
                          <Legend />
                          {selectedProductNames.map((name, i) => (
                            <Bar key={name} dataKey={name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Skin Type Analysis */}
                  <div className="card-container">
                    <h3 className="text-lg font-bold mb-4">피부 타입별 구매 비중</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.skin} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickLine={false} axisLine={false} />
                          <YAxis dataKey="skinType" type="category" tickLine={false} axisLine={false} width={80} />
                          <Tooltip contentStyle={{borderRadius: '12px'}} />
                          <Legend />
                          {selectedProductNames.map((name, i) => (
                            <Bar key={name} dataKey={name} fill={COLORS[i % COLORS.length]} stackId="a" />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
