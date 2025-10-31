# 🔧 배포 문제 해결 가이드

원들이 안 보이고 추가도 안 되는 문제를 해결하기 위한 수정 사항입니다.

---

## 🔍 문제 원인

1. **CORS 설정 부족**: Vercel 배포 환경에서 CORS가 제대로 작동하지 않음
2. **API 경로 문제**: Vercel Serverless Functions의 경로 매핑과 Express 앱의 경로가 일치하지 않음
3. **에러 처리 부족**: 프론트엔드에서 API 호출 실패 시 에러 처리가 부족함

---

## ✅ 수정 사항

### **1. API 코드 수정 (`api/index.js`)**

#### CORS 설정 강화:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.options('*', cors());
```

#### API 경로 수정:
- `/api/classes/:classId/students` → `/classes/:classId/students`
- `/api/students/:studentId` → `/students/:studentId`
- 등등...

**이유:** Vercel에서 `api/index.js`는 자동으로 `/api/*` 경로로 매핑되므로, Express 앱 내에서 `/api`를 중복으로 사용하면 안 됩니다.

#### Vercel 서버리스 함수 export 수정:
```javascript
module.exports = app;
```

---

### **2. 프론트엔드 코드 수정 (`frontend/src/ClassDetails.tsx`)**

#### 에러 처리 및 로깅 강화:
```javascript
const url = `${API_URL}/api/classes/${classId}/students`;
console.log('🔄 학생 목록 가져오기:', url);

const response = await fetch(url);

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

const data = await response.json();
console.log('✅ 학생 데이터 수신:', data.length, '명');
```

---

## 🚀 배포 방법

### **1단계: 코드 커밋 및 푸시**

```bash
cd /Users/yunhochoi/Desktop/physical-education-app
git add -A
git commit -m "fix: CORS 및 API 경로 수정, 에러 처리 강화"
git push origin main
```

### **2단계: Vercel 자동 배포 확인**

- Vercel이 GitHub와 연결되어 있으면 자동으로 배포가 시작됩니다
- API 프로젝트와 프론트엔드 프로젝트 모두 재배포됩니다

### **3단계: 배포 확인**

1. **API 프로젝트 배포 확인:**
   - Vercel 대시보드 → API 프로젝트
   - Deployments 탭에서 최신 배포 확인
   - ✅ 성공적으로 배포되었는지 확인

2. **프론트엔드 프로젝트 배포 확인:**
   - Vercel 대시보드 → 프론트엔드 프로젝트
   - Deployments 탭에서 최신 배포 확인
   - ✅ 성공적으로 배포되었는지 확인

3. **브라우저에서 테스트:**
   - 프론트엔드 URL 접속
   - 개발자 도구 (F12) → Console 탭 열기
   - 반 클릭하여 들어가기
   - Console에 로그 메시지가 나타나는지 확인:
     - `🔄 학생 목록 가져오기: [URL]`
     - `✅ 학생 데이터 수신: [개수] 명`
   - 또는 에러 메시지 확인:
     - `❌ Error fetching students: [에러 내용]`
     - `API_URL: [URL]`

---

## 🔍 문제 해결 체크리스트

배포 후에도 문제가 있으면 다음을 확인하세요:

### **1. 환경 변수 확인**

#### API 프로젝트:
- [ ] `FIREBASE_PROJECT_ID` 설정됨
- [ ] `FIREBASE_CLIENT_EMAIL` 설정됨
- [ ] `FIREBASE_PRIVATE_KEY` 설정됨 (전체 private_key)

#### 프론트엔드 프로젝트:
- [ ] `REACT_APP_API_URL` 설정됨
- [ ] `REACT_APP_API_URL` 값이 올바른 API URL인지 확인
  - 예: `https://physical-education-api.vercel.app`
  - ⚠️ 마지막에 `/`가 없어야 합니다!

### **2. API URL 확인**

브라우저에서 직접 API URL을 테스트해보세요:

```
https://[your-api-url]/api/classes/1/students
```

예상 응답:
- ✅ 학생 데이터 배열 (JSON)
- ❌ 에러 메시지 또는 404

### **3. CORS 확인**

브라우저 개발자 도구 → Network 탭:
- API 호출이 있는지 확인
- 응답 헤더에 `Access-Control-Allow-Origin: *`가 있는지 확인

### **4. Firebase 연결 확인**

Vercel API 프로젝트 → Deployments → Functions 로그:
- ✅ `Firestore 연결 성공` 메시지가 있는지 확인
- ❌ 에러 메시지가 있으면 환경 변수 확인

---

## 📝 추가 디버깅

### **브라우저 Console 확인:**

1. **프론트엔드 URL 접속**
2. **F12 키로 개발자 도구 열기**
3. **Console 탭 확인:**
   - `🔄 학생 목록 가져오기: [URL]` ← API 호출 시작
   - `✅ 학생 데이터 수신: [개수] 명` ← 성공
   - `❌ Error fetching students: [에러]` ← 실패

### **Network 탭 확인:**

1. **Network 탭 클릭**
2. **반 클릭하여 들어가기**
3. **API 호출 확인:**
   - `/api/classes/[classId]/students` 요청 찾기
   - Status 코드 확인:
     - ✅ `200` = 성공
     - ❌ `404` = 경로를 찾을 수 없음
     - ❌ `500` = 서버 에러
     - ❌ `CORS error` = CORS 문제

---

## 🎯 예상 결과

수정 후:
- ✅ 반에 들어가면 원들이 보임
- ✅ 학생 추가 버튼이 작동함
- ✅ 모든 API 호출이 정상적으로 작동함

---

**문제가 계속되면 브라우저 Console의 에러 메시지를 알려주세요!** 🚀

