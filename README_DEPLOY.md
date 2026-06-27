# 고객관리 CRM — 모바일 웹앱 배포 가이드

기존 Electron 데스크톱 앱을 **모바일 웹앱(PWA)** 으로 이식한 버전입니다.
- **프론트엔드**: React + Vite (모바일 하단 탭 내비, PWA 설치 지원)
- **백엔드**: Vercel 서버리스 함수 (Express, `api/` 폴더)
- **DB**: Supabase (PostgreSQL) — 기존 SQLite 데이터를 그대로 이전
- **AI**: Claude(Anthropic) API — 고객 요약/추천/액션 제안

모두 **무료 요금제**로 운영할 수 있습니다. (AI는 사용량만큼 소액 과금 / 키 없으면 자동 비활성)

---

## 0. 준비물 (모두 무료 가입)
1. [GitHub](https://github.com) 계정 (코드 업로드용)
2. [Supabase](https://supabase.com) 계정 (데이터베이스)
3. [Vercel](https://vercel.com) 계정 (배포)
4. (선택) [Anthropic Console](https://console.anthropic.com) — AI 기능용 API 키

---

## 1. Supabase 데이터베이스 만들기

1. Supabase 에서 **New project** 생성 (Region 은 `Northeast Asia (Seoul)` 권장).
2. 좌측 메뉴 **SQL Editor** → **New query** 에 `supabase/schema.sql` 내용을 붙여넣고 **Run**.
3. 다시 New query 에 `supabase/seed.sql` 내용을 붙여넣고 **Run**. (현재 데이터 = 고객 100, 상품 5, 판매 300건이 들어갑니다.)
4. **연결 문자열 복사**: 좌측 하단 **Project Settings → Database → Connection string → URI** 탭.
   - 서버리스(Vercel)에서는 반드시 **Transaction pooler** (포트 `6543`) 주소를 사용하세요.
   - `[YOUR-PASSWORD]` 부분을 프로젝트 비밀번호로 교체한 전체 문자열이 `DATABASE_URL` 입니다.

> 데이터를 새로 시작하고 싶으면 seed.sql 을 건너뛰고 schema.sql 만 실행하세요.
> 그래도 관리자 코드 `0000` 으로 로그인할 수 있습니다.

---

## 2. (선택) AI 키 발급

[Anthropic Console](https://console.anthropic.com) → **API Keys** 에서 키를 발급받습니다.
- 키를 설정하지 않아도 앱은 정상 동작하며, AI 버튼만 "설정 필요" 안내를 띄웁니다.
- 모델은 기본 `claude-haiku-4-5` (가장 저렴). 환경변수로 변경 가능.

---

## 3. Vercel 에 배포하기

### 방법 A — GitHub 연동 (권장)
1. 이 `webapp` 폴더를 GitHub 저장소에 올립니다.
   (저장소 루트가 곧 webapp 폴더가 되도록 올리는 것이 가장 간단합니다.)
2. Vercel → **Add New → Project** → 해당 저장소 Import.
3. **Framework Preset**: Vite 자동 인식. (webapp 을 하위 폴더로 올렸다면 **Root Directory** 를 `webapp` 으로 지정)
4. **Environment Variables** 에 아래를 추가:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | 1번에서 복사한 Supabase pooler URI |
   | `ANTHROPIC_API_KEY` | (선택) Anthropic 키 |
   | `ANTHROPIC_MODEL` | (선택) `claude-haiku-4-5` |

5. **Deploy** 클릭 → 1~2분 후 `https://<프로젝트>.vercel.app` 주소가 생성됩니다.

### 방법 B — Vercel CLI
```bash
npm i -g vercel
cd webapp
vercel            # 최초 1회 프로젝트 연결
vercel env add DATABASE_URL          # 값 입력
vercel env add ANTHROPIC_API_KEY     # (선택)
vercel --prod     # 운영 배포
```

---

## 4. 휴대폰에서 앱처럼 설치하기 (PWA)
- 배포된 주소를 휴대폰 브라우저로 엽니다.
- **iPhone(Safari)**: 공유 → "홈 화면에 추가"
- **Android(Chrome)**: 메뉴(⋮) → "앱 설치" / "홈 화면에 추가"
- 설치하면 주소창 없는 전체화면 앱으로 실행됩니다.

---

## 5. 로그인 정보
- 일반 로그인: **admin / admin123**
- 관리자 코드 로그인: **0000**
- (설정 메뉴에서 계정 추가 / 브랜드명 변경 가능)

---

## 6. 로컬에서 개발/테스트
```bash
cd webapp
npm install
cp .env.example .env      # .env 에 DATABASE_URL, ANTHROPIC_API_KEY 입력

# 터미널 1 - 백엔드(3001)
npm run server
# 터미널 2 - 프론트(5173, /api 는 3001로 프록시됨)
npm run dev
```
브라우저에서 http://localhost:5173 접속.

---

## 7. 폴더 구조
```
webapp/
├─ api/                  # Vercel 서버리스 (Express)
│  ├─ index.js           # 모든 /api 라우트
│  ├─ db.js              # Postgres 연결 풀
│  ├─ ai.js              # Claude 호출 (요약/추천)
│  └─ server-local.js    # 로컬 개발용 진입점
├─ src/                  # React 프론트엔드
│  ├─ pages/             # 대시보드/고객/판매/세일즈포인트 등
│  └─ components/        # Layout(모바일 내비), AiInsightButton
├─ supabase/
│  ├─ schema.sql         # 테이블 정의 (먼저 실행)
│  └─ seed.sql           # 현재 데이터 (그 다음 실행)
├─ vercel.json           # /api 라우팅 + 빌드 설정
├─ .env.example          # 환경변수 예시
└─ package.json
```

## 8. AI 기능 위치
- **대시보드**: "AI 월간 요약" — 해당 월 실적 분석 + 다음 달 액션
- **세일즈포인트**: "AI 액션 제안" — 오늘 우선 연락할 고객 + 캠페인 아이디어
- **구매이력**: "AI 추천/응대 가이드" — 고객별 맞춤 추천 제품 + 응대 메시지
