import { useState, useEffect } from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import api from '../api';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', price: '', description: '', stock: '', image_url: '', link: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock || 0)
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', price: '', description: '', stock: '', image_url: '', link: '' });
      fetchProducts();
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', stock: '', image_url: '', link: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name, price: p.price, description: p.description, stock: p.stock, image_url: p.image_url, link: p.link });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">제품 명부 관리</h1>
        <button onClick={openNewModal} className="btn-primary w-auto px-6 text-sm">
          신규 제품 등록
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p) => (
          <div key={p.id} className="card-container p-5 hover:-translate-y-1 transition-transform border border-gray-100 flex flex-col h-full">
            <div className="w-full h-40 bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-gray-100 relative group">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-gray-300" size={40} />
              )}
              {p.link && (
                <a 
                  href={p.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                    <ExternalLink size={16} />
                    <span>상세 링크</span>
                  </span>
                </a>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{p.name}</h3>
              <p className="text-neon-pink font-bold text-xl mb-3">₩{p.price.toLocaleString()}</p>
              <p className="text-sm text-gray-500 line-clamp-2">{p.description || '제품 설명이 없습니다.'}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
              <span className="text-gray-400">재고: <span className="font-bold text-gray-700">{p.stock}개</span></span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">ID: {p.id}</span>
                <button onClick={() => openEditModal(p)} className="text-neon-pink hover:underline text-xs font-medium ml-2">수정</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-6">{editingId ? '제품 수정' : '신규 제품 등록'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제품명</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">가격 (₩)</label>
                <input required type="number" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">제품 이미지 링크 (선택)</label>
                <input type="text" className="input-field" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">제품 상세 URL (선택)</label>
                <input type="text" className="input-field" placeholder="https://..." value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea className="input-field h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">초기 재고량</label>
                <input type="number" className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary w-full py-3">취소</button>
                <button type="submit" className="btn-primary py-3">저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
