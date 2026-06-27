// 로컬 개발용 서버: webapp 폴더에서 `npm run server` 로 실행 (포트 3001)
// vite dev 서버가 /api 요청을 이 서버로 프록시합니다.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 파일 간단 로더 (dotenv 의존성 없이)
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    if (line.trim().startsWith('#')) return;
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m) {
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  });
  console.log('[server-local] .env 로드 완료');
} else {
  console.warn('[server-local] .env 파일이 없습니다. .env.example 을 참고해 webapp/.env 를 만드세요.');
}

// env 설정 후 동적 import (모듈 로드 시점에 env가 필요하므로)
const { default: app } = await import('./index.js');
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`로컬 백엔드 실행: http://localhost:${PORT}`));
