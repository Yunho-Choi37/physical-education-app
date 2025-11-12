// API 및 환경 설정
export const getApiUrl = (): string => {
  // 환경 변수가 설정되어 있으면 우선 사용 (별도 백엔드 프로젝트인 경우)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 환경 변수가 없으면 현재 도메인 사용 (같은 프로젝트에 백엔드가 있는 경우)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // SSR이나 빌드 시점 기본값
  return 'http://localhost:3001';
};


