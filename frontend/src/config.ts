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
      // Firebase Functions URL에서 끝의 /api 제거 (Express 앱이 이미 /api 경로를 사용하므로)
      if (apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.slice(0, -4);
      }
      if (typeof window !== 'undefined') {
        console.log('🔗 API URL (Firebase Functions):', apiUrl);
      }
      return apiUrl;
    }
  }

  // 기존 API URL (호환성)
  if (process.env.REACT_APP_API_URL) {
    const apiUrl = process.env.REACT_APP_API_URL;
    if (typeof window !== 'undefined') {
      console.log('🔗 API URL (환경 변수):', apiUrl);
    }
    return apiUrl;
  }

  // 로컬 개발용 Express 서버 (우선순위)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Express 서버가 실행 중인 경우 (포트 3001)
    const expressUrl = 'http://localhost:3001';
    console.log('🔗 API URL (로컬 Express 서버):', expressUrl);
    return expressUrl;
  }

  // 프로덕션 기본값 (Firebase Functions)
  // 배포 후 실제 URL로 교체 필요
  // Firebase Functions URL에서 끝의 /api 제거 (Express 앱이 이미 /api 경로를 사용하므로)
  let defaultUrl = 'https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api';
  if (defaultUrl.endsWith('/api')) {
    defaultUrl = defaultUrl.slice(0, -4);
  }
  if (typeof window !== 'undefined') {
    console.warn('⚠️ REACT_APP_FIREBASE_FUNCTIONS_URL이 설정되지 않았습니다. 기본값 사용:', defaultUrl);
    console.warn('💡 Vercel 대시보드에서 REACT_APP_FIREBASE_FUNCTIONS_URL을 설정하세요');
  }
  return defaultUrl;
};


