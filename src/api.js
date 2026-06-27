import axios from 'axios';

// 배포 환경(Vercel)에서는 동일 도메인의 /api 서버리스 함수로 요청됩니다.
// 로컬 개발에서는 vite proxy(vite.config.js)가 /api 를 localhost:3001 로 넘깁니다.
const api = axios.create({
  baseURL: '/api',
});

// Add a request interceptor for auth token (if needed)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 설정 화면에서 입력한 AI API 키/모델을 함께 전송 (AI 기능에 사용)
  const aiKey = localStorage.getItem('crm_ai_key');
  if (aiKey) config.headers['x-ai-key'] = aiKey;
  const aiModel = localStorage.getItem('crm_ai_model');
  if (aiModel) config.headers['x-ai-model'] = aiModel;
  return config;
});

export default api;
