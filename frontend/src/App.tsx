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

interface Goal {
  id: string;
  title: string;
  description: string;
  items: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PurposePage = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', itemCount: 1, items: [''] });
  const [isAdmin, setIsAdmin] = useState(() => {
    // localStorage에서 관리자 토큰 확인
    const savedToken = localStorage.getItem('purposeAdminToken');
    return !!savedToken; // 토큰이 있으면 관리자로 간주 (실제 검증은 useEffect에서)
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadGoals = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiUrl()}/api/goals`);
        if (response.ok && mounted) {
          const data = await response.json();
          setGoals(data);
        }
      } catch (error) {
        if (mounted) {
          console.error('목표를 가져오는 중 오류:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadGoals();
    
    return () => {
      mounted = false;
    };
  }, []);

  // 관리자 토큰 검증 (PurposePage)
  useEffect(() => {
    const verifyAdminToken = async () => {
      const token = localStorage.getItem('purposeAdminToken');
      const expiresAt = localStorage.getItem('purposeAdminTokenExpires');
      
      if (!token) {
        setIsAdmin(false);
        return;
      }

      // 만료 시간 확인
      if (expiresAt && parseInt(expiresAt) < Date.now()) {
        console.log('⏰ 토큰 만료됨');
        setIsAdmin(false);
        localStorage.removeItem('purposeAdminToken');
        localStorage.removeItem('purposeAdminTokenExpires');
        return;
      }

      // 서버에서 토큰 검증
      try {
        const response = await fetch(`${getApiUrl()}/api/admin/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('❌ 토큰 검증 응답 파싱 오류:', parseError);
          // 파싱 오류 시 토큰이 있으면 일단 관리자로 유지
          return;
        }

        if (data.valid) {
          console.log('✅ PurposePage 토큰 검증 성공');
          setIsAdmin(true);
        } else {
          console.log('❌ PurposePage 토큰 검증 실패:', data.error);
          setIsAdmin(false);
          localStorage.removeItem('purposeAdminToken');
          localStorage.removeItem('purposeAdminTokenExpires');
        }
      } catch (error) {
        console.error('❌ PurposePage 토큰 검증 오류:', error);
        // 네트워크 오류 시 토큰이 있으면 일단 관리자로 유지
      }
    };

    verifyAdminToken();
  }, []);

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) {
      alert('목표 제목을 입력해주세요.');
      return;
    }
    try {
      const goalData = {
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        items: newGoal.items.filter(item => item.trim() !== '')
      };
      
      console.log('목표 생성 요청:', goalData);
      const apiUrl = getApiUrl();
      console.log('API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      
      console.log('응답 상태:', response.status);
      
      if (response.ok) {
        const newGoalData = await response.json();
        console.log('생성된 목표:', newGoalData);
        setGoals(prev => [newGoalData, ...prev]);
        setShowCreateModal(false);
        setNewGoal({ title: '', description: '', itemCount: 1, items: [''] });
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        console.error('목표 생성 실패:', errorData);
        alert(`목표 생성에 실패했습니다: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('목표 생성 오류:', error);
      alert(`목표 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !editingGoal.title.trim()) {
      alert('목표 제목을 입력해주세요.');
      return;
    }
    try {
      const response = await fetch(`${getApiUrl()}/api/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingGoal.title,
          description: editingGoal.description,
          items: editingGoal.items.filter(item => item.trim() !== '')
        })
      });
      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(prev => prev.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal));
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
      const response = await fetch(`${getApiUrl()}/api/goals/${goalId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
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

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const apiUrl = `${getApiUrl()}/api/admin/login`;
      console.log('🔐 관리자 로그인 시도:', apiUrl);
      console.log('🌐 현재 호스트:', window.location.hostname);
      console.log('🔗 전체 URL:', window.location.href);
      
      // 먼저 간단한 연결 테스트
      try {
        const healthCheckUrl = `${getApiUrl()}/api/health`;
        console.log('🏥 Health check 시도:', healthCheckUrl);
        const healthResponse = await fetch(healthCheckUrl, { method: 'GET' });
        console.log('🏥 Health check 응답:', healthResponse.status, healthResponse.statusText);
      } catch (healthError: any) {
        console.warn('⚠️ Health check 실패 (계속 진행):', healthError);
      }
      
      // 타임아웃을 위한 AbortController 생성
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      console.log('📤 요청 전송 시작...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
        signal: controller.signal,
      }).then((res) => {
        clearTimeout(timeoutId);
        console.log('✅ 응답 수신:', res.status, res.statusText);
        return res;
      }).catch((fetchError: any) => {
        clearTimeout(timeoutId);
        console.error('❌ Fetch 오류 상세:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
          cause: fetchError.cause
        });
        if (fetchError.name === 'AbortError' || fetchError.message === 'The user aborted a request.') {
          throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
        } else if (fetchError.name === 'TypeError' && (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError'))) {
          throw new Error(`서버에 연결할 수 없습니다. (${apiUrl})\n인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.`);
        }
        throw fetchError;
      });

      console.log('📡 응답 상태:', response.status, response.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        const text = await response.text();
        console.log('📦 응답 본문:', text);
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ JSON 파싱 오류:', parseError);
        alert(`서버 응답 오류 (${response.status}): 응답을 파싱할 수 없습니다.`);
        return;
      }

      if (response.ok && data.success) {
        console.log('✅ 로그인 성공');
        // 상태 업데이트 순서 중요: 먼저 localStorage 저장, 그 다음 상태 업데이트
        localStorage.setItem('purposeAdminToken', data.token);
        localStorage.setItem('purposeAdminTokenExpires', data.expiresAt.toString());
        setIsAdmin(true);
        setAdminPassword(''); // 비밀번호 필드 초기화
        setShowAdminLogin(false);
        console.log('✅ 관리자 모드 활성화 완료');
      } else {
        console.error('❌ 로그인 실패:', data);
        alert(data.error || '비밀번호가 올바르지 않습니다.');
        setAdminPassword(''); // 실패 시에도 비밀번호 필드 초기화
      }
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      const errorMessage = error.message || '알 수 없는 오류';
      alert(`로그인 중 오류가 발생했습니다:\n${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`);
    }
  };

  const handleAdminLogout = () => {
    console.log('🚪 로그아웃 시작');
    setIsAdmin(false);
    setAdminPassword(''); // 비밀번호 필드 초기화
    localStorage.removeItem('purposeAdminToken');
    localStorage.removeItem('purposeAdminTokenExpires');
    console.log('✅ 로그아웃 완료');
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    setAiLoading(true);
    setAiAnswer('');
    
    try {
      const response = await fetch(`${getApiUrl()}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: aiQuestion }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(errorData.error || 'AI 답변을 가져오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setAiAnswer(data.answer || '답변을 생성할 수 없습니다.');
    } catch (error) {
      console.error('AI 질문 오류:', error);
      setAiAnswer(`오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="existence-home">
      <div className="existence-search-container" style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '40px',
          width: '100%',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="existence-button"
              onClick={() => navigate('/')}
            >
              홈
            </button>
            <button
              type="button"
              className="existence-button"
              onClick={() => navigate('/being')}
            >
              존재
            </button>
            {isAdmin && (
              <button
                type="button"
                className="existence-button"
                onClick={() => setShowAIModal(true)}
              >
                질문
              </button>
            )}
          </div>
          {!isAdmin ? (
            <Button 
              variant="outline-primary" 
              onClick={() => setShowAdminLogin(true)}
              className="admin-login-btn"
              style={{ 
                background: '#f8f9fa',
                border: '1px solid #f8f9fa',
                borderRadius: '4px',
                color: '#3c4043',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                padding: '0 16px',
                height: '36px',
                minWidth: '120px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#dadce0';
                e.currentTarget.style.boxShadow = '0 1px 6px rgba(32, 33, 36, 0.28)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f8f9fa';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🔐 관리자 로그인
            </Button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ 
                background: '#191970',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '16px',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}>
                관리자 모드
              </span>
              <button
                type="button"
                className="existence-button"
                onClick={() => setShowCreateModal(true)}
              >
                + 목표 생성
              </button>
              <button
                type="button"
                className="existence-button"
                onClick={handleAdminLogout}
                style={{ minWidth: 'auto', padding: '0 12px' }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#5f6368' }}>
            <p style={{ fontSize: '1rem', margin: 0 }}>로딩 중...</p>
          </div>
        ) : goals.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 6px rgba(32, 33, 36, 0.28)'
          }}>
            <p style={{ fontSize: '1rem', color: '#5f6368', marginBottom: '24px', margin: 0 }}>
              아직 생성된 목표가 없습니다.
            </p>
            {isAdmin ? (
              <button
                type="button"
                className="existence-button"
                onClick={() => setShowCreateModal(true)}
              >
                첫 목표 만들기
              </button>
            ) : (
              <button
                type="button"
                className="existence-button"
                onClick={() => setShowAdminLogin(true)}
              >
                🔐 관리자 로그인
              </button>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '24px',
            width: '100%'
          }}>
            {goals.map((goal) => (
              <div 
                key={goal.id} 
                style={{ 
                  background: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 6px rgba(32, 33, 36, 0.28)',
                  padding: '24px',
                  transition: 'box-shadow 0.2s ease',
                  border: '1px solid #f8f9fa'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(32, 33, 36, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 6px rgba(32, 33, 36, 0.28)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e8eaed'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1.25rem', 
                    fontWeight: 500,
                    color: '#202124',
                    fontFamily: 'Roboto, sans-serif',
                    lineHeight: '1.4'
                  }}>
                    {goal.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                    <button
                      type="button"
                      className="existence-button"
                      onClick={() => handleEditClick(goal)}
                      style={{ 
                        padding: '6px 16px',
                        fontSize: '14px',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="existence-button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      style={{ 
                        padding: '6px 16px',
                        fontSize: '14px',
                        minWidth: 'auto',
                        backgroundColor: '#f8f9fa',
                        borderColor: '#dadce0',
                        color: '#d93025',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f3f4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {goal.description && (
                  <p style={{ 
                    color: '#5f6368', 
                    marginBottom: '16px',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    fontFamily: 'Roboto, sans-serif'
                  }}>
                    {goal.description}
                  </p>
                )}
                {goal.items && goal.items.length > 0 && (
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '20px',
                    color: '#202124',
                    fontSize: '0.9rem',
                    lineHeight: '1.8',
                    fontFamily: 'Roboto, sans-serif'
                  }}>
                    {goal.items.map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 목표 생성 모달 */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
          <Modal.Header closeButton style={{ fontFamily: 'Roboto, sans-serif' }}>
            <Modal.Title style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>새 목표 생성</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ fontFamily: 'Roboto, sans-serif' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>목표 제목 *</Form.Label>
              <Form.Control
                type="text"
                placeholder="목표 제목을 입력하세요"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>목표 설명</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="목표에 대한 설명을 입력하세요"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <Form.Label style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>목표 내용 항목</Form.Label>
                <button
                  type="button"
                  className="existence-button"
                  onClick={addItemToNewGoal}
                  style={{ padding: '6px 16px', fontSize: '14px', minWidth: 'auto' }}
                >
                  + 항목 추가
                </button>
              </div>
              {newGoal.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <Form.Control
                    type="text"
                    placeholder={`항목 ${index + 1}`}
                    value={item}
                    onChange={(e) => updateNewGoalItem(index, e.target.value)}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                  {newGoal.items.length > 1 && (
                    <button
                      type="button"
                      className="existence-button"
                      onClick={() => removeItemFromNewGoal(index)}
                      style={{ 
                        padding: '6px 16px', 
                        fontSize: '14px', 
                        minWidth: 'auto',
                        backgroundColor: '#f8f9fa',
                        borderColor: '#dadce0',
                        color: '#d93025',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ fontFamily: 'Roboto, sans-serif' }}>
            <button
              type="button"
              className="existence-button"
              onClick={() => setShowCreateModal(false)}
              style={{ backgroundColor: '#f8f9fa', borderColor: '#dadce0', color: '#3c4043' }}
            >
              취소
            </button>
            <button
              type="button"
              className="existence-button"
              onClick={handleCreateGoal}
            >
              생성
            </button>
          </Modal.Footer>
        </Modal>

        {/* 목표 수정 모달 */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton style={{ fontFamily: 'Roboto, sans-serif' }}>
            <Modal.Title style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>목표 수정</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ fontFamily: 'Roboto, sans-serif' }}>
            {editingGoal && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>목표 제목 *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="목표 제목을 입력하세요"
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>목표 설명</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="목표에 대한 설명을 입력하세요"
                    value={editingGoal.description}
                    onChange={(e) => setEditingGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <Form.Label style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>목표 내용 항목</Form.Label>
                    <button
                      type="button"
                      className="existence-button"
                      onClick={addItemToEditingGoal}
                      style={{ padding: '6px 16px', fontSize: '14px', minWidth: 'auto' }}
                    >
                      + 항목 추가
                    </button>
                  </div>
                  {editingGoal.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <Form.Control
                        type="text"
                        placeholder={`항목 ${index + 1}`}
                        value={item}
                        onChange={(e) => updateEditingGoalItem(index, e.target.value)}
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      />
                      <button
                        type="button"
                        className="existence-button"
                        onClick={() => removeItemFromEditingGoal(index)}
                        style={{ 
                          padding: '6px 16px', 
                          fontSize: '14px', 
                          minWidth: 'auto',
                          backgroundColor: '#f8f9fa',
                          borderColor: '#dadce0',
                          color: '#d93025',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer style={{ fontFamily: 'Roboto, sans-serif' }}>
            <button
              type="button"
              className="existence-button"
              onClick={() => setShowEditModal(false)}
              style={{ backgroundColor: '#f8f9fa', borderColor: '#dadce0', color: '#3c4043' }}
            >
              취소
            </button>
            <button
              type="button"
              className="existence-button"
              onClick={handleUpdateGoal}
            >
              저장
            </button>
          </Modal.Footer>
        </Modal>

        {/* AI 질문 모달 */}
        <Modal show={showAIModal} onHide={() => {
          setShowAIModal(false);
          setAiQuestion('');
          setAiAnswer('');
        }} size="lg" centered>
          <Modal.Header closeButton style={{ fontFamily: 'Roboto, sans-serif' }}>
            <Modal.Title style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>
              질문하기
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ fontFamily: 'Roboto, sans-serif' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>
                질문을 입력하세요
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="예: 가장 활동적인 학생은 누구인가요? 또는 전체 학생들의 평균 에너지 레벨은 얼마인가요?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAskAI();
                  }
                }}
                style={{ fontFamily: 'Roboto, sans-serif' }}
                disabled={aiLoading}
              />
              <Form.Text className="text-muted" style={{ fontSize: '0.85rem' }}>
                Ctrl + Enter로 질문을 제출할 수 있습니다.
              </Form.Text>
            </Form.Group>

            {aiLoading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: '#5f6368'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                <p style={{ margin: 0 }}>AI가 답변을 생성하는 중...</p>
              </div>
            )}

            {aiAnswer && !aiLoading && (
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e8eaed',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '16px'
              }}>
                <div style={{
                  fontWeight: 600,
                  color: '#202124',
                  marginBottom: '12px',
                  fontSize: '0.9rem'
                }}>
                  답변:
                </div>
                <div style={{
                  color: '#3c4043',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '0.95rem'
                }}>
                  {aiAnswer}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ fontFamily: 'Roboto, sans-serif' }}>
            <button
              type="button"
              className="existence-button"
              onClick={() => {
                setShowAIModal(false);
                setAiQuestion('');
                setAiAnswer('');
              }}
              style={{ backgroundColor: '#f8f9fa', borderColor: '#dadce0', color: '#3c4043' }}
              disabled={aiLoading}
            >
              닫기
            </button>
            <button
              type="button"
              className="existence-button"
              onClick={handleAskAI}
              disabled={aiLoading || !aiQuestion.trim()}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'none',
                opacity: (aiLoading || !aiQuestion.trim()) ? 0.5 : 1
              }}
            >
              {aiLoading ? '처리 중...' : '질문하기'}
            </button>
          </Modal.Footer>
        </Modal>

        {/* 관리자 로그인 모달 */}
        <Modal show={showAdminLogin} onHide={() => {
          setShowAdminLogin(false);
          setAdminPassword(''); // 모달 닫을 때 비밀번호 필드 초기화
        }} centered>
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
      </div>
    </div>
  );
};

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
  // 캔버스 관련 상태
  const classesCanvasRef = useRef<HTMLCanvasElement>(null);
  const classesContainerRef = useRef<HTMLDivElement>(null);
  const [classesCanvasSize, setClassesCanvasSize] = useState({ width: 1200, height: 800 });
  const [draggedClassIndex, setDraggedClassIndex] = useState<number | null>(null);
  const [isDraggingClass, setIsDraggingClass] = useState(false);
  const [classDragOffset, setClassDragOffset] = useState({ x: 0, y: 0 });
  const [hasDraggedClass, setHasDraggedClass] = useState(false);
  const [classDragStartPos, setClassDragStartPos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; classIndex: number } | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    // localStorage에서 관리자 토큰 확인
    const savedToken = localStorage.getItem('adminToken');
    return !!savedToken; // 토큰이 있으면 관리자로 간주 (실제 검증은 useEffect에서)
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [editingClassIndex, setEditingClassIndex] = useState<number | null>(null);
  const [editingClassName, setEditingClassName] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showStudentManageModal, setShowStudentManageModal] = useState<number | null>(null);
  const [classStudents, setClassStudents] = useState<Array<{id: number, name: string}>>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isClassView = location.pathname.startsWith('/class');
  const isLegacyView = location.pathname === '/being' || isClassView;

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const apiUrl = `${getApiUrl()}/api/admin/login`;
      console.log('🔐 관리자 로그인 시도:', apiUrl);
      console.log('🌐 현재 호스트:', window.location.hostname);
      console.log('🔗 전체 URL:', window.location.href);
      
      // 먼저 간단한 연결 테스트
      try {
        const healthCheckUrl = `${getApiUrl()}/api/health`;
        console.log('🏥 Health check 시도:', healthCheckUrl);
        const healthResponse = await fetch(healthCheckUrl, { method: 'GET' });
        console.log('🏥 Health check 응답:', healthResponse.status, healthResponse.statusText);
      } catch (healthError: any) {
        console.warn('⚠️ Health check 실패 (계속 진행):', healthError);
      }
      
      // 타임아웃을 위한 AbortController 생성
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      console.log('📤 요청 전송 시작...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
        signal: controller.signal,
      }).then((res) => {
        clearTimeout(timeoutId);
        console.log('✅ 응답 수신:', res.status, res.statusText);
        return res;
      }).catch((fetchError: any) => {
        clearTimeout(timeoutId);
        console.error('❌ Fetch 오류 상세:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
          cause: fetchError.cause
        });
        if (fetchError.name === 'AbortError' || fetchError.message === 'The user aborted a request.') {
          throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
        } else if (fetchError.name === 'TypeError' && (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError'))) {
          throw new Error(`서버에 연결할 수 없습니다. (${apiUrl})\n인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.`);
        }
        throw fetchError;
      });

      console.log('📡 응답 상태:', response.status, response.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        const text = await response.text();
        console.log('📦 응답 본문:', text);
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ JSON 파싱 오류:', parseError);
        alert(`서버 응답 오류 (${response.status}): 응답을 파싱할 수 없습니다.`);
        return;
      }

      if (response.ok && data.success) {
        console.log('✅ 로그인 성공');
        // 상태 업데이트 순서 중요: 먼저 localStorage 저장, 그 다음 상태 업데이트
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminTokenExpires', data.expiresAt.toString());
        setIsAdmin(true);
        setAdminPassword(''); // 비밀번호 필드 초기화
        setShowAdminLogin(false);
        console.log('✅ 관리자 모드 활성화 완료');
      } else {
        console.error('❌ 로그인 실패:', data);
        alert(data.error || '비밀번호가 올바르지 않습니다.');
        setAdminPassword(''); // 실패 시에도 비밀번호 필드 초기화
      }
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      const errorMessage = error.message || '알 수 없는 오류';
      alert(`로그인 중 오류가 발생했습니다:\n${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`);
      setAdminPassword(''); // 에러 발생 시에도 비밀번호 필드 초기화
    }
  };

  const handleAdminLogout = () => {
    console.log('🚪 로그아웃 시작');
    setIsAdmin(false);
    setAdminPassword(''); // 비밀번호 필드 초기화
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminTokenExpires');
    console.log('✅ 로그아웃 완료');
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    setAiLoading(true);
    setAiAnswer('');
    
    try {
      const response = await fetch(`${getApiUrl()}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: aiQuestion }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(errorData.error || 'AI 답변을 가져오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setAiAnswer(data.answer || '답변을 생성할 수 없습니다.');
    } catch (error) {
      console.error('AI 질문 오류:', error);
      setAiAnswer(`오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditClassName = (index: number) => {
    setEditingClassIndex(index);
    setEditingClassName(classes[index]);
  };

  // 클래스 위치 저장 함수
  const saveClassPosition = useCallback(async (classIndex: number, x: number, y: number) => {
    try {
      // 클래스 위치는 로컬 스토리지에 저장하거나 서버에 저장할 수 있습니다
      // 여기서는 간단히 로컬 스토리지에 저장
      const savedPositions = JSON.parse(localStorage.getItem('classPositions') || '{}');
      savedPositions[classIndex] = { x, y };
      localStorage.setItem('classPositions', JSON.stringify(savedPositions));
    } catch (error) {
      console.error('클래스 위치 저장 오류:', error);
    }
  }, []);

  // 클래스 원 그리기 함수
  const drawClasses = useCallback(() => {
    const canvas = classesCanvasRef.current;
    if (!canvas || !classesLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 고해상도 렌더링을 위한 DPI 스케일링
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // 캔버스 크기를 실제 픽셀 크기로 설정
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    // CSS 크기는 원래 크기로 유지
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // 컨텍스트 스케일링
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // 텍스트 렌더링 품질 향상
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 캔버스 클리어
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 각 클래스 원 그리기
    classes.forEach((className, index) => {
      const position = classPositions[index];
      if (!position) return;

      const existence = classExistence[index + 1];
      const baseSize = screenSize.width < 768 ? 100 : screenSize.width < 1024 ? 130 : 150;
      const size = (existence?.size || 1.0) * baseSize;
      const radius = size / 2;
      const x = position.x;
      const y = position.y;

      // 드래그 중인 원 강조
      if (draggedClassIndex === index) {
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowBlur = 0;
      }

      // 이미지가 있으면 이미지 그리기
      if (existence?.imageData && classImageLoaded[index + 1]) {
        const cache = classImageCacheRef.current;
        let cachedImage = cache.get(existence.imageData);
        
        if (!cachedImage) {
          const img = new Image();
          img.onload = () => {
            cache.set(existence.imageData!, img);
            // 이미지 로드 후 다시 그리기 (requestAnimationFrame으로 최적화)
            requestAnimationFrame(() => {
              drawClasses();
            });
          };
          img.onerror = () => {
            setClassImageLoaded(prev => ({ ...prev, [index + 1]: false }));
          };
          img.src = existence.imageData;
          cachedImage = img;
          cache.set(existence.imageData, img);
        }

        if (cachedImage.complete && cachedImage.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(cachedImage, x - radius, y - radius, size, size);
          ctx.restore();
        }
      } else {
        // 색상으로 그리기
        const color = existence?.color || '#667eea';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 테두리
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // 모양 이모티콘 (이미지가 없을 때만)
      if (!existence?.imageData && existence?.shape && existence.shape !== 'circle') {
        const emojiMap: { [key: string]: string } = {
          'square': '⬜', 'triangle': '🔺', 'star': '⭐', 'heart': '❤️',
          'smile': '😊', 'fire': '🔥', 'sun': '☀️', 'moon': '🌙',
          'rainbow': '🌈', 'flower': '🌸', 'butterfly': '🦋',
          'cat': '🐱', 'dog': '🐶', 'panda': '🐼'
        };
        const emoji = emojiMap[existence.shape];
        if (emoji) {
          ctx.font = `${radius * 0.8}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, x, y);
        }
      }

      // 클래스 이름 또는 번호
      const displayText = existence?.customName || className !== '.' ? className : `${index + 1}`;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${radius * 0.3}px "Roboto", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayText, x, y);

      ctx.shadowBlur = 0;
    });
  }, [classes, classesLoaded, classPositions, classExistence, classImageLoaded, screenSize, draggedClassIndex]);

  // drawClasses를 useEffect로 호출
  useEffect(() => {
    if (classesLoaded && classPositions.length > 0) {
      drawClasses();
    }
  }, [drawClasses, classesLoaded, classPositions]);

  // 전역 클릭으로 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // 캔버스 좌표 변환 함수
  const getClassesCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = classesCanvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    return {
      x: (clientX - rect.left) * (canvas.width / (rect.width * devicePixelRatio)),
      y: (clientY - rect.top) * (canvas.height / (rect.height * devicePixelRatio))
    };
  }, []);

  // 클래스 클릭/드래그 시작 처리
  const handleClassesPointerDown = useCallback((clientX: number, clientY: number) => {
    const coords = getClassesCanvasCoordinates(clientX, clientY);
    if (!coords) return;

    const { x, y } = coords;
    setClassDragStartPos({ x, y });
    setHasDraggedClass(false);

    const baseSize = screenSize.width < 768 ? 100 : screenSize.width < 1024 ? 130 : 150;
    const nodeSize = baseSize / 2;

    // 클릭된 클래스 찾기
    const clickedIndex = classes.findIndex((_, index) => {
      const position = classPositions[index];
      if (!position) return false;
      const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2);
      return distance <= nodeSize;
    });

    if (clickedIndex >= 0) {
      const position = classPositions[clickedIndex];
      if (position) {
        setDraggedClassIndex(clickedIndex);
        setIsDraggingClass(true);
        setClassDragOffset({
          x: x - position.x,
          y: y - position.y
        });
      }
    }
  }, [classes, classPositions, getClassesCanvasCoordinates, screenSize]);

  // 클래스 드래그 이동 처리
  const handleClassesPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingClass || draggedClassIndex === null) return;

    const coords = getClassesCanvasCoordinates(clientX, clientY);
    if (!coords) return;

    const { x, y } = coords;
    
    // 드래그 거리 계산 (5px 이상 움직였을 때만 드래그로 인식)
    const dragDistance = Math.sqrt(
      (x - classDragStartPos.x) ** 2 + (y - classDragStartPos.y) ** 2
    );
    
    if (dragDistance > 5) {
      setHasDraggedClass(true);
    }

    const newX = x - classDragOffset.x;
    const newY = y - classDragOffset.y;

    // 캔버스 경계 내로 제한
    const baseSize = screenSize.width < 768 ? 100 : screenSize.width < 1024 ? 130 : 150;
    const radius = baseSize / 2;
    const clampedX = Math.max(radius, Math.min(classesCanvasSize.width - radius, newX));
    const clampedY = Math.max(radius, Math.min(classesCanvasSize.height - radius, newY));

    const newPositions = [...classPositions];
    newPositions[draggedClassIndex] = { x: clampedX, y: clampedY };
    setClassPositions(newPositions);
  }, [isDraggingClass, draggedClassIndex, classDragOffset, classDragStartPos, getClassesCanvasCoordinates, classesCanvasSize, classPositions, screenSize]);

  // 클래스 드래그 종료 처리
  const handleClassesPointerUp = useCallback(() => {
    if (draggedClassIndex !== null && isDraggingClass && hasDraggedClass) {
      saveClassPosition(draggedClassIndex, classPositions[draggedClassIndex].x, classPositions[draggedClassIndex].y);
    }
    // 약간의 지연을 두어 클릭 이벤트 처리 후 상태 초기화
    setTimeout(() => {
      setDraggedClassIndex(null);
      setIsDraggingClass(false);
      setHasDraggedClass(false);
    }, 100);
  }, [draggedClassIndex, isDraggingClass, hasDraggedClass, classPositions, saveClassPosition]);

  // 마우스 이벤트 핸들러
  const handleClassesMouseDown = (e: React.MouseEvent) => {
    handleClassesPointerDown(e.clientX, e.clientY);
  };

  const handleClassesMouseMove = (e: React.MouseEvent) => {
    handleClassesPointerMove(e.clientX, e.clientY);
  };

  const handleClassesMouseUp = () => {
    handleClassesPointerUp();
  };

  const handleClassesMouseLeave = () => {
    handleClassesPointerUp();
  };

  // 터치 이벤트 핸들러
  const handleClassesTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleClassesPointerDown(touch.clientX, touch.clientY);
    }
  };

  const handleClassesTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleClassesPointerMove(touch.clientX, touch.clientY);
    }
  };

  const handleClassesTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleClassesPointerUp();
  };

  // 클래스 클릭 처리 (드래그가 아닐 때만)
  const handleClassesClick = useCallback((e: React.MouseEvent) => {
    // 드래그가 있었으면 클릭 무시
    if (hasDraggedClass) {
      return;
    }

    // 우클릭 메뉴 닫기
    setContextMenu(null);

    const coords = getClassesCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    const { x, y } = coords;
    const baseSize = screenSize.width < 768 ? 100 : screenSize.width < 1024 ? 130 : 150;
    const nodeSize = baseSize / 2;

    const clickedIndex = classes.findIndex((_, index) => {
      const position = classPositions[index];
      if (!position) return false;
      const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2);
      return distance <= nodeSize;
    });

    if (clickedIndex >= 0) {
      navigate(`/class/${clickedIndex + 1}`);
    }
  }, [hasDraggedClass, getClassesCanvasCoordinates, classes, classPositions, screenSize, navigate]);

  // 우클릭 메뉴 처리
  const handleClassesContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();

    const coords = getClassesCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    const { x, y } = coords;
    const baseSize = screenSize.width < 768 ? 100 : screenSize.width < 1024 ? 130 : 150;
    const nodeSize = baseSize / 2;

    const clickedIndex = classes.findIndex((_, index) => {
      const position = classPositions[index];
      if (!position) return false;
      const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2);
      return distance <= nodeSize;
    });

    if (clickedIndex >= 0) {
      setContextMenu({ x: e.clientX, y: e.clientY, classIndex: clickedIndex });
    }
  }, [isAdmin, getClassesCanvasCoordinates, classes, classPositions, screenSize]);

  // 관리자 토큰 검증
  useEffect(() => {
    const verifyAdminToken = async () => {
      const token = localStorage.getItem('adminToken');
      const expiresAt = localStorage.getItem('adminTokenExpires');
      
      if (!token) {
        setIsAdmin(false);
        return;
      }

      // 만료 시간 확인
      if (expiresAt && parseInt(expiresAt) < Date.now()) {
        setIsAdmin(false);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpires');
        return;
      }

      // 서버에서 토큰 검증
      try {
        const response = await fetch(`${getApiUrl()}/api/admin/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('❌ 토큰 검증 응답 파싱 오류:', parseError);
          // 파싱 오류 시 토큰이 있으면 일단 관리자로 유지
          return;
        }

        if (data.valid) {
          console.log('✅ App 토큰 검증 성공');
          setIsAdmin(true);
        } else {
          console.log('❌ App 토큰 검증 실패:', data.error);
          setIsAdmin(false);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminTokenExpires');
        }
      } catch (error) {
        console.error('❌ App 토큰 검증 오류:', error);
        // 네트워크 오류 시 토큰이 있으면 일단 관리자로 유지
      }
    };

    verifyAdminToken();
  }, []);

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
    const isMobile = screenWidth < 768;
    
    // 기본 사이즈
    const baseSize = isMobile ? 100 : screenWidth < 1024 ? 130 : 150;
    const buttonSize = baseSize;
    
    // 그리드 설정: 가로로 배치할 원의 개수
    const itemsPerRow = isMobile ? 2 : screenWidth < 1024 ? 3 : 4;
    const spacing = buttonSize * 1.2; // 원 사이 간격
    
    // 모바일에서는 좌측 상단부터 시작, 데스크톱에서는 중앙 정렬
    const containerWidth = isMobile ? screenWidth : 1200;
    const totalWidth = itemsPerRow * spacing;
    
    // 시작 위치: 모바일은 좌측 상단부터, 데스크톱은 중앙 정렬
    const startX = isMobile ? spacing : (containerWidth - totalWidth) / 2 + spacing / 2;
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

  // 캔버스 크기 설정
  useEffect(() => {
    const updateCanvasSize = () => {
      if (classesContainerRef.current) {
        const container = classesContainerRef.current;
        const isMobile = window.innerWidth < 768;
        const containerWidth = container.clientWidth || window.innerWidth;
        const containerHeight = isMobile 
          ? window.innerHeight - 200
          : Math.max(600, window.innerHeight * 0.6);
        
        const newSize = {
          width: Math.min(containerWidth - (isMobile ? 20 : 40), isMobile ? window.innerWidth : 1200),
          height: Math.min(containerHeight, isMobile ? window.innerHeight - 150 : 800)
        };
        
        setClassesCanvasSize(newSize);
        
        const canvas = classesCanvasRef.current;
        if (canvas) {
          const devicePixelRatio = window.devicePixelRatio || 1;
          canvas.width = newSize.width * devicePixelRatio;
          canvas.height = newSize.height * devicePixelRatio;
          canvas.style.width = newSize.width + 'px';
          canvas.style.height = newSize.height + 'px';
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    // 저장된 위치 불러오기
    try {
      const savedPositions = JSON.parse(localStorage.getItem('classPositions') || '{}');
      if (Object.keys(savedPositions).length > 0) {
        const positions = classes.map((_, index) => {
          if (savedPositions[index]) {
            return savedPositions[index];
          }
          return null;
        });
        // 일부만 저장되어 있으면 나머지는 자동 레이아웃으로 채움
        const hasAnySaved = positions.some(p => p !== null);
        if (hasAnySaved) {
          const autoLayout = generateCircularLayout();
          const finalPositions = positions.map((p, i) => p || autoLayout[i] || { x: 100, y: 100 });
          setClassPositions(finalPositions);
        } else {
          setClassPositions(generateCircularLayout());
        }
      } else {
        setClassPositions(generateCircularLayout());
      }
    } catch (error) {
      console.error('저장된 위치 불러오기 오류:', error);
      setClassPositions(generateCircularLayout());
    }

    // 화면 크기 변경 시 위치 재계산
    const handleResize = () => {
      const newPositions = generateCircularLayout();
      setClassPositions(newPositions);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [generateCircularLayout, classes]); // generateCircularLayout이 변경될 때마다 위치 재계산

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
          <div className="existence-buttons">
            <button
              type="button"
              className="existence-button"
              onClick={() => navigate('/being')}
            >
              존재
            </button>
            <button
              type="button"
              className="existence-button"
              onClick={() => navigate('/purpose')}
            >
              목적
            </button>
            {isAdmin && (
              <button
                type="button"
                className="existence-button"
                onClick={() => setShowAIModal(true)}
              >
                질문
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`App ${isLegacyView ? 'legacy-view' : 'landing-view'}`}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/being" element={
          <div className="existence-home">
            <div className="existence-search-container" style={{ width: '100%', maxWidth: '1200px', position: 'relative', minHeight: '80vh' }}>
              {/* 네비게이션 및 관리자 컨트롤 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '40px',
                width: '100%',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="existence-button"
                    onClick={() => navigate('/')}
                  >
                    홈
                  </button>
                  <button
                    type="button"
                    className="existence-button"
                    onClick={() => navigate('/purpose')}
                  >
                    목적
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="existence-button"
                      onClick={() => setShowAIModal(true)}
                    >
                      질문
                    </button>
                  )}
                </div>
                {!isAdmin ? (
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setShowAdminLogin(true)}
                    className="admin-login-btn"
                    style={{ 
                      background: '#f8f9fa',
                      border: '1px solid #f8f9fa',
                      borderRadius: '4px',
                      color: '#3c4043',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '14px',
                      padding: '0 16px',
                      height: '36px',
                      minWidth: '120px',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#dadce0';
                      e.currentTarget.style.boxShadow = '0 1px 6px rgba(32, 33, 36, 0.28)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#f8f9fa';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    🔐 관리자 로그인
                  </Button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: '#191970',
                      color: '#ffffff',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      관리자 모드
                    </span>
                    <button
                      type="button"
                      className="existence-button"
                      onClick={() => setShowAddClassModal(true)}
                      style={{ minWidth: 'auto', padding: '0 12px' }}
                    >
                      ➕ 원 추가
                    </button>
                    <button
                      type="button"
                      className="existence-button"
                      onClick={handleAdminLogout}
                      style={{ minWidth: 'auto', padding: '0 12px' }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>

              {/* 원들 컨테이너 - 캔버스로 전환 */}
              <div 
                className="floating-classes-container" 
                ref={classesContainerRef}
                style={{ position: 'relative', width: '100%', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                <canvas
                  ref={classesCanvasRef}
                  width={classesCanvasSize.width}
                  height={classesCanvasSize.height}
                  onMouseDown={handleClassesMouseDown}
                  onMouseMove={handleClassesMouseMove}
                  onMouseUp={handleClassesMouseUp}
                  onMouseLeave={handleClassesMouseLeave}
                  onClick={handleClassesClick}
                  onContextMenu={handleClassesContextMenu}
                  onTouchStart={handleClassesTouchStart}
                  onTouchMove={handleClassesTouchMove}
                  onTouchEnd={handleClassesTouchEnd}
                  style={{ 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: isDraggingClass ? 'grabbing' : 'pointer',
                    touchAction: 'none',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
                {/* 우클릭 컨텍스트 메뉴 */}
                {contextMenu && isAdmin && (
                  <div
                    style={{
                      position: 'fixed',
                      left: contextMenu.x,
                      top: contextMenu.y,
                      background: '#ffffff',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 10000,
                      minWidth: '150px',
                      padding: '8px 0'
                    }}
                    onMouseLeave={() => setContextMenu(null)}
                  >
                    <button
                      onClick={() => {
                        handleEditClassName(contextMenu.classIndex);
                        setContextMenu(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f3f4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      ✏️ 이름 수정
                    </button>
                    <button
                      onClick={() => {
                        handleOpenStudentManage(contextMenu.classIndex);
                        setContextMenu(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f3f4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      👥 학생 관리
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassIndex(contextMenu.classIndex);
                        setShowClassCustomizeModal(true);
                        setContextMenu(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f3f4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      🎨 원 편집
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteClass(contextMenu.classIndex);
                        setContextMenu(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#d93025'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fce8e6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                )}
                {/* 관리자 모드에서 편집 버튼들을 위한 오버레이 (필요시) */}
                {isAdmin && editingClassIndex !== null && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000
                  }}>
                    {/* 편집 UI는 별도 모달로 처리 */}
                  </div>
                )}
                {/* 기존 div 기반 렌더링 제거됨 - 캔버스로 대체 */}
                {/* 관리자 모드에서 우클릭 메뉴를 위한 컨텍스트 메뉴 (추후 구현 가능) */}
              </div>
            </div>
          </div>
        } />
        <Route path="/purpose" element={<PurposePage />} />
        <Route path="/class/:classId" element={<ClassDetails isAdmin={isAdmin} />} />
      </Routes>

      {/* 관리자 로그인 모달 */}
      <Modal show={showAdminLogin} onHide={() => {
        setShowAdminLogin(false);
        setAdminPassword(''); // 모달 닫을 때 비밀번호 필드 초기화
      }} centered>
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

      {/* AI 질문 모달 */}
      <Modal show={showAIModal} onHide={() => {
        setShowAIModal(false);
        setAiQuestion('');
        setAiAnswer('');
      }} size="lg" centered>
        <Modal.Header closeButton style={{ fontFamily: 'Roboto, sans-serif' }}>
          <Modal.Title style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>
            🤖 AI 질문하기
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: 'Roboto, sans-serif' }}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#202124' }}>
              질문을 입력하세요
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="예: 가장 활동적인 학생은 누구인가요? 또는 전체 학생들의 평균 에너지 레벨은 얼마인가요?"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleAskAI();
                }
              }}
              style={{ fontFamily: 'Roboto, sans-serif' }}
              disabled={aiLoading}
            />
            <Form.Text className="text-muted" style={{ fontSize: '0.85rem' }}>
              Ctrl + Enter로 질문을 제출할 수 있습니다.
            </Form.Text>
          </Form.Group>

          {aiLoading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: '#5f6368'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <p style={{ margin: 0 }}>AI가 답변을 생성하는 중...</p>
            </div>
          )}

          {aiAnswer && !aiLoading && (
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e8eaed',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <div style={{
                fontWeight: 600,
                color: '#202124',
                marginBottom: '12px',
                fontSize: '0.9rem'
              }}>
                답변:
              </div>
              <div style={{
                color: '#3c4043',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Roboto, sans-serif',
                fontSize: '0.95rem'
              }}>
                {aiAnswer}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ fontFamily: 'Roboto, sans-serif' }}>
          <button
            type="button"
            className="existence-button"
            onClick={() => {
              setShowAIModal(false);
              setAiQuestion('');
              setAiAnswer('');
            }}
            style={{ backgroundColor: '#f8f9fa', borderColor: '#dadce0', color: '#3c4043' }}
            disabled={aiLoading}
          >
            닫기
          </button>
          <button
            type="button"
            className="existence-button"
            onClick={handleAskAI}
            disabled={aiLoading || !aiQuestion.trim()}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              border: 'none',
              opacity: (aiLoading || !aiQuestion.trim()) ? 0.5 : 1
            }}
          >
            {aiLoading ? '처리 중...' : '질문하기'}
          </button>
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
                placeholder="예: 원 8"
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
                  <Form.Label>원 추가 (개수)</Form.Label>
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
                          alert('1과 50 사이의 숫자를 입력하세요.');
                        }
                      }}
                    >
                      추가
                    </Button>
                  </div>
                </Form.Group>
              </div>
              
              <div>
                <strong>현재 원 목록 ({classStudents.length})</strong>
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
                      사용 가능한 원이 없습니다.
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
          width: 100%;
          min-height: 60vh;
          overflow: visible;
        }
        @media (max-width: 768px) {
          .floating-classes-container {
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
          }
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
