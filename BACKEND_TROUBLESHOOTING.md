# 🔧 백엔드 서버 접속 불가 문제 해결

## 🔴 가능한 원인들

### 1. Vercel 프로젝트 설정 문제

백엔드 프로젝트 (existence37)의 Vercel 설정 확인:

#### Settings → General:
- **Root Directory**: `api` ✅ (반드시 `api`로 설정)
- **Framework Preset**: Other 또는 Auto-detect

#### Settings → Build & Development Settings:
- **Install Command**: `npm install` (또는 비워둠)
- **Build Command**: (비워둠 - 서버리스 함수는 빌드 불필요)
- **Output Directory**: (비워둠)

### 2. Firebase 환경 변수 미설정

백엔드 프로젝트의 **Settings → Environment Variables**에서:

- **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`
- **Value**: Firebase 서비스 계정 JSON 전체 (한 줄로)
- **Production, Preview, Development** 모두 체크

환경 변수가 없으면 서버가 시작되지 않습니다.

### 3. 서버리스 함수 경로 문제

Vercel에서 Express 앱을 서버리스 함수로 사용할 때:
- 파일 위치: `api/index.js`
- 접근 경로: `https://existence37.vercel.app/api/*`
- Express 앱 내부 라우트: `/api/classes` → 실제 접근: `/api/api/classes` ❌

**해결 방법**: Express 앱의 라우트를 `/api` 없이 정의하거나, Vercel의 rewrites 사용

### 4. 배포 상태 확인

Vercel 대시보드에서:
1. **Deployments** 탭 확인
2. 최신 배포가 성공했는지 확인
3. Functions 탭에서 `/api/index` 함수가 있는지 확인
4. 함수 로그 확인 (에러 메시지 확인)

## ✅ 해결 방법

### 방법 1: Vercel 프로젝트 설정 확인 및 수정

1. Vercel 대시보드 → 백엔드 프로젝트 (existence37)
2. **Settings → General → Root Directory**: `api` 확인
3. **Settings → Build & Development Settings**:
   - Build Command: 비워둠
   - Output Directory: 비워둠
4. **Settings → Environment Variables**: `FIREBASE_SERVICE_ACCOUNT_JSON` 확인
5. **Deployments** → 최신 배포 → **Redeploy**

### 방법 2: 헬스 체크 엔드포인트 테스트

브라우저에서 직접 접속:
- `https://existence37.vercel.app/api/health`
- `https://existence37.vercel.app/`

응답이 없으면:
- 배포가 실패했거나
- 서버리스 함수가 제대로 작동하지 않음

### 방법 3: Functions 로그 확인

Vercel 대시보드 → 백엔드 프로젝트 → **Functions** 탭:
- `/api/index` 함수 클릭
- **Logs** 탭에서 에러 메시지 확인
- Firebase 연결 실패 메시지가 있는지 확인

### 방법 4: Express 라우트 경로 수정

현재 Express 앱이 `/api/classes` 같은 경로를 사용하는데, Vercel 서버리스 함수는 이미 `/api/` 경로에 있으므로:
- 실제 접근 경로: `https://existence37.vercel.app/api/api/classes` ❌
- 올바른 접근 경로: `https://existence37.vercel.app/api/classes` ✅

**해결**: Express 앱의 라우트를 `/api` 없이 정의하거나, Vercel의 rewrites 사용

## 🔍 디버깅 체크리스트

- [ ] Root Directory가 `api`로 설정되어 있는가?
- [ ] Build Command가 비어있는가?
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` 환경 변수가 설정되어 있는가?
- [ ] 최신 배포가 성공했는가?
- [ ] Functions 탭에 `/api/index` 함수가 있는가?
- [ ] Functions 로그에 에러가 있는가?
- [ ] `https://existence37.vercel.app/api/health`에 접속 가능한가?

## 📞 다음 단계

위 항목들을 확인한 후, 문제가 지속되면:
1. Functions 로그의 실제 에러 메시지 확인
2. 배포 로그 확인
3. 환경 변수 값 확인 (JSON 형식이 올바른지)

