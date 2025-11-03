# Vercel 빌드 문제 추가 해결 방법

## 설정이 올바른데도 간헐적으로 실패하는 경우

### 1. 빌드 캐시 초기화

Vercel 대시보드에서:
1. **Settings** → **General** → **Build & Development Settings**
2. 맨 아래 **Clear Build Cache** 버튼 클릭
3. 재배포

### 2. 각 프로젝트의 GitHub 연결 확인

#### 프론트엔드 프로젝트:
- **Settings** → **Git**
- **Production Branch**: `main` 확인
- **Ignore Build Step**: 비워둠 (또는 제거)

#### API 프로젝트:
- **Settings** → **Git**
- **Production Branch**: `main` 확인
- **Ignore Build Step**: 설정이 있다면 제거

### 3. Ignore Build Step 설정 확인

각 프로젝트의 **Settings** → **Git** → **Ignore Build Step**에:
- **비워두거나**
- **프론트엔드**: 비워둠 (항상 빌드)
- **API**: 비워둠 (항상 배포)

### 4. 배포 트리거 확인

**Deployments** 탭에서:
- 어떤 커밋이 배포를 트리거했는지 확인
- 두 프로젝트가 동시에 같은 커밋에서 배포되는지 확인
- 불필요한 재배포가 있는지 확인

### 5. 환경 변수 확인

각 프로젝트의 **Settings** → **Environment Variables**:
- 프론트엔드: `REACT_APP_API_URL` 등
- API: `FIREBASE_SERVICE_ACCOUNT_JSON` 등
- 모든 환경 변수가 올바르게 설정되어 있는지 확인

### 6. Build Command 명시적 설정 (권장)

#### 프론트엔드 프로젝트:
**Settings** → **Build & Development Settings**:
- **Build Command**: `npm run build` (명시적으로 입력)

#### API 프로젝트:
**Settings** → **Build & Development Settings**:
- **Build Command**: (비워둠 - 서버리스 함수는 빌드 불필요)

### 7. 최후의 수단: 프로젝트 재연결

만약 계속 문제가 발생한다면:
1. Vercel 대시보드에서 프로젝트 **Settings** → **General**
2. **Disconnect** 클릭 (GitHub 연결 해제)
3. **Connect Git Repository** 클릭
4. 같은 저장소를 다시 연결
5. Root Directory와 설정 다시 확인

## 🔍 디버깅 체크리스트

빌드 실패 시 확인할 사항:

- [ ] Root Directory가 올바른지 (`frontend` 또는 `api`)
- [ ] package.json이 해당 디렉토리에 있는지
- [ ] Build Command가 올바른지
- [ ] vercel.json이 없는지 (제거 완료)
- [ ] 빌드 캐시가 손상되지 않았는지
- [ ] GitHub 연결이 올바른지
- [ ] 환경 변수가 모두 설정되어 있는지

## 📊 모니터링

**Deployments** 탭에서:
- 최근 배포들의 성공/실패 패턴 확인
- 어떤 커밋에서 문제가 발생하는지 패턴 분석
- 로그에서 정확한 오류 메시지 확인

