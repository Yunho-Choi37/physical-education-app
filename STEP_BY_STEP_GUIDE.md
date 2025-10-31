# 📋 단계별 배포 가이드 (초보자용)

이 가이드를 순서대로 따라하시면 됩니다!

---

## 🎯 전체 흐름

1. **Google Cloud Firestore 설정** (데이터베이스 만들기)
2. **GitHub에 코드 올리기** (코드 저장소 만들기)
3. **Vercel에 배포하기** (웹사이트 공개하기)

---

## 📌 1단계: Google Cloud Firestore 설정

### 1-1. Firebase Console 접속
1. 웹 브라우저에서 [https://console.firebase.google.com](https://console.firebase.google.com) 접속
2. Google 계정으로 로그인

### 1-2. Firestore Database 만들기
1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 버튼 클릭
3. 보안 규칙 선택:
   - **테스트 모드로 시작** 선택 (개발용)
   - "다음" 클릭
4. 위치 선택:
   - **asia-northeast3 (서울)** 또는 가장 가까운 리전 선택
   - "사용 설정" 클릭
5. 완료! 데이터베이스가 생성됩니다

### 1-3. 서비스 계정 키 다운로드 (중요!)
1. Firebase Console 왼쪽 하단의 ⚙️ 아이콘 클릭 → "프로젝트 설정"
2. 상단 탭에서 "서비스 계정" 클릭
3. "Firebase Admin SDK" 섹션에서 "새 비공개 키 생성" 버튼 클릭
4. 경고 창에서 "키 생성" 클릭
5. JSON 파일이 자동으로 다운로드됩니다
6. **이 파일은 절대 GitHub에 올리지 마세요!** (이미 .gitignore에 포함됨)

### 1-4. 서비스 계정 정보 확인
다운로드한 JSON 파일을 열어서 다음 정보를 확인하세요:
- `project_id`: 프로젝트 ID
- `client_email`: 이메일 주소
- `private_key`: 긴 문자열 (-----BEGIN PRIVATE KEY----- 부터 -----END PRIVATE KEY-----까지)

**이 정보는 나중에 Vercel에서 사용합니다!**

---

## 📌 2단계: GitHub에 코드 올리기

### 2-1. GitHub 레포지토리 만들기
1. 웹 브라우저에서 [https://github.com](https://github.com) 접속
2. 로그인 후 우측 상단의 "+" 버튼 클릭 → "New repository"
3. 레포지토리 정보 입력:
   - **Repository name**: `physical-education-app`
   - **Description**: `체육 교육용 원자 모델 시각화 웹 앱` (선택사항)
   - **Public** 또는 **Private** 선택
   - **README, .gitignore, license는 체크하지 않기** (이미 있으므로)
4. "Create repository" 클릭

### 2-2. 로컬에서 코드 푸시하기
터미널(Mac: Terminal, Windows: Command Prompt)을 열고 아래 명령어를 순서대로 실행:

```bash
# 1. 프로젝트 폴더로 이동
cd /Users/yunhochoi/Desktop/physical-education-app

# 2. Git 초기화 (이미 되어있을 수 있음)
git init

# 3. 모든 파일 추가
git add .

# 4. 첫 커밋
git commit -m "Initial commit: 체육 교육 앱"

# 5. 브랜치 이름을 main으로 변경
git branch -M main

# 6. GitHub 레포지토리 연결
# ⚠️ YOUR_USERNAME을 본인의 GitHub 사용자 이름으로 변경하세요!
git remote add origin https://github.com/YOUR_USERNAME/physical-education-app.git

# 7. GitHub에 푸시
git push -u origin main
```

**주의**: 6번 명령어에서 `YOUR_USERNAME`을 본인의 GitHub 사용자 이름으로 바꿔야 합니다!

**예시**: GitHub 사용자 이름이 `yunhochoi`라면:
```bash
git remote add origin https://github.com/yunhochoi/physical-education-app.git
```

### 2-3. 확인
GitHub 레포지토리 페이지를 새로고침하면 파일들이 올라간 것을 확인할 수 있습니다!

---

## 📌 3단계: Vercel에 배포하기

### 3-1. Vercel 계정 만들기
1. 웹 브라우저에서 [https://vercel.com](https://vercel.com) 접속
2. "Sign Up" 클릭
3. **"Continue with GitHub"** 선택 (GitHub 계정으로 로그인)
4. GitHub 계정 인증 허용

### 3-2. 프로젝트 가져오기
1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. GitHub 레포지토리 목록에서 `physical-education-app` 찾아서 **"Import"** 클릭

### 3-3. 프로젝트 설정
1. **Project Name**: `physical-education-app` (기본값 유지)
2. **Framework Preset**: "Other"
3. **Root Directory**: `.` (루트)
4. **Build Command**: 
   ```
   cd frontend && npm install && npm run build
   ```
5. **Output Directory**: 
   ```
   frontend/build
   ```
6. **Install Command**: (비워두기)

### 3-4. 환경 변수 설정 (중요!)
"Environment Variables" 섹션에서 다음 변수들을 추가하세요:

#### 1. Firebase 설정 (3개)
1. **FIREBASE_PROJECT_ID**
   - Key: `FIREBASE_PROJECT_ID`
   - Value: 다운로드한 JSON 파일의 `project_id` 값 (예: `l-existence-precede-l-essence`)
   - Environment: Production, Preview, Development 모두 체크

2. **FIREBASE_CLIENT_EMAIL**
   - Key: `FIREBASE_CLIENT_EMAIL`
   - Value: 다운로드한 JSON 파일의 `client_email` 값
   - Environment: Production, Preview, Development 모두 체크

3. **FIREBASE_PRIVATE_KEY**
   - Key: `FIREBASE_PRIVATE_KEY`
   - Value: 다운로드한 JSON 파일의 `private_key` 값 (**전체 내용** 복사, 줄바꿈 포함)
     - 예시: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n`
   - **주의**: 전체 문자열을 그대로 복사해야 합니다!
   - Environment: Production, Preview, Development 모두 체크

#### 2. 기타 설정 (1개)
4. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Environment: Production, Preview, Development 모두 체크

### 3-5. 배포 실행
1. 환경 변수 모두 추가 후 **"Deploy"** 버튼 클릭
2. 배포가 진행됩니다 (1-2분 소요)
3. 배포 완료 후 URL이 표시됩니다! (예: `https://physical-education-app.vercel.app`)

### 3-6. 프론트엔드 환경 변수 추가
배포가 완료된 후:

1. Vercel 대시보드에서 프로젝트 클릭
2. **Settings** → **Environment Variables** 클릭
3. 다음 변수 추가:

**REACT_APP_API_URL**
- Key: `REACT_APP_API_URL`
- Value: 배포된 Vercel URL + `/api` (예: `https://physical-education-app.vercel.app/api`)
- Environment: Production, Preview, Development 모두 체크

4. 저장 후 **배포를 다시 실행**하거나 자동으로 재배포됩니다

---

## ✅ 완료!

이제 웹사이트가 공개되었습니다!

### 확인 방법
1. Vercel 대시보드에서 배포된 URL 클릭
2. 웹사이트가 정상적으로 열리는지 확인
3. 브라우저 개발자 도구(F12) → Console 탭에서 "✅ Firebase 초기화 성공" 메시지 확인

### 문제 발생 시
- Vercel 대시보드 → Deployments → 해당 배포의 "Logs" 확인
- Firebase Console → Firestore Database에서 데이터 확인
- 환경 변수가 올바르게 설정되었는지 확인

---

## 📞 도움이 필요하신가요?

각 단계에서 막히시면:
1. 에러 메시지를 복사해 알려주세요
2. 어느 단계에서 막혔는지 알려주세요
3. 스크린샷을 보여주시면 더 정확히 도와드릴 수 있습니다!


