# 🔗 Vercel 별도 프로젝트 연결 설정

프론트엔드와 백엔드가 별도의 Vercel 프로젝트로 분리되어 있는 경우 설정 방법입니다.

## 📋 현재 상황

- **프론트엔드 프로젝트**: `existenceyh.vercel.app` (또는 다른 URL)
- **백엔드 프로젝트**: `existence37.vercel.app` (또는 다른 URL)

## ✅ 해결 방법

### 1. 백엔드 프로젝트 URL 확인

백엔드 프로젝트의 Vercel 배포 URL을 확인하세요:
- 예: `https://existence37.vercel.app`
- 또는 커스텀 도메인: `https://api.yourdomain.com`

### 2. 프론트엔드 프로젝트에 환경 변수 설정

1. Vercel 대시보드에서 **프론트엔드 프로젝트** 선택
2. **Settings** → **Environment Variables** 클릭
3. **Add New** 클릭
4. **Key**: `REACT_APP_API_URL` 입력
5. **Value**: 백엔드 프로젝트 URL 입력 (예: `https://existence37.vercel.app`)
   - ⚠️ **주의**: `https://` 포함, 끝에 `/` 없이 입력
6. **Production**, **Preview**, **Development** 모두 체크
7. **Save** 클릭

### 3. 재배포

환경 변수 추가 후:
1. **Deployments** 탭으로 이동
2. 최신 배포의 **⋯** 메뉴 클릭
3. **Redeploy** 선택
4. 또는 새로운 커밋을 푸시하여 자동 재배포

## 🔍 확인 방법

배포 후 브라우저 콘솔에서:
```javascript
// API URL이 올바르게 설정되었는지 확인
console.log('API URL:', window.location.origin);
// 또는 네트워크 탭에서 API 요청 URL 확인
```

API 요청이 백엔드 프로젝트 URL로 가는지 확인:
- `https://existence37.vercel.app/api/classes` ✅
- `https://existenceyh.vercel.app/api/classes` ❌ (현재 도메인)

## 🎯 대안: 같은 프로젝트로 통합 (권장)

만약 가능하다면, 프론트엔드와 백엔드를 같은 Vercel 프로젝트로 통합하는 것이 더 간단합니다:

1. **프론트엔드 프로젝트**에 `api/` 폴더가 있는지 확인
2. `vercel.json`의 rewrites 설정 확인:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "/api/index.js"
       }
     ]
   }
   ```
3. 환경 변수 `REACT_APP_API_URL` 제거 (또는 빈 값으로 설정)
4. 이 경우 프론트엔드와 백엔드가 같은 도메인을 사용하므로 CORS 문제 없음

## ⚠️ CORS 설정 확인

백엔드 프로젝트의 `api/index.js`에서 CORS가 올바르게 설정되어 있는지 확인:

```javascript
app.use(cors({
  origin: '*',  // 또는 프론트엔드 도메인 지정
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
```

## 🐛 문제 해결

### 여전히 연결이 안 되는 경우:

1. **환경 변수 확인**
   - Vercel 대시보드에서 `REACT_APP_API_URL`이 올바르게 설정되었는지 확인
   - 값에 공백이나 따옴표가 없는지 확인

2. **재배포 확인**
   - 환경 변수는 새 배포에만 적용됩니다
   - 반드시 재배포해야 합니다

3. **브라우저 캐시 클리어**
   - 하드 리프레시: `Ctrl+Shift+R` (Windows) 또는 `Cmd+Shift+R` (Mac)

4. **네트워크 탭 확인**
   - 브라우저 개발자 도구 → Network 탭
   - API 요청의 실제 URL 확인
   - 에러 메시지 확인

