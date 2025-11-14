// API 및 환경 설정
export const getApiUrl = (): string => {
  // Firebase Functions URL (환경 변수 우선)
  if (process.env.REACT_APP_FIREBASE_FUNCTIONS_URL) {
    let apiUrl = process.env.REACT_APP_FIREBASE_FUNCTIONS_URL;
    
    // 잘못된 Firebase Console URL 감지 및 차단
    if (apiUrl.includes('console.firebase.google.com')) {
      console.error('❌ 잘못된 Firebase Console URL이 감지되었습니다:', apiUrl);
      console.error('💡 올바른 Firebase Functions URL 형식: https://[region]-[project-id].cloudfunctions.net/api');
      console.warn('⚠️ 기본 Firebase Functions URL을 사용합니다.');
    } else {
      // Firebase Functions URL 그대로 사용 (함수 이름이 'api'이고 Express 앱이 /api에 마운트됨)
      // 전체 경로: ...cloudfunctions.net/api/api/goals
      if (typeof window !== 'undefined') {
        console.log('🔗 API URL (Firebase Functions):', apiUrl);
      }
      return apiUrl;
    }
  }

  // 기존 API URL (호환성 - 사용 중단 예정)
  if (process.env.REACT_APP_API_URL) {
    const apiUrl = process.env.REACT_APP_API_URL;
    if (typeof window !== 'undefined') {
      console.log('🔗 API URL (환경 변수):', apiUrl);
    }
    return apiUrl;
  }

  // 프로덕션 기본값 (Firebase Functions)
  // 로컬 개발에서도 Firebase Functions 사용 (에뮬레이터 사용 가능)
  // 함수 이름이 'api'이고 Express 앱이 /api에 마운트되므로 URL에 /api 포함
  const defaultUrl = 'https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api';
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') {
      console.log('🔗 API URL (Firebase Functions - 로컬 개발):', defaultUrl);
      console.log('💡 로컬 개발 시 Firebase Functions 에뮬레이터를 사용하려면 REACT_APP_FIREBASE_FUNCTIONS_URL을 설정하세요');
    } else {
      console.warn('⚠️ REACT_APP_FIREBASE_FUNCTIONS_URL이 설정되지 않았습니다. 기본값 사용:', defaultUrl);
    }
  }
  return defaultUrl;
};


