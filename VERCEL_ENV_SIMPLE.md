# 🔥 Vercel 환경 변수 설정 (가장 간단한 방법)

## ✅ 방법 1: JSON 전체를 한 줄로 저장 (권장 - 100% 확실함)

### FIREBASE_SERVICE_ACCOUNT_JSON
Firebase 서비스 계정 JSON 파일을 **한 줄로** 변환해서 저장하세요.

**로컬 터미널에서 실행:**
```bash
# Firebase JSON 파일 경로를 지정하고 한 줄로 변환
node -e "const fs = require('fs'); const json = JSON.parse(fs.readFileSync('Downloads/l-existence-precede-l-essence-firebase-adminsdk-fbsvc-b6f346cffa.json', 'utf8')); console.log(JSON.stringify(json));"
```

위 명령어 출력 결과를 **전체 복사**해서 Vercel 환경 변수 값으로 사용하세요.

## 설정 방법

1. Vercel 대시보드 → **API 프로젝트** 선택
2. **Settings** → **Environment Variables** 클릭
3. **Add New** 클릭
4. **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON` 입력
5. **Value**: 위의 JSON 한 줄 전체를 복사해서 붙여넣기
6. **Production**, **Preview**, **Development** 모두 체크
7. **Save** 클릭
8. **Deployments** 탭에서 **Redeploy** 실행

## ✅ 확인

환경 변수 추가 후 재배포하면:
- `https://existence37.vercel.app/api/health` → `{ ok: true }` 확인
- 콘솔 로그에 `✅ Firestore 연결 성공` 메시지 확인

## 🎯 이 방법의 장점

- **단 하나의 환경 변수만** 추가하면 됨
- 줄바꿈 문제 없음 (JSON 파싱으로 자동 처리)
- 실수할 가능성 최소화

