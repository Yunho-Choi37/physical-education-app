# 🔥 Firebase 다음 단계 가이드

Firebase 프로젝트를 생성하셨으니, 이제 다음 2가지를 해야 합니다:

---

## ✅ 1단계: Firestore Database 만들기

### 방법:
1. Firebase Console 왼쪽 메뉴에서 **"Firestore Database"** 클릭
   (혹시 안 보이면 ⚙️ 아이콘 옆의 "제품 더보기" 클릭)
   
2. **"데이터베이스 만들기"** 버튼 클릭

3. **보안 규칙 선택**:
   - **"테스트 모드로 시작"** 선택 ✅
   - "다음" 클릭

4. **위치 선택**:
   - **asia-northeast3 (서울)** 선택 ✅ (가장 가까움)
   - 다른 위치: asia-northeast1 (도쿄), asia-east1 (대만)도 가능
   - "사용 설정" 클릭

5. ⏱️ 1-2분 정도 기다리면 데이터베이스가 생성됩니다!

### 완료 확인:
Firestore Database 페이지에 "컬렉션 시작하기" 버튼이 보이면 완료! ✅

---

## ✅ 2단계: 서비스 계정 키 다운로드 (중요!)

이 키는 나중에 Vercel에서 환경 변수로 사용합니다.

### 방법:
1. Firebase Console 왼쪽 하단의 **⚙️ 아이콘** 클릭
2. **"프로젝트 설정"** 클릭
3. 상단 탭에서 **"서비스 계정"** 클릭
4. "Firebase Admin SDK" 섹션에서:
   - **"Node.js"** 탭이 선택되어 있는지 확인
   - **"새 비공개 키 생성"** 버튼 클릭
5. 경고 창이 뜨면:
   - ✅ "키 생성" 버튼 클릭
   - (비공개 키는 재다운로드할 수 없다는 경고입니다)
6. **JSON 파일이 자동으로 다운로드됩니다!** 📥
   - 파일 이름: `l-existence-precede-l-essence-xxxxx.json` (또는 비슷한 이름)

### 중요!
- ✅ **이 파일은 안전한 곳에 보관하세요!**
- ❌ **절대 GitHub에 올리지 마세요!** (이미 .gitignore에 포함됨)
- ❌ **다른 사람과 공유하지 마세요!**

### 파일 내용 확인:
다운로드한 JSON 파일을 열어서 확인하세요 (메모장이나 텍스트 에디터로):

```json
{
  "type": "service_account",
  "project_id": "l-existence-precede-l-essence",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@l-existence-precede-l-essence.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**나중에 필요한 것들:**
- ✅ `project_id`: "l-existence-precede-l-essence"
- ✅ `client_email`: "firebase-adminsdk-..."로 시작하는 이메일
- ✅ `private_key`: "-----BEGIN PRIVATE KEY-----" 부터 "-----END PRIVATE KEY-----" 까지의 전체 내용

---

## ✅ 완료 확인

두 가지를 모두 완료했는지 확인:

- [ ] Firestore Database가 생성되었는가?
  - Firestore Database 페이지에 "컬렉션 시작하기" 버튼이 보이나요?
  
- [ ] 서비스 계정 키 JSON 파일을 다운로드했는가?
  - 다운로드 폴더에 JSON 파일이 있나요?

**둘 다 완료되면 다음 단계로 넘어가세요!** 🚀

---

## 🎯 다음 단계

1. ✅ Firebase 프로젝트 생성 (완료!)
2. ⬜ Firestore Database 생성 ← **지금 여기!**
3. ⬜ 서비스 계정 키 다운로드 ← **지금 여기!**
4. ⬜ GitHub에 코드 올리기
5. ⬜ Vercel에 배포하기

---

## ❓ 문제가 있나요?

### "Firestore Database가 안 보여요"
- 왼쪽 메뉴에서 "제품 더보기" 클릭
- 또는 Firebase Console 상단 검색창에서 "Firestore" 검색

### "서비스 계정 키 다운로드가 안 돼요"
- ⚙️ → 프로젝트 설정 → 서비스 계정 탭 확인
- "Node.js" 탭이 선택되어 있는지 확인
- 브라우저 팝업 차단이 되어 있는지 확인

### "JSON 파일을 어디에 저장해야 하나요?"
- 어디든 상관없지만, 쉽게 찾을 수 있는 곳에 저장하세요
- 예: 바탕화면, 문서 폴더
- **절대 프로젝트 폴더 안에는 두지 마세요!** (GitHub에 올라갈 수 있음)

