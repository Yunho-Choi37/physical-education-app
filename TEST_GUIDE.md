# 테스트 가이드

## 1. 백엔드 API 테스트

### 1.1 목표 생성 테스트
```bash
# 터미널에서 실행
curl -X POST http://localhost:5001/l-existence-precede-l-essence/us-central1/api/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 목표",
    "description": "이것은 테스트 목표입니다",
    "items": ["항목 1", "항목 2", "항목 3"]
  }'
```

또는 브라우저 개발자 도구 콘솔에서:
```javascript
fetch('http://localhost:5001/l-existence-precede-l-essence/us-central1/api/api/goals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '테스트 목표',
    description: '이것은 테스트 목표입니다',
    items: ['항목 1', '항목 2', '항목 3']
  })
}).then(r => r.json()).then(console.log);
```

### 1.2 목표 조회 테스트
```bash
curl http://localhost:5001/l-existence-precede-l-essence/us-central1/api/api/goals
```

또는 브라우저 콘솔:
```javascript
fetch('http://localhost:5001/l-existence-precede-l-essence/us-central1/api/api/goals')
  .then(r => r.json())
  .then(console.log);
```

### 1.3 목표 수정 테스트
```bash
# {goalId}를 실제 목표 ID로 교체
curl -X PUT http://localhost:5001/l-existence-precede-l-essence/us-central1/api/api/goals/{goalId} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 목표",
    "description": "수정된 설명",
    "items": ["수정된 항목 1", "수정된 항목 2"]
  }'
```

### 1.4 목표 삭제 테스트
```bash
# {goalId}를 실제 목표 ID로 교체
curl -X DELETE http://localhost:5001/l-existence-precede-l-essence/us-central1/api/api/goals/{goalId}
```

---

## 2. Purpose 페이지 UI 테스트

### 2.1 페이지 접근 테스트
1. 브라우저에서 앱 실행
2. 랜딩 페이지에서 "Purpose" 버튼 클릭
3. Purpose 페이지가 정상적으로 로드되는지 확인

### 2.2 목표 생성 테스트
1. "목표 생성" 버튼 클릭
2. 모달이 열리는지 확인
3. 다음 정보 입력:
   - 제목: "체육 활동 목표"
   - 설명: "학생들의 체육 활동을 기록하고 관리합니다"
   - 항목 추가:
     - "달리기"
     - "점프"
     - "공 던지기"
4. "생성" 버튼 클릭
5. 목표가 목록에 추가되었는지 확인

### 2.3 목표 수정 테스트
1. 생성된 목표 카드에서 "수정" 버튼 클릭
2. 모달에서 내용 수정
3. "저장" 버튼 클릭
4. 변경사항이 반영되었는지 확인

### 2.4 목표 삭제 테스트
1. 목표 카드에서 "삭제" 버튼 클릭
2. 확인 대화상자에서 "확인" 클릭
3. 목표가 목록에서 제거되었는지 확인

### 2.5 항목 추가/삭제 테스트
1. 목표 생성 또는 수정 모달 열기
2. "+ 항목 추가" 버튼 클릭
3. 새 항목 입력 필드가 추가되는지 확인
4. 항목 입력 후 "삭제" 버튼으로 제거 가능한지 확인

---

## 3. StudentCustomizeModal 목표 선택 기능 테스트

### 3.1 전자 추가 - 목표 선택 테스트
1. Being 페이지로 이동
2. 학생 원자 클릭하여 편집 모달 열기
3. "Shells" 탭 선택
4. 원하는 Shell 타입(kShell, lShell, mShell, valence)에서 "목표에서 선택" 버튼 클릭
5. 목표 선택 모달이 열리는지 확인
6. 목표 카드 클릭
7. 목표의 항목들이 전자로 추가되었는지 확인

### 3.2 직접 추가 vs 목표 선택 비교 테스트
1. 같은 Shell 타입에서 "직접 추가" 버튼으로 전자 추가
2. "목표에서 선택" 버튼으로 목표에서 전자 추가
3. 두 방식 모두 정상 작동하는지 확인

### 3.3 여러 Shell 타입 테스트
1. kShell에 목표 선택으로 전자 추가
2. lShell에 목표 선택으로 전자 추가
3. mShell에 목표 선택으로 전자 추가
4. valence에 목표 선택으로 전자 추가
5. 각 Shell 타입별로 전자가 올바르게 추가되는지 확인

### 3.4 목표가 없을 때 테스트
1. 모든 목표 삭제
2. StudentCustomizeModal에서 "목표에서 선택" 클릭
3. "생성된 목표가 없습니다" 메시지가 표시되는지 확인

---

## 4. 통합 테스트 시나리오

### 시나리오 1: 전체 워크플로우
1. Purpose 페이지에서 목표 생성
   - 제목: "체육 활동"
   - 항목: ["달리기", "점프", "공 던지기"]
2. Being 페이지로 이동
3. 학생 원자 편집 모달 열기
4. Shells 탭에서 kShell의 "목표에서 선택" 클릭
5. "체육 활동" 목표 선택
6. 3개의 전자가 추가되었는지 확인
7. 각 전자의 activity 필드가 목표 항목과 일치하는지 확인

### 시나리오 2: 목표 수정 후 반영 확인
1. Purpose 페이지에서 목표 수정 (항목 추가/삭제)
2. Being 페이지에서 학생 원자 편집
3. 기존에 추가된 전자들은 그대로 유지되는지 확인
4. 새로 목표를 선택하면 수정된 항목들이 반영되는지 확인

---

## 5. 에러 케이스 테스트

### 5.1 빈 제목으로 목표 생성 시도
- 목표 제목 없이 생성 버튼 클릭
- 에러 메시지가 표시되는지 확인

### 5.2 네트워크 오류 시뮬레이션
- 네트워크 연결 끊기
- API 호출 시 적절한 에러 처리가 되는지 확인

### 5.3 잘못된 목표 ID로 수정/삭제 시도
- 존재하지 않는 목표 ID로 수정/삭제 시도
- 적절한 에러 메시지가 표시되는지 확인

---

## 6. 브라우저 개발자 도구 확인 사항

### 6.1 콘솔 에러 확인
- F12로 개발자 도구 열기
- Console 탭에서 에러 메시지 확인
- 빨간색 에러가 없는지 확인

### 6.2 네트워크 요청 확인
- Network 탭 열기
- API 요청이 정상적으로 전송되는지 확인
- 응답 상태 코드 확인 (200, 201, 404 등)

### 6.3 상태 확인
- React DevTools 설치 시 컴포넌트 상태 확인 가능
- 목표 목록이 올바르게 로드되는지 확인

---

## 7. 체크리스트

### 백엔드 API
- [ ] 목표 생성 API 작동 확인
- [ ] 목표 조회 API 작동 확인
- [ ] 목표 수정 API 작동 확인
- [ ] 목표 삭제 API 작동 확인

### Purpose 페이지
- [ ] 페이지 로드 확인
- [ ] 목표 생성 기능 확인
- [ ] 목표 수정 기능 확인
- [ ] 목표 삭제 기능 확인
- [ ] 항목 추가/삭제 기능 확인
- [ ] 목표 목록 표시 확인

### StudentCustomizeModal
- [ ] 목표 목록 로드 확인
- [ ] 목표 선택 모달 열기 확인
- [ ] kShell에 목표 선택 기능 확인
- [ ] lShell에 목표 선택 기능 확인
- [ ] mShell에 목표 선택 기능 확인
- [ ] valence에 목표 선택 기능 확인
- [ ] 선택한 목표의 항목이 전자로 추가되는지 확인
- [ ] 목표가 없을 때 메시지 표시 확인

### 통합
- [ ] Purpose에서 생성한 목표가 StudentCustomizeModal에 표시되는지 확인
- [ ] 목표 선택 후 전자가 올바르게 추가되는지 확인
- [ ] 저장 후 다시 열었을 때 전자가 유지되는지 확인

