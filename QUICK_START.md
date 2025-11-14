# 빠른 시작 가이드

## 로컬 개발 서버 실행 방법

### 1단계: 프론트엔드 의존성 설치 및 실행

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm start
```

**예상 결과:**
- 브라우저가 자동으로 열리며 `http://localhost:3000` 접속
- 터미널에 "Compiled successfully!" 메시지 표시

### 2단계: 백엔드 서버 실행 (별도 터미널)

```bash
# api 디렉토리로 이동
cd api

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm start
```

**예상 결과:**
- 터미널에 "서버가 포트 3001에서 실행 중입니다." 메시지 표시

---

## 문제 해결

### 문제 1: "포트 3000이 이미 사용 중입니다"

**해결 방법:**
```bash
# 포트를 사용하는 프로세스 종료
lsof -ti:3000 | xargs kill -9

# 또는 다른 포트 사용
PORT=3001 npm start
```

### 문제 2: "npm: command not found"

**해결 방법:**
Node.js가 설치되어 있지 않습니다. 다음 중 하나를 설치하세요:
- [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전 다운로드
- Homebrew 사용: `brew install node`

### 문제 3: "Cannot find module" 에러

**해결 방법:**
```bash
# node_modules 삭제 후 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 문제 4: "Firebase 연결 실패" 에러

**해결 방법:**
백엔드 서버가 실행되지 않았거나 Firebase 설정이 필요합니다.

1. 백엔드 서버가 실행 중인지 확인
2. `api/firebase-config.js` 파일이 존재하는지 확인
3. 로컬 개발 시에는 Firebase 없이도 프론트엔드는 실행 가능 (API 호출만 실패)

### 문제 5: 브라우저에서 "페이지를 찾을 수 없습니다"

**해결 방법:**
1. 프론트엔드 서버가 실행 중인지 확인
2. 터미널에 에러 메시지가 있는지 확인
3. `http://localhost:3000` 대신 `http://127.0.0.1:3000` 시도

---

## 실행 확인 체크리스트

- [ ] `cd frontend` 후 `npm install` 완료
- [ ] `npm start` 실행 후 터미널에 "Compiled successfully!" 표시
- [ ] 브라우저에서 `http://localhost:3000` 접속 가능
- [ ] 랜딩 페이지가 정상적으로 표시됨
- [ ] (선택) `cd api` 후 `npm start` 실행하여 백엔드 서버 실행

---

## 빠른 테스트

서버가 실행되면:

1. 브라우저에서 `http://localhost:3000` 접속
2. "Being" 또는 "Purpose" 버튼 클릭
3. 페이지가 정상적으로 로드되는지 확인

---

## 추가 도움말

문제가 계속되면 터미널의 전체 에러 메시지를 확인하세요.

