// API 및 환경 설정
export const getApiUrl = (): string => {
  // Firebase Functions URL (환경 변수 우선)
  if (process.env.REACT_APP_FIREBASE_FUNCTIONS_URL) {
    const apiUrl = process.env.REACT_APP_FIREBASE_FUNCTIONS_URL;
    if (typeof window !== 'undefined') {
      console.log('🔗 API URL (Firebase Functions):', apiUrl);
    }
    return apiUrl;
  }

  // 기존 API URL (호환성)
  if (process.env.REACT_APP_API_URL) {
    const apiUrl = process.env.REACT_APP_API_URL;
    if (typeof window !== 'undefined') {
      console.log('🔗 API URL (환경 변수):', apiUrl);
    }
    return apiUrl;
  }

  // 로컬 개발용 Firebase Functions Emulator
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    const localUrl = 'http://localhost:5001/l-existence-precede-l-essence/us-central1/api';
    console.log('🔗 API URL (로컬 개발):', localUrl);
    return localUrl;
  }

  // 프로덕션 기본값 (Firebase Functions)
  // 배포 후 실제 URL로 교체 필요
  const defaultUrl = 'https://us-central1-l-existence-precede-l-essence.cloudfunctions.net/api';
  if (typeof window !== 'undefined') {
    console.warn('⚠️ REACT_APP_FIREBASE_FUNCTIONS_URL이 설정되지 않았습니다. 기본값 사용:', defaultUrl);
    console.warn('💡 Vercel 대시보드에서 REACT_APP_FIREBASE_FUNCTIONS_URL을 설정하세요');
  }
  return defaultUrl;
};


