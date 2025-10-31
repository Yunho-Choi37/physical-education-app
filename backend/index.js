
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // 이미지 데이터를 위한 큰 페이로드 허용
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 데이터베이스 파일 읽기 (없으면 초기화)
const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = {
            classes: [],
            students: [],
            activities: [],
            items: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
};

// 데이터베이스 파일 쓰기
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// 기본 라우트
app.get('/', (req, res) => {
    res.send('백엔드 서버가 실행 중입니다.');
});

// API: 모든 데이터 가져오기
app.get('/api/data', (req, res) => {
    const data = readDB();
    res.json(data);
});

// API: 특정 반의 학생들 가져오기
app.get('/api/classes/:classId/students', (req, res) => {
    const data = readDB();
    const classId = parseInt(req.params.classId, 10);
    const students = data.students.filter(student => student.classId === classId);
    res.json(students);
});

// API: 학생 추가
app.post('/api/classes/:classId/students', (req, res) => {
    const data = readDB();
    const { name } = req.body;
    const classId = parseInt(req.params.classId, 10);
    const newStudent = {
        id: data.students.length > 0 ? Math.max(...data.students.map(s => s.id)) + 1 : 1,
        name,
        classId,
    };
    data.students.push(newStudent);
    writeDB(data);
    res.status(201).json(newStudent);
});

// API: 학생 정보 수정
app.put('/api/students/:studentId', (req, res) => {
    const data = readDB();
    const studentId = parseInt(req.params.studentId, 10);
    const studentIndex = data.students.findIndex(student => student.id === studentId);

    if (studentIndex === -1) {
        return res.status(404).send('Student not found');
    }

    data.students[studentIndex] = { ...data.students[studentIndex], ...req.body };
    writeDB(data);
    res.json(data.students[studentIndex]);
});

// API: 학생 삭제
app.delete('/api/students/:studentId', (req, res) => {
    const data = readDB();
    const studentId = parseInt(req.params.studentId, 10);
    const studentIndex = data.students.findIndex(student => student.id === studentId);

    if (studentIndex === -1) {
        return res.status(404).send('Student not found');
    }

    data.students.splice(studentIndex, 1);
    writeDB(data);
    res.status(204).send();
});

// API: 학생 위치 저장
app.post('/api/students/:studentId/position', (req, res) => {
    const data = readDB();
    const studentId = parseInt(req.params.studentId, 10);
    const { x, y } = req.body;
    
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex === -1) {
        return res.status(404).send('Student not found');
    }

    // 학생 데이터에 위치 정보 추가
    if (!data.students[studentIndex].position) {
        data.students[studentIndex].position = {};
    }
    data.students[studentIndex].position.x = x;
    data.students[studentIndex].position.y = y;
    
    writeDB(data);
    res.json({ success: true });
});

// API: 클래스별 학생 위치 조회
app.get('/api/classes/:classId/positions', (req, res) => {
    const data = readDB();
    const classId = parseInt(req.params.classId, 10);
    
    const classStudents = data.students.filter(student => student.classId === classId);
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
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    readDB(); // 서버 시작 시 DB 파일 확인 및 초기화
});
