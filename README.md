# 체육 교육 앱 (Physical Education App)

학생들의 활동과 특성을 원자 모델로 시각화하는 체육 교육용 웹 애플리케이션입니다.

## 기능

- **원자 모델 시각화**: 학생들을 원자 모델로 표현하여 각자의 특성과 활동을 시각화
- **양성자/중성자 편집**: 핵심 특성과 균형적 특성을 이모티콘으로 표현
- **전자 껍질 편집**: 학생들의 활동을 전자 껍질로 표현
- **활동 기록**: 학생들의 체육 활동을 기록하고 추적
- **원 모양 커스터마이징**: 색상, 이모티콘, 이미지로 원 모양 설정
- **실시간 상호작용**: 마우스 호버 및 드래그 앤 드롭 지원

## 기술 스택

### Frontend
- React 19
- TypeScript
- Bootstrap 5
- React Router
- Canvas API (애니메이션)

### Backend
- Node.js
- Express
- Google Cloud Firestore

### 배포
- Vercel (Frontend)
- Vercel Serverless Functions (Backend)

## 프로젝트 구조

```
physical-education-app/
├── frontend/          # React 프론트엔드
│   ├── src/
│   │   ├── App.tsx
│   │   ├── ClassDetails.tsx
│   │   └── StudentCustomizeModal.tsx
│   └── package.json
├── backend/           # Express 백엔드
│   ├── index.js
│   └── package.json
├── .gitignore
├── vercel.json       # Vercel 배포 설정
└── README.md
```

## 로컬 개발

### 전제 조건
- Node.js 16+ 
- npm 또는 yarn

### 설치 및 실행

1. 레포지토리 클론
```bash
git clone <repository-url>
cd physical-education-app
```

2. 백엔드 설정
```bash
cd backend
npm install
npm start
```

3. 프론트엔드 설정
```bash
cd frontend
npm install
npm start
```

4. 브라우저에서 열기
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 환경 변수 설정

### Backend (.env)
```
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

## 배포

### Vercel 배포
1. Vercel CLI 설치
```bash
npm i -g vercel
```

2. 로그인
```bash
vercel login
```

3. 배포
```bash
vercel
```

### Google Cloud Firestore 설정
1. Firebase Console에서 프로젝트 생성
2. Firestore Database 생성
3. 서비스 계정 키 다운로드
4. 환경 변수에 Firebase 설정 추가

## 라이선스

ISC

## 작성자

yunhochoi

