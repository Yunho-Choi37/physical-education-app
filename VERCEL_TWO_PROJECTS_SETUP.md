# 🚀 Vercel 두 개 프로젝트 분리 배포 가이드

**가장 안전한 방법**: API와 프론트엔드를 **별도의 프로젝트**로 분리 배포합니다!

---

## 📋 현재 상황

- ✅ **프론트엔드 프로젝트**: 이미 생성 및 배포 중
- ⬜ **API 프로젝트**: 별도로 생성해야 함

---

## 🎯 두 개의 프로젝트 구조

### **1. API 프로젝트** (`api/` 폴더)
- **역할**: Firebase Firestore와 통신하는 Serverless Functions
- **URL**: `https://your-api.vercel.app`
- **환경 변수**: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

### **2. 프론트엔드 프로젝트** (`frontend/` 폴더)
- **역할**: React 앱
- **URL**: `https://your-frontend.vercel.app`
- **환경 변수**: REACT_APP_API_URL (API 프로젝트의 URL)

---

## 🔧 API 프로젝트 생성 방법

### **1단계: 새 프로젝트 생성**

1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. GitHub 저장소 선택:
   - 저장소: `Yunho-Choi37/physical-education-app`
   - Branch: `main`

### **2단계: 프로젝트 설정**

**프로젝트 설정 화면에서:**

✅ **Project Name**: `physical-education-api` (원하는 이름)

✅ **Framework Preset**: **"Other"** 또는 **"Node.js"** 선택
   - API는 Serverless Functions이므로 React가 아닙니다!

✅ **Root Directory**: **`api`** 선택 (중요!)
   - 이게 가장 중요합니다!
   - 루트가 아닌 `api` 폴더를 루트로 사용합니다

✅ **Build Command**: 비워두기 또는 `echo "No build needed"`
   - API는 Serverless Functions이므로 빌드가 필요 없습니다!

✅ **Output Directory**: 비워두기

✅ **Install Command**: `npm install` (기본값)

✅ **Development Command**: 비워두기

### **3단계: 환경 변수 설정**

**배포 시작 후 (또는 배포 완료 후):**

1. **프로젝트 선택** → **Settings** → **Environment Variables**
2. 다음 3개 환경 변수 추가 (이미 알고 계신 값들):
   - `FIREBASE_PROJECT_ID`: `l-existence-precede-l-essence`
   - `FIREBASE_CLIENT_EMAIL`: `firebase-adminsdk-fbsvc@l-existence-precede-l-essence.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY`: (JSON 파일의 private_key 전체 내용)
3. 각 환경 변수에 **Production, Preview, Development 모두 선택**
4. **Save** 클릭

### **4단계: 배포 및 URL 확인**

1. **"Deploy"** 버튼 클릭
2. 배포 완료까지 대기 (1-2분)
3. **Settings** → **Domains**에서 API URL 확인
   - 예: `https://physical-education-api.vercel.app`
   - 이 URL을 메모하세요! 프론트엔드에서 사용합니다!

---

## 🔧 프론트엔드 프로젝트 설정 확인

### **프론트엔드 프로젝트 확인:**

1. **프론트엔드 프로젝트** 선택
2. **Settings** → **General**에서:
   - ✅ **Root Directory**: `frontend`
   - ✅ **Framework Preset**: `Create React App`
   - ✅ **Build Command**: `npm run build` (⚠️ `cd frontend && ...` 없이!)
   - ✅ **Output Directory**: `build`

### **프론트엔드 환경 변수 설정:**

1. **Settings** → **Environment Variables**
2. `REACT_APP_API_URL` 환경 변수 추가:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: 위에서 확인한 API URL (예: `https://physical-education-api.vercel.app`)
   - **Environment**: Production, Preview, Development 모두 선택
3. **Save** 클릭
4. **재배포** (Redeploy)

---

## ✅ 최종 결과

두 개의 별도 프로젝트가 생성됩니다:

### **1. API 프로젝트**
- **프로젝트명**: `physical-education-api`
- **URL**: `https://physical-education-api.vercel.app`
- **Root Directory**: `api`
- **환경 변수**: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

### **2. 프론트엔드 프로젝트**
- **프로젝트명**: `physical-education-frontend` (또는 다른 이름)
- **URL**: `https://physical-education-frontend.vercel.app`
- **Root Directory**: `frontend`
- **환경 변수**: REACT_APP_API_URL (API 프로젝트의 URL)

---

## 🚨 주의사항

### **루트의 `vercel.json` 파일:**

루트에 `vercel.json` 파일이 있는데:
- ✅ **두 개의 별도 프로젝트로 분리하면 `vercel.json`은 무시됩니다**
- ✅ 각 프로젝트는 자신의 Root Directory에서만 작동합니다
- ✅ 경고가 나타날 수 있지만 정상 작동합니다

### **단일 프로젝트 vs 별도 프로젝트:**

| 방식 | 장점 | 단점 |
|------|------|------|
| **단일 프로젝트** (`vercel.json` 사용) | 하나의 URL로 관리 | 경고 발생, 설정 복잡 |
| **별도 프로젝트** (권장) | 명확한 분리, 각각 독립 배포 | 두 개의 URL 관리 |

**우리는 별도 프로젝트 방식을 선택했습니다 (안전함!)** ✅

---

## 📝 체크리스트

### **API 프로젝트:**
- [ ] Vercel에서 새 프로젝트 생성
- [ ] Root Directory를 `api`로 설정
- [ ] Framework Preset을 "Other" 또는 "Node.js"로 설정
- [ ] Build Command 비우기
- [ ] 환경 변수 3개 추가 (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
- [ ] 배포 완료
- [ ] API URL 확인 및 메모

### **프론트엔드 프로젝트:**
- [ ] Root Directory가 `frontend`로 설정되어 있는지 확인
- [ ] Build Command가 `npm run build`인지 확인 (`cd frontend && ...` 없이!)
- [ ] `REACT_APP_API_URL` 환경 변수 추가 (API 프로젝트의 URL)
- [ ] 재배포 완료

---

## ❓ 문제 해결

### **"API 프로젝트에서 package.json을 찾을 수 없어요"**
- ✅ Root Directory가 `api`로 설정되어 있는지 확인
- ✅ `api/package.json` 파일이 존재하는지 확인

### **"프론트엔드에서 API 호출이 실패해요"**
- ✅ `REACT_APP_API_URL` 환경 변수가 올바른 API URL로 설정되었는지 확인
- ✅ API 프로젝트가 정상적으로 배포되었는지 확인
- ✅ CORS 설정 확인 (필요한 경우)

### **"빌드가 실패해요"**
- ✅ 각 프로젝트의 Root Directory가 올바르게 설정되었는지 확인
- ✅ Build Command가 올바른지 확인 (`cd frontend && ...` 같은 경로 이동 없이!)

---

**지금 API 프로젝트를 별도로 만들어주세요!** 🚀

