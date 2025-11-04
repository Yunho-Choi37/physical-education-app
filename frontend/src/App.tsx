import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Modal, Button, Form } from 'react-bootstrap';
import { Routes, Route, Link } from 'react-router-dom';
import ClassDetails from './ClassDetails';
import StudentCustomizeModal from './StudentCustomizeModal';
import { API_URL } from './config';

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
  const [positionsInitialized, setPositionsInitialized] = useState(false);
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

  const handleAdminLogin = () => {
    if (adminPassword === '159753') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true'); // localStorage에 저장
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
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
        const response = await fetch(`${API_URL}/api/classes`);
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
      const allClassNames = await fetch(`${API_URL}/api/classes`).then(r => r.json()).catch(() => classes.map((name, i) => name === '.' ? `${i + 1}반` : name));
      allClassNames[index] = nameToSave;
      
      // 화면에 표시할 때는 "." 처리
      newClasses[index] = nameToSave === `${index + 1}반` ? '.' : savedName;
      setClasses(newClasses);
      
      // API에 저장
      try {
        await fetch(`${API_URL}/api/classes`, {
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
        alert('클래스 이름 저장 중 오류가 발생했습니다.');
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
        await fetch(`${API_URL}/api/classes`, {
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
        alert('클래스 추가 중 오류가 발생했습니다.');
        return;
      }
      
      setNewClassName('');
      setShowAddClassModal(false);
    }
  };

  const handleDeleteClass = async (index: number) => {
    if (window.confirm(`정말로 ${classes[index]}를 삭제하시겠습니까? 이 클래스의 모든 학생도 삭제됩니다.`)) {
      const classId = index + 1;
      
      // 해당 클래스의 모든 학생 삭제
      try {
        const response = await fetch(`${API_URL}/api/classes/${classId}/students`);
        const students = await response.json();
        
        for (const student of students) {
          await fetch(`${API_URL}/api/students/${student.id}`, {
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
        await fetch(`${API_URL}/api/classes`, {
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
        alert('클래스 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleOpenStudentManage = async (index: number) => {
    const classId = index + 1;
    try {
      const response = await fetch(`${API_URL}/api/classes/${classId}/students`);
      const students = await response.json();
      setClassStudents(students);
      setShowStudentManageModal(index);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('학생 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleAddStudent = async (classIndex: number, count: number) => {
    const classId = classIndex + 1;
    try {
      const students = [...classStudents];
      
      for (let i = 0; i < count; i++) {
        const response = await fetch(`${API_URL}/api/classes/${classId}/students`, {
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
      alert('원 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('정말로 이 원을 삭제하시겠습니까?')) {
      try {
        await fetch(`${API_URL}/api/students/${studentId}`, {
          method: 'DELETE'
        });
        setClassStudents(classStudents.filter(s => s.id !== studentId));
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('원 삭제 중 오류가 발생했습니다.');
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
          const response = await fetch(`${API_URL}/api/classes/${classId}/students`);
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

  // 겹치지 않는 위치 생성 함수
  const generateCircularLayout = useCallback(() => {
    const positions: Array<{x: number, y: number}> = [];
    
    // 화면 크기에 따라 버튼 크기와 원 반지름 조정
    const screenWidth = screenSize.width;
    const screenHeight = screenSize.height;
    
    // 화면 중앙 좌표
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    
    // 화면 크기에 따른 설정
    let buttonSize, radius;
    
    // 기본 사이즈 증가 및 classExistence의 size 적용
    const baseSize = screenWidth < 768 ? 100 : screenWidth < 1024 ? 130 : 150; // 기본 사이즈 증가
    
    if (screenWidth < 768) {
      // 모바일: 작은 원
      buttonSize = baseSize;
      radius = Math.min(screenWidth, screenHeight) * 0.25;
    } else if (screenWidth < 1024) {
      // 태블릿: 중간 원
      buttonSize = baseSize;
      radius = Math.min(screenWidth, screenHeight) * 0.3;
    } else {
      // 데스크톱: 큰 원
      buttonSize = baseSize;
      radius = Math.min(screenWidth, screenHeight) * 0.35;
    }
    
    // 7개 반을 시계 방향으로 배치 (1반이 12시 방향)
    for (let i = 0; i < classes.length; i++) {
      // 시계 방향 각도 계산 (12시 방향부터 시작, 시계방향으로 회전)
      // 1반(0번째) = 12시 방향 (-90도), 2반(1번째) = 2시 방향, ...
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / classes.length;
      
      // 원 위의 좌표 계산
      const x = centerX + Math.cos(angle) * radius - buttonSize / 2;
      const y = centerY + Math.sin(angle) * radius - buttonSize / 2;
      
      positions.push({ x, y });
    }
    
    return positions;
  }, [classes, screenSize, classExistence]);

  useEffect(() => {
    // 위치 설정
    const positions = generateCircularLayout();
    setClassPositions(positions);
    setPositionsInitialized(true);

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

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={
          <div className="floating-classes-container">
            {/* 관리자 로그인 버튼 */}
            <div className="admin-controls">
              {!isAdmin ? (
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowAdminLogin(true)}
                  className="admin-login-btn"
                >
                  🔐 관리자 로그인
                </Button>
              ) : (
                <div className="admin-status">
                  <span className="admin-badge">관리자 모드</span>
                  <Button 
                    variant="outline-warning"
                    size="sm"
                    onClick={() => setShowAddClassModal(true)}
                    className="admin-add-class-btn"
                    style={{ marginRight: '8px' }}
                  >
                    ➕ 원 추가
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleAdminLogout}
                    className="admin-logout-btn"
                  >
                    로그아웃
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
                            background: 'rgba(102, 126, 234, 0.9)',
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
                            e.currentTarget.style.background = 'rgba(102, 126, 234, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="원 이름 수정"
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
                            background: 'rgba(40, 167, 69, 0.9)',
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
                            e.currentTarget.style.background = 'rgba(40, 167, 69, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(40, 167, 69, 0.9)';
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
                          title="원 편집"
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
                            background: 'rgba(220, 53, 69, 0.9)',
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
                            e.currentTarget.style.background = 'rgba(220, 53, 69, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(220, 53, 69, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="원 삭제"
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
        <Route path="/class/:classId" element={<ClassDetails isAdmin={isAdmin} />} />
      </Routes>

      {/* 관리자 로그인 모달 */}
      <Modal show={showAdminLogin} onHide={() => setShowAdminLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔐 관리자 로그인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>관리자 비밀번호</Form.Label>
              <Form.Control
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdminLogin(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleAdminLogin}>
            로그인
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 클래스 추가 모달 */}
      <Modal show={showAddClassModal} onHide={() => setShowAddClassModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>➕ 원 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>원 이름</Form.Label>
              <Form.Control
                type="text"
                placeholder="예: 8반"
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
            취소
          </Button>
          <Button variant="primary" onClick={handleAddClass}>
            추가
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
            👥 {showStudentManageModal !== null && classes[showStudentManageModal]} 원 이름 관리
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showStudentManageModal !== null && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <Form.Group>
                  <Form.Label>원 추가하기 (개수)</Form.Label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Form.Control
                      type="number"
                      min="1"
                      max="50"
                      placeholder="개수"
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
                          alert('1부터 50 사이의 숫자를 입력하세요.');
                        }
                      }}
                    >
                      추가
                    </Button>
                  </div>
                </Form.Group>
              </div>
              
              <div>
                <strong>현재 원 목록 ({classStudents.length}개)</strong>
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
                      원이 없습니다.
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
                          삭제
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
            닫기
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
              await fetch(`${API_URL}/api/classes/${classId}/existence`, {
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
              alert('클래스 편집 저장 중 오류가 발생했습니다.');
            }
          }}
        />
      )}

      <style>{`
        .App {
          min-height: 100vh;
          background-color: white;
          color: #333;
          position: relative;
          overflow: hidden;
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
        }
        .admin-login-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
        }
        .admin-login-btn:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .admin-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-badge {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 2px 10px rgba(40, 167, 69, 0.3);
        }
        .admin-logout-btn {
          border: 1px solid #dc3545;
          color: #dc3545;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          transition: all 0.3s ease;
        }
        .admin-logout-btn:hover {
          background: #dc3545;
          color: white;
          transform: translateY(-1px);
        }
        .admin-add-class-btn {
          border: 1px solid #ffc107;
          color: #ffc107;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          transition: all 0.3s ease;
        }
        .admin-add-class-btn:hover {
          background: #ffc107;
          color: white;
          transform: translateY(-1px);
        }
        .floating-class-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.25);
          text-align: center;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
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
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }
        .floating-class-button:hover::before {
          left: 100%;
        }
        .floating-class-button:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.35);
          transform: translateY(-8px) scale(1.05);
          border-color: rgba(255, 255, 255, 0.25);
          animation-play-state: paused;
        }
        .floating-class-button:hover .edit-hint {
          opacity: 1;
        }
        .floating-class-button:active {
          transform: translateY(-4px) scale(1.02);
          transition: all 0.1s ease;
        }
        
        /* 시계 스타일 Float 애니메이션 */
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          25% { 
            transform: translateY(-8px) rotate(0.5deg); 
          }
          50% { 
            transform: translateY(-4px) rotate(0deg); 
          }
          75% { 
            transform: translateY(-12px) rotate(-0.5deg); 
          }
        }
        
        /* 시계 방향 애니메이션 딜레이 (12시부터 시계방향) */
        .floating-class-button:nth-child(1) { animation-delay: 0s; }    /* 1반 - 12시 */
        .floating-class-button:nth-child(2) { animation-delay: 0.4s; }  /* 2반 - 2시 */
        .floating-class-button:nth-child(3) { animation-delay: 0.8s; }  /* 3반 - 4시 */
        .floating-class-button:nth-child(4) { animation-delay: 1.2s; }  /* 4반 - 6시 */
        .floating-class-button:nth-child(5) { animation-delay: 1.6s; }  /* 5반 - 8시 */
        .floating-class-button:nth-child(6) { animation-delay: 2.0s; }  /* 6반 - 10시 */
        .floating-class-button:nth-child(7) { animation-delay: 2.4s; }  /* 7반 - 12시 근처 */
        .class-text {
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* 원형 배치 반응형 디자인 */
        @media (max-width: 767px) {
          .floating-class-button {
            width: 80px;
            height: 80px;
            border-radius: 50%;
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
            border-radius: 50%;
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
            border-radius: 50%;
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
