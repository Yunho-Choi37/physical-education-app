# Vercel 배포 설정 안내

## 문제 해결

Vercel 빌드 오류가 발생하는 경우, 다음을 확인하세요:

### 방법 1: Vercel 대시보드에서 설정 (권장)

1. Vercel 프로젝트 대시보드로 이동
2. **Settings** → **General** → **Root Directory**로 이동
3. Root Directory를 `frontend`로 설정
4. **Build & Development Settings**에서:
   - **Install Command**: `npm install` (또는 빈 값)
   - **Build Command**: `npm run build` (또는 빈 값)
   - **Output Directory**: `build`
5. 저장 후 다시 배포

### 방법 2: vercel.json 사용

현재 `vercel.json` 파일이 루트에 있습니다. 이 파일은 Root Directory가 루트로 설정된 경우에 작동합니다.

Root Directory를 `frontend`로 설정하고 `vercel.json`을 제거하거나, 
루트에 `package.json`을 추가하는 방법도 있습니다.

### 확인 사항

- ✅ Root Directory가 `frontend`로 설정되어 있는지
- ✅ Build Command가 `npm run build`인지
- ✅ Output Directory가 `build`인지
- ✅ frontend 폴더에 `package.json`이 있는지

