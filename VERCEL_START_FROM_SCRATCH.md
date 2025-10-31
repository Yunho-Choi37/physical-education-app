# 🚀 Vercel 처음부터 배포하기 (깔끔한 가이드)

Vercel에서 모든 프로젝트를 지우고 처음부터 다시 시작하는 가이드입니다!

---

## 📋 순서

1. **API 프로젝트 생성 및 배포** (먼저!)
2. **프론트엔드 프로젝트 생성 및 배포** (두 번째!)
3. **프론트엔드에서 API URL 연결** (마지막!)

---

## 🔥 1단계: API 프로젝트 생성

### **1-1. 새 프로젝트 생성**

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. **"Add New..."** → **"Project"** 클릭
3. GitHub 저장소 선택:
   - **Repository**: `Yunho-Choi37/physical-education-app`
   - **Branch**: `main`
   - **"Import"** 클릭

### **1-2. 프로젝트 설정**

**프로젝트 설정 화면에서:**

✅ **Project Name**: `physical-education-api` (원하는 이름)

✅ **Framework Preset**: **"Other"** 선택
   - ⚠️ "Create React App"이 아닌 "Other"를 선택하세요!

✅ **Root Directory**: **`api`** 입력 (중요!)
   - 이게 가장 중요합니다!
   - 루트가 아닌 `api` 폴더를 루트로 사용합니다

✅ **Build Command**: 비워두기
   - ⚠️ 아무것도 입력하지 마세요!

✅ **Output Directory**: 비워두기
   - ⚠️ 아무것도 입력하지 마세요!

✅ **Install Command**: `npm install` (기본값, 그대로 두기)

✅ **Development Command**: 비워두기

### **1-3. 환경 변수 설정**

**⚠️ 배포를 시작하기 전에 환경 변수를 먼저 설정하세요!**

1. 설정 화면에서 **"Environment Variables"** 섹션 찾기
   - 또는 배포 후 Settings → Environment Variables에서도 가능
2. **"Add Environment Variable"** 버튼 클릭
3. 다음 3개를 하나씩 추가:

   **첫 번째: FIREBASE_PROJECT_ID**
   - **Key**: `FIREBASE_PROJECT_ID`
   - **Value**: `l-existence-precede-l-essence`
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
   - **"Save"** 클릭

   **두 번째: FIREBASE_CLIENT_EMAIL**
   - **Key**: `FIREBASE_CLIENT_EMAIL`
   - **Value**: `firebase-adminsdk-fbsvc@l-existence-precede-l-essence.iam.gserviceaccount.com`
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
   - **"Save"** 클릭

   **세 번째: FIREBASE_PRIVATE_KEY** ⚠️ (가장 중요!)
   - **Key**: `FIREBASE_PRIVATE_KEY`
   - **Value**: 아래 전체를 복사해서 붙여넣으세요 (줄바꿈 포함!)
     ```
     -----BEGIN PRIVATE KEY-----
     MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCifE4xnwNDTVpJ
     6MetrmosHEd9pPQhyBIYosu26h23B+7voqsWrhy68mVFp+or8oeBoYZq1Wcu/FqU
     Dv1C1n7WB4cH+qlXMoZs61Ezm24YCu1EVj7VzVzADlTegiYoH0/skWnnsleen/1d
     A1HS+gO6A7gXDRBFDE91N5RB3rGQBr42DwzIJOjpw48hQlrp8QxuQcmvYPrR1wZ2
     uz50DOM6xXkwT91aq051qjoSQhGmE+5iVeUSbltokc2RFzaMg5RZ3SgDmmrqY12L
     tCAFNyJ3qcX9KVRmw9jWVa84EEKT6z8skILS9HSF6DBm1ldyS7Iaa2YUPaEitogX
     LZF9POjdAgMBAAECggEAAKc+Sz3H7hPYCpcIgn7Ch4XflbY9kwsyY234IrajQvKh
     t83wISm3DNtfo92Od/nEKLXFDBXqkcpK9PBwfT3Oib7DALm1x5d46eQyUeJMmYUl
     uhIcs5BdUJpeJfzg+WVS1XEqO1fAuW8MPjz+rbn6nNtZ+KHBUH3Brgd4raEfFqSm
     qDPC71wjNmU3dPLn3zxxe7X57cY05gJMZG5Iet7p6tSsySUVzI1SsWqmr1Wof/ep
     pX38eVhQTXNCXy53zoKGcDnsuRcL7C4I3pOY/9uaMMwIX2JGmJnMXhJh/+92fZKG
     jNhFqYlZ58WUz0tIfh1XYVKRDDnftHfxTV3Z2QsL4wKBgQDP5AUCql3yJ9TDjjgr
     AnovoQFQK41SpU4nzG+JWCOsmys/Dj2mvbwZVWyuGd5Lq5nbQOhM+gr38OhRY85r
     1zpwKw13ZamvWYaPyaNmnAFMNJ97Wg1URrkog8XqkvVuMcM1d13PXBrqG6eEKCFx
     VhagKRDDiaBNAHz0VUSlDDMULwKBgQDIFl5uEROlHc/ZgDpzxiAuvzQx3ROcTljf
     5lxPbxSnFY34Pl8E7mzIkRcSisIsWoBHcXN0zFQvuDWPLez+OJtJV7+1ddhumDDL
     OJ/zvxesGQwR4h16LEnemME/PDcTf8XLK2mWBK5dHnxX16IpPtuxmfeqB4iB8vZH
     MQCElwf0swKBgDNlAcAY8kTNiBIYdNZdNGvV+Acj3TpTV7ELH3/q5FblvZlHIgK4
     4Wm57rZT+trmP5EuyL9PCasmSajlbcDHYtEcM6YS4hJRpayigtz5MHDwiYTrTGRL
     X7cebK2DS13Eu6faLLz43kaGM7G+YhYs3EcYH+bXfWPL/RhChEfxbidNAoGAW61E
     HxJb+e+q6HFEVv+Uh1a8R4yQC7IqLoySByNSRywtHG0XhF7qIQu5kplZVpEw7Ysh
     54YnnKW+hJf6WpD9NaGrCS2xuRqqYLLVNw17fzMKwLbl4rCgOAmtoZepdJm6utht
     THtgmPH67xSyDEvsxXdSbul8tm3oQb5GCnpY/tkCgYEAxdUS84JbAqKwoeu71zmS
     mtBGQRS6QEa5/p3maAQmpsENF+gwvf3KbeHF2b4n4oV3RFL1G2PbbUPXl1yHjU6k
     7454JLHHcJ9sAVUUdYtQ9aKgoqUxaIL0ElbYDCLgE1uE4m5bbK0DR7dZiXldJcud
     1S6I81OvchOVnvBQBqxiFrg=
     -----END PRIVATE KEY-----
     ```
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
   - **"Save"** 클릭

### **1-4. 배포**

1. 모든 설정이 완료되었는지 확인:
   - ✅ Root Directory: `api`
   - ✅ Framework Preset: "Other"
   - ✅ Build Command: 비어있음
   - ✅ 환경 변수 3개 추가됨
2. **"Deploy"** 버튼 클릭
3. ⏱️ 배포 완료까지 기다립니다 (1-2분)

### **1-5. API URL 확인**

배포 완료 후:

1. **프로젝트 선택** → **"Settings"** → **"Domains"** 클릭
2. 또는 **"Deployments"** → 최근 배포 클릭 → URL 확인
3. **API URL 확인** (예: `https://physical-education-api.vercel.app`)
4. **이 URL을 메모하세요!** 📝

---

## 🎨 2단계: 프론트엔드 프로젝트 생성

### **2-1. 새 프로젝트 생성**

1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. GitHub 저장소 선택:
   - **Repository**: `Yunho-Choi37/physical-education-app`
   - **Branch**: `main`
   - **"Import"** 클릭

### **2-2. 프로젝트 설정**

**프로젝트 설정 화면에서:**

✅ **Project Name**: `physical-education-frontend` (원하는 이름)

✅ **Framework Preset**: **"Create React App"** 선택 ✅
   - 이번에는 React입니다!

✅ **Root Directory**: **`frontend`** 입력 (중요!)
   - 이게 가장 중요합니다!

✅ **Build Command**: `npm run build` (기본값, 그대로 두기)
   - ⚠️ `cd frontend && npm run build` 같은 경로 이동 없이!

✅ **Output Directory**: `build` (기본값, 그대로 두기)

✅ **Install Command**: `npm install` (기본값, 그대로 두기)

### **2-3. 환경 변수 설정**

**⚠️ 배포를 시작하기 전에 환경 변수를 먼저 설정하세요!**

1. 설정 화면에서 **"Environment Variables"** 섹션 찾기
2. **"Add Environment Variable"** 버튼 클릭
3. 다음 환경 변수 추가:

   **REACT_APP_API_URL**
   - **Key**: `REACT_APP_API_URL`
   - **Value**: 위에서 확인한 API URL (예: `https://physical-education-api.vercel.app`)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
   - **"Save"** 클릭

### **2-4. 배포**

1. 모든 설정이 완료되었는지 확인:
   - ✅ Root Directory: `frontend`
   - ✅ Framework Preset: "Create React App"
   - ✅ Build Command: `npm run build`
   - ✅ 환경 변수 `REACT_APP_API_URL` 추가됨
2. **"Deploy"** 버튼 클릭
3. ⏱️ 배포 완료까지 기다립니다 (3-5분, 첫 빌드는 시간이 걸립니다)

### **2-5. 프론트엔드 URL 확인**

배포 완료 후:

1. **프로젝트 선택** → **"Settings"** → **"Domains"** 클릭
2. **프론트엔드 URL 확인** (예: `https://physical-education-frontend.vercel.app`)
3. **이 URL에서 앱이 작동하는지 확인하세요!** 🎉

---

## ✅ 완료 확인

### **체크리스트:**

**API 프로젝트:**
- [ ] 프로젝트 생성 완료
- [ ] Root Directory: `api` 설정
- [ ] Framework Preset: "Other"
- [ ] Build Command: 비어있음
- [ ] 환경 변수 3개 추가 (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
- [ ] 배포 완료
- [ ] API URL 확인 및 메모

**프론트엔드 프로젝트:**
- [ ] 프로젝트 생성 완료
- [ ] Root Directory: `frontend` 설정
- [ ] Framework Preset: "Create React App"
- [ ] Build Command: `npm run build`
- [ ] 환경 변수 `REACT_APP_API_URL` 추가 (API URL로 설정)
- [ ] 배포 완료
- [ ] 프론트엔드 URL 확인

---

## 🚨 문제 해결

### **"API 프로젝트에서 package.json을 찾을 수 없어요"**
- ✅ Root Directory가 `api`로 설정되어 있는지 확인
- ✅ 프로젝트 설정에서 Root Directory를 다시 확인

### **"프론트엔드 빌드가 실패해요"**
- ✅ Root Directory가 `frontend`로 설정되어 있는지 확인
- ✅ Build Command가 `npm run build`인지 확인 (`cd frontend && ...` 없이!)
- ✅ Vercel 빌드 로그에서 정확한 에러 메시지 확인

### **"API 호출이 실패해요"**
- ✅ `REACT_APP_API_URL` 환경 변수가 올바른 API URL로 설정되었는지 확인
- ✅ API 프로젝트가 정상적으로 배포되었는지 확인
- ✅ 프론트엔드 프로젝트를 재배포 (환경 변수 변경 후)

---

## 🎯 최종 결과

두 개의 별도 프로젝트:

1. **API 프로젝트**: `physical-education-api`
   - URL: `https://physical-education-api.vercel.app`
   - Root Directory: `api`

2. **프론트엔드 프로젝트**: `physical-education-frontend`
   - URL: `https://physical-education-frontend.vercel.app`
   - Root Directory: `frontend`

**이제 프론트엔드 URL에서 앱이 정상적으로 작동해야 합니다!** 🚀

---

**문제가 있으면 알려주세요!** ❓

