# 배포 가이드 (Deployment Guide)

이 가이드는 체육 교육 앱을 Google Cloud Firestore, GitHub, Vercel에 배포하는 방법을 설명합니다.

## 1. Google Cloud Firestore 설정

### 1.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `physical-education-app`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### 1.2 Firestore Database 생성
1. Firebase Console에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 모드 선택:
   - **테스트 모드**: 개발 단계에서는 허용, 프로덕션에서는 제한 필요
   - **프로덕션 모드**: 즉시 보안 규칙 적용 권장
4. 위치 선택 (가장 가까운 리전 선택)
5. 데이터베이스 생성 완료

### 1.3 서비스 계정 키 생성
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. 파일을 `backend/serviceAccountKey.json`으로 저장 (로컬 개발용)
5. **주의**: 이 파일은 절대 Git에 커밋하지 마세요!

### 1.4 Firestore 보안 규칙 설정
Firebase Console → Firestore Database → 규칙 탭에서:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 개발 환경: 모두 허용 (주의: 프로덕션에서는 제한 필요)
    match /{document=**} {
      allow read, write: if true;
    }
    
    // 프로덕션 환경 (예시):
    // match /students/{studentId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null && request.auth.token.admin == true;
    // }
  }
}
```

## 2. GitHub 레포지토리 설정

### 2.1 Git 초기화
```bash
cd /Users/yunhochoi/Desktop/physical-education-app
git init
git add .
git commit -m "Initial commit"
```

### 2.2 GitHub 레포지토리 생성
1. [GitHub](https://github.com)에 로그인
2. "New repository" 클릭
3. Repository name 입력 (예: `physical-education-app`)
4. Public 또는 Private 선택
5. "Create repository" 클릭

### 2.3 원격 저장소 연결 및 푸시
```bash
git remote add origin https://github.com/YOUR_USERNAME/physical-education-app.git
git branch -M main
git push -u origin main
```

## 3. 백엔드 Firestore 마이그레이션

### 3.1 Firebase Admin SDK 설치
```bash
cd backend
npm install firebase-admin
```

### 3.2 환경 변수 설정
`.env` 파일 생성:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3.3 백엔드 코드 수정
`backend/index.js`를 Firestore를 사용하도록 수정 (별도 파일 참조)

## 4. Vercel 배포 설정

### 4.1 Vercel 계정 생성
1. [Vercel](https://vercel.com)에 접속
2. GitHub 계정으로 로그인

### 4.2 프로젝트 가져오기
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 레포지토리 선택
3. 프로젝트 설정:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (루트)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`

### 4.3 환경 변수 설정
Vercel 대시보드 → Settings → Environment Variables에서:

**Production 환경:**
- `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `FIREBASE_CLIENT_EMAIL`: 서비스 계정 이메일
- `FIREBASE_PRIVATE_KEY`: 서비스 계정 비공개 키 (전체 내용)
- `NODE_ENV`: `production`
- `PORT`: `3001` (또는 Vercel이 자동 할당)

### 4.4 배포 실행
```bash
# Vercel CLI 사용
npm i -g vercel
vercel login
vercel
```

또는 GitHub에 푸시하면 자동으로 배포됩니다.

## 5. 프론트엔드 환경 변수 설정

### 5.1 Firebase 웹 설정 가져오기
1. Firebase Console → 프로젝트 설정 → 일반
2. "내 앱" 섹션에서 웹 앱 추가 (⚙️ 아이콘 클릭)
3. Firebase SDK 구성 복사

### 5.2 환경 변수 파일 생성
`frontend/.env.production`:
```
REACT_APP_API_URL=https://your-vercel-url.vercel.app/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

## 6. 배포 후 확인

### 6.1 API 엔드포인트 확인
```bash
curl https://your-vercel-url.vercel.app/api/data
```

### 6.2 Firestore 데이터 확인
Firebase Console → Firestore Database에서 데이터 확인

## 7. 문제 해결

### 7.1 CORS 오류
백엔드의 CORS 설정이 올바른지 확인:
```javascript
app.use(cors({
  origin: ['https://your-vercel-url.vercel.app'],
  credentials: true
}));
```

### 7.2 환경 변수 오류
- Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- 환경 변수 이름이 정확한지 확인 (대소문자 구분)

### 7.3 Firestore 연결 오류
- 서비스 계정 키가 올바른지 확인
- Firestore 보안 규칙이 올바른지 확인
- 프로젝트 ID가 정확한지 확인

## 8. 추가 리소스

- [Firebase 문서](https://firebase.google.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)

