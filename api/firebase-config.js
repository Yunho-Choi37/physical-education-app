// Firebase 설정 - 환경 변수에서 읽어옴
// 방법 1: FIREBASE_SERVICE_ACCOUNT_JSON에 JSON 전체를 한 줄로 저장 (권장)
// 방법 2: 개별 필드 사용 (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)

let firebaseConfig;

// 방법 1: JSON 전체를 환경 변수로 저장 (가장 간단하고 확실함)
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON 파싱 실패:', error);
    firebaseConfig = null;
  }
} 
// 방법 2: 개별 필드 사용
else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  firebaseConfig = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
} else {
  firebaseConfig = null;
}

module.exports = firebaseConfig;


