// API 및 환경 설정
export const getApiUrl = (): string => {
  // 환경 변수가 설정되어 있으면 우선 사용 (별도 백엔드 프로젝트인 경우)
  if (process.env.REACT_APP_API_URL) {
    const apiUrl = process.env.REACT_APP_API_URL;
    if (typeof window !== 'undefined') {
      console.log('🔗 API URL (환경 변수):', apiUrl);
    }
    return apiUrl;
  }

  // 환경 변수가 없으면 현재 도메인 사용 (같은 프로젝트에 백엔드가 있는 경우)
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    console.warn('⚠️ REACT_APP_API_URL 환경 변수가 설정되지 않았습니다. 현재 도메인 사용:', currentOrigin);
    console.warn('💡 Vercel 대시보드에서 REACT_APP_API_URL을 백엔드 URL로 설정하세요 (예: https://existence37.vercel.app)');
    return currentOrigin;
  }

  // SSR이나 빌드 시점 기본값
  return 'http://localhost:3001';
};


