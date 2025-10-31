# GitHub 레포지토리 설정 가이드

## 1. GitHub 레포지토리 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단의 "+" 버튼 클릭 → "New repository" 선택
3. Repository 정보 입력:
   - **Name**: `physical-education-app`
   - **Description**: `체육 교육용 원자 모델 시각화 웹 앱`
   - **Visibility**: Public 또는 Private 선택
   - **Initialize this repository with**: 체크하지 않기 (이미 로컬에 파일이 있으므로)
4. "Create repository" 클릭

## 2. 로컬 Git 초기화 및 커밋

```bash
cd /Users/yunhochoi/Desktop/physical-education-app

# Git 초기화 (이미 완료됨)
git init

# 모든 파일 추가 (node_modules는 자동으로 제외됨)
git add .

# 첫 커밋
git commit -m "Initial commit: 체육 교육 앱 프로젝트"

# 브랜치 이름을 main으로 변경
git branch -M main
```

## 3. 원격 저장소 연결

```bash
# GitHub에서 생성한 레포지토리의 URL 사용
# 예: https://github.com/YOUR_USERNAME/physical-education-app.git
git remote add origin https://github.com/YOUR_USERNAME/physical-education-app.git

# 확인
git remote -v
```

## 4. GitHub에 푸시

```bash
# 코드 푸시
git push -u origin main
```

## 5. GitHub에 푸시 후 확인

1. GitHub 레포지토리 페이지로 이동
2. 모든 파일이 올라갔는지 확인
3. README.md가 제대로 표시되는지 확인

## 6. 추가 커밋 방법

코드를 수정한 후:

```bash
# 변경사항 확인
git status

# 변경된 파일 추가
git add .

# 커밋
git commit -m "변경사항 설명"

# GitHub에 푸시
git push
```

## 주의사항

- `.env` 파일은 절대 커밋하지 마세요 (`.gitignore`에 포함됨)
- `serviceAccountKey.json`은 절대 커밋하지 마세요
- `node_modules`는 자동으로 제외됩니다
- `backend/db.json`은 로컬 개발용이므로 커밋하지 않습니다

## 문제 해결

### 푸시 거부 오류
```bash
# 강제 푸시 (주의: 기존 커밋 이력을 덮어씁니다)
git push -u origin main --force
```

### 원격 저장소 URL 변경
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/physical-education-app.git
```

### 커밋 이력 확인
```bash
git log --oneline
```


