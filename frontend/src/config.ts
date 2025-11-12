// API 및 환경 설정
export const getApiUrl = (): string => {
  // 런타임에 항상 현재 도메인 사용 (배포 환경에서 CORS 방지)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // SSR이나 빌드 시점에만 환경 변수 또는 기본값 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  return 'http://localhost:3001';
};


