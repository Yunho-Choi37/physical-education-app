// API 및 환경 설정
const resolveApiUrl = (): string => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3001';
};

export const API_URL = resolveApiUrl();


