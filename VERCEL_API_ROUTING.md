# 🔍 Vercel 서버리스 함수 라우팅 확인

## ✅ Root Directory 설정

**올바른 설정:**
- Root Directory: `api` (슬래시 없음) ✅

**잘못된 설정:**
- Root Directory: `/api` (슬래시 있음) ❌

## 🔄 Vercel 서버리스 함수 라우팅 방식

### 시나리오 1: Root Directory가 `api`인 경우

```
프로젝트 구조:
/api/index.js  (Root Directory가 api이므로, 이 파일이 루트의 index.js가 됨)
```

**Vercel 라우팅:**
- `https://existence37.vercel.app/api/index` → `api/index.js` 실행
- `https://existence37.vercel.app/api/classes` → Express 앱의 `/api/classes` 라우트 처리 ✅

**Express 앱 내부 라우트:**
- `app.get('/api/classes', ...)` → 실제 접근: `/api/classes` ✅

### 시나리오 2: Root Directory가 루트인 경우

```
프로젝트 구조:
api/index.js
```

**Vercel 라우팅:**
- `https://existence37.vercel.app/api/index` → `api/index.js` 실행
- `https://existence37.vercel.app/api/classes` → Express 앱의 `/api/classes` 라우트 처리 ✅

## 🎯 현재 설정 확인

백엔드 프로젝트 (existence37)의 Vercel 설정:

1. **Settings → General → Root Directory**: `api` 확인
2. **Settings → Build & Development Settings**:
   - Build Command: 비워둠
   - Output Directory: 비워둠

## 🔍 문제 진단

백엔드 서버에 접속이 안 되는 경우:

### 1. 헬스 체크 테스트

브라우저에서 직접 접속:
```
https://existence37.vercel.app/api/health
```

**예상 응답:**
```json
{
  "ok": true,
  "timestamp": 1234567890
}
```

**응답이 없으면:**
- 배포가 실패했거나
- 서버리스 함수가 제대로 작동하지 않음

### 2. Functions 탭 확인

Vercel 대시보드 → 백엔드 프로젝트 → **Functions** 탭:
- `/api/index` 함수가 있는지 확인
- 함수를 클릭하여 **Logs** 확인
- 에러 메시지 확인

### 3. 배포 상태 확인

Vercel 대시보드 → **Deployments** 탭:
- 최신 배포가 성공했는지 확인
- 배포 로그에서 에러 확인

### 4. 환경 변수 확인

Vercel 대시보드 → **Settings → Environment Variables**:
- `FIREBASE_SERVICE_ACCOUNT_JSON`이 설정되어 있는지 확인
- 값이 올바른 JSON 형식인지 확인

## 🐛 일반적인 문제들

### 문제 1: Root Directory가 `/api`로 설정됨

**증상:** 배포 실패 또는 함수를 찾을 수 없음

**해결:** Root Directory를 `api`로 변경 (슬래시 제거)

### 문제 2: Firebase 환경 변수 미설정

**증상:** Functions 로그에 "Firestore 연결 실패" 메시지

**해결:** `FIREBASE_SERVICE_ACCOUNT_JSON` 환경 변수 설정

### 문제 3: Build Command가 설정됨

**증상:** 불필요한 빌드 시도로 인한 에러

**해결:** Build Command 비워둠 (서버리스 함수는 빌드 불필요)

## ✅ 확인 체크리스트

- [ ] Root Directory가 `api`로 설정되어 있는가? (슬래시 없음)
- [ ] Build Command가 비어있는가?
- [ ] Output Directory가 비어있는가?
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` 환경 변수가 설정되어 있는가?
- [ ] 최신 배포가 성공했는가?
- [ ] Functions 탭에 `/api/index` 함수가 있는가?
- [ ] `https://existence37.vercel.app/api/health`에 접속 가능한가?

