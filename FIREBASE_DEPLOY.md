# 🚀 Firebase Functions 배포 가이드

## ✅ 완료된 작업

1. ✅ Firebase CLI 설치
2. ✅ Firebase Functions 프로젝트 초기화
3. ✅ Express 앱을 Firebase Functions로 변환
4. ✅ 프론트엔드 설정 수정

## 📋 배포 전 확인사항

### 1. Firebase 로그인

터미널에서 실행:
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
firebase login
```

브라우저가 열리면 Google 계정으로 로그인하세요.

### 2. 프로젝트 확인

```bash
firebase projects:list
```

`l-existence-precede-l-essence` 프로젝트가 보여야 합니다.

## 🚀 배포 단계

### 1. Functions 배포

```bash
cd /Users/yunhochoi/Desktop/physical-education-app
export PATH="$HOME/.npm-global/bin:$PATH"
firebase deploy --only functions
```

### 2. 배포 완료 후 URL 확인

배포가 완료되면 다음과 같은 URL이 표시됩니다:
```
Function URL: https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api
```

### 3. 프론트엔드 환경 변수 설정

Vercel 대시보드 → 프론트엔드 프로젝트 → Settings → Environment Variables:

- **Key**: `REACT_APP_FIREBASE_FUNCTIONS_URL`
- **Value**: 배포된 Functions URL (예: `https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api`)
- **Production, Preview, Development** 모두 체크
- **Save** 클릭

### 4. 프론트엔드 재배포

환경 변수 추가 후 프론트엔드 프로젝트를 재배포하세요.

## 🔍 배포 확인

### 1. 헬스 체크

브라우저에서 접속:
```
https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api/api/health
```

응답:
```json
{
  "ok": true,
  "timestamp": 1234567890
}
```

### 2. 클래스 목록 확인

```
https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api/api/classes
```

## 📝 주요 변경사항

1. **백엔드**: Vercel 서버리스 함수 → Firebase Functions
2. **프론트엔드**: `REACT_APP_API_URL` → `REACT_APP_FIREBASE_FUNCTIONS_URL`
3. **배포**: `vercel deploy` → `firebase deploy --only functions`

## 🎯 장점

1. ✅ Vercel 백엔드 연결 문제 해결
2. ✅ Firebase 생태계 통합
3. ✅ 간단한 배포
4. ✅ 자동 CORS 처리
5. ✅ 비용 효율적

## ⚠️ 주의사항

- Firebase Functions URL은 `/api/api/...` 형식입니다 (Express 앱의 `/api/...` 라우트 때문)
- 로컬 개발 시 Firebase Emulator 사용 가능: `firebase emulators:start`

