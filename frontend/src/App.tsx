import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Modal, Button, Form } from 'react-bootstrap';
import { Routes, Route, Link } from 'react-router-dom';
import ClassDetails from './ClassDetails';

function App() {
  const classes = ['1반', '2반', '3반', '4반', '5반', '6반', '7반'];
  const [classPositions, setClassPositions] = useState<Array<{x: number, y: number}>>([]);
  const [positionsInitialized, setPositionsInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    // localStorage에서 관리자 상태 복원
    const savedAdminState = localStorage.getItem('isAdmin');
    return savedAdminState === 'true';
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

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

  useEffect(() => {
    // 겹치지 않는 위치 생성 함수
    const generateCircularLayout = () => {
      const positions: Array<{x: number, y: number}> = [];
      
      // 화면 크기에 따라 버튼 크기와 원 반지름 조정
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // 화면 중앙 좌표
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;
      
      // 화면 크기에 따른 설정
      let buttonSize, radius;
      
      if (screenWidth < 768) {
        // 모바일: 작은 원
        buttonSize = 80;
        radius = Math.min(screenWidth, screenHeight) * 0.25;
      } else if (screenWidth < 1024) {
        // 태블릿: 중간 원
        buttonSize = 100;
        radius = Math.min(screenWidth, screenHeight) * 0.3;
      } else {
        // 데스크톱: 큰 원
        buttonSize = 120;
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
    };

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
  }, []);

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

            {classes.map((className, index) => (
              <Link 
                key={className} 
                to={`/class/${index + 1}`} 
                style={{ 
                  textDecoration: 'none',
                  position: 'absolute',
                  left: classPositions[index]?.x || 0,
                  top: classPositions[index]?.y || 0
                }}
              >
                <div className="floating-class-button">
                  <span className="class-text">{className}</span>
                </div>
              </Link>
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
