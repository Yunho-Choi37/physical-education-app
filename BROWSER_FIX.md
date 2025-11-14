# 브라우저 자동 열림 문제 해결

## 문제 원인

브라우저가 자동으로 열리지 않는 주요 원인:

1. **환경 변수 설정 문제**: `BROWSER` 환경 변수가 제대로 설정되지 않음
2. **react-scripts 버전**: 일부 버전에서 자동 브라우저 열림이 비활성화됨
3. **macOS 권한 문제**: 시스템 설정에서 자동 실행이 차단됨

## 해결 방법

### 방법 1: .env 파일 사용 (권장) ✅

`.env` 파일이 생성되었습니다. 이제 `npm start`를 실행하면 브라우저가 자동으로 열립니다.

```bash
cd frontend
npm start
```

### 방법 2: 수동으로 브라우저 열기

컴파일이 완료되면 (터미널에 "Compiled successfully!" 메시지가 보이면):

**macOS:**
```bash
# 기본 브라우저로 열기
open http://localhost:3000

# 크롬으로 열기
open -a "Google Chrome" http://localhost:3000

# Safari로 열기
open -a Safari http://localhost:3000
```

**또는 브라우저에서 직접:**
- 주소창에 `http://localhost:3000` 입력

### 방법 3: 크롬을 기본 브라우저로 설정

터미널에서:
```bash
# 크롬 경로 확인
ls -la "/Applications/Google Chrome.app"

# .env 파일에 크롬 경로 추가
echo "BROWSER=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" >> frontend/.env
```

### 방법 4: package.json 스크립트 수정

`package.json`의 start 스크립트를 다음과 같이 수정:

```json
"scripts": {
  "start": "BROWSER=open react-scripts start"
}
```

하지만 이미 `.env` 파일로 설정했으므로 필요 없습니다.

## 확인 방법

1. **서버 실행 확인:**
   ```bash
   lsof -ti:3000
   ```
   - 결과가 있으면 서버가 실행 중입니다

2. **브라우저 수동 열기:**
   ```bash
   open http://localhost:3000
   ```

3. **터미널 메시지 확인:**
   - "Compiled successfully!" 메시지가 보이면 정상
   - 에러가 있으면 메시지를 확인하세요

## 현재 설정 상태

✅ `.env` 파일 생성됨 (`BROWSER=open`)
✅ `package.json` 스크립트 정리됨
✅ macOS `open` 명령어 사용 가능

이제 `npm start`를 실행하면 브라우저가 자동으로 열려야 합니다!

## 추가 팁

브라우저가 여전히 자동으로 열리지 않는다면:

1. **터미널에서 직접 열기:**
   ```bash
   # 서버가 실행된 후
   open http://localhost:3000
   ```

2. **브라우저 북마크 추가:**
   - 개발 중 자주 사용하므로 북마크에 추가

3. **알림 설정:**
   - 컴파일 완료 시 알림을 받도록 설정 (선택사항)

