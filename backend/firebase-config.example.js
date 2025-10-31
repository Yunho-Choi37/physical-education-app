// Firebase 설정 예시 파일
// 실제 사용 시 이 파일을 firebase-config.js로 복사하고 실제 값을 입력하세요

module.exports = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'your-client-email@project-id.iam.gserviceaccount.com',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 'your-private-key'
};

