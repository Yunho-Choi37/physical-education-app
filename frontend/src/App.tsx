import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Card, ListGroup } from 'react-bootstrap';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import ClassDetails from './ClassDetails';
import StudentCustomizeModal from './StudentCustomizeModal';
import { getApiUrl } from './config';

interface ClassExistence {
  color: string;
  shape: string;
  pattern: string;
  size: number;
  glow: boolean;
  border: string;
  customName?: string;
  imageData?: string;
}

function App() {
  const [classes, setClasses] = useState<string[]>(['.', '.', '.', '.', '.', '.', '.']);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [classExistence, setClassExistence] = useState<Record<number, ClassExistence>>({});
  const [selectedClassIndex, setSelectedClassIndex] = useState<number | null>(null);
  const [showClassCustomizeModal, setShowClassCustomizeModal] = useState(false);
  const [classPositions, setClassPositions] = useState<Array<{x: number, y: number}>>([]);
  const [classImageLoaded, setClassImageLoaded] = useState<Record<number, boolean>>({});
  const classImageCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const [screenSize, setScreenSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1920, height: typeof window !== 'undefined' ? window.innerHeight : 1080 });
  const [isAdmin, setIsAdmin] = useState(() => {
    // localStorage에서 관리자 상태 복원
    const savedAdminState = localStorage.getItem('isAdmin');
    return savedAdminState === 'true';
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [editingClassIndex, setEditingClassIndex] = useState<number | null>(null);
  const [editingClassName, setEditingClassName] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showStudentManageModal, setShowStudentManageModal] = useState<number | null>(null);
  const [classStudents, setClassStudents] = useState<Array<{id: number, name: string}>>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isClassView = location.pathname.startsWith('/class');
  const isLegacyView = location.pathname === '/being' || isClassView;

  const handleAdminLogin = () => {
    if (adminPassword === '159753') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true'); // localStorage에 저장
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Password is incorrect.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin'); // localStorage에서 제거
  };

  const handleEditClassName = (index: number) => {
    setEditingClassIndex(index);
    setEditingClassName(classes[index]);
  };

  // 클래스 목록 불러오기
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/classes`);
        if (response.ok) {
          const classesData = await response.json();
          // 기본 이름(1반, 2반 등)이 있으면 "."로 변환
          const processedClassNames = classesData.classNames.map((name: string, index: number) => {
            const defaultName = `${index + 1}반`;
            return name === defaultName ? '.' : name;
          });
          setClasses(processedClassNames);
          const existence = classesData.classExistence || {};
          setClassExistence(existence);
          
          // 클래스 이미지 사전 로드
          Object.keys(existence).forEach((classIdStr) => {
            const classId = parseInt(classIdStr, 10);
            const imageData = existence[classId]?.imageData;
            if (imageData && imageData.startsWith('data:image')) {
              const cache = classImageCacheRef.current;
              if (!cache.has(classId)) {
                const img = new Image();
                img.onload = () => {
                  cache.set(classId, img);
                  setClassImageLoaded(prev => ({ ...prev, [classId]: true }));
                };
                img.onerror = () => {
                  console.error(`이미지 로드 실패: 클래스 ${classId}`);
                  setClassImageLoaded(prev => ({ ...prev, [classId]: false }));
                };
                img.src = imageData;
              }
            }
          });
          
          setClassesLoaded(true);
          // localStorage에도 백업 저장
          localStorage.setItem('classNames', JSON.stringify(processedClassNames));
        } else {
          console.error('Failed to fetch classes:', response.status);
          // API 실패 시 localStorage에서 불러오기 (백업)
          const saved = localStorage.getItem('classNames');
          if (saved) {
            const classNames = JSON.parse(saved);
            const processedClassNames = classNames.map((name: string, index: number) => {
              const defaultName = `${index + 1}반`;
              return name === defaultName ? '.' : name;
            });
            setClasses(processedClassNames);
          }
          setClassesLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        // 오류 발생 시 localStorage에서 불러오기 (백업)
        const saved = localStorage.getItem('classNames');
        if (saved) {
          const classNames = JSON.parse(saved);
          const processedClassNames = classNames.map((name: string, index: number) => {
            const defaultName = `${index + 1}반`;
            return name === defaultName ? '.' : name;
          });
          setClasses(processedClassNames);
        }
        setClassesLoaded(true);
      }
    };
    
    fetchClasses();
    
    // 주기적으로 클래스 목록 갱신 (다른 기기 동기화를 위한 안전장치)
    const interval = setInterval(fetchClasses, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleSaveClassName = async (index: number) => {
    if (editingClassName.trim()) {
      const newClasses = [...classes];
      const savedName = editingClassName.trim();
      // "."인 경우 기본 이름으로 저장
      const nameToSave = savedName === '.' ? `${index + 1}반` : savedName;
      
      // API에 저장할 때는 원본 이름 저장
      const allClassNames = await fetch(`${getApiUrl()}/api/classes`).then(r => r.json()).catch(() => classes.map((name, i) => name === '.' ? `${i + 1}반` : name));
      allClassNames[index] = nameToSave;
      
      // 화면에 표시할 때는 "." 처리
      newClasses[index] = nameToSave === `${index + 1}반` ? '.' : savedName;
      setClasses(newClasses);
      
      // API에 저장
      try {
        await fetch(`${getApiUrl()}/api/classes`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ classNames: allClassNames }),
        });
        
        // localStorage에도 백업 저장 (원본 저장)
        localStorage.setItem('classNames', JSON.stringify(allClassNames));
        
        // 커스텀 이벤트 발생 (같은 탭에서도 동기화되도록)
        window.dispatchEvent(new CustomEvent('classNamesUpdated', {
          detail: { classNames: allClassNames }
        }));
      } catch (error) {
        console.error('Error saving class name:', error);
        alert('Error occurred while saving class name.');
      }
      
      setEditingClassIndex(null);
      setEditingClassName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingClassIndex(null);
    setEditingClassName('');
  };

  const handleAddClass = async () => {
    if (newClassName.trim()) {
      const newClasses = [...classes, newClassName.trim()];
      setClasses(newClasses);
      
      // API에 저장
      try {
        await fetch(`${getApiUrl()}/api/classes`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ classNames: newClasses }),
        });
        
        // localStorage에도 백업 저장
        localStorage.setItem('classNames', JSON.stringify(newClasses));
        
        window.dispatchEvent(new CustomEvent('classNamesUpdated', {
          detail: { classNames: newClasses }
        }));
      } catch (error) {
        console.error('Error adding class:', error);
        alert('Error occurred while adding class.');
        return;
      }
      
      setNewClassName('');
      setShowAddClassModal(false);
    }
  };

  const handleDeleteClass = async (index: number) => {
    if (window.confirm(`Are you sure you want to delete ${classes[index]}? All students in this class will also be deleted.`)) {
      const classId = index + 1;
      
      // 해당 클래스의 모든 학생 삭제
      try {
        const response = await fetch(`${getApiUrl()}/api/classes/${classId}/students`);
        const students = await response.json();
        
        for (const student of students) {
          await fetch(`${getApiUrl()}/api/students/${student.id}`, {
            method: 'DELETE'
          });
        }
      } catch (error) {
        console.error('Error deleting students:', error);
      }
      
      // 클래스 목록에서 제거
      const newClasses = classes.filter((_, i) => i !== index);
      setClasses(newClasses);
      
      // API에 저장
      try {
        await fetch(`${getApiUrl()}/api/classes`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ classNames: newClasses }),
        });
        
        // localStorage에도 백업 저장
        localStorage.setItem('classNames', JSON.stringify(newClasses));
        
        window.dispatchEvent(new CustomEvent('classNamesUpdated', {
          detail: { classNames: newClasses }
        }));
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error occurred while deleting class.');
      }
    }
  };

  const handleOpenStudentManage = async (index: number) => {
    const classId = index + 1;
    try {
      const response = await fetch(`${getApiUrl()}/api/classes/${classId}/students`);
      const students = await response.json();
      setClassStudents(students);
      setShowStudentManageModal(index);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error occurred while loading student list.');
    }
  };

  const handleAddStudent = async (classIndex: number, count: number) => {
    const classId = classIndex + 1;
    try {
      const students = [...classStudents];
      
      for (let i = 0; i < count; i++) {
        const response = await fetch(`${getApiUrl()}/api/classes/${classId}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: '원', classId }),
        });
        const newStudent = await response.json();
        students.push(newStudent);
      }
      
      setClassStudents(students);
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error occurred while adding circle.');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this circle?')) {
      try {
        await fetch(`${getApiUrl()}/api/students/${studentId}`, {
          method: 'DELETE'
        });
        setClassStudents(classStudents.filter(s => s.id !== studentId));
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error occurred while deleting circle.');
      }
    }
  };

  // 학생 정보 업데이트 이벤트 리스너 (이름 동기화를 위해)
  useEffect(() => {
    const handleStudentUpdated = async () => {
      // 모달이 열려있을 때만 학생 목록을 다시 불러옴
      if (showStudentManageModal !== null) {
        const classId = showStudentManageModal + 1;
        try {
          const response = await fetch(`${getApiUrl()}/api/classes/${classId}/students`);
          const students = await response.json();
          setClassStudents(students);
        } catch (error) {
          console.error('Error refreshing students:', error);
        }
      }
    };
    
    // 커스텀 이벤트 리스너 추가
    window.addEventListener('studentUpdated', handleStudentUpdated);
    
    return () => {
      window.removeEventListener('studentUpdated', handleStudentUpdated);
    };
  }, [showStudentManageModal]);

  // 화면 크기 추적
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 겹치지 않는 위치 생성 함수 (그리드 레이아웃)
  const generateCircularLayout = useCallback(() => {
    const positions: Array<{x: number, y: number}> = [];
    
    // 화면 크기에 따라 버튼 크기 조정
    const screenWidth = screenSize.width;
    
    // 기본 사이즈
    const baseSize = screenWidth < 768 ? 100 : screenWidth < 1024 ? 130 : 150;
    const buttonSize = baseSize;
    
    // 그리드 설정: 가로로 배치할 원의 개수
    const itemsPerRow = screenWidth < 768 ? 2 : screenWidth < 1024 ? 3 : 4;
    const spacing = buttonSize * 1.2; // 원 사이 간격
    
    // 시작 위치 (왼쪽 상단부터)
    const startX = spacing;
    const startY = spacing;
    
    // 각 클래스를 그리드로 배치
    for (let i = 0; i < classes.length; i++) {
      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);
      
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      
      positions.push({ x, y });
    }
    
    return positions;
  }, [classes, screenSize]);

  useEffect(() => {
    // 위치 설정
    const positions = generateCircularLayout();
    setClassPositions(positions);
    // 화면 크기 변경 시 위치 재계산
    const handleResize = () => {
      const newPositions = generateCircularLayout();
      setClassPositions(newPositions);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [generateCircularLayout]); // generateCircularLayout이 변경될 때마다 위치 재계산

  const LandingPage = () => {
    const handleLogoClick = () => {
      if (location.pathname !== '/') {
        navigate('/');
      }
    };

    return (
      <div className="existence-home">
        <div className="existence-search-container">
          <h1 className="existence-logo" onClick={handleLogoClick}>
            <span className="existence-letter existence-letter-red">E</span>
            <span className="existence-letter existence-letter-dark">x</span>
            <span className="existence-letter existence-letter-green">i</span>
            <span className="existence-letter existence-letter-dark">st</span>
            <span className="existence-letter existence-letter-blue">e</span>
            <span className="existence-letter existence-letter-dark">n</span>
            <span className="existence-letter existence-letter-red">c</span>
            <span className="existence-letter existence-letter-dark">e</span>
          </h1>
          <p className="existence-subtitle">움직임을 기록하는 새로운 방식, 언제든 Being으로 이동해 보세요.</p>
          <div className="existence-buttons">
            <button
              type="button"
              className="existence-button"
              onClick={() => navigate('/being')}
            >
              Being
            </button>
            <button
              type="button"
              className="existence-button"
              onClick={() => navigate('/purpose')}
            >
              Purpose
            </button>
          </div>
        </div>
      </div>
    );
  };

  interface Goal {
    id: string;
    title: string;
    description: string;
    items: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }

  const PurposePage = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [newGoal, setNewGoal] = useState({ title: '', description: '', itemCount: 1, items: [''] });
    const apiUrl = getApiUrl();

    const fetchGoals = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/goals`);
        if (response.ok) {
          const data = await response.json();
          setGoals(data);
        }
      } catch (error) {
        console.error('목표를 가져오는 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchGoals();
    }, []);

    const handleCreateGoal = async () => {
      if (!newGoal.title.trim()) {
        alert('목표 제목을 입력해주세요.');
        return;
      }
      try {
        const goalData = {
          title: newGoal.title,
          description: newGoal.description,
          items: newGoal.items.filter(item => item.trim() !== '')
        };
        const response = await fetch(`${apiUrl}/api/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData)
        });
        if (response.ok) {
          await fetchGoals();
          setShowCreateModal(false);
          setNewGoal({ title: '', description: '', itemCount: 1, items: [''] });
        } else {
          alert('목표 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('목표 생성 오류:', error);
        alert('목표 생성 중 오류가 발생했습니다.');
      }
    };

    const handleUpdateGoal = async () => {
      if (!editingGoal || !editingGoal.title.trim()) {
        alert('목표 제목을 입력해주세요.');
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editingGoal.title,
            description: editingGoal.description,
            items: editingGoal.items.filter(item => item.trim() !== '')
          })
        });
        if (response.ok) {
          await fetchGoals();
          setShowEditModal(false);
          setEditingGoal(null);
        } else {
          alert('목표 수정에 실패했습니다.');
        }
      } catch (error) {
        console.error('목표 수정 오류:', error);
        alert('목표 수정 중 오류가 발생했습니다.');
      }
    };

    const handleDeleteGoal = async (goalId: string) => {
      if (!window.confirm('정말 이 목표를 삭제하시겠습니까?')) {
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/api/goals/${goalId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchGoals();
        } else {
          alert('목표 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('목표 삭제 오류:', error);
        alert('목표 삭제 중 오류가 발생했습니다.');
      }
    };

    const handleEditClick = (goal: Goal) => {
      setEditingGoal({ ...goal });
      setShowEditModal(true);
    };

    const addItemToNewGoal = () => {
      setNewGoal(prev => ({
        ...prev,
        itemCount: prev.itemCount + 1,
        items: [...prev.items, '']
      }));
    };

    const removeItemFromNewGoal = (index: number) => {
      setNewGoal(prev => ({
        ...prev,
        itemCount: Math.max(1, prev.itemCount - 1),
        items: prev.items.filter((_, i) => i !== index)
      }));
    };

    const updateNewGoalItem = (index: number, value: string) => {
      setNewGoal(prev => ({
        ...prev,
        items: prev.items.map((item, i) => i === index ? value : item)
      }));
    };

    const addItemToEditingGoal = () => {
      if (editingGoal) {
        setEditingGoal({
          ...editingGoal,
          items: [...editingGoal.items, '']
        });
      }
    };

    const removeItemFromEditingGoal = (index: number) => {
      if (editingGoal) {
        setEditingGoal({
          ...editingGoal,
          items: editingGoal.items.filter((_, i) => i !== index)
        });
      }
    };

    const updateEditingGoalItem = (index: number, value: string) => {
      if (editingGoal) {
        setEditingGoal({
          ...editingGoal,
          items: editingGoal.items.map((item, i) => i === index ? value : item)
        });
      }
    };

    return (
      <div className="purpose-wrapper">
        <div style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          padding: '40px 20px',
          minHeight: '100vh'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#191970',
              margin: 0
            }}>
              목표 관리
            </h1>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              style={{ 
                padding: '10px 24px',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              + 목표 생성
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>로딩 중...</p>
            </div>
          ) : goals.length === 0 ? (
            <Card style={{ padding: '60px', textAlign: 'center' }}>
              <Card.Body>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '20px' }}>
                  아직 생성된 목표가 없습니다.
                </p>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  첫 목표 만들기
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {goals.map((goal) => (
                <Card key={goal.id} style={{ marginBottom: '20px' }}>
                  <Card.Header style={{ 
                    backgroundColor: '#f8f9fa', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Card.Title style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                      {goal.title}
                    </Card.Title>
                    <div>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => handleEditClick(goal)}
                        style={{ marginRight: '8px' }}
                      >
                        수정
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {goal.description && (
                      <p style={{ color: '#666', marginBottom: '15px' }}>
                        {goal.description}
                      </p>
                    )}
                    {goal.items && goal.items.length > 0 && (
                      <ListGroup variant="flush">
                        {goal.items.map((item, index) => (
                          <ListGroup.Item key={index} style={{ padding: '8px 0' }}>
                            • {item}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* 목표 생성 모달 */}
          <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>새 목표 생성</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>목표 제목 *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="목표 제목을 입력하세요"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>목표 설명</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="목표에 대한 설명을 입력하세요"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Form.Label style={{ margin: 0 }}>목표 내용 항목</Form.Label>
                  <Button variant="outline-primary" size="sm" onClick={addItemToNewGoal}>
                    + 항목 추가
                  </Button>
                </div>
                {newGoal.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Form.Control
                      type="text"
                      placeholder={`항목 ${index + 1}`}
                      value={item}
                      onChange={(e) => updateNewGoalItem(index, e.target.value)}
                    />
                    {newGoal.items.length > 1 && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => removeItemFromNewGoal(index)}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                ))}
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleCreateGoal}>
                생성
              </Button>
            </Modal.Footer>
          </Modal>

          {/* 목표 수정 모달 */}
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>목표 수정</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {editingGoal && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>목표 제목 *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="목표 제목을 입력하세요"
                      value={editingGoal.title}
                      onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>목표 설명</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="목표에 대한 설명을 입력하세요"
                      value={editingGoal.description}
                      onChange={(e) => setEditingGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <Form.Label style={{ margin: 0 }}>목표 내용 항목</Form.Label>
                      <Button variant="outline-primary" size="sm" onClick={addItemToEditingGoal}>
                        + 항목 추가
                      </Button>
                    </div>
                    {editingGoal.items.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <Form.Control
                          type="text"
                          placeholder={`항목 ${index + 1}`}
                          value={item}
                          onChange={(e) => updateEditingGoalItem(index, e.target.value)}
                        />
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => removeItemFromEditingGoal(index)}
                        >
                          삭제
                        </Button>
                      </div>
                    ))}
                  </Form.Group>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleUpdateGoal}>
                저장
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  };

  return (
    <div className={`App ${isLegacyView ? 'legacy-view' : 'landing-view'}`}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/being" element={
          <div className="floating-classes-container">
            {/* 관리자 로그인 버튼 */}
            <div className="admin-controls">
              {!isAdmin ? (
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowAdminLogin(true)}
                  className="admin-login-btn"
                >
                  🔐 Admin Login
                </Button>
              ) : (
                <div className="admin-status">
                  <span className="admin-badge">Admin Mode</span>
                  <Button 
                    variant="outline-warning"
                    size="sm"
                    onClick={() => setShowAddClassModal(true)}
                    className="admin-add-class-btn"
                    style={{ marginRight: '8px' }}
                  >
                    ➕ Add Circle
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleAdminLogout}
                    className="admin-logout-btn"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>

            {classesLoaded && classes.map((className, index) => (
              <div
                key={`class-${index}`}
                style={{ 
                  position: 'absolute',
                  left: classPositions[index]?.x || 0,
                  top: classPositions[index]?.y || 0
                }}
              >
                {editingClassIndex === index && isAdmin ? (
                  <div className="floating-class-button">
                    <Form.Control
                      type="text"
                      value={editingClassName}
                      onChange={(e) => setEditingClassName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveClassName(index);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      onBlur={() => handleSaveClassName(index)}
                      autoFocus
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        textAlign: 'center',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        padding: 0,
                        width: '100%',
                        outline: 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Link 
                      to={`/class/${index + 1}`} 
                      style={{ 
                        textDecoration: 'none',
                        display: 'block'
                      }}
                    >
                      <div 
                        className="floating-class-button"
                        style={{
                          background: !classExistence[index + 1]?.imageData && classExistence[index + 1]?.color 
                            ? `linear-gradient(135deg, ${classExistence[index + 1].color} 0%, ${classExistence[index + 1].color}dd 100%)`
                            : undefined,
                          position: 'relative',
                          overflow: 'hidden',
                          width: `${(classExistence[index + 1]?.size || 1.0) * (screenSize.width < 768 ? 100 : screenSize.width < 1024 ? 130 : 150)}px`,
                          height: `${(classExistence[index + 1]?.size || 1.0) * (screenSize.width < 768 ? 100 : screenSize.width < 1024 ? 130 : 150)}px`,
                          fontSize: `${(classExistence[index + 1]?.size || 1.0) * (screenSize.width < 768 ? 14 : 16)}px`
                        }}
                      >
                        {classExistence[index + 1]?.imageData && classImageLoaded[index + 1] ? (
                          <img
                            src={classExistence[index + 1].imageData}
                            alt="클래스 이미지"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '50%'
                            }}
                            onError={() => {
                              setClassImageLoaded(prev => ({ ...prev, [index + 1]: false }));
                            }}
                          />
                        ) : classExistence[index + 1]?.imageData ? (
                          // 이미지 로딩 중
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: classExistence[index + 1]?.color || '#667eea',
                            borderRadius: '50%'
                          }}>
                            <span style={{ fontSize: '20px', opacity: 0.5 }}>⏳</span>
                          </div>
                        ) : null}
                        {!classExistence[index + 1]?.imageData && classExistence[index + 1]?.shape && classExistence[index + 1].shape !== 'circle' ? (
                          <span style={{ fontSize: '40px', position: 'relative', zIndex: 1 }}>
                            {classExistence[index + 1].shape === 'square' && '⬜'}
                            {classExistence[index + 1].shape === 'triangle' && '🔺'}
                            {classExistence[index + 1].shape === 'star' && '⭐'}
                            {classExistence[index + 1].shape === 'heart' && '❤️'}
                            {classExistence[index + 1].shape === 'smile' && '😊'}
                            {classExistence[index + 1].shape === 'fire' && '🔥'}
                            {classExistence[index + 1].shape === 'sun' && '☀️'}
                            {classExistence[index + 1].shape === 'moon' && '🌙'}
                            {classExistence[index + 1].shape === 'rainbow' && '🌈'}
                            {classExistence[index + 1].shape === 'flower' && '🌸'}
                            {classExistence[index + 1].shape === 'butterfly' && '🦋'}
                            {classExistence[index + 1].shape === 'cat' && '🐱'}
                            {classExistence[index + 1].shape === 'dog' && '🐶'}
                            {classExistence[index + 1].shape === 'panda' && '🐼'}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                    {isAdmin && (
                      <div style={{ 
                        position: 'absolute',
                        bottom: '-50px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 10
                      }}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClassName(index);
                          }}
                          className="edit-class-btn"
                          style={{
                            background: '#424242',
                            border: '1px solid #616161',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#e0e0e0',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#616161';
                            e.currentTarget.style.borderColor = '#757575';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#424242';
                            e.currentTarget.style.borderColor = '#616161';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Edit Circle Name"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenStudentManage(index);
                          }}
                          className="manage-students-btn"
                          style={{
                            background: '#424242',
                            border: '1px solid #616161',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#e0e0e0',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#616161';
                            e.currentTarget.style.borderColor = '#757575';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#424242';
                            e.currentTarget.style.borderColor = '#616161';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="원 관리"
                        >
                          👥
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedClassIndex(index);
                            setShowClassCustomizeModal(true);
                          }}
                          className="customize-class-btn"
                          style={{
                            background: 'rgba(255, 193, 7, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 193, 7, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 193, 7, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Edit Circle"
                        >
                          🎨
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClass(index);
                          }}
                          className="delete-class-btn"
                          style={{
                            background: '#424242',
                            border: '1px solid #616161',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#e0e0e0',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#616161';
                            e.currentTarget.style.borderColor = '#757575';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#424242';
                            e.currentTarget.style.borderColor = '#616161';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Delete Circle"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        } />
        <Route path="/purpose" element={<PurposePage />} />
        <Route path="/class/:classId" element={<ClassDetails isAdmin={isAdmin} />} />
      </Routes>

      {/* 관리자 로그인 모달 */}
      <Modal show={showAdminLogin} onHide={() => setShowAdminLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔐 Admin Login</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Admin Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdminLogin(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdminLogin}>
            Login
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 클래스 추가 모달 */}
      <Modal show={showAddClassModal} onHide={() => setShowAddClassModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>➕ Add Circle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Circle Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Circle 8"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddClassModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddClass}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 원 이름 관리 모달 */}
      <Modal 
        show={showStudentManageModal !== null} 
        onHide={() => setShowStudentManageModal(null)} 
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            👥 {showStudentManageModal !== null && classes[showStudentManageModal]} Circle Name Management
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showStudentManageModal !== null && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <Form.Group>
                  <Form.Label>Add Circle (Count)</Form.Label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Form.Control
                      type="number"
                      min="1"
                      max="50"
                      placeholder="Count"
                      id="student-count-input"
                      style={{ width: '120px' }}
                    />
                    <Button
                      variant="success"
                      onClick={() => {
                        const input = document.getElementById('student-count-input') as HTMLInputElement;
                        const count = parseInt(input.value) || 1;
                        if (count > 0 && count <= 50) {
                          handleAddStudent(showStudentManageModal, count);
                          input.value = '';
                        } else {
                          alert('Please enter a number between 1 and 50.');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </Form.Group>
              </div>
              
              <div>
                <strong>Current Circle List ({classStudents.length})</strong>
                <div style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  marginTop: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '10px'
                }}>
                  {classStudents.length === 0 ? (
                    <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                      No circles available.
                    </div>
                  ) : (
                    classStudents.map((student) => (
                      <div
                        key={student.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px',
                          borderBottom: '1px solid #eee',
                          marginBottom: '5px'
                        }}
                      >
                        <span>{student.name}</span>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStudentManageModal(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 클래스 편집 모달 */}
      {selectedClassIndex !== null && (
        <StudentCustomizeModal
          student={{
            id: selectedClassIndex + 1,
            name: classes[selectedClassIndex],
            classId: selectedClassIndex + 1,
            existence: classExistence[selectedClassIndex + 1] ? {
              color: classExistence[selectedClassIndex + 1].color,
              shape: classExistence[selectedClassIndex + 1].shape,
              pattern: classExistence[selectedClassIndex + 1].pattern,
              size: classExistence[selectedClassIndex + 1].size,
              glow: classExistence[selectedClassIndex + 1].glow,
              border: classExistence[selectedClassIndex + 1].border,
              activity: '',
              activities: [],
              energy: 60,
              personality: 'active',
              customName: classExistence[selectedClassIndex + 1].customName,
              imageData: classExistence[selectedClassIndex + 1].imageData,
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
            } : undefined
          }}
          show={showClassCustomizeModal}
          onHide={() => {
            setShowClassCustomizeModal(false);
            setSelectedClassIndex(null);
          }}
          onSave={async (updatedStudent) => {
            const classId = selectedClassIndex + 1;
            const existence: ClassExistence = {
              color: updatedStudent.existence?.color || '#667eea',
              shape: updatedStudent.existence?.shape || 'circle',
              pattern: updatedStudent.existence?.pattern || 'solid',
              size: updatedStudent.existence?.size || 1.0,
              glow: updatedStudent.existence?.glow || false,
              border: updatedStudent.existence?.border || 'normal',
              customName: updatedStudent.existence?.customName,
              imageData: updatedStudent.existence?.imageData
            };
            
            try {
              await fetch(`${getApiUrl()}/api/classes/${classId}/existence`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ existence }),
              });
              
              const updatedClassExistence = {
                ...classExistence,
                [classId]: existence
              };
              
              setClassExistence(updatedClassExistence);
              
              // 이미지가 있으면 사전 로드
              if (existence.imageData && existence.imageData.startsWith('data:image')) {
                const cache = classImageCacheRef.current;
                if (!cache.has(classId)) {
                  const img = new Image();
                  img.onload = () => {
                    cache.set(classId, img);
                    setClassImageLoaded(prev => ({ ...prev, [classId]: true }));
                  };
                  img.onerror = () => {
                    console.error(`이미지 로드 실패: 클래스 ${classId}`);
                    setClassImageLoaded(prev => ({ ...prev, [classId]: false }));
                  };
                  img.src = existence.imageData;
                } else {
                  setClassImageLoaded(prev => ({ ...prev, [classId]: true }));
                }
              } else {
                setClassImageLoaded(prev => ({ ...prev, [classId]: false }));
              }
              
              setShowClassCustomizeModal(false);
              setSelectedClassIndex(null);
            } catch (error) {
              console.error('Error saving class existence:', error);
              alert('Error occurred while saving class edit.');
            }
          }}
        />
      )}

      <style>{`
        .App {
          min-height: 100vh;
          position: relative;
          font-family: 'Roboto', sans-serif;
          color: #202124;
        }
        .App.landing-view {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: clamp(48px, 8vh, 96px) 0 120px;
          overflow-x: hidden;
        }
        .App.legacy-view {
          background: radial-gradient(circle at top, #ffffff 0%, #f4f6fb 55%, #eef1f9 100%);
          overflow: hidden;
        }
        .existence-home {
          width: 100%;
          max-width: 1040px;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 56px;
        }
        .existence-search-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .existence-logo {
          font-size: clamp(60px, 8vw, 88px);
          font-weight: 800;
          letter-spacing: -0.04em;
          margin: 0;
          cursor: pointer;
        }
        .existence-subtitle {
          margin: 0;
          font-size: 1rem;
          color: #5f6368;
          text-align: center;
        }
        .existence-letter {
          display: inline-block;
        }
        .existence-letter-dark { color: #FFD700; } /* 노란색으로 변경 */
        .existence-letter-gray { color: #5f6368; }
        .existence-letter-green { color: #188038; }
        .existence-letter-blue { color: #1a73e8; }
        .existence-letter-red { color: #d93025; }
        .existence-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 8px;
        }
        .existence-button {
          background-color: #f8f9fa;
          border: 1px solid #f8f9fa;
          border-radius: 4px;
          color: #3c4043;
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 27px;
          height: 36px;
          min-width: 120px;
          padding: 0 16px;
          margin: 11px 4px;
          cursor: pointer;
          user-select: none;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .existence-button:hover {
          border-color: #dadce0;
          box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
          transform: translateY(-1px);
        }
        @media (max-width: 480px) {
          .existence-buttons {
            width: 100%;
            max-width: 360px;
            flex-wrap: nowrap;
            justify-content: space-between;
            gap: 0;
          }
          .existence-button {
            flex: 1 1 auto;
            min-width: auto;
            padding: 0 10px;
            margin: 6px 2px;
            font-size: 12px;
            height: 34px;
            line-height: 25px;
          }
        }
        @media (max-width: 768px) {
          .App.landing-view {
            padding: 64px 0 80px;
          }
          .existence-home {
            padding: 0 16px;
            gap: 40px;
          }
        }
        .purpose-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #f5f7ff 0%, #eef2fb 100%);
        }
        .purpose-empty {
          width: 100%;
          height: 100%;
        }
        @media (max-width: 600px) {
          .existence-home {
            padding-top: 64px;
          }
        }
        .floating-classes-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        .admin-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .admin-login-btn {
          background: #ffffff;
          border: 1px solid #dfe1e5;
          color: #191970;
          padding: 10px 20px;
          border-radius: 24px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(25, 25, 112, 0.08);
          transition: all 0.25s ease;
        }
        .admin-login-btn:hover {
          background: #e8f0fe;
          border-color: #c7d2ff;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(25, 25, 112, 0.15);
        }
        .admin-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #dfe1e5;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(66, 133, 244, 0.08);
        }
        .admin-badge {
          background: #191970;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.4px;
        }
        .admin-logout-btn,
        .admin-add-class-btn {
          border: 1px solid transparent;
          color: #191970;
          background: #ffffff;
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 6px 18px rgba(25, 25, 112, 0.08);
        }
        .admin-logout-btn:hover,
        .admin-add-class-btn:hover {
          background: #e8f0fe;
          color: #0b3d91;
          transform: translateY(-1px);
        }
        .floating-class-button {
          background: #ffffff;
          color: #202124;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 18px 45px rgba(25, 25, 112, 0.18);
          text-align: center;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
          border: 2px solid rgba(25, 25, 112, 0.12);
          backdrop-filter: blur(14px);
          overflow: hidden;
          animation: float 3s ease-in-out infinite;
        }
        .floating-class-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(66, 133, 244, 0.22), transparent);
          transition: left 0.6s;
        }
        .floating-class-button:hover::before {
          left: 100%;
        }
        .floating-class-button:hover {
          background: linear-gradient(135deg, #ffffff 0%, #f3f6ff 100%);
          box-shadow: 0 22px 60px rgba(25, 25, 112, 0.22);
          transform: translateY(-10px) scale(1.06);
          border-color: rgba(25, 25, 112, 0.3);
          animation-play-state: paused;
        }
        .floating-class-button:active {
          transform: translateY(-6px) scale(1.02);
          transition: all 0.15s ease;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(0.4deg);
          }
          50% {
            transform: translateY(-4px) rotate(0deg);
          }
          75% {
            transform: translateY(-12px) rotate(-0.4deg);
          }
        }
        .floating-class-button:nth-child(1) { animation-delay: 0s; }
        .floating-class-button:nth-child(2) { animation-delay: 0.4s; }
        .floating-class-button:nth-child(3) { animation-delay: 0.8s; }
        .floating-class-button:nth-child(4) { animation-delay: 1.2s; }
        .floating-class-button:nth-child(5) { animation-delay: 1.6s; }
        .floating-class-button:nth-child(6) { animation-delay: 2.0s; }
        .floating-class-button:nth-child(7) { animation-delay: 2.4s; }
        .class-text {
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          font-family: 'Roboto', sans-serif;
          color: #191970;
        }
        @media (max-width: 767px) {
          .floating-class-button {
            width: 80px;
            height: 80px;
          }
          .class-text {
            font-size: 0.8rem;
            font-weight: 700;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .floating-class-button {
            width: 100px;
            height: 100px;
          }
          .class-text {
            font-size: 0.9rem;
            font-weight: 700;
          }
        }
        @media (min-width: 1024px) {
          .floating-class-button {
            width: 120px;
            height: 120px;
          }
          .class-text {
            font-size: 1rem;
            font-weight: 700;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
