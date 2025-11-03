// Firestore를 사용하는 버전의 백엔드 서버
// 로컬 개발: index.js 사용
// 프로덕션: index-firestore.js 사용

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Firebase Admin SDK 초기화
let db;
try {
  const firebaseConfig = require('./firebase-config');
  
  if (!firebaseConfig || !firebaseConfig.project_id || !firebaseConfig.client_email || !firebaseConfig.private_key) {
    throw new Error('Firebase 환경 변수가 설정되지 않았습니다.');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
  });
  db = admin.firestore();
  console.log('✅ Firestore 연결 성공');
} catch (error) {
  console.error('❌ Firestore 연결 실패:', error);
  // 프로덕션 환경에서는 프로세스를 종료하지 않고 경고만 표시
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    process.exit(1);
  }
}

// 미들웨어 설정
// CORS 설정 (모든 도메인 허용)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Firestore 연결 확인
const checkFirestoreConnection = () => {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
  }
};

// Firestore 헬퍼 함수
const getStudents = async () => {
  checkFirestoreConnection();
  const snapshot = await db.collection('students').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getStudentById = async (studentId) => {
  checkFirestoreConnection();
  const doc = await db.collection('students').doc(studentId.toString()).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const saveStudent = async (student) => {
  checkFirestoreConnection();
  const studentRef = db.collection('students').doc(student.id.toString());
  await studentRef.set(student);
  return student;
};

const deleteStudent = async (studentId) => {
  checkFirestoreConnection();
  await db.collection('students').doc(studentId.toString()).delete();
};

// 클래스 정보 관리 헬퍼 함수
const getClasses = async () => {
  checkFirestoreConnection();
  const doc = await db.collection('settings').doc('classes').get();
  if (!doc.exists) {
    // 기본값 반환
    return ['1반', '2반', '3반', '4반', '5반', '6반', '7반'];
  }
  return doc.data().classNames || ['1반', '2반', '3반', '4반', '5반', '6반', '7반'];
};

const saveClasses = async (classNames) => {
  checkFirestoreConnection();
  await db.collection('settings').doc('classes').set({ classNames });
};

// 기본 라우트
app.get('/', (req, res) => {
  res.send('백엔드 서버가 실행 중입니다. (Firestore 사용)');
});

// 헬스 체크 (배포 상태 확인용)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Firestore 연결 상태 확인
app.get('/api/health/firestore', (req, res) => {
  if (!db) {
    return res.status(503).json({ 
      ok: false, 
      error: 'Firestore가 초기화되지 않았습니다.',
      message: 'FIREBASE_SERVICE_ACCOUNT_JSON 환경 변수를 확인하세요.'
    });
  }
  res.json({ ok: true, message: 'Firestore 연결됨' });
});

// API: 모든 데이터 가져오기
app.get('/api/data', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Firestore가 연결되지 않았습니다.',
        message: 'FIREBASE_SERVICE_ACCOUNT_JSON 환경 변수를 확인하세요.'
      });
    }
    const students = await getStudents();
    res.json({ students });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ 
      error: '데이터를 가져오는 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// API: 특정 반의 학생들 가져오기
app.get('/api/classes/:classId/students', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    const allStudents = await getStudents();
    const students = allStudents.filter(student => student.classId === classId);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: '학생 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// API: 학생 추가
app.post('/api/classes/:classId/students', async (req, res) => {
  try {
    const { name } = req.body;
    const classId = parseInt(req.params.classId, 10);
    const allStudents = await getStudents();
    
    // 새 ID 생성
    const maxId = allStudents.length > 0 
      ? Math.max(...allStudents.map(s => parseInt(s.id) || 0)) 
      : 0;
    const newId = maxId + 1;
    
    const newStudent = {
      id: newId,
      name,
      classId,
      password: '0000',
      existence: {
        color: '#FF6B6B',
        shape: 'circle',
        pattern: 'solid',
        size: 1.0,
        glow: false,
        border: 'normal',
        activity: '',
        activities: [],
        energy: 60,
        personality: 'active',
        customName: '',
        records: [],
        showElectrons: false,
        showProtonsNeutrons: false,
        atom: {
          protons: [],
          neutrons: [],
          electrons: {
            kShell: [],
            lShell: [],
            mShell: [],
            valence: []
          }
        }
      }
    };
    
    await saveStudent(newStudent);
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: '학생을 추가하는 중 오류가 발생했습니다.' });
  }
});

// API: 학생 정보 수정
app.put('/api/students/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const existingStudent = await getStudentById(studentId);
    
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const updatedStudent = { ...existingStudent, ...req.body };
    await saveStudent(updatedStudent);
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: '학생 정보를 수정하는 중 오류가 발생했습니다.' });
  }
});

// API: 학생 삭제
app.delete('/api/students/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const existingStudent = await getStudentById(studentId);
    
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await deleteStudent(studentId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: '학생을 삭제하는 중 오류가 발생했습니다.' });
  }
});

// API: 학생 위치 저장
app.post('/api/students/:studentId/position', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const { x, y } = req.body;
    const existingStudent = await getStudentById(studentId);
    
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const updatedStudent = {
      ...existingStudent,
      position: { x, y }
    };
    
    await saveStudent(updatedStudent);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving position:', error);
    res.status(500).json({ error: '위치를 저장하는 중 오류가 발생했습니다.' });
  }
});

// API: 클래스 목록 조회
app.get('/api/classes', async (req, res) => {
  try {
    const classNames = await getClasses();
    res.json(classNames);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: '클래스 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// API: 클래스 목록 저장
app.put('/api/classes', async (req, res) => {
  try {
    const { classNames } = req.body;
    if (!Array.isArray(classNames)) {
      return res.status(400).json({ error: 'classNames는 배열이어야 합니다.' });
    }
    await saveClasses(classNames);
    res.json({ success: true, classNames });
  } catch (error) {
    console.error('Error saving classes:', error);
    res.status(500).json({ error: '클래스 목록을 저장하는 중 오류가 발생했습니다.' });
  }
});

// API: 클래스별 학생 위치 조회
app.get('/api/classes/:classId/positions', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    const allStudents = await getStudents();
    const classStudents = allStudents.filter(student => student.classId === classId);
    const positions = {};
    
    classStudents.forEach(student => {
      if (student.position) {
        positions[student.id] = {
          x: student.position.x,
          y: student.position.y
        };
      }
    });
    
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: '위치 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// API: 클래스별 학생 위치 삭제 (리셋용)
app.delete('/api/classes/:classId/positions', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    const allStudents = await getStudents();
    const classStudents = allStudents.filter(student => student.classId === classId);
    
    const updatePromises = classStudents.map(async (student) => {
      const updatedStudent = { ...student };
      delete updatedStudent.position;
      await saveStudent(updatedStudent);
    });
    
    await Promise.all(updatePromises);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting positions:', error);
    res.status(500).json({ error: '위치를 삭제하는 중 오류가 발생했습니다.' });
  }
});

// Vercel 서버리스 함수용 export
// Vercel에서는 포트 바인딩 없이 app만 export 해야 함
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // 로컬 개발 서버에서만 포트 바인딩
  const server = app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (error) => {
    console.error('서버 오류:', error);
  });

  server.on('listening', () => {
    console.log(`✅ 로컬 서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

