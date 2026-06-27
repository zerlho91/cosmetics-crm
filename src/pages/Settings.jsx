import { useState, useEffect } from 'react';
import api from '../api';
import { Database, Users, AlertTriangle, Search, Trash2, Download, Upload, FileSpreadsheet, Sparkles, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
export default function Settings() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '' });

  const [brandName, setBrandName] = useState('');

  // AI API 키 설정
  const [aiKey, setAiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiSaved, setAiSaved] = useState(false);
  
  const [resetTarget, setResetTarget] = useState('all');
  const [resetCustomerNo, setResetCustomerNo] = useState('');
  const [resetCustomerId, setResetCustomerId] = useState(null);

  const downloadCustomerTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      customer_no: 'CUST-0001',
      name: '홍길동',
      birth_date: '1990-01-01',
      join_date: '2026-05-01',
      skin_type: '건성,민감성',
      region: '서울 강남구',
      memo: '메모 예시',
      mileage: 1000
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, '고객업로드양식.xlsx');
  };

  const downloadProductTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      name: '테스트 상품',
      price: 15000,
      description: '상품 설명',
      stock: 100,
      image_url: 'http://example.com/image.jpg',
      link: 'http://example.com'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, '상품업로드양식.xlsx');
  };

  const handleCustomerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
        
        const res = await api.post('/customers/bulk', data);
        alert(`업로드 완료! 신규 고객 ${res.data.inserted}명이 추가되었습니다. (중복 제외)`);
      } catch (err) {
        alert('엑셀 처리 중 오류가 발생했습니다.');
        console.error(err);
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleProductUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
        
        const res = await api.post('/products/bulk', data);
        alert(`업로드 완료! 신규 상품 ${res.data.inserted}개가 추가되었습니다. (중복 제외)`);
      } catch (err) {
        alert('엑셀 처리 중 오류가 발생했습니다.');
        console.error(err);
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    fetchUsers();
    setBrandName(localStorage.getItem('crm_brand') || 'AmorePacific');
    setAiKey(localStorage.getItem('crm_ai_key') || '');
    setAiModel(localStorage.getItem('crm_ai_model') || '');
  }, []);

  const handleSaveAiKey = (e) => {
    e.preventDefault();
    const key = aiKey.trim();
    if (key) localStorage.setItem('crm_ai_key', key);
    else localStorage.removeItem('crm_ai_key');
    const model = aiModel.trim();
    if (model) localStorage.setItem('crm_ai_model', model);
    else localStorage.removeItem('crm_ai_model');
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2500);
  };

  const handleClearAiKey = () => {
    if (!confirm('저장된 AI API 키를 삭제하시겠습니까?')) return;
    localStorage.removeItem('crm_ai_key');
    localStorage.removeItem('crm_ai_model');
    setAiKey('');
    setAiModel('');
    alert('AI API 키가 삭제되었습니다.');
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      setNewUser({ username: '', password: '' });
      fetchUsers();
      alert('사용자가 추가되었습니다.');
    } catch (e) {
      alert('오류 발생');
    }
  };

  const handleDeleteUser = async (id) => {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch(e) {
      alert('오류 발생');
    }
  };

  const handleUpdateBrand = async (e) => {
    e.preventDefault();
    try {
      const myUsername = localStorage.getItem('crm_user');
      const myUser = users.find(u => u.username === myUsername);
      if(myUser) {
        await api.put(`/users/${myUser.id}/brand`, { brand_name: brandName });
        localStorage.setItem('crm_brand', brandName);
        alert('브랜드명이 업데이트 되었습니다. 새로고침 후 반영됩니다.');
        window.location.reload();
      }
    } catch(e) {
      alert('오류 발생');
    }
  };

  const searchCustomerToReset = async () => {
    try {
      const res = await api.get(`/customers?search=${resetCustomerNo}`);
      if(res.data.length > 0) {
        setResetCustomerId(res.data[0].id);
        alert(`${res.data[0].name} 고객님이 선택되었습니다.`);
      } else {
        alert('고객을 찾을 수 없습니다.');
        setResetCustomerId(null);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleResetData = async () => {
    if(resetTarget === 'all') {
      if(!confirm('경고: 모든 고객 정보와 판매 내역이 삭제됩니다. 정말 진행하시겠습니까?')) return;
      if(!confirm('다시 한번 묻습니다. 이 작업은 되돌릴 수 없습니다. 진행하시겠습니까?')) return;
      
      try {
        await api.post('/system/reset', { target: 'all' });
        alert('전체 초기화가 완료되었습니다.');
      } catch(e) {
        alert('초기화 실패');
      }
    } else if (resetTarget === 'customer') {
      if(!resetCustomerId) {
        alert('먼저 초기화할 고객을 검색해주세요.');
        return;
      }
      if(!confirm('해당 고객을 완전히 삭제하시겠습니까? 연관된 판매 데이터는 유지되지만 고객 정보는 사라집니다.')) return;
      
      try {
        await api.post('/system/reset', { target: 'customer', customerId: resetCustomerId });
        alert('고객 정보가 초기화되었습니다.');
        setResetCustomerNo('');
        setResetCustomerId(null);
      } catch(e) {
        alert('초기화 실패');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">시스템 설정 및 모니터링</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AI API Key */}
        <div className="card-container lg:col-span-2 border-t-4 border-neon-pink">
          <h2 className="text-lg font-bold mb-2 flex items-center space-x-2">
            <Sparkles size={20} className="text-neon-pink" />
            <span>AI 기능 설정 (API 키)</span>
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Claude(Anthropic) API 키를 입력하면 <b>AI 월간 요약 · 액션 제안 · 고객 추천</b> 기능이 활성화됩니다.
            키는 이 기기의 브라우저에만 저장됩니다.
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-neon-pink underline ml-1">키 발급받기 ↗</a>
          </p>

          <form onSubmit={handleSaveAiKey} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-2">AI API 키</label>
              <input
                type="password"
                className="input-field font-mono"
                placeholder="sk-ant-..."
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">모델 (선택)</label>
              <input
                type="text"
                className="input-field"
                placeholder="claude-haiku-4-5 (비워두면 기본값 사용)"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button type="submit" className="btn-primary w-auto px-6 py-2 text-sm flex items-center space-x-2">
                {aiSaved ? <><Check size={16} /><span>저장됨</span></> : <span>저장</span>}
              </button>
              {(aiKey || aiModel) && (
                <button type="button" onClick={handleClearAiKey} className="btn-secondary text-sm py-2 text-red-500 border-red-200 hover:bg-red-500 hover:text-white">
                  삭제
                </button>
              )}
              <span className={`text-sm font-medium ${localStorage.getItem('crm_ai_key') ? 'text-green-600' : 'text-gray-400'}`}>
                {localStorage.getItem('crm_ai_key') ? '● AI 활성화됨' : '○ 키 미설정 (AI 비활성)'}
              </span>
            </div>
          </form>
        </div>

        {/* User Management */}
        <div className="card-container">
          <h2 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <Users className="text-neon-blue" size={20} />
            <span>사용자 및 브랜드 관리</span>
          </h2>
          
          <form onSubmit={handleUpdateBrand} className="mb-8 border-b border-gray-100 pb-6">
            <label className="block text-sm font-medium mb-2">커스텀 브랜드명 (우측 상단 표시)</label>
            <div className="flex space-x-2">
              <input type="text" className="input-field" value={brandName} onChange={e => setBrandName(e.target.value)} />
              <button type="submit" className="btn-secondary whitespace-nowrap">변경</button>
            </div>
          </form>

          <div className="mb-6">
            <h3 className="font-medium text-sm text-gray-500 mb-3">등록된 계정 목록</h3>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">{u.username}</span>
                  {u.username !== 'admin' && (
                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddUser} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="font-medium text-sm mb-3">새 계정 추가</h3>
            <div className="space-y-3">
              <input required type="text" className="input-field bg-white py-2" placeholder="ID" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              <input required type="password" className="input-field bg-white py-2" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <button type="submit" className="btn-primary py-2 text-sm">계정 생성</button>
            </div>
          </form>
        </div>

        {/* Excel Data Management */}
        <div className="card-container lg:col-span-2">
          <h2 className="text-lg font-bold mb-6 flex items-center space-x-2 text-green-600">
            <FileSpreadsheet size={20} />
            <span>엑셀 일괄 업로드 및 다운로드</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customers Excel */}
            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
              <h3 className="font-bold text-green-800 mb-4">고객 데이터 (Customers)</h3>
              <p className="text-sm text-green-700 mb-4">고객번호가 동일한 기존 데이터는 무시되고, 새로운 고객만 추가됩니다.</p>
              <div className="space-y-3">
                <button onClick={downloadCustomerTemplate} className="w-full flex items-center justify-center space-x-2 py-2 bg-white text-green-700 border border-green-300 rounded-lg font-medium hover:bg-green-100 transition-colors">
                  <Download size={18} />
                  <span>고객 업로드 양식 다운로드</span>
                </button>
                <div className="relative">
                  <input type="file" accept=".xlsx, .xls" onChange={handleCustomerUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button className="w-full flex items-center justify-center space-x-2 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                    <Upload size={18} />
                    <span>작성된 고객 엑셀 업로드</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Products Excel */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-4">상품 데이터 (Products)</h3>
              <p className="text-sm text-blue-700 mb-4">상품명이 동일한 기존 데이터는 무시되고, 새로운 상품만 추가됩니다.</p>
              <div className="space-y-3">
                <button onClick={downloadProductTemplate} className="w-full flex items-center justify-center space-x-2 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                  <Download size={18} />
                  <span>상품 업로드 양식 다운로드</span>
                </button>
                <div className="relative">
                  <input type="file" accept=".xlsx, .xls" onChange={handleProductUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    <Upload size={18} />
                    <span>작성된 상품 엑셀 업로드</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management & Danger Zone */}
        <div className="card-container border-t-4 border-red-500 lg:col-span-2">
          <h2 className="text-lg font-bold mb-6 flex items-center space-x-2 text-red-600">
            <AlertTriangle size={20} />
            <span>데이터 초기화 (Danger Zone)</span>
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">초기화 대상 선택</label>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={resetTarget === 'all'} onChange={() => setResetTarget('all')} className="text-red-500 focus:ring-red-500" />
                  <span className="font-medium">전체 초기화 (DB 전체)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={resetTarget === 'customer'} onChange={() => setResetTarget('customer')} className="text-red-500 focus:ring-red-500" />
                  <span className="font-medium">인원별 초기화 (특정 고객)</span>
                </label>
              </div>

              {resetTarget === 'customer' && (
                <div className="flex space-x-2 mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
                  <input 
                    type="text" 
                    placeholder="고객 번호 입력" 
                    className="input-field bg-white py-2"
                    value={resetCustomerNo}
                    onChange={e => setResetCustomerNo(e.target.value)}
                  />
                  <button onClick={searchCustomerToReset} className="btn-secondary whitespace-nowrap px-4 border-red-200 text-red-500 hover:bg-red-500 hover:text-white">
                    검색
                  </button>
                </div>
              )}

              <div className="bg-red-50 p-4 rounded-xl">
                <p className="text-sm text-red-600 font-medium mb-3">
                  주의: 삭제된 데이터는 복구할 수 없습니다. 계속하시겠습니까?
                </p>
                <button onClick={handleResetData} className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-md">
                  선택한 데이터 초기화
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
