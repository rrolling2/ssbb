# 속마음 - 독립 웹앱 버전

Claude 계정 없이도 누구나 이메일로 가입해서 쓸 수 있는, 완전히 독립된 버전이에요.

```
web-app/
  server/   ← 백엔드 (인증, 회원 DB, AI 프록시)
  web/      ← 프론트엔드 (정적 파일, 어디든 호스팅 가능)
```

## 이전 버전과 무엇이 다른가요

| | Claude 아티팩트 버전 | 이 독립 웹앱 버전 |
|---|---|---|
| 회원 데이터 | Claude 계정에 종속된 저장소 | 백엔드 자체 DB (`server/data/db.json`) |
| 로그인 | Claude를 쓰는 사람만 | 이메일만 있으면 누구나 |
| AI 호출 | Claude가 대신 처리 | 백엔드가 서버에 보관한 API 키로 직접 호출 |
| 실행 위치 | claude.ai 안에서만 | 아무 웹 호스팅에나 배포 가능 |

## 1. 백엔드 실행

```bash
cd server
npm install
cp .env.example .env
```

`.env`를 열어 채워주세요:
- `JWT_SECRET` — 아무도 못 맞출 긴 임의 문자열
- `SMTP_*` — 이메일 발송용 (Gmail 앱 비밀번호 추천, server/README 이전 버전 참고)
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)에서 발급. **절대 프론트엔드에 넣지 마세요**
- `ALLOWED_ORIGIN` — 프론트엔드가 실제로 열리는 주소 (로컬 테스트면 아래 2번 참고)

```bash
npm start
```
`http://localhost:3001/health` → `{"ok":true}` 확인되면 성공.

## 2. 프론트엔드 실행 (로컬 테스트)

`web/index.html`을 그냥 더블클릭해서 열면 `file://` 프로토콜이라 fetch가 막혀요. 간단한 정적 서버로 띄워주세요.

```bash
cd web
npm install
npm start
# (package.json 없이 바로 띄우고 싶다면: npx serve -l 5500 또는 python3 -m http.server 5500)
```

`http://localhost:5500`으로 접속하고, 서버 `.env`의 `ALLOWED_ORIGIN=http://localhost:5500`으로 맞춰주세요.

## 3. 실제 배포

**백엔드** — Render / Railway / Fly.io 등
1. `server` 폴더를 깃허브 레포로
2. Build: `npm install`, Start: `npm start`
3. `.env` 값들을 환경변수로 등록 (`NODE_ENV=production` 포함 — 쿠키가 `Secure`로 전송되려면 필요해요, HTTPS 필수)

**프론트엔드** — Vercel / Netlify / Cloudflare Pages 등 (정적 파일이라 어디든 가능)
1. `web` 폴더를 그대로 배포
2. `index.html`의 `window.SOKMAEUM_API_BASE`를 배포된 백엔드 주소로 변경
3. 백엔드 `.env`의 `ALLOWED_ORIGIN`을 이 프론트엔드의 실제 주소로 변경 (배포 순서상 백엔드를 나중에 한 번 더 업데이트해야 할 수 있어요)

## 4. 크레딧 시스템 (CHAT)

AI가 실제로 대사를 생성하는 순간에만 크레딧이 소모돼요. (사람과 사람 사이의 순수 대화 기능을 나중에 추가하더라도, 그 경로는 크레딧을 차감하지 않도록 설계돼 있어요 — `/api/ai/complete`를 거치는 호출만 과금 대상이에요.)

- 신규 가입 시 기본 **30 CHAT** 지급
- AI 대화 한 라운드(기본 **8턴**)를 시작할 때 **15 CHAT** 선차감 (그 라운드 안의 턴 생성 + 케미 스코어 판정까지 포함)
- 일시정지 후 이어서 재생해도 같은 라운드면 추가로 차감되지 않아요
- 크레딧이 부족하면 "대화 시작" 버튼이 비활성화되고 안내 문구가 떠요 (결제 페이지는 다음 단계에서 연결)

이 세 수치(가입 크레딧 / 라운드당 소모량 / 라운드당 턴 수)는 전부 **관리자 페이지**에서 실시간으로 조절할 수 있어요.

## 5. 관리자 페이지

`web/admin.html`로 접속하면 별도의 관리자 대시보드가 떠요.

1. `server/.env`의 `ADMIN_EMAILS`에 본인 이메일을 등록
2. `admin.html`에서 그 이메일로 로그인 (일반 회원가입과 동일한 이메일 인증 방식)
3. 로그인하면:
   - 크레딧 설정(가입 보너스 / 라운드당 소모량 / 라운드당 턴 수) 수정
   - 전체 통계(회원 수, 누적 지급/소비 CHAT, 진행된 라운드 수)
   - 회원별 크레딧 조회 및 수동 지급·차감

관리자로 등록되지 않은 이메일로 로그인하면 "관리자 권한이 없어요" 화면이 떠요 — `ADMIN_EMAILS`만 관리하면 되고 별도의 관리자 회원가입 절차는 없어요.

## 참고 · 한계

- 회원 DB가 JSON 파일 기반이에요. 사용자가 많아지면 PostgreSQL 등으로 옮기는 걸 권장해요 (`server/src/db.js`의 함수 시그니처만 유지하면 다른 파일은 안 건드려도 돼요).
- 세션은 JWT + httpOnly 쿠키예요. 프론트/백엔드가 서로 다른 도메인이면 `SameSite=None; Secure`가 필요해서 **반드시 HTTPS** 환경이어야 해요.
- AI 대화 비용은 이 백엔드의 `ANTHROPIC_API_KEY`로 청구돼요. 로그인한 사용자만 호출 가능하도록 막아뒀지만, 실서비스라면 사용자별 호출 횟수 제한도 추가하는 걸 권장해요.
- 지금 프론트엔드는 빌드 과정 없이 브라우저에서 Babel로 즉석 변환하는 방식이에요. 빠르게 띄우기엔 좋지만, 트래픽이 늘면 Vite 등으로 정식 빌드하는 걸 권장해요.
