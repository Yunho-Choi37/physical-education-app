# 🔥 Firebase Functions로 백엔드 전환 가이드

## ✅ Firebase Functions의 장점

1. **Vercel 연결 문제 해결**: 별도 백엔드 프로젝트 불필요
2. **Firebase 생태계 통합**: Firestore, Auth 등과 자연스럽게 통합
3. **간단한 배포**: `firebase deploy` 한 번으로 배포
4. **CORS 자동 처리**: Firebase Functions는 CORS를 자동으로 처리
5. **비용 효율적**: 무료 티어 제공

## 📋 전환 단계

### 1. Firebase CLI 설치 및 초기화

```bash
# Firebase CLI 설치 (전역)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 루트에서 Firebase 초기화
firebase init functions
```

초기화 시 선택:
- **Language**: JavaScript 또는 TypeScript
- **ESLint**: Yes (권장)
- **Dependencies 설치**: Yes

### 2. 프로젝트 구조

```
physical-education-app/
├── functions/
│   ├── index.js (또는 index.ts)
│   ├── package.json
│   └── node_modules/
├── frontend/
└── firebase.json
```

### 3. Express 앱을 Firebase Functions로 변환

`functions/index.js` 파일 생성:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Firebase Admin 초기화
admin.initializeApp();

const app = express();

// CORS 설정
app.use(cors({ origin: true }));

// 기존 Express 라우트들 복사
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.get('/classes', async (req, res) => {
  // Firestore에서 데이터 가져오기
  const db = admin.firestore();
  // ... 기존 로직
});

// Firebase Functions로 export
exports.api = functions.https.onRequest(app);
```

### 4. Firebase Functions URL

배포 후 URL 형식:
```
https://[region]-[project-id].cloudfunctions.net/api
```

예:
```
https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api
```

### 5. 프론트엔드 설정 변경

`frontend/src/config.ts` 수정:

```typescript
export const getApiUrl = (): string => {
  // Firebase Functions URL 사용
  if (process.env.REACT_APP_FIREBASE_FUNCTIONS_URL) {
    return process.env.REACT_APP_FIREBASE_FUNCTIONS_URL;
  }
  
  // 기본값 (로컬 개발용)
  return 'http://localhost:5001/l-existence-precede-l-essence/us-central1/api';
};
```

### 6. 배포

```bash
# Functions만 배포
firebase deploy --only functions

# 또는 전체 배포
firebase deploy
```

## 🔧 기존 Express 앱 마이그레이션

### 단계별 마이그레이션

1. **`api/index.js`의 Express 라우트들을 `functions/index.js`로 복사**
2. **Firebase Admin SDK는 이미 초기화되어 있으므로 그대로 사용**
3. **환경 변수는 Firebase Functions Config로 설정**

```bash
# 환경 변수 설정
firebase functions:config:set firebase.project_id="l-existence-precede-l-essence"
```

## 📝 Firebase Functions 설정

### `firebase.json` 예시

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### `functions/package.json` 예시

```json
{
  "name": "functions",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

## 🎯 장점 요약

1. **단일 프로젝트**: 프론트엔드와 백엔드가 같은 Firebase 프로젝트
2. **간단한 배포**: `firebase deploy` 한 번으로 모든 것 배포
3. **자동 CORS**: Firebase Functions가 CORS 자동 처리
4. **통합 관리**: Firebase Console에서 모든 것 관리
5. **비용 효율**: 무료 티어 제공

## ⚠️ 주의사항

1. **Cold Start**: 첫 요청이 느릴 수 있음 (서버리스 특성)
2. **타임아웃**: 기본 60초, 최대 540초
3. **메모리**: 기본 256MB, 최대 8GB

## 🚀 다음 단계

1. Firebase CLI 설치 및 초기화
2. `functions` 폴더 생성 및 Express 앱 마이그레이션
3. Firebase Functions로 배포
4. 프론트엔드에서 Firebase Functions URL 사용

