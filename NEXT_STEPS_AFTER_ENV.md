# 🚀 환경 변수 입력 후 다음 단계

환경 변수 입력이 완료되었으니, 이제 배포를 진행합니다!

---

## ✅ 현재 완료된 것

- [x] Firebase 프로젝트 생성
- [x] Firestore Database 생성 (확인 필요)
- [x] 서비스 계정 키 다운로드
- [x] Vercel 환경 변수 입력 (API 프로젝트)

---

## 📋 다음 단계

### **1단계: API 프로젝트 배포 확인/재배포** 🔄

환경 변수를 추가한 후에는 **프로젝트를 다시 배포**해야 적용됩니다!

#### 방법:
1. Vercel 대시보드에서 **API 프로젝트** 선택
2. **"Deployments"** 탭 클릭
3. 가장 최근 배포 항목을 찾아서:
   - **"..." (메뉴)** 클릭 → **"Redeploy"** 클릭
   - 또는 **"Redeploy"** 버튼이 보이면 직접 클릭
4. ✅ 배포가 완료될 때까지 기다립니다 (1-2분)

#### 완료 확인:
- 배포가 성공적으로 완료되면 ✅ 초록색 체크 표시
- 배포 URL이 생성됩니다 (예: `https://your-api.vercel.app`)

---

### **2단계: API URL 확인 및 저장** 📝

배포가 완료되면 API URL을 확인하고 저장하세요!

#### 방법:
1. Vercel 대시보드에서 **API 프로젝트** 선택
2. **"Settings"** 탭 → **"Domains"** 클릭
3. 또는 **"Deployments"** 탭 → 최근 배포 클릭 → URL 확인
4. API URL 확인 (예: `https://physical-education-api.vercel.app`)

**이 URL을 메모하세요!** 다음 단계에서 사용합니다! 📌

---

### **3단계: 프론트엔드 프로젝트 생성 및 배포** 🎨

이제 프론트엔드 프로젝트를 별도로 만들어야 합니다!

#### 3-1. 새 프로젝트 생성:
1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. GitHub 저장소 선택 (또는 업로드)
3. **프로젝트 설정**:
   - **Project Name**: `physical-education-frontend` (원하는 이름)
   - **Framework Preset**: **"Create React App"** 선택
   - **Root Directory**: **`frontend`** 선택 (중요!)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `build` (기본값)
4. **"Deploy"** 버튼 클릭

#### 3-2. 프론트엔드 환경 변수 설정:
배포가 시작되면 (또는 배포 완료 후):

1. **프론트엔드 프로젝트** 선택
2. **"Settings"** 탭 → **"Environment Variables"** 클릭
3. 다음 환경 변수 추가:

   **✅ REACT_APP_API_URL**
   - Key: `REACT_APP_API_URL`
   - Value: 위에서 확인한 API URL (예: `https://physical-education-api.vercel.app`)
   - Environment: Production, Preview, Development 모두 선택

4. **"Save"** 클릭

#### 3-3. 프론트엔드 재배포:
1. **"Deployments"** 탭 클릭
2. 최근 배포의 **"Redeploy"** 클릭
3. ✅ 배포 완료까지 기다립니다

---

## ✅ 완료 확인

### 체크리스트:
- [ ] API 프로젝트 배포 완료
- [ ] API URL 확인 및 메모
- [ ] 프론트엔드 프로젝트 생성
- [ ] 프론트엔드 Root Directory를 `frontend`로 설정
- [ ] `REACT_APP_API_URL` 환경 변수 추가 (API URL로 설정)
- [ ] 프론트엔드 재배포 완료

---

## 🎯 최종 결과

두 개의 프로젝트가 생성되어야 합니다:

1. **API 프로젝트** (예: `physical-education-api`)
   - URL: `https://physical-education-api.vercel.app`
   - 환경 변수: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

2. **프론트엔드 프로젝트** (예: `physical-education-frontend`)
   - URL: `https://physical-education-frontend.vercel.app`
   - 환경 변수: REACT_APP_API_URL

---

## ❓ 문제 해결

### "Root Directory가 안 보여요"
- 프로젝트를 생성하기 전에 **"Configure Project"** 또는 **"Advanced"** 버튼 클릭
- 또는 배포 후 Settings → General에서 Root Directory 설정

### "API URL을 모르겠어요"
- API 프로젝트의 Deployments 탭에서 최근 배포 클릭
- 배포 URL이 보입니다
- 또는 Settings → Domains에서 확인

### "프론트엔드 배포가 실패해요"
- Root Directory가 `frontend`로 설정되었는지 확인
- Framework Preset이 "Create React App"인지 확인
- Build Command가 `npm run build`인지 확인
- Output Directory가 `build`인지 확인

---

**다음 단계를 진행하시고, 문제가 있으면 알려주세요!** 🚀

