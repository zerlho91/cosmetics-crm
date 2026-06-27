import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [loginMode, setLoginMode] = useState('idpw'); // 'idpw' or 'admincode'
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [adminCode, setAdminCode] = useState('');
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Clear previous sessions when entering login
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_brand');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      let payload = {};
      if (loginMode === 'idpw') {
        payload = { username, password };
      } else {
        payload = { adminCode };
      }

      const res = await api.post('/auth/login', payload);
      if (res.data.success) {
        localStorage.setItem('crm_token', res.data.token);
        localStorage.setItem('crm_user', res.data.user.username);
        localStorage.setItem('crm_brand', res.data.user.brand_name || 'AmorePacific');
        navigate('/');
      }
    } catch (err) {
      setError('로그인 정보가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="card-container w-full max-w-md relative z-10 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 tracking-wider">LUMIÈRE</h1>
          <p className="text-sm text-gray-500">Cosmetics CRM System</p>
        </div>

        <div className="flex mb-6 border-b border-gray-200">
          <button 
            className={`flex-1 pb-3 text-sm font-medium ${loginMode === 'idpw' ? 'text-neon-pink border-b-2 border-neon-pink' : 'text-gray-400'}`}
            onClick={() => { setLoginMode('idpw'); setError(''); }}
          >
            ID / PW 로그인
          </button>
          <button 
            className={`flex-1 pb-3 text-sm font-medium ${loginMode === 'admincode' ? 'text-neon-pink border-b-2 border-neon-pink' : 'text-gray-400'}`}
            onClick={() => { setLoginMode('admincode'); setError(''); }}
          >
            Admin Code 로그인
          </button>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {loginMode === 'idpw' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Code</label>
              <input 
                type="password" 
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="input-field text-center tracking-[0.5em] text-lg font-semibold"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          
          <button type="submit" className="btn-primary py-3">
            시스템 접속하기
          </button>
        </form>
      </div>
    </div>
  );
}
