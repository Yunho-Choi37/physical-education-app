# Vercel 배포 가이드

## 1. Vercel 계정 생성

1. [Vercel](https://vercel.com)에 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인 (권장)

## 2. 프로젝트 가져오기

1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 레포지토리 목록에서 `physical-education-app` 선택
3. "Import" 클릭

## 3. 프로젝트 설정

### 3.1 빌드 설정
- **Framework Preset**: Other
- **Root Directory**: `.` (루트)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: (비워두기)

### 3.2 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수들을 추가:

#### Firebase 설정 (모든 환경)
- `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `FIREBASE_CLIENT_EMAIL`: 서비스 계정 이메일 (예: `firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com`)
- `FIREBASE_PRIVATE_KEY`: 서비스 계정 비공개 키 (전체 내용, `\n` 포함)

**FIREBASE_PRIVATE_KEY 설정 시 주의사항:**
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 다운로드한 JSON 파일에서 `private_key` 값을 복사
4. **전체 내용**을 복사해야 합니다 (줄바꿈 포함)
5. Vercel 환경 변수에 붙여넣을 때 따옴표는 제거하지 마세요

예시:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

#### 기타 환경 변수
- `NODE_ENV`: `production`
- `PORT`: (비워두기, Vercel이 자동 할당)

## 4. 배포 실행

### 4.1 자동 배포 (GitHub 연동)
1. 설정 완료 후 "Deploy" 클릭
2. GitHub에 푸시하면 자동으로 재배포됩니다

### 4.2 수동 배포 (Vercel CLI)
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 디렉토리에서 배포
cd /Users/yunhochoi/Desktop/physical-education-app
vercel

# 프로덕션 배포
vercel --prod
```

## 5. 배포 후 확인

### 5.1 프론트엔드 확인
1. Vercel 대시보드에서 배포된 URL 확인 (예: `https://physical-education-app.vercel.app`)
2. 브라우저에서 접속하여 프론트엔드가 제대로 로드되는지 확인

### 5.2 API 엔드포인트 확인
```bash
# 기본 엔드포인트
curl https://your-project.vercel.app/api/

# 데이터 가져오기
curl https://your-project.vercel.app/api/data
```

### 5.3 Firestore 연결 확인
1. Firebase Console → Firestore Database
2. 데이터가 정상적으로 저장/조회되는지 확인

## 6. 프론트엔드 환경 변수 설정

프론트엔드에서 API URL을 환경 변수로 설정해야 합니다:

### 6.1 .env.production 파일 생성
`frontend/.env.production`:
```
REACT_APP_API_URL=https://your-project.vercel.app/api
```

### 6.2 코드 수정 필요
프론트엔드 코드에서 API URL을 하드코딩하지 않고 환경 변수를 사용하도록 수정:

`frontend/src/ClassDetails.tsx` 등에서:
```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

## 7. 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드 → Settings → Domains
2. 원하는 도메인 추가
3. DNS 설정에 안내된 레코드 추가

## 8. 문제 해결

### 8.1 빌드 실패
- 로그 확인: Vercel 대시보드 → Deployments → 해당 배포의 "Logs" 확인
- 의존성 오류: `package.json` 확인
- 환경 변수 확인: 모든 필수 환경 변수가 설정되었는지 확인

### 8.2 API 오류 (500 에러)
- Firestore 연결 확인: 환경 변수가 올바른지 확인
- Firebase 보안 규칙 확인: Firestore 규칙이 올바른지 확인
- 로그 확인: Vercel 함수 로그 확인

### 8.3 CORS 오류
- 백엔드 CORS 설정 확인:
```javascript
app.use(cors({
  origin: ['https://your-project.vercel.app'],
  credentials: true
}));
```

### 8.4 Firestore 연결 실패
- 환경 변수 형식 확인 (특히 `FIREBASE_PRIVATE_KEY`의 줄바꿈 문자)
- 서비스 계정 키가 올바른지 확인
- Firebase 프로젝트 ID가 올바른지 확인

## 9. 추가 리소스

- [Vercel 문서](https://vercel.com/docs)
- [Firebase 문서](https://firebase.google.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)


