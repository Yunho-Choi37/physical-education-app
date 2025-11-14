// Firebase Functions를 사용하는 백엔드 서버
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Firebase Admin SDK 초기화 (Firebase Functions에서는 자동으로 초기화됨)
admin.initializeApp();
const db = admin.firestore();

const app = express();

// CORS 설정 (모든 도메인 허용)
app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Firebase Functions는 이미 /api 경로로 배포되므로, Express 앱 내부에서는 /api 없이 라우트 정의
// 하지만 프론트엔드가 /api/...를 호출하므로, Express 앱에 /api prefix 추가
const apiRouter = express.Router();

// Firestore 연결 확인
const checkFirestoreConnection = () => {
  if (!db) {
    const error = new Error('Firestore가 초기화되지 않았습니다.');
    error.statusCode = 503;
    throw error;
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
    // 기본값 반환 (처음 생성된 원의 이름은 "."로 표시)
    return {
      classNames: ['.', '.', '.', '.', '.', '.', '.'],
      classExistence: {}
    };
  }
  const data = doc.data();
  const classNames = data.classNames || ['.', '.', '.', '.', '.', '.', '.'];
  // 기본 이름(1반, 2반 등)이 있으면 "."로 변환
  const processedNames = classNames.map((name, index) => {
    const defaultName = `${index + 1}반`;
    return name === defaultName ? '.' : name;
  });
  return {
    classNames: processedNames,
    classExistence: data.classExistence || {}
  };
};

const saveClasses = async (classNames, classExistence = null) => {
  checkFirestoreConnection();
  const doc = await db.collection('settings').doc('classes').get();
  const currentData = doc.exists ? doc.data() : {};
  await db.collection('settings').doc('classes').set({
    classNames,
    classExistence: classExistence !== null ? classExistence : (currentData.classExistence || {})
  });
};

// 기본 라우트
app.get('/', (req, res) => {
  res.send('백엔드 서버가 실행 중입니다. (Firebase Functions 사용)');
});

// 헬스 체크 (배포 상태 확인용)
apiRouter.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Firestore 연결 상태 확인
apiRouter.get('/health/firestore', (req, res) => {
  if (!db) {
    return res.status(503).json({ 
      ok: false, 
      error: 'Firestore가 초기화되지 않았습니다.'
    });
  }
  res.json({ ok: true, message: 'Firestore 연결됨' });
});

// API: 모든 데이터 가져오기
apiRouter.get('/data', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Firestore가 연결되지 않았습니다.'
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
apiRouter.get('/classes/:classId/students', async (req, res) => {
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
apiRouter.post('/classes/:classId/students', async (req, res) => {
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
apiRouter.put('/students/:studentId', async (req, res) => {
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
apiRouter.delete('/students/:studentId', async (req, res) => {
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
apiRouter.post('/students/:studentId/position', async (req, res) => {
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
apiRouter.get('/classes', async (req, res) => {
  try {
    const classNames = await getClasses();
    res.json(classNames);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: '클래스 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// API: 클래스 목록 저장
apiRouter.put('/classes', async (req, res) => {
  try {
    const { classNames, classExistence } = req.body;
    if (!Array.isArray(classNames)) {
      return res.status(400).json({ error: 'classNames는 배열이어야 합니다.' });
    }
    await saveClasses(classNames, classExistence);
    res.json({ success: true, classNames });
  } catch (error) {
    console.error('Error saving classes:', error);
    res.status(500).json({ error: '클래스 목록을 저장하는 중 오류가 발생했습니다.' });
  }
});

// API: 특정 클래스 existence 조회
apiRouter.get('/classes/:classId/existence', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    const classesData = await getClasses();
    const existence = classesData.classExistence[classId] || null;
    res.json(existence);
  } catch (error) {
    console.error('Error fetching class existence:', error);
    res.status(500).json({ error: '클래스 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// API: 특정 클래스 existence 저장
apiRouter.put('/classes/:classId/existence', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    const { existence } = req.body;
    const classesData = await getClasses();
    classesData.classExistence[classId] = existence;
    await saveClasses(classesData.classNames, classesData.classExistence);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving class existence:', error);
    res.status(500).json({ error: '클래스 정보를 저장하는 중 오류가 발생했습니다.' });
  }
});

// API: 클래스별 학생 위치 조회
apiRouter.get('/classes/:classId/positions', async (req, res) => {
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
apiRouter.delete('/classes/:classId/positions', async (req, res) => {
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

// 목표(Purpose) 관리 헬퍼 함수
const getGoals = async () => {
  checkFirestoreConnection();
  const snapshot = await db.collection('goals').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getGoalById = async (goalId) => {
  checkFirestoreConnection();
  const doc = await db.collection('goals').doc(goalId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const saveGoal = async (goal) => {
  checkFirestoreConnection();
  if (goal.id) {
    const goalRef = db.collection('goals').doc(goal.id);
    await goalRef.set({ ...goal, updatedAt: new Date() }, { merge: true });
    return { id: goal.id, ...goal };
  } else {
    const goalRef = db.collection('goals').doc();
    const newGoal = { ...goal, createdAt: new Date(), updatedAt: new Date() };
    await goalRef.set(newGoal);
    return { id: goalRef.id, ...newGoal };
  }
};

const deleteGoal = async (goalId) => {
  checkFirestoreConnection();
  await db.collection('goals').doc(goalId).delete();
};

// API: 모든 목표 가져오기
apiRouter.get('/goals', async (req, res) => {
  try {
    const goals = await getGoals();
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: '목표를 가져오는 중 오류가 발생했습니다.' });
  }
});

// API: 목표 생성
apiRouter.post('/goals', async (req, res) => {
  try {
    const { title, description, items } = req.body;
    console.log('목표 생성 요청 받음:', { title, description, items });
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: '목표 제목은 필수입니다.' });
    }
    
    const newGoal = {
      title: title.trim(),
      description: (description || '').trim(),
      items: items || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('저장할 목표 데이터:', newGoal);
    const savedGoal = await saveGoal(newGoal);
    console.log('저장된 목표:', savedGoal);
    
    res.status(201).json(savedGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    const errorMessage = error.message || '목표를 생성하는 중 오류가 발생했습니다.';
    res.status(error.statusCode || 500).json({ error: errorMessage });
  }
});

// API: 목표 수정
apiRouter.put('/goals/:goalId', async (req, res) => {
  try {
    const goalId = req.params.goalId;
    const { title, description, items } = req.body;
    const existingGoal = await getGoalById(goalId);
    if (!existingGoal) {
      return res.status(404).json({ error: '목표를 찾을 수 없습니다.' });
    }
    const updatedGoal = {
      ...existingGoal,
      title: title || existingGoal.title,
      description: description !== undefined ? description : existingGoal.description,
      items: items !== undefined ? items : existingGoal.items,
      updatedAt: new Date()
    };
    const savedGoal = await saveGoal(updatedGoal);
    res.json(savedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: '목표를 수정하는 중 오류가 발생했습니다.' });
  }
});

// API: 목표 삭제
apiRouter.delete('/goals/:goalId', async (req, res) => {
  try {
    const goalId = req.params.goalId;
    await deleteGoal(goalId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: '목표를 삭제하는 중 오류가 발생했습니다.' });
  }
});

// API 라우터를 /api 경로에 마운트
app.use('/api', apiRouter);

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: '서버 오류가 발생했습니다.',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `경로를 찾을 수 없습니다: ${req.path}`
  });
});

// Firebase Functions로 export
exports.api = functions.https.onRequest(app);

