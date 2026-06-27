import { useState, useEffect } from 'react';
import { Edit2, Plus } from 'lucide-react';
import api from '../api';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  
  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', customer_no: '', birth_date: '', join_date: new Date().toISOString().split('T')[0],
    region: '', memo: ''
  });
  const [selectedSkins, setSelectedSkins] = useState([]);

  // Mileage Modal State
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);
  const [mileageTarget, setMileageTarget] = useState(null);
  const [mileageToAdd, setMileageToAdd] = useState('');

  const skinOptions = ['건성', '지성', '복합성', '민감성', '수부지', '트러블'];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const birthYear = parseInt(birthDate.split('-')[0]);
    // Assuming current year is 2026 for demo consistency
    const age = 2026 - birthYear;
    return `${age}세`;
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', customer_no: '', birth_date: '', join_date: new Date().toISOString().split('T')[0], region: '', memo: '' });
    setSelectedSkins([]);
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setModalMode('edit');
    setEditId(c.id);
    setFormData({
      name: c.name, customer_no: c.customer_no, birth_date: c.birth_date || '', join_date: c.join_date, region: c.region || '', memo: c.memo || ''
    });
    setSelectedSkins(c.skin_type ? c.skin_type.split(',') : []);
    setIsModalOpen(true);
  };

  const handleSkinChange = (skin) => {
    if (selectedSkins.includes(skin)) setSelectedSkins(selectedSkins.filter(s => s !== skin));
    else setSelectedSkins([...selectedSkins, skin]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await api.post('/customers', { ...formData, skin_type: selectedSkins.join(',') });
      } else {
        await api.put(`/customers/${editId}`, { ...formData, skin_type: selectedSkins.join(',') });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleAddMileage = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/customers/${mileageTarget.id}/mileage`, { amount: parseInt(mileageToAdd) });
      setIsMileageModalOpen(false);
      setMileageToAdd('');
      fetchCustomers();
      alert('마일리지가 추가되었습니다.');
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">고객 명부 관리</h1>
        <button onClick={openCreateModal} className="btn-primary w-auto px-6 text-sm">
          신규 고객 등록
        </button>
      </div>

      <div className="card-container overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-4 rounded-tl-2xl">고객번호</th>
                <th className="px-4 py-4">성함</th>
                <th className="px-4 py-4">생년월일 (나이)</th>
                <th className="px-4 py-4">가입일자</th>
                <th className="px-4 py-4">피부 특성</th>
                <th className="px-4 py-4">마일리지</th>
                <th className="px-4 py-4 rounded-tr-2xl text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-900">{c.customer_no}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-neon-pink text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium text-text">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {c.birth_date ? `${c.birth_date} (${calculateAge(c.birth_date)})` : '-'}
                  </td>
                  <td className="px-4 py-4">{c.join_date}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.skin_type ? c.skin_type.split(',').map(skin => (
                        <span key={skin} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px]">{skin}</span>
                      )) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-neon-pink font-semibold">₩{c.mileage.toLocaleString()}</span>
                      <button 
                        onClick={() => { setMileageTarget(c); setIsMileageModalOpen(true); }}
                        className="p-1 bg-gray-100 hover:bg-neon-pink hover:text-white rounded-full text-gray-500 transition-colors"
                        title="마일리지 추가"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => openEditModal(c)} className="text-gray-400 hover:text-neon-pink p-2">
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{modalMode === 'create' ? '신규 고객 등록' : '고객 정보 수정'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">성함</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium mb-1">고객번호 (고유 식별자)</label>
                  <input required type="text" className="input-field" placeholder="예: CUST-004" value={formData.customer_no} onChange={e => setFormData({...formData, customer_no: e.target.value})} />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">생년월일</label>
                <input type="date" className="input-field" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">피부 특성 (다중 선택)</label>
                <div className="grid grid-cols-3 gap-2">
                  {skinOptions.map(skin => (
                    <label key={skin} className={`flex items-center justify-center px-3 py-2 text-sm rounded-xl cursor-pointer border transition-colors ${selectedSkins.includes(skin) ? 'bg-neon-pink text-white border-neon-pink' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-neon-pink'}`}>
                      <input type="checkbox" className="hidden" checked={selectedSkins.includes(skin)} onChange={() => handleSkinChange(skin)} />
                      {skin}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">지역</label>
                <input type="text" className="input-field" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
              </div>
              <div className="flex space-x-3 mt-6 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary w-full py-3">취소</button>
                <button type="submit" className="btn-primary py-3">저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mileage Add Modal */}
      {isMileageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <Plus className="text-neon-pink" size={20} />
              <span>마일리지 수동 추가</span>
            </h2>
            <p className="text-sm text-gray-500 mb-4">{mileageTarget?.name} 고객님에게 추가할 마일리지를 입력하세요.</p>
            <form onSubmit={handleAddMileage} className="space-y-4">
              <div>
                <input required type="number" min="1" className="input-field text-right" placeholder="금액 입력 (예: 5000)" value={mileageToAdd} onChange={e => setMileageToAdd(e.target.value)} />
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setIsMileageModalOpen(false)} className="btn-secondary flex-1">취소</button>
                <button type="submit" className="btn-primary flex-1">추가하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
