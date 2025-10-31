// Firebase 설정
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase 웹 설정
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC9C-7RIE5JQUNWU7Emjf3UR9mBDkLLgQg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "l-existence-precede-l-essence.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "l-existence-precede-l-essence",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "l-existence-precede-l-essence.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "213007609767",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:213007609767:web:59b4c1280b3f69b04c5082",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-S15HFHCBTH"
};

// Firebase 초기화
let app: FirebaseApp;
let db: Firestore;
let analytics: Analytics | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // Analytics는 브라우저 환경에서만 초기화
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (analyticsError) {
      console.warn('Analytics 초기화 실패 (선택사항):', analyticsError);
    }
  }
  
  console.log('✅ Firebase 초기화 성공');
} catch (error) {
  console.error('❌ Firebase 초기화 실패:', error);
  // 기본값으로 빈 객체 생성 (타입 에러 방지)
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { app, db, analytics };

