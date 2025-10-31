# Vercel 환경 변수 업데이트 방법

## 문제
`FIREBASE_SERVICE_ACCOUNT_JSON` 환경 변수가 이미 존재합니다.

## 해결 방법

### 방법 1: 기존 변수 값 수정 (권장)

1. Vercel 대시보드 → **API 프로젝트** 선택
2. **Settings** → **Environment Variables** 클릭
3. `FIREBASE_SERVICE_ACCOUNT_JSON` 찾기
4. **Edit** (연필 아이콘) 클릭
5. **Value** 필드의 기존 값을 **전부 삭제**
6. 아래 명령어로 생성한 새 값을 **전체 복사해서 붙여넣기**:

```bash
node -e "const fs = require('fs'); const json = JSON.parse(fs.readFileSync('/Users/yunhochoi/Downloads/l-existence-precede-l-essence-firebase-adminsdk-fbsvc-b6f346cffa.json', 'utf8')); console.log(JSON.stringify(json));"
```

7. **Save** 클릭
8. **Deployments** 탭 → **Redeploy** 실행

### 방법 2: 기존 변수 삭제 후 재생성

1. Vercel 대시보드 → **API 프로젝트** 선택
2. **Settings** → **Environment Variables** 클릭
3. `FIREBASE_SERVICE_ACCOUNT_JSON` 옆의 **휴지통 아이콘** 클릭하여 삭제
4. **Add New** 클릭
5. **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`
6. **Value**: 위 명령어로 생성한 JSON 한 줄 전체
7. **Production**, **Preview**, **Development** 모두 체크
8. **Save** 클릭
9. **Deployments** 탭 → **Redeploy** 실행

## 주의사항

- 환경 변수 수정/추가 후 **반드시 재배포**해야 적용됩니다.
- 기존 값이 잘못되어 있을 수 있으니, **전체를 새 값으로 교체**하는 것을 권장합니다.

