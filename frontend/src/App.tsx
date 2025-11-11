import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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

interface ActivityRecord {
  activity?: string;
  duration?: number;
  notes?: string;
  description?: string;
  date?: string;
}

interface StudentSnapshot {
  id: number;
  name: string;
  classId: number;
  existence?: {
    color?: string;
    shape?: string;
    pattern?: string;
    size?: number;
    glow?: boolean;
    border?: string;
    customName?: string;
    imageData?: string;
    records?: ActivityRecord[];
  };
}

interface SearchResultItem {
  student: StudentSnapshot;
  className: string;
  matchedRecords: ActivityRecord[];
}

const normalizeTagValue = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const primaryToken = trimmed
    .split(/[\s,]+/)
    .find((segment) => segment.replace(/[#\s]/g, '').length > 0);

  if (!primaryToken) {
    return '';
  }

  const withHash = primaryToken.startsWith('#') ? primaryToken : `#${primaryToken}`;
  const cleaned = withHash.replace(/[,.;:!?~\u3001\u3002\uff0c\uff01\uff1f\uff1b\uff1a]+$/gu, '');

  if (cleaned === '#') {
    return '';
  }

  return cleaned.toLowerCase();
};

interface AtomHashtagEntry {
  tag: string;
  contexts: string[];
}

const collectAtomHashtags = (existence: any): AtomHashtagEntry[] => {
  if (!existence?.atom) return [];

  const contextMap = new Map<string, Set<string>>();

  const registerTags = (items: any[] | undefined, baseContext: string) => {
    if (!Array.isArray(items)) return;
    items.forEach((item: any, index: number) => {
      const rawTags = Array.isArray(item?.hashtags)
        ? item.hashtags
        : typeof item?.hashtags === 'string'
          ? [item.hashtags]
          : [];

      const contextLabel = item?.name
        ? `${baseContext} · ${item.name}`
        : `${baseContext}${typeof index === 'number' ? ` #${index + 1}` : ''}`;

      rawTags.forEach((rawTag: string) => {
        const normalized = normalizeTagValue(rawTag);
        if (!normalized) return;
        if (!contextMap.has(normalized)) {
          contextMap.set(normalized, new Set());
        }
        contextMap.get(normalized)!.add(contextLabel);
      });
    });
  };

  registerTags(existence.atom.protons, 'Proton');
  registerTags(existence.atom.neutrons, 'Neutron');
  const electrons = existence.atom.electrons || {};
  registerTags(electrons.kShell, 'Electron K-shell');
  registerTags(electrons.lShell, 'Electron L-shell');
  registerTags(electrons.mShell, 'Electron M-shell');
  registerTags(electrons.valence, 'Electron Valence');

  return Array.from(contextMap.entries()).map(([tag, contextsSet]) => ({
    tag,
    contexts: Array.from(contextsSet)
  }));
};

const createAtomMatchRecords = (entries: AtomHashtagEntry[], normalizedTag: string): ActivityRecord[] => {
  const match = entries.find((entry) => entry.tag === normalizedTag);
  if (!match) return [];

  return match.contexts.map((context) => ({
    activity: normalizedTag,
    notes: `${context} ${normalizedTag}`,
    description: context,
    date: '',
    duration: 0
  }));
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputCompositionRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isClassView = location.pathname.startsWith('/class');
  const isLegacyView = location.pathname === '/being' || isClassView;

  const updateSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchError) {
      setSearchError(null);
    }
  }, [searchError]);

  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (searchInputCompositionRef.current) {
      return;
    }
    updateSearchQuery(event.target.value);
  }, [updateSearchQuery]);

  const handleSearchInput = useCallback((event: React.FormEvent<HTMLInputElement>) => {
    if (searchInputCompositionRef.current) {
      return;
    }
    updateSearchQuery(event.currentTarget.value);
  }, [updateSearchQuery]);

  const handleCompositionStart = useCallback(() => {
    searchInputCompositionRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLInputElement>) => {
    searchInputCompositionRef.current = false;
    updateSearchQuery(event.currentTarget.value);
  }, [updateSearchQuery]);

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

  const getDisplayClassName = useCallback((classId: number) => {
    const name = classes[classId - 1];
    if (!name || name === '.') {
      return `${classId}반`;
    }
    return name;
  }, [classes]);

  const normalizeTag = useCallback(normalizeTagValue, []);

  const handleSearchSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeTag(searchQuery);
    if (!normalized) {
      setSearchError('검색어를 입력해주세요.');
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      const response = await fetch(`${API_URL}/api/data`);
      if (!response.ok) {
        throw new Error('학생 데이터를 불러오지 못했습니다.');
      }

      const payload = await response.json();
      let rawStudents: any = Array.isArray(payload?.students)
        ? payload.students
        : Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data?.students)
            ? payload.data.students
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

      if (!Array.isArray(rawStudents)) {
        rawStudents = [];
      }

      const results: SearchResultItem[] = [];
      (rawStudents as any[]).forEach((rawStudent) => {
        if (!rawStudent) return;
        const numericId = typeof rawStudent.id === 'string' ? parseInt(rawStudent.id, 10) : Number(rawStudent.id);
        const numericClassId = typeof rawStudent.classId === 'string' ? parseInt(rawStudent.classId, 10) : Number(rawStudent.classId);
        if (!numericId || !numericClassId) return;

        const existence = rawStudent.existence || {};
        const records: ActivityRecord[] = Array.isArray(existence.records) ? existence.records : [];
        const recordMatches = records.filter((record) => {
          if (!record) return false;
          const possibleTexts = [record.notes, record.description, record.activity]
            .filter(Boolean)
            .map((text) => (typeof text === 'string' ? text.toLowerCase() : ''));
          return possibleTexts.some((text) => text.includes(normalized));
        });

        const atomHashtagEntries = collectAtomHashtags(existence);
        const atomMatches = createAtomMatchRecords(atomHashtagEntries, normalized);
        const combinedMatches = [...recordMatches, ...atomMatches];

        if (combinedMatches.length > 0) {
          const snapshot: StudentSnapshot = {
            id: numericId,
            name: rawStudent.name || `학생 ${numericId}`,
            classId: numericClassId,
            existence,
          };

          results.push({
            student: snapshot,
            className: getDisplayClassName(numericClassId),
            matchedRecords: combinedMatches,
          });
        }
      });

      results.sort((a, b) => {
        const aDate = a.matchedRecords[0]?.date ? new Date(a.matchedRecords[0].date).getTime() : 0;
        const bDate = b.matchedRecords[0]?.date ? new Date(b.matchedRecords[0].date).getTime() : 0;
        return bDate - aDate;
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('검색 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [getDisplayClassName, normalizeTag, searchQuery]);

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
        alert('Error occurred while deleting class.');
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
      alert('Error occurred while loading student list.');
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
      alert('Error occurred while adding circle.');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this circle?')) {
      try {
        await fetch(`${API_URL}/api/students/${studentId}`, {
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

  const getPreviewEmoji = (shape?: string | null) => {
    switch (shape) {
      case 'square':
        return '⬜';
      case 'triangle':
        return '🔺';
      case 'star':
        return '⭐';
      case 'heart':
        return '❤️';
      case 'smile':
        return '😊';
      case 'fire':
        return '🔥';
      case 'sun':
        return '☀️';
      case 'moon':
        return '🌙';
      case 'rainbow':
        return '🌈';
      case 'flower':
        return '🌸';
      case 'butterfly':
        return '🦋';
      case 'cat':
        return '🐱';
      case 'dog':
        return '🐶';
      case 'panda':
        return '🐼';
      default:
        return null;
    }
  };

  const renderCirclePreview = (existence?: StudentSnapshot['existence']) => {
    const color = existence?.color || '#4ECDC4';
    const imageData = existence?.imageData;
    const emoji = getPreviewEmoji(existence?.shape);

    return (
      <div
        className="existence-circle-preview"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        }}
      >
        {imageData ? (
          <img src={imageData} alt="existence preview" />
        ) : emoji ? (
          <span>{emoji}</span>
        ) : (
          <span>◎</span>
        )}
      </div>
    );
  };

  const truncate = (text: string, length = 140) => (
    text.length > length ? `${text.slice(0, length)}…` : text
  );

  const LandingPage = () => {
    const handleLogoClick = () => {
      if (location.pathname !== '/') {
        navigate('/');
      }
      updateSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setSearchError(null);
      setIsSearching(false);
    };

    const renderResults = () => {
      if (!hasSearched) {
        if (searchError && !isSearching) {
          return (
            <div className="existence-feedback existence-feedback--error">
              {searchError}
            </div>
          );
        }
        return null;
      }

      if (isSearching) {
        return <div className="existence-feedback">검색 중입니다...</div>;
      }

      if (searchError) {
        return (
          <div className="existence-feedback existence-feedback--error">
            {searchError}
          </div>
        );
      }

      if (searchResults.length === 0) {
        return (
          <div className="existence-feedback existence-feedback--empty">
            검색 결과가 없습니다.
          </div>
        );
      }

      return (
        <div className="existence-result-grid">
          {searchResults.map((result) => {
            const primaryRecord = result.matchedRecords[0];
            const snippetSource =
              typeof primaryRecord?.notes === 'string'
                ? primaryRecord.notes
                : typeof primaryRecord?.description === 'string'
                  ? primaryRecord.description
                  : typeof primaryRecord?.activity === 'string'
                    ? primaryRecord.activity
                    : '';
            const snippet = snippetSource
              ? truncate(snippetSource, 140)
              : `${normalizeTag(searchQuery) || '#주제'} 기록을 확인해 보세요.`;

            return (
              <div
                className="existence-result-card"
                key={`${result.student.id}-${result.className}`}
              >
                <div className="existence-result-avatar">
                  {renderCirclePreview(result.student.existence)}
                </div>
                <div className="existence-result-body">
                  <div className="existence-result-header">
                    <h3>{result.student.name}</h3>
                    <span>{result.className}</span>
                  </div>
                  <p className="existence-result-snippet">{snippet}</p>
                  <div className="existence-result-meta">
                    {primaryRecord?.date && <span>{primaryRecord.date}</span>}
                    {typeof primaryRecord?.duration === 'number' && primaryRecord.duration > 0 && (
                      <span>{primaryRecord.duration}분</span>
                    )}
                  </div>
                  <div className="existence-result-actions">
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => navigate(`/class/${result.student.classId}`)}
                    >
                      원 보기
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="existence-home">
        <div className="existence-search-container">
          <h1 className="existence-logo" onClick={handleLogoClick}>
            <span className="existence-letter existence-letter-red">e</span>
            <span className="existence-letter existence-letter-dark">x</span>
            <span className="existence-letter existence-letter-green">i</span>
            <span className="existence-letter existence-letter-dark">st</span>
            <span className="existence-letter existence-letter-blue">e</span>
            <span className="existence-letter existence-letter-dark">n</span>
            <span className="existence-letter existence-letter-red">c</span>
            <span className="existence-letter existence-letter-dark">e</span>
          </h1>
          <form className="existence-search-form" onSubmit={handleSearchSubmit}>
            <div className="existence-search-bar">
              <input
                type="text"
                value={searchQuery}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onChange={handleSearchInputChange}
                onInput={handleSearchInput}
                placeholder="#주제를 입력해주세요"
                className="existence-search-input"
              />
            </div>
            <div className="existence-buttons">
              <button type="submit" className="existence-button">
                검색
              </button>
              <button
                type="button"
                className="existence-button"
                onClick={() => {
                  navigate('/being');
                }}
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
          </form>
          {searchError && !hasSearched && (
            <div className="existence-feedback existence-feedback--error">
              {searchError}
            </div>
          )}
          <div className="existence-helper" />
        </div>
        <div className="existence-results-container">
          {renderResults()}
        </div>
      </div>
    );
  };

  const PurposePage = () => (
    <div className="purpose-wrapper purpose-empty" />
  );

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
        .existence-letter {
          display: inline-block;
        }
        .existence-letter-dark { color: #1f2937; }
        .existence-letter-gray { color: #5f6368; }
        .existence-letter-green { color: #188038; }
        .existence-letter-blue { color: #1a73e8; }
        .existence-letter-red { color: #d93025; }
        .existence-search-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .existence-search-bar {
          width: 100%;
          max-width: 560px;
          position: relative;
          z-index: 2;
        }
        .existence-search-input {
          width: 100%;
          padding: 16px 20px;
          border-radius: 28px;
          border: 1px solid #dfe1e5;
          font-size: 16px;
          box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          z-index: 2;
        }
        .existence-search-input:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 6px 18px rgba(26, 115, 232, 0.18);
        }
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
        .existence-feedback {
          margin-top: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          text-align: center;
          color: #1f2937;
        }
        .existence-feedback--error {
          color: #d93025;
        }
        .existence-feedback--empty {
          color: #5f6368;
        }
        .existence-helper {
          height: 0;
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
        .existence-results-container {
          width: 100%;
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
        .existence-result-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        .existence-result-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 12px 30px rgba(17, 36, 77, 0.12);
          display: flex;
          gap: 20px;
          align-items: center;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .existence-result-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 45px rgba(17, 36, 77, 0.16);
        }
        .existence-result-avatar {
          flex-shrink: 0;
        }
        .existence-circle-preview {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 28px;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(17, 36, 77, 0.18);
        }
        .existence-circle-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .existence-result-body {
          flex: 1;
          text-align: left;
        }
        .existence-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          color: #11224d;
        }
        .existence-result-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        .existence-result-header span {
          font-size: 0.85rem;
          color: #5f6368;
          white-space: nowrap;
        }
        .existence-result-snippet {
          margin: 0 0 12px;
          color: #3c4043;
          line-height: 1.5;
          font-size: 0.95rem;
        }
        .existence-result-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: #5f6368;
          margin-bottom: 12px;
        }
        .existence-result-actions {
          display: flex;
          gap: 12px;
        }
        .primary-action {
          background: #1a73e8;
          border: none;
          color: #ffffff;
          border-radius: 999px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(26, 115, 232, 0.25);
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .primary-action:hover {
          background: #1558b0;
          box-shadow: 0 16px 28px rgba(26, 115, 232, 0.28);
          transform: translateY(-1px);
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
          .existence-result-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .existence-result-avatar {
            align-self: center;
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
