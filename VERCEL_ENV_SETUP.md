# 🔐 Vercel 환경 변수 설정 가이드

Vercel에서 환경 변수를 입력하는 정확한 위치와 방법을 알려드립니다!

---

## 📍 **환경 변수 입력 위치 찾기**

### **단계별 가이드:**

#### **1단계: Vercel 대시보드 접속**
- https://vercel.com/dashboard 접속
- 로그인 (GitHub 계정으로 로그인)

#### **2단계: 프로젝트 선택**
- 대시보드에서 **API 프로젝트** 선택
  - (프로젝트 이름을 클릭하면 상세 페이지로 이동)

#### **3단계: Settings(설정) 탭 클릭**
- 프로젝트 상세 페이지 상단에 있는 탭들:
  ```
  [Overview] [Deployments] [Analytics] [Settings] [Team]
  ```
- **"Settings"** 탭 클릭 ✅

#### **4단계: Environment Variables(환경 변수) 섹션 찾기**
- Settings 페이지 왼쪽 메뉴에서:
  ```
  [General]
  [Domains]
  [Environment Variables] ← 여기 클릭! ✅
  [Git]
  [Deploy Hooks]
  [Security]
  ...
  ```
- 또는 페이지를 스크롤 다운하면 **"Environment Variables"** 섹션이 보입니다

#### **5단계: 환경 변수 추가**
- **"Add New"** 버튼 클릭
- 또는 **"Add Environment Variable"** 버튼 클릭

---

## 🔥 **입력해야 할 값들 (API 프로젝트용)**

### **아래 3개를 입력하세요:**

---

### **1️⃣ FIREBASE_PROJECT_ID**

**Key(키):**
```
FIREBASE_PROJECT_ID
```

**Value(값):**
```
l-existence-precede-l-essence
```

**Environment(환경):**
- ✅ Production
- ✅ Preview
- ✅ Development
(모두 선택하세요!)

---

### **2️⃣ FIREBASE_CLIENT_EMAIL**

**Key(키):**
```
FIREBASE_CLIENT_EMAIL
```

**Value(값):**
```
firebase-adminsdk-fbsvc@l-existence-precede-l-essence.iam.gserviceaccount.com
```

**Environment(환경):**
- ✅ Production
- ✅ Preview
- ✅ Development
(모두 선택하세요!)

---

### **3️⃣ FIREBASE_PRIVATE_KEY** ⚠️ (가장 중요!)

**Key(키):**
```
FIREBASE_PRIVATE_KEY
```

**Value(값):** (아래 전체를 복사해서 붙여넣으세요!)
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCifE4xnwNDTVpJ
6MetrmosHEd9pPQhyBIYosu26h23B+7voqsWrhy68mVFp+or8oeBoYZq1Wcu/FqU
Dv1C1n7WB4cH+qlXMoZs61Ezm24YCu1EVj7VzVzADlTegiYoH0/skWnnsleen/1d
A1HS+gO6A7gXDRBFDE91N5RB3rGQBr42DwzIJOjpw48hQlrp8QxuQcmvYPrR1wZ2
uz50DOM6xXkwT91aq051qjoSQhGmE+5iVeUSbltokc2RFzaMg5RZ3SgDmmrqY12L
tCAFNyJ3qcX9KVRmw9jWVa84EEKT6z8skILS9HSF6DBm1ldyS7Iaa2YUPaEitogX
LZF9POjdAgMBAAECggEAAKc+Sz3H7hPYCpcIgn7Ch4XflbY9kwsyY234IrajQvKh
t83wISm3DNtfo92Od/nEKLXFDBXqkcpK9PBwfT3Oib7DALm1x5d46eQyUeJMmYUl
uhIcs5BdUJpeJfzg+WVS1XEqO1fAuW8MPjz+rbn6nNtZ+KHBUH3Brgd4raEfFqSm
qDPC71wjNmU3dPLn3zxxe7X57cY05gJMZG5Iet7p6tSsySUVzI1SsWqmr1Wof/ep
pX38eVhQTXNCXy53zoKGcDnsuRcL7C4I3pOY/9uaMMwIX2JGmJnMXhJh/+92fZKG
jNhFqYlZ58WUz0tIfh1XYVKRDDnftHfxTV3Z2QsL4wKBgQDP5AUCql3yJ9TDjjgr
AnovoQFQK41SpU4nzG+JWCOsmys/Dj2mvbwZVWyuGd5Lq5nbQOhM+gr38OhRY85r
1zpwKw13ZamvWYaPyaNmnAFMNJ97Wg1URrkog8XqkvVuMcM1d13PXBrqG6eEKCFx
VhagKRDDiaBNAHz0VUSlDDMULwKBgQDIFl5uEROlHc/ZgDpzxiAuvzQx3ROcTljf
5lxPbxSnFY34Pl8E7mzIkRcSisIsWoBHcXN0zFQvuDWPLez+OJtJV7+1ddhumDDL
OJ/zvxesGQwR4h16LEnemME/PDcTf8XLK2mWBK5dHnxX16IpPtuxmfeqB4iB8vZH
MQCElwf0swKBgDNlAcAY8kTNiBIYdNZdNGvV+Acj3TpTV7ELH3/q5FblvZlHIgK4
4Wm57rZT+trmP5EuyL9PCasmSajlbcDHYtEcM6YS4hJRpayigtz5MHDwiYTrTGRL
X7cebK2DS13Eu6faLLz43kaGM7G+YhYs3EcYH+bXfWPL/RhChEfxbidNAoGAW61E
HxJb+e+q6HFEVv+Uh1a8R4yQC7IqLoySByNSRywtHG0XhF7qIQu5kplZVpEw7Ysh
54YnnKW+hJf6WpD9NaGrCS2xuRqqYLLVNw17fzMKwLbl4rCgOAmtoZepdJm6utht
THtgmPH67xSyDEvsxXdSbul8tm3oQb5GCnpY/tkCgYEAxdUS84JbAqKwoeu71zmS
mtBGQRS6QEa5/p3maAQmpsENF+gwvf3KbeHF2b4n4oV3RFL1G2PbbUPXl1yHjU6k
7454JLHHcJ9sAVUUdYtQ9aKgoqUxaIL0ElbYDCLgE1uE4m5bbK0DR7dZiXldJcud
1S6I81OvchOVnvBQBqxiFrg=
-----END PRIVATE KEY-----
```

**Environment(환경):**
- ✅ Production
- ✅ Preview
- ✅ Development
(모두 선택하세요!)

**⚠️ 중요:** 
- 줄바꿈이 포함된 전체 텍스트를 그대로 복사해서 붙여넣으세요!
- Vercel의 환경 변수 입력란은 여러 줄 텍스트를 지원합니다!

---

## 📸 **화면에서 찾기 힌트**

### **Settings 페이지에서 보이는 것:**
```
┌─────────────────────────────────────────┐
│  Environment Variables                   │
├─────────────────────────────────────────┤
│                                          │
│  [Add New] 또는 [Add Environment Variable] │
│                                          │
│  또는 아래처럼 표가 보일 수 있습니다:    │
│                                          │
│  Key              | Value   | Environment │
│  ────────────────────────────────────── │
│  (아직 없음)                             │
│                                          │
└─────────────────────────────────────────┘
```

### **환경 변수 추가 팝업/폼:**
```
┌─────────────────────────────────────────┐
│  Add Environment Variable               │
├─────────────────────────────────────────┤
│  Key:                                   │
│  [________________]                     │
│                                         │
│  Value:                                 │
│  [________________]                     │
│  [________________]                     │
│  [________________]                     │
│                                         │
│  Environment:                           │
│  ☑ Production                           │
│  ☑ Preview                              │
│  ☑ Development                          │
│                                         │
│  [Save] [Cancel]                        │
└─────────────────────────────────────────┘
```

---

## ✅ **완료 후 확인**

### **입력 후 확인:**
1. **"Save"** 또는 **"Add"** 버튼 클릭
2. 아래처럼 3개가 모두 보여야 합니다:
   - ✅ FIREBASE_PROJECT_ID
   - ✅ FIREBASE_CLIENT_EMAIL
   - ✅ FIREBASE_PRIVATE_KEY

### **다음 단계:**
- 환경 변수를 저장한 후, **프로젝트를 다시 배포(Deploy)**해야 적용됩니다!
- 최근 배포가 있으면 **"Redeploy"** 버튼 클릭
- 또는 새로운 코드를 푸시하면 자동으로 배포됩니다

---

## 🚨 **문제 해결**

### **"Environment Variables" 메뉴가 안 보여요**
- Settings 페이지 왼쪽 사이드바를 확인하세요
- 또는 Settings 페이지에서 Ctrl+F (또는 Cmd+F)로 "Environment" 검색

### **"Add New" 버튼이 안 보여요**
- 프로젝트 소유자 또는 팀 관리자 권한이 있어야 합니다
- 다른 사람이 만든 프로젝트인 경우, 권한을 요청하세요

### **여러 줄 텍스트 입력이 안 돼요**
- `FIREBASE_PRIVATE_KEY`는 여러 줄 텍스트 입력란에 붙여넣으세요
- 일부 브라우저에서는 텍스트 영역이 자동으로 확장됩니다

---

## 📝 **체크리스트**

- [ ] Vercel 대시보드 접속
- [ ] API 프로젝트 선택
- [ ] Settings 탭 클릭
- [ ] Environment Variables 메뉴 클릭
- [ ] FIREBASE_PROJECT_ID 추가
- [ ] FIREBASE_CLIENT_EMAIL 추가
- [ ] FIREBASE_PRIVATE_KEY 추가 (여러 줄 그대로!)
- [ ] 각 환경 변수에 Production, Preview, Development 모두 체크
- [ ] 저장 후 재배포

---

**완료되면 알려주세요!** 🚀

