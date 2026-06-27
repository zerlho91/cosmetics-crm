import { useState, useEffect } from 'react';
import api from '../api';
import { Search, Trash2 } from 'lucide-react';

export default function SalesForm() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerNo, setCustomerNo] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectKey, setSelectKey] = useState(0); // select 리셋용
  
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const [useMileage, setUseMileage] = useState(false);
  const [mileageToUse, setMileageToUse] = useState(0);
  
  const [discountType, setDiscountType] = useState('none'); // none, rate, amount
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('카드');
  
  const [memo, setMemo] = useState('');

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data));
  }, []);

  const handleCustomerSearch = async () => {
    if (!customerNo) return;
    try {
      const res = await api.get(`/customers?search=${customerNo}`);
      if (res.data.length > 0) {
        setCustomerInfo(res.data[0]);
      } else {
        alert('고객을 찾을 수 없습니다.');
        setCustomerInfo(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addProduct = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;
    
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
    // select를 초기화하여 동일 제품 재선택 가능하게
    setSelectKey(k => k + 1);
  };

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  let calculatedDiscount = 0;
  if (discountType === 'rate') {
    calculatedDiscount = Math.floor(totalAmount * (discountValue / 100));
  } else if (discountType === 'amount') {
    calculatedDiscount = parseInt(discountValue) || 0;
  }
  
  const finalAmount = Math.max(0, totalAmount - calculatedDiscount - (useMileage ? mileageToUse : 0));

  const handleSubmit = async () => {
    if (!customerInfo || selectedProducts.length === 0) {
      alert('고객 정보와 제품을 선택해주세요.');
      return;
    }
    
    try {
      const payload = {
        date,
        customer_id: customerInfo.id,
        total_amount: finalAmount,
        used_mileage: useMileage ? mileageToUse : 0,
        discount_type: discountType === 'none' ? null : discountType,
        discount_value: discountType === 'none' ? 0 : discountValue,
        payment_method: paymentMethod,
        memo,
        items: selectedProducts.map(p => ({ product_id: p.id, quantity: p.quantity }))
      };
      
      await api.post('/sales', payload);
      alert('판매가 등록되었습니다.');
      // Reset form
      setCustomerNo('');
      setCustomerInfo(null);
      setSelectedProducts([]);
      setUseMileage(false);
      setMileageToUse(0);
      setDiscountType('none');
      setDiscountValue(0);
      setPaymentMethod('카드');
      setMemo('');
      setSelectKey(k => k + 1);
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">판매 기록 등록</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form */}
        <div className="card-container space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">고객 번호 또는 이름</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={customerNo} 
                  onChange={(e) => setCustomerNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                  className="input-field" 
                  placeholder="고객번호 또는 이름 입력 후 Enter"
                />
                <button onClick={handleCustomerSearch} className="btn-primary w-auto px-6 flex items-center justify-center">
                  <Search size={18} />
                </button>
              </div>
              {customerInfo && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-neon-pink shadow-sm">
                  <p className="font-medium text-neon-pink">✓ 매핑 완료</p>
                  <p className="text-sm mt-1">성함: {customerInfo.name}</p>
                  <p className="text-sm">보유 마일리지: ₩{customerInfo.mileage.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">제품 추가</label>
              <select
                key={selectKey}
                onChange={(e) => { addProduct(e.target.value); }}
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled>제품을 선택하세요 (다중 선택)</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ₩{p.price.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">비고 / 이벤트 메모</label>
              <textarea 
                className="input-field h-24 resize-none" 
                value={memo} 
                onChange={(e) => setMemo(e.target.value)}
                placeholder="특이사항 또는 이벤트 내용 입력"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Right Summary & Cart */}
        <div className="space-y-6">
          <div className="card-container">
            <h2 className="text-lg font-bold mb-4">선택된 제품 리스트</h2>
            {selectedProducts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">선택된 제품이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">₩{p.price.toLocaleString()} x {p.quantity}</p>
                    </div>
                    <button onClick={() => removeProduct(p.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-container border-t-4 border-neon-pink">
            <h2 className="text-lg font-bold mb-4">결제 정보</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>총 상품 금액</span>
                <span>₩{totalAmount.toLocaleString()}</span>
              </div>
              
              {/* Discount Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium mb-2 text-gray-700">추가 할인 적용</label>
                <div className="flex items-center space-x-3 mb-2">
                  <label className="flex items-center space-x-1 cursor-pointer text-sm">
                    <input type="radio" name="discount" checked={discountType === 'none'} onChange={() => setDiscountType('none')} className="text-neon-pink focus:ring-neon-pink" />
                    <span>적용안함</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer text-sm">
                    <input type="radio" name="discount" checked={discountType === 'rate'} onChange={() => setDiscountType('rate')} className="text-neon-pink focus:ring-neon-pink" />
                    <span>할인율(%)</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer text-sm">
                    <input type="radio" name="discount" checked={discountType === 'amount'} onChange={() => setDiscountType('amount')} className="text-neon-pink focus:ring-neon-pink" />
                    <span>할인금액(₩)</span>
                  </label>
                </div>
                {discountType !== 'none' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neon-pink">- 할인 적용 금액</span>
                    <input 
                      type="number" 
                      className="input-field w-32 py-1 px-2 text-right text-sm border-neon-pink"
                      placeholder={discountType === 'rate' ? '% 입력' : '금액 입력'}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Mileage Section */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useMileage} 
                      onChange={(e) => setUseMileage(e.target.checked)}
                      className="rounded text-neon-pink focus:ring-neon-pink"
                      disabled={!customerInfo || customerInfo.mileage === 0}
                    />
                    <span className={`text-sm font-medium ${!customerInfo || customerInfo.mileage === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                      마일리지 사용 (최대 ₩{customerInfo ? customerInfo.mileage.toLocaleString() : 0})
                    </span>
                  </label>
                  {useMileage && customerInfo && (
                    <input 
                      type="number" 
                      className="input-field w-32 py-1 px-2 text-right text-sm"
                      value={mileageToUse}
                      onChange={(e) => setMileageToUse(Math.min(e.target.value, customerInfo.mileage))}
                      max={customerInfo.mileage}
                    />
                  )}
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium mb-2 text-gray-700">결제 수단</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="radio" name="payment_method" checked={paymentMethod === '카드'} onChange={() => setPaymentMethod('카드')} className="text-neon-pink focus:ring-neon-pink" />
                    <span className="text-sm">카드 결제</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="radio" name="payment_method" checked={paymentMethod === '현금'} onChange={() => setPaymentMethod('현금')} className="text-neon-pink focus:ring-neon-pink" />
                    <span className="text-sm">현금 결제</span>
                  </label>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                <span className="font-medium">최종 결제 금액</span>
                <span className="text-2xl font-bold text-neon-pink">₩{finalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={handleSubmit} className="btn-primary">
              판매 내역 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
