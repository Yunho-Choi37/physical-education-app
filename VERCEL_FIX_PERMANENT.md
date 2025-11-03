# Vercel 배포 문제 근본 해결 방법

## 🔴 근본 원인

`vercel.json`과 Vercel 대시보드 설정이 **충돌**하여 간헐적으로 빌드 실패가 발생합니다.

### 문제점:
1. `vercel.json`이 있으면 Vercel UI 설정이 **무시**됨
2. 프론트엔드와 API 두 프로젝트가 같은 저장소를 공유
3. Root Directory 설정과 `vercel.json` 설정이 불일치

## ✅ 영구 해결 방법

### 1. vercel.json 제거 (완료)
- `vercel.json` 파일을 제거했습니다
- 이제 Vercel 대시보드 설정만 사용합니다

### 2. 프론트엔드 프로젝트 설정

Vercel 대시보드 → **프론트엔드 프로젝트** → **Settings**:

#### General:
- **Root Directory**: `frontend` ✅

#### Build & Development Settings:
- **Framework Preset**: Create React App (또는 Auto-detect)
- **Install Command**: `npm install` (또는 비워둠)
- **Build Command**: `npm run build` (또는 비워둠)
- **Output Directory**: `build`
- **Development Command**: `npm start` (로컬 개발용)

### 3. API 프로젝트 설정

Vercel 대시보드 → **API 프로젝트** → **Settings**:

#### General:
- **Root Directory**: `api` ✅

#### Build & Development Settings:
- **Framework Preset**: Other (또는 Auto-detect)
- **Install Command**: `npm install` (또는 비워둠)
- **Build Command**: (비워둠 - 빌드 불필요, 서버리스 함수)
- **Output Directory**: (비워둠)

## 📝 확인 사항

각 프로젝트마다:
- ✅ Root Directory가 올바르게 설정되어 있는지
- ✅ Build Command가 해당 폴더의 package.json 기준으로 작동하는지
- ✅ vercel.json이 없는지

## 🎯 이 방법의 장점

1. **일관성**: 대시보드 설정만으로 관리 가능
2. **명확성**: 각 프로젝트의 Root Directory가 명확
3. **충돌 없음**: vercel.json과 UI 설정 충돌 없음
4. **유지보수 용이**: 설정 변경이 쉬움

## ⚠️ 주의사항

- `vercel.json`을 다시 추가하면 대시보드 설정이 무시됩니다
- 두 프로젝트가 서로 다른 Root Directory를 가져야 합니다
- 환경 변수는 각 프로젝트별로 별도로 설정해야 합니다

