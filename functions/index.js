// Firebase Functions를 사용하는 백엔드 서버
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

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

// 관리자 비밀번호 해시 생성 함수 (초기 설정용)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 관리자 비밀번호 검증 및 토큰 발급
apiRouter.post('/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: '비밀번호를 입력해주세요.' });
    }

    // Firestore에서 관리자 설정 가져오기
    const adminDoc = await db.collection('settings').doc('admin').get();
    
    let hashedPassword;
    if (!adminDoc.exists) {
      // 처음 설정하는 경우: 비밀번호를 해시화하여 저장
      hashedPassword = hashPassword('159753'); // 기본 비밀번호
      await db.collection('settings').doc('admin').set({
        passwordHash: hashedPassword,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      hashedPassword = adminDoc.data().passwordHash;
    }

    // 비밀번호 검증
    const inputHash = hashPassword(password);
    if (inputHash !== hashedPassword) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }

    // 토큰 생성 (간단한 JWT 스타일 토큰)
    const tokenPayload = {
      admin: true,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7일 유효
    };
    
    // 간단한 토큰 생성 (실제 프로덕션에서는 JWT 라이브러리 사용 권장)
    const secret = process.env.ADMIN_SECRET || 'default-secret-key-change-in-production';
    const token = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(tokenPayload))
      .digest('hex');
    
    const fullToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64') + '.' + token;

    res.json({ 
      success: true,
      token: fullToken,
      expiresAt: tokenPayload.expiresAt
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

// 관리자 토큰 검증
apiRouter.post('/admin/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ valid: false, error: '토큰이 없습니다.' });
    }

    try {
      const [payloadBase64, signature] = token.split('.');
      if (!payloadBase64 || !signature) {
        return res.status(400).json({ valid: false, error: '토큰 형식이 올바르지 않습니다.' });
      }

      const tokenPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      
      // 만료 시간 확인
      if (tokenPayload.expiresAt < Date.now()) {
        return res.status(401).json({ valid: false, error: '토큰이 만료되었습니다.' });
      }

      // 서명 검증
      const secret = process.env.ADMIN_SECRET || 'default-secret-key-change-in-production';
      const expectedSignature = crypto.createHmac('sha256', secret)
        .update(JSON.stringify(tokenPayload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return res.status(401).json({ valid: false, error: '토큰이 유효하지 않습니다.' });
      }

      res.json({ valid: true, admin: true });
    } catch (error) {
      return res.status(400).json({ valid: false, error: '토큰 파싱 오류' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ valid: false, error: '토큰 검증 중 오류가 발생했습니다.' });
  }
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

// Gemini AI 초기화 함수 (런타임에만 실행)
const getGeminiClient = () => {
  try {
    // 환경 변수 우선
    let apiKey = process.env.GEMINI_API_KEY;
    
    // 환경 변수가 없으면 functions.config() 사용 (안전하게)
    if (!apiKey) {
      try {
        const config = functions.config();
        apiKey = config && config.gemini && config.gemini.api_key;
      } catch (configError) {
        console.warn('Functions config 읽기 실패:', configError.message);
      }
    }
    
    if (!apiKey || !apiKey.trim()) {
      console.error('Gemini API 키가 설정되지 않았습니다.');
      return null;
    }
    
    // API 키 유효성 검사
    if (!apiKey.startsWith('AIza')) {
      console.error('잘못된 API 키 형식입니다.');
      return null;
    }
    
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Gemini 초기화 오류:', error);
    return null;
  }
};

// 데이터베이스 컨텍스트 수집 함수
const getDatabaseContext = async () => {
  try {
    const [studentsSnapshot, classesDoc, goalsSnapshot] = await Promise.all([
      db.collection('students').get(),
      db.collection('settings').doc('classes').get(),
      db.collection('goals').get()
    ]);

    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const classesData = classesDoc.exists ? classesDoc.data() : { classNames: [], classExistence: {} };
    const goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let context = '=== 체육 교육 앱 데이터베이스 정보 ===\n\n';
    
    // 클래스 정보
    context += '## 클래스 정보\n';
    if (classesData.classNames && classesData.classNames.length > 0) {
      classesData.classNames.forEach((name, index) => {
        const classId = index + 1;
        const existence = classesData.classExistence?.[classId];
        context += `- 클래스 ${classId}: ${name === '.' ? `${classId}반` : name}\n`;
        if (existence) {
          context += `  - 색상: ${existence.color || '없음'}\n`;
          context += `  - 형태: ${existence.shape || '없음'}\n`;
          context += `  - 크기: ${existence.size || 1.0}\n`;
          if (existence.customName) {
            context += `  - 사용자 정의 이름: ${existence.customName}\n`;
          }
        }
      });
    }
    context += '\n';

    // 학생 정보
    context += '## 학생 정보\n';
    if (students.length > 0) {
      students.forEach(student => {
        context += `- 학생 ID ${student.id}: ${student.name || '이름 없음'}\n`;
        context += `  - 클래스 ID: ${student.classId || '없음'}\n`;
        
        if (student.existence) {
          const ex = student.existence;
          // 원의 이름 (customName) - 학생을 식별하는 중요한 정보
          if (ex.customName && ex.customName.trim()) {
            context += `  - 원의 이름: ${ex.customName}\n`;
          }
          context += `  - 현재 활동: ${ex.activity || '없음'}\n`;
          context += `  - 에너지 레벨: ${ex.energy || 60}/100\n`;
          context += `  - 개성: ${ex.personality || '없음'}\n`;
          
          // 총 활동 시간 계산
          let totalActivityTime = 0;
          
          // records에서 duration 합산
          if (ex.records && ex.records.length > 0) {
            const recordsDuration = ex.records.reduce((sum, record) => {
              return sum + (parseInt(record.duration) || 0);
            }, 0);
            totalActivityTime += recordsDuration;
          }
          
          // atom.electrons에서 activityTime 합산
          if (ex.atom && ex.atom.electrons) {
            const e = ex.atom.electrons;
            const allElectronActivities = [
              ...(e.kShell || []),
              ...(e.lShell || []),
              ...(e.mShell || []),
              ...(e.valence || [])
            ];
            const electronActivityTime = allElectronActivities.reduce((sum, activity) => {
              return sum + (parseInt(activity.activityTime) || 0);
            }, 0);
            totalActivityTime += electronActivityTime;
          }
          
          // 총 활동 시간 표시
          if (totalActivityTime > 0) {
            context += `  - 총 활동 시간: ${totalActivityTime}분\n`;
          }
          
          if (ex.activities && ex.activities.length > 0) {
            context += `  - 활동 기록: ${ex.activities.join(', ')}\n`;
          }
          
          if (ex.records && ex.records.length > 0) {
            context += `  - 상세 기록 (최근 ${Math.min(5, ex.records.length)}개):\n`;
            ex.records.slice(-5).forEach(record => {
              context += `    * 날짜: ${record.date || '날짜 없음'}, 활동: ${record.activity || '활동 없음'}, 시간: ${record.duration || 0}분, 메모: ${record.notes || '메모 없음'}\n`;
            });
            // 전체 기록의 총 시간도 표시
            const allRecordsDuration = ex.records.reduce((sum, record) => {
              return sum + (parseInt(record.duration) || 0);
            }, 0);
            if (allRecordsDuration > 0) {
              context += `  - 기록된 총 활동 시간: ${allRecordsDuration}분 (${ex.records.length}개 기록)\n`;
            }
            // 모든 기록의 날짜 목록도 포함
            const allDates = ex.records
              .map(record => record.date)
              .filter(date => date && date.trim())
              .filter((date, index, self) => self.indexOf(date) === index) // 중복 제거
              .sort();
            if (allDates.length > 0) {
              context += `  - 활동 날짜 목록: ${allDates.join(', ')}\n`;
            }
          }
          
          if (ex.atom) {
            const atom = ex.atom;
            if (atom.protons && atom.protons.length > 0) {
              context += `  - 핵심 특성 (양성자):\n`;
              atom.protons.forEach((p, idx) => {
                context += `    ${idx + 1}. ${p.keyword} (강도: ${p.strength}/5)\n`;
                if (p.description && p.description.trim()) {
                  context += `       설명: ${p.description}\n`;
                }
                if (p.hashtags && p.hashtags.length > 0) {
                  context += `       해시태그: ${p.hashtags.join(', ')}\n`;
                }
              });
            }
            if (atom.neutrons && atom.neutrons.length > 0) {
              context += `  - 균형적 특성 (중성자):\n`;
              atom.neutrons.forEach((n, idx) => {
                context += `    ${idx + 1}. ${n.keyword} (카테고리: ${n.category})\n`;
                if (n.description && n.description.trim()) {
                  context += `       설명: ${n.description}\n`;
                }
                if (n.hashtags && n.hashtags.length > 0) {
                  context += `       해시태그: ${n.hashtags.join(', ')}\n`;
                }
              });
            }
            if (atom.electrons) {
              const e = atom.electrons;
              const allActivities = [
                ...(e.kShell || []).map(a => `K:${a.activity}(${a.frequency}/7)`),
                ...(e.lShell || []).map(a => `L:${a.activity}(${a.frequency}/7)`),
                ...(e.mShell || []).map(a => `M:${a.activity}(${a.frequency}/7)`),
                ...(e.valence || []).map(a => `V:${a.activity}(${a.cooperation}/5)`),
              ];
              if (allActivities.length > 0) {
                context += `  - 활동 에너지 준위 요약: ${allActivities.join(', ')}\n`;
              }
              
              // 전자 활동 상세 정보 (설명 및 해시태그 포함)
              const electronShells = [
                { name: 'K 껍질 (필수 활동)', activities: e.kShell || [] },
                { name: 'L 껍질 (선택 활동)', activities: e.lShell || [] },
                { name: 'M 껍질 (특별 활동)', activities: e.mShell || [] },
                { name: '원자가 전자 (사회적 결합 활동)', activities: e.valence || [] }
              ];
              
                  electronShells.forEach(shell => {
                if (shell.activities.length > 0) {
                  context += `  - ${shell.name}:\n`;
                  shell.activities.forEach((activity, idx) => {
                    const freqOrCoop = activity.frequency !== undefined 
                      ? `빈도: ${activity.frequency}/7` 
                      : `협력도: ${activity.cooperation}/5`;
                    context += `    ${idx + 1}. ${activity.activity} (${freqOrCoop})\n`;
                    if (activity.description && activity.description.trim()) {
                      context += `       설명: ${activity.description}\n`;
                    }
                    if (activity.hashtags && activity.hashtags.length > 0) {
                      context += `       해시태그: ${activity.hashtags.join(', ')}\n`;
                    }
                    if (activity.activityTime && activity.activityTime > 0) {
                      context += `       활동 시간: ${activity.activityTime}분\n`;
                    }
                    if (activity.date && activity.date.trim()) {
                      context += `       활동 날짜: ${activity.date}\n`;
                    }
                  });
                }
              });
              
              // 전자 활동의 총 시간 계산 및 표시
              const allElectronActivities = [
                ...(e.kShell || []),
                ...(e.lShell || []),
                ...(e.mShell || []),
                ...(e.valence || [])
              ];
              const electronActivityTime = allElectronActivities.reduce((sum, activity) => {
                return sum + (parseInt(activity.activityTime) || 0);
              }, 0);
              if (electronActivityTime > 0) {
                context += `  - 전자 활동 총 시간: ${electronActivityTime}분 (${allElectronActivities.length}개 활동)\n`;
              }
            }
          }
        }
        context += '\n';
      });
    } else {
      context += '- 등록된 학생이 없습니다.\n\n';
    }

    // 목표 정보
    context += '## 목표 정보\n';
    if (goals.length > 0) {
      goals.forEach(goal => {
        context += `- 목표: ${goal.title || '제목 없음'}\n`;
        if (goal.description) {
          context += `  - 설명: ${goal.description}\n`;
        }
        if (goal.items && goal.items.length > 0) {
          context += `  - 항목:\n`;
          goal.items.forEach((item, idx) => {
            context += `    ${idx + 1}. ${item}\n`;
          });
        }
        context += '\n';
      });
    } else {
      context += '- 등록된 목표가 없습니다.\n\n';
    }

    return context;
  } catch (error) {
    console.error('Error getting database context:', error);
    return '데이터베이스 정보를 가져오는 중 오류가 발생했습니다.';
  }
};

// API: AI 질문 답변
apiRouter.post('/ai/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || !question.trim()) {
      return res.status(400).json({ error: '질문을 입력해주세요.' });
    }

    // Gemini 클라이언트 초기화 (런타임에만 실행)
    const geminiClient = getGeminiClient();
    if (!geminiClient) {
      return res.status(500).json({ 
        error: 'Gemini API 키가 설정되지 않았습니다.',
        hint: '환경 변수 GEMINI_API_KEY를 설정하거나 firebase functions:config:set gemini.api_key="YOUR_API_KEY"를 실행하세요.'
      });
    }

    // 데이터베이스 컨텍스트 가져오기
    const context = await getDatabaseContext();
    
    // 사용 가능한 모델 목록 확인 (디버깅용)
    let availableModelNames = [];
    try {
      console.log('🔍 listModels() 호출 시작...');
      const modelsResponse = await geminiClient.listModels();
      console.log('📦 listModels() 응답 타입:', typeof modelsResponse);
      console.log('📦 listModels() 전체 응답:', JSON.stringify(modelsResponse));
      
      if (modelsResponse && modelsResponse.models) {
        availableModelNames = modelsResponse.models.map(m => m.name || m).filter(Boolean);
        console.log('✅ 사용 가능한 모델 목록:', availableModelNames);
      } else if (modelsResponse && Array.isArray(modelsResponse)) {
        availableModelNames = modelsResponse.map(m => m.name || m).filter(Boolean);
        console.log('✅ 사용 가능한 모델 목록 (배열):', availableModelNames);
      } else {
        console.warn('⚠️ listModels() 응답 형식이 예상과 다릅니다. 전체 응답:', JSON.stringify(modelsResponse));
      }
    } catch (listError) {
      console.error('❌ 모델 목록 조회 실패:', listError.message);
      console.error('❌ 에러 스택:', listError.stack);
      // listModels 실패해도 계속 진행
    }
    
    // Gemini 모델 초기화 및 API 호출
    // 사용 가능한 모델이 있으면 그것부터 시도, 없으면 기본 모델 시도
    let modelsToTry = [];
    if (availableModelNames.length > 0) {
      // listModels로 확인된 모델 사용
      modelsToTry = availableModelNames.slice(0, 10); // 더 많은 모델 시도
      console.log('📋 확인된 모델로 시도:', modelsToTry);
    } else {
      // 기본 모델 시도 (최신 Gemini API 모델명)
      modelsToTry = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'models/gemini-1.5-flash-latest',
        'models/gemini-1.5-pro-latest',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro',
        'models/gemini-pro'
      ];
      console.log('📋 기본 모델로 시도:', modelsToTry);
    }
    
    // 프롬프트 구성
    const prompt = `당신은 체육 교육 앱의 데이터베이스 정보를 바탕으로 질문에 답변하는 AI 어시스턴트입니다.

${context}

위 정보를 바탕으로 다음 질문에 친절하고 정확하게 답변해주세요. 한국어로 답변해주세요.

질문: ${question}

답변:`;

    let answer = null;
    let lastError = null;
    
    // 여러 모델 시도
    for (const modelName of modelsToTry) {
      try {
        console.log(`모델 시도: ${modelName}`);
        const model = geminiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
        console.log(`✅ 모델 ${modelName} 성공`);
        break; // 성공하면 루프 종료
      } catch (modelError) {
        console.error(`❌ 모델 ${modelName} 실패:`, modelError.message);
        lastError = modelError;
        continue; // 다음 모델 시도
      }
    }
    
    if (!answer) {
      throw new Error(`모든 모델 시도 실패. 마지막 에러: ${lastError?.message || '알 수 없는 오류'}. 사용 가능한 모델을 확인하세요.`);
    }

    res.json({ 
      answer,
      question,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'AI 답변 생성 중 오류가 발생했습니다.',
      details: error.message,
      type: error.constructor.name
    });
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

