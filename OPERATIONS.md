# 작업 지시서 (운영/수정/배포 가이드)

이 문서는 **앞으로 이 앱을 고치고 다시 배포할 때** 그대로 따라 하면 되는 안내서입니다.
Claude(나)에게 일을 시킬 때, 사람이 직접 할 때 모두 이 문서를 기준으로 합니다.

---

## 0. 한 줄 요약 (Claude에게 시키는 법)
> **"webapp 폴더에서 〇〇 수정하고 배포해줘"**

라고만 하면 Claude가 아래를 자동으로 수행합니다:
1. 해당 파일 수정
2. `npm run build` 로 빌드 오류 없는지 확인
3. `git add → commit → push`
4. push 되면 **Vercel이 자동으로 재배포** (1~2분)
5. 배포 주소로 실제 동작 확인 후 결과 보고

즉, 사람은 "무엇을 바꿀지"만 말하면 됩니다.

---

## 1. 기본 정보 (바뀌면 여기 갱신)
| 항목 | 값 |
|---|---|
| 작업 폴더 | `C:\Users\g8058\OneDrive\바탕 화면\고객관리프로그램\webapp` |
| 라이브 주소 | https://cosmetics-crm-three.vercel.app/ |
| GitHub 저장소 | https://github.com/zerlho91/cosmetics-crm (private) |
| 호스팅 | Vercel (zerlho91 GitHub 연결, push 시 자동 배포) |
| 데이터베이스 | Supabase (project ref: `sgmnkmxemwgwmtcbizno`) |
| 로그인 | 관리자코드 `0000` 또는 `admin` / `admin123` |
| 환경변수(Vercel) | `DATABASE_URL` (필수), `ANTHROPIC_API_KEY`(선택) |

---

## 2. 수정 → 배포 절차 (수동으로 할 때)
webapp 폴더에서 PowerShell 기준:

```powershell
cd "C:\Users\g8058\OneDrive\바탕 화면\고객관리프로그램\webapp"

# 1) (선택) 로컬에서 미리 확인
npm install        # 최초 1회 또는 패키지 변경 시
npm run server     # 터미널 A: 백엔드(3001) - .env의 DATABASE_URL 사용
npm run dev        # 터미널 B: 프론트(5173)
#  → http://localhost:5173 에서 확인

# 2) 빌드 점검 (배포 전 필수)
npm run build      # 오류 없이 "built in ..." 나오면 OK

# 3) 배포 (git push → Vercel 자동 재배포)
git add -A
git commit -m "수정 내용 요약"
git push
#  → 1~2분 뒤 라이브 주소에 반영됨
```

> Vercel 대시보드 > Deployments 에서 진행 상황과 성공/실패를 볼 수 있습니다.

---

## 3. .env 파일 (로컬 테스트용 비밀 보관)
- 위치: `webapp\.env`  (이미 생성해 둠, **git에 안 올라감**)
- 비밀번호를 몰라도 됩니다. 이 파일에 DB 주소가 이미 들어 있어 로컬에서 바로 실제 DB로 테스트됩니다.
- AI 키를 로컬에서도 쓰고 싶으면 `ANTHROPIC_API_KEY=` 뒤에 키만 붙여 넣으면 됩니다.
- ⚠️ 로컬에서 `npm run server` 로 띄우면 **실제 운영 DB에 연결**됩니다. 데이터 추가/삭제 테스트는 주의하세요.
  (운영 DB를 건드리기 싫으면 `.env`의 `DATABASE_URL` 한 줄을 잠깐 `#` 처리하면 → 내장 임시 DB(pglite)로 동작)

---

## 4. 환경변수가 바뀔 때 (예: DB 비밀번호 교체)
1. Supabase 에서 비밀번호 변경 → 새 연결주소 확보
2. **Vercel** > 프로젝트 > Settings > Environment Variables > `DATABASE_URL` 수정 > Save
3. Vercel > Deployments > 최신 배포 ⋯ > **Redeploy** (환경변수는 재배포해야 적용)
4. 로컬 `webapp\.env` 의 `DATABASE_URL` 도 같은 값으로 갱신

---

## 5. 문제가 생겼을 때 (롤백)
- Vercel > Deployments 목록에서 **이전에 잘 되던 배포** 선택 > ⋯ > **Promote to Production**
- 즉시 이전 버전으로 되돌아갑니다. (코드는 그대로 두고 운영만 롤백)

---

## 6. 폴더 구조 (어디를 고치면 무엇이 바뀌나)
```
webapp/
├─ src/pages/         # 각 화면 (대시보드, 고객, 판매, 세일즈포인트, 뉴스, 설정 ...)
├─ src/components/     # Layout(메뉴/모바일 탭), AiInsightButton(AI 버튼)
├─ src/api.js          # 프론트 → 서버 통신 설정
├─ api/index.js        # 모든 백엔드 API (서버리스)
├─ api/ai.js           # AI(Claude) 프롬프트/호출
├─ api/db.js           # DB 연결 (운영=Supabase / 로컬 .env 없으면 임시DB)
├─ supabase/           # schema.sql(테이블), seed.sql(초기데이터)
├─ .env                # 로컬 비밀(미공개)
└─ ROADMAP.md          # 향후 업그레이드 플랜
```

자주 하는 수정 예시:
- "상품 목록 화면 디자인 바꿔줘" → `src/pages/ProductList.jsx`
- "새 API 추가해줘" → `api/index.js`
- "AI 답변 말투 바꿔줘" → `api/ai.js`
- "메뉴 항목 추가/이름 변경" → `src/components/Layout.jsx` + `src/App.jsx`

---

## 7. 주의사항
- `node_modules`, `dist`, `.env` 는 git에 올리지 않습니다(.gitignore).
- DB 스키마(테이블 구조)를 바꾸면 → `supabase/schema.sql` 갱신 + **Supabase SQL Editor에서 직접 반영** 필요 (코드만 바꾼다고 운영 DB 테이블이 바뀌지 않음).
- 큰 변경 전에는 `npm run build` 로 꼭 확인 후 push.
