# 🔧 Vercel 빌드 오류 해결 가이드

`npm run build`가 실패했다면 다음을 확인하세요!

---

## 🔍 **1단계: 정확한 에러 메시지 확인**

Vercel 대시보드에서 빌드 로그를 확인하세요:

1. Vercel 대시보드에서 **프론트엔드 프로젝트** 선택
2. **"Deployments"** 탭 클릭
3. 실패한 배포 클릭
4. **"Build Logs"** 클릭 (또는 자동으로 보임)
5. 🔴 **빨간색 에러 메시지** 찾기

### 일반적인 에러들:
- `Module not found: Can't resolve...` → 패키지 설치 문제
- `Type error: ...` → TypeScript 타입 에러
- `Command failed: npm run build` → 빌드 스크립트 문제
- `ENOENT: no such file or directory` → 경로 설정 문제

---

## 🔧 **2단계: Vercel 프로젝트 설정 확인**

### 필수 설정:

1. **Settings** → **General** 탭에서 확인:

   ✅ **Root Directory**: `frontend` (중요!)
   
   ✅ **Framework Preset**: `Create React App`
   
   ✅ **Build Command**: `npm run build` (기본값)
   
   ✅ **Output Directory**: `build` (기본값)
   
   ✅ **Install Command**: `npm install` (기본값)
   
   ✅ **Node.js Version**: `18.x` 또는 `20.x` (최신 LTS 권장)

### 설정 방법:
- Root Directory가 비어있거나 다른 값이라면 → `frontend`로 설정
- Root Directory를 변경하려면:
  1. Settings → General
  2. **Root Directory** 섹션 찾기
  3. **Edit** 버튼 클릭
  4. `frontend` 입력
  5. **Save** 클릭

---

## 🔧 **3단계: 일반적인 해결 방법**

### 방법 1: Root Directory 설정 확인 ✅

**가장 흔한 원인입니다!**

Vercel에서 프로젝트를 생성할 때 Root Directory를 `frontend`로 설정하지 않으면:
- `package.json`을 찾을 수 없음
- `src` 폴더를 찾을 수 없음
- 빌드 실패

**해결:**
1. Settings → General
2. Root Directory: `frontend` 설정
3. 저장 후 재배포

---

### 방법 2: Node.js 버전 확인

Vercel이 오래된 Node.js 버전을 사용할 수 있습니다.

**해결:**
1. Settings → General
2. **Node.js Version** 확인 (18.x 또는 20.x 권장)
3. `.nvmrc` 파일 생성 (선택사항):

```bash
# frontend/.nvmrc 파일 생성
echo "20" > frontend/.nvmrc
```

또는 Vercel에서 직접 Node.js Version 설정

---

### 방법 3: 패키지 설치 확인

패키지 설치가 실패할 수 있습니다.

**해결:**
1. `frontend/package.json` 확인
2. 모든 의존성이 올바른지 확인
3. Vercel Settings → General → Install Command 확인

---

## 🔧 **4단계: vercel.json 생성 (선택사항)**

프로젝트 루트에 `vercel.json`이 있어서 문제가 될 수 있습니다.

### 해결 방법 A: vercel.json 무시 (권장)
- Vercel 프로젝트 설정에서 Root Directory를 `frontend`로 설정하면
- 루트의 `vercel.json`은 무시됩니다
- 이게 가장 안전한 방법입니다!

### 해결 방법 B: vercel.json 삭제 또는 수정
- 루트의 `vercel.json`을 삭제하거나
- 프론트엔드 전용 설정으로 수정

---

## 🔧 **5단계: 환경 변수 확인**

빌드 시점에 환경 변수가 필요할 수 있습니다.

### 필수 환경 변수:
- `REACT_APP_API_URL` (API 프로젝트의 URL)
  - 예: `https://your-api.vercel.app`

### 확인 방법:
1. Settings → Environment Variables
2. `REACT_APP_API_URL`이 설정되어 있는지 확인
3. Production, Preview, Development 모두 선택되었는지 확인

---

## 🔧 **6단계: 타입스크립트 에러 (만약 있다면)**

로컬에서는 경고만 있지만, Vercel에서는 타입 에러가 발생할 수 있습니다.

**해결:**
- Vercel 빌드 로그에서 정확한 타입 에러 확인
- 해당 파일의 타입 수정

---

## 📝 **체크리스트**

빌드를 다시 시도하기 전에:

- [ ] Root Directory가 `frontend`로 설정되어 있는가?
- [ ] Framework Preset이 `Create React App`인가?
- [ ] Build Command가 `npm run build`인가?
- [ ] Output Directory가 `build`인가?
- [ ] Node.js Version이 18.x 이상인가?
- [ ] `REACT_APP_API_URL` 환경 변수가 설정되어 있는가?
- [ ] Vercel 빌드 로그에서 정확한 에러 메시지를 확인했는가?

---

## 🚨 **빠른 해결 방법**

### 1. Root Directory 확인 및 수정
```
Settings → General → Root Directory: frontend
```

### 2. 환경 변수 설정
```
Settings → Environment Variables → REACT_APP_API_URL 추가
```

### 3. 재배포
```
Deployments → 최근 배포 → Redeploy
```

---

## ❓ **여전히 안 되나요?**

Vercel 빌드 로그에서 **정확한 에러 메시지**를 복사해서 알려주세요!

특히 이런 메시지를 찾아주세요:
- 🔴 빨간색 에러 메시지
- `ERROR` 또는 `FAILED` 키워드
- 파일 경로와 줄 번호가 포함된 메시지

---

**에러 메시지를 알려주시면 더 정확하게 도와드릴 수 있습니다!** 🚀

