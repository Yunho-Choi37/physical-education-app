
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import './ClassDetails.css';
import StudentDetailsModal from './StudentDetailsModal';
import AddStudentModal from './AddStudentModal';
import StudentCustomizeModal from './StudentCustomizeModal';
import { API_URL } from './config';

interface Student {
  id: number;
  name: string;
  classId: number;
  password?: string;  // 4자리 비밀번호
  tags?: string[];
  connections?: number[];
        existence?: {
          color: string;         // 원의 색상
          shape: string;         // 원의 형태 (circle, square, triangle, star, heart)
          pattern: string;       // 패턴 (solid, stripes, dots, waves, grid)
          size: number;          // 크기 (0.8-1.5)
          glow: boolean;         // 빛나는 효과
          border: string;        // 테두리 스타일 (normal, thick, dotted, dashed)
          activity: string;      // 현재 활동
          activities: string[];  // 활동 기록
          energy: number;        // 에너지 레벨 (0-100)
          personality: string;   // 개성 (active, calm, creative, etc.)
          customName?: string;   // 사용자 정의 이름
          imageData?: string;    // 로컬 업로드 이미지(Data URL)
          showElectrons?: boolean; // 전자 표시 여부
          showProtonsNeutrons?: boolean; // 양성자/중성자 표시 여부
          records: Array<{      // 활동 기록
            date: string;
            activity: string;
            duration: number;
            notes: string;
          }>;
          // 원자 모델 구조
          atom?: {
            protons: Array<{     // 양성자 (핵심 특성)
              keyword: string;   // 대표 키워드
              strength: number;  // 특성 강도 (1-5)
              color: string;     // 양성자 색상
              emoji: string;     // 선택된 이모티콘
            }>;
            neutrons: Array<{    // 중성자 (균형적 특성)
              keyword: string;   // 취미/관심사 키워드
              category: string;  // 카테고리 (취미, 관심사, 개성)
              color: string;     // 중성자 색상 (양성자와 다름)
              emoji: string;     // 선택된 이모티콘
            }>;
            electrons: {         // 전자 (활동 에너지 준위)
              kShell: Array<{    // K 껍질 (필수 활동)
                activity: string;
                frequency: number; // 빈도 (1-7, 매일=7)
                emoji: string;     // 선택된 이모티콘
              }>;
              lShell: Array<{    // L 껍질 (선택 활동)
                activity: string;
                frequency: number; // 빈도 (1-7)
                emoji: string;     // 선택된 이모티콘
              }>;
              mShell: Array<{    // M 껍질 (특별 활동)
                activity: string;
                frequency: number; // 빈도 (1-7)
                emoji: string;     // 선택된 이모티콘
              }>;
              valence: Array<{   // 원자가 전자 (사회적 결합 활동)
                activity: string;
                cooperation: number; // 협력도 (1-5)
                social: boolean;     // 사회적 활동 여부
                emoji: string;       // 선택된 이모티콘
              }>;
            };
          };
        };
}

const ClassDetails = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [hoveredStudent, setHoveredStudent] = useState<number | null>(null);
  const [draggedStudent, setDraggedStudent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 1000 });
  // 마우스 위치(피시아이/호버 효과용)
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [studentPositions, setStudentPositions] = useState<Map<number, {x: number, y: number}>>(new Map());
  const [studentGroups, setStudentGroups] = useState<Map<number, number>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { classId } = useParams<{ classId: string }>();
  // 새로고침/세션마다 바뀌는 랜덤 위상 시드(세션 내 안정성 보장)
  const sessionSeedRef = useRef<number>(Math.floor(Math.random() * 1_000_000_000));

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const url = `${API_URL}/api/classes/${classId}/students`;
        console.log('🔄 학생 목록 가져오기:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ 학생 데이터 수신:', data.length, '명');
        
        // 학생들의 존재 초기화 (기존 데이터가 있으면 유지, 없으면 새로 생성)
        const studentsWithExistence = data.map((student: Student) => ({
          ...student,
          password: student.password || '0000', // 기본 비밀번호 0000
          existence: student.existence || generateStudentExistence(student.name, student.id)
        }));
        
        setStudents(studentsWithExistence);
        
        // 자동 배치 적용
        setTimeout(() => {
          updateAutoLayout(studentsWithExistence);
        }, 100);
      } catch (error) {
        console.error('❌ Error fetching students:', error);
        console.error('API_URL:', API_URL);
        console.error('classId:', classId);
        // 에러가 발생해도 빈 배열로 설정하여 화면이 깨지지 않도록
        setStudents([]);
      }
    };

    fetchStudents();
  }, [classId]);

  // 화면 크기 감지 및 캔버스 크기 조절 (모바일 최적화)
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const isMobile = window.innerWidth < 768;
        
        // 모바일에서는 전체 화면 활용, 데스크톱에서는 제한된 크기
        const containerWidth = container.clientWidth || window.innerWidth;
        const containerHeight = isMobile 
          ? window.innerHeight - 200 // 모바일: 거의 전체 높이
          : Math.max(600, window.innerHeight * 0.6); // 데스크톱: 화면 높이의 60%
        
        const newSize = {
          width: Math.min(containerWidth - (isMobile ? 20 : 40), isMobile ? window.innerWidth : 1200),
          height: Math.min(containerHeight, isMobile ? window.innerHeight - 150 : 1000)
        };
        
        setCanvasSize(newSize);
        
        // 캔버스 고해상도 설정
        const canvas = canvasRef.current;
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

  // 원형(시계) 정렬 위치 생성: 학생 id 오름차순으로 360° 균등 배치
  const generateOrderedPositions = (students: Student[], canvasWidth: number, canvasHeight: number) => {
    const positions = new Map<number, {x: number, y: number}>();
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.35;
    const sorted = [...students].sort((a, b) => a.id - b.id);
    const n = Math.max(1, sorted.length);
    sorted.forEach((student, i) => {
      const angle = (i / n) * (2 * Math.PI) - Math.PI / 2; // 12시 방향부터 시계방향
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      positions.set(student.id, { x, y });
    });
    return positions;
  };

  // 연결된 그룹 찾기 (Union-Find 알고리즘)
  const findConnectedGroups = (students: Student[]) => {
    const groups = new Map<number, number>();
    const groupColors = new Map<number, string>();
    
    // 각 학생을 개별 그룹으로 초기화
    students.forEach(student => {
      groups.set(student.id, student.id);
    });
    
    // 연결된 학생들을 같은 그룹으로 묶기
    students.forEach(student => {
      if (student.connections && student.connections.length > 0) {
        student.connections.forEach(connectedId => {
          const root1 = findRoot(groups, student.id);
          const root2 = findRoot(groups, connectedId);
          if (root1 !== root2) {
            groups.set(root2, root1);
          }
        });
      }
    });
    
    // 그룹별 색상 할당
    const uniqueGroups = new Set(groups.values());
    const groupColorArray = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let colorIndex = 0;
    uniqueGroups.forEach(groupId => {
      groupColors.set(groupId, groupColorArray[colorIndex % groupColorArray.length]);
      colorIndex++;
    });
    
    return { groups, groupColors };
  };

  // Union-Find의 find 함수
  const findRoot = (groups: Map<number, number>, id: number): number => {
    if (groups.get(id) === id) return id;
    const root = findRoot(groups, groups.get(id)!);
    groups.set(id, root);
    return root;
  };

  // 유사 이모지 판별 (정규식 유니코드 플래그 없이 동작)
  const isEmojiLike = (text: string): boolean => {
    if (!text) return false;
    const chars = Array.from(text);
    return chars.some(ch => {
      const cp = ch.codePointAt(0) || 0;
      // 대략적인 이모지 범위 (자연/물건/활동 등 BMP 밖과 일부 BMP)
      return cp >= 0x1F300 || (cp >= 0x2600 && cp <= 0x27BF);
    });
  };

  // 활동 이모티콘 맵핑
  const getActivityEmoji = (activity: string): string => {
    // 활동이 이미 이모티콘처럼 보이면 그대로 반환
    if (activity && activity.length <= 4 && isEmojiLike(activity)) {
      return activity;
    }

    const activityEmojiMap: { [key: string]: string } = {
      '축구': '⚽', '농구': '🏀', '배구': '🏐', '테니스': '🎾', '수영': '🏊',
      '달리기': '🏃', '체조': '🤸', '댄스': '💃', '요가': '🧘', '복싱': '🥊',
      '탁구': '🏓', '배드민턴': '🏸', '야구': '⚾', '골프': '⛳', '스키': '🎿',
      '스케이트': '⛸️', '자전거': '🚴', '등산': '🥾', '클라이밍': '🧗',
      '명상': '🧘‍♀️', '공부': '📚', '독서': '📖', '그림': '🎨', '음악': '🎵',
      '요리': '👨‍🍳', '청소': '🧹', '산책': '🚶', '게임': '🎮', '영화감상': '🎬'
    };
    return activityEmojiMap[activity] || '⭐';
  };

  // 활동 위성 그리기 함수
  const drawActivitySatellites = (ctx: CanvasRenderingContext2D, x: number, y: number, activities: string[], time: number) => {
    if (!activities || activities.length === 0) return;
    
    const satelliteRadius = 40; // 위성 궤도 반지름
    const satelliteSize = 20; // 위성 크기
    
    activities.forEach((activity, index) => {
      const angle = (time * 0.001 + index * (2 * Math.PI / activities.length)) % (2 * Math.PI);
      const satelliteX = x + Math.cos(angle) * satelliteRadius;
      const satelliteY = y + Math.sin(angle) * satelliteRadius;
      
      // 위성 배경 원
      ctx.beginPath();
      ctx.arc(satelliteX, satelliteY, satelliteSize, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 활동 이모티콘
      const emoji = getActivityEmoji(activity);
      ctx.font = `${satelliteSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, satelliteX, satelliteY);
    });
  };

  // 텍스트 자동 크기 조절 함수
  const getOptimalFontSize = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number) => {
    let fontSize = Math.min(maxWidth, maxHeight) * 0.3; // 초기 크기
    ctx.font = `${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize; // 대략적인 높이
    
    // 텍스트가 영역을 벗어나면 크기 조절
    while ((textWidth > maxWidth || textHeight > maxHeight) && fontSize > 8) {
      fontSize -= 2;
      ctx.font = `${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const newMetrics = ctx.measureText(text);
      if (newMetrics.width <= maxWidth && fontSize <= maxHeight) break;
    }
    
    return fontSize;
  };

  // 이모티콘 옵션들
  // 이모티콘 카테고리 정의 (StudentCustomizeModal과 동일)
  const emojiCategories = {
    faces: { name: '표정', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'] },
    nature: { name: '자연', emojis: ['🌱', '🌿', '🍀', '🌾', '🌵', '🌴', '🌳', '🌲', '🌰', '🌰', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '⭐', '🌟', '💫', '✨', '☄️', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☔', '⚡', '🔥', '💧', '🌊'] },
    activities: { name: '활동', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🪘', '🥁', '🪗', '🎸', '🪕', '🎺', '🎷', '🪗', '🎻', '🎹', '🪗', '🎸', '🪕', '🎺', '🎷', '🪗', '🎻', '🎹'] },
    objects: { name: '물건', emojis: ['📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📷', '📸', '📹', '🎬', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🧪', '🧫', '🧬', '🦠', '💉', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🚰', '🪣', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🚰', '🪣'] },
    food: { name: '음식', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫒', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥙', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'] },
    symbols: { name: '기호', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🟰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', '🔤', 'ℹ️', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'] }
  };

  // 이모티콘 옵션 (기존 호환성 유지)
  const emojiOptions = {
    proton: Object.values(emojiCategories).flatMap(category => category.emojis).slice(0, 30),
    neutron: Object.values(emojiCategories).flatMap(category => category.emojis).slice(30, 60),
    electron: Object.values(emojiCategories).flatMap(category => category.emojis).slice(60, 90)
  };

  // 양성자/중성자를 '달처럼' 중심 모양 주변에서 공전시키는 함수
  const drawProtonNeutronSatellites = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    atom: any,
    coreSize: number,
    time: number,
    seed: number
  ) => {
    if (!atom) return;

    const numP = atom.protons?.length || 0;
    const numN = atom.neutrons?.length || 0;

    // 전자 궤도보다 안쪽에서 공전하도록 반지름 설정
    const protonOrbit = coreSize * 0.95;   // 모양 가장자리 바로 바깥
    const neutronOrbit = coreSize * 1.25;  // 그 바깥

    const baseParticleSize = Math.max(10, Math.floor(coreSize * 0.28)); // 전자보다 큼

    const drawOrbiting = (items: any[], radius: number, stroke: string, speed: number, phaseOffset: number, shellIndex: number) => {
      if (!items || items.length === 0) return;

      const count = items.length;
      const angleStep = (2 * Math.PI) / count; // 균등 간격
      // 세션+학생 기반 위상 무작위화로 초기 정렬을 가지런하지 않게
      const baseRand = (v: number) => {
        const r = Math.sin(v) * 43758.5453;
        return r - Math.floor(r);
      };
      const basePhase = baseRand(seed + shellIndex * 10000) * (2 * Math.PI);
      const angleOffset = time * speed + phaseOffset + basePhase;

      // 겹침 방지: 둘레 대비 입자 지름 수용량으로 반경/크기 동적 조정 후 위치/스케일 계산
      const particleDiameter = baseParticleSize * 0.6 * 2;
      const requiredPerimeter = count * particleDiameter * 1.15;
      let adjRadius = radius;
      let scaleCap = 1;
      if (2 * Math.PI * adjRadius < requiredPerimeter) {
        adjRadius = Math.min(coreSize * 2.2, requiredPerimeter / (2 * Math.PI));
        const newPerimeter = 2 * Math.PI * adjRadius;
        if (newPerimeter < requiredPerimeter) {
          scaleCap = Math.max(0.5, newPerimeter / requiredPerimeter);
        }
      }

      const particles: Array<{ item: any; x: number; y: number; scale: number }> = items.map((item: any, idx: number) => {
        const angle = angleOffset + idx * angleStep;
        const baseX = x + Math.cos(angle) * adjRadius;
        const baseY = y + Math.sin(angle) * adjRadius;
        // 피시아이 효과 계산
        let scale = scaleCap;
        let dx = 0, dy = 0;
        if (mousePos) {
          const dist = Math.hypot(baseX - mousePos.x, baseY - mousePos.y);
          const influence = Math.max(0, 1 - dist / Math.max(60, coreSize * 0.9));
          scale = scaleCap * (1 + influence * 0.8); // 확대하되 상한 반영
          const repel = influence * 8;  // 밀어내기
          const dirX = (baseX - mousePos.x) / (dist || 1);
          const dirY = (baseY - mousePos.y) / (dist || 1);
          dx = dirX * repel;
          dy = dirY * repel;
        }
        return { item, x: baseX + dx, y: baseY + dy, scale };
      });

      particles.sort((a, b): number => a.scale - b.scale); // 작은 것부터 그리고, 큰 것(호버)은 나중에 그려 위로

      particles.forEach(({ item, x: px, y: py, scale }) => {
        // 배경 원 (입자 색)
        ctx.beginPath();
        ctx.arc(px, py, baseParticleSize * 0.6 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = item.color || 'rgba(255,255,255,0.9)';
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 이모티콘 (입자 이모지)
        const emoji = item.emoji || '✨';
        ctx.font = `${Math.floor(baseParticleSize * scale)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, px, py);
      });
    };

    // 양성자/중성자 공전 속도: 아주 느리지만 눈에 띄게 (세션 시드 반영)
    drawOrbiting(atom.protons || [], protonOrbit, '#ffffff', 0.00005, 0, 1);
    drawOrbiting(atom.neutrons || [], neutronOrbit, '#333333', 0.00003, Math.PI / 6, 2);
  };

  // 전자 궤도 그리기 함수
  const drawElectronOrbits = (ctx: CanvasRenderingContext2D, x: number, y: number, atom: any, size: number, time: number, seed: number) => {
    if (!atom?.electrons) return;
    
    // 껍질 자체는 보이지 않도록 하되, 간격은 더 넓힘
    const orbits = [
      { shell: 'kShell', radius: size * 1.2, color: '#FF6B6B', name: 'K' },
      { shell: 'lShell', radius: size * 1.7, color: '#4ECDC4', name: 'L' },
      { shell: 'mShell', radius: size * 2.3, color: '#45B7D1', name: 'M' },
      { shell: 'valence', radius: size * 3.0, color: '#96CEB4', name: 'V' }
    ];
    
    orbits.forEach((orbit, orbitIndex) => {
      const electrons = atom.electrons[orbit.shell];
      if (!electrons || electrons.length === 0) return;

      const n = electrons.length; // 정확히 궤도 내 전자 수로 균등 배치
      const angleStep = (2 * Math.PI) / n;
      // 세션+학생 기반 위상 무작위화로 초기 정렬을 가지런하지 않게
      const baseRand = (v: number) => {
        const r = Math.sin(v) * 43758.5453;
        return r - Math.floor(r);
      };
      const basePhase = baseRand(seed + (orbitIndex + 1) * 12345) * (2 * Math.PI);
      const angleOffset = time * (0.00005 + orbitIndex * 0.00001) + basePhase; // 아주 느린 회전 + 무작위 위상

      // 먼저 위치/스케일 계산(피시아이/호버) 후, 스케일이 작은 것부터 그려 큰 것(호버)이 위로 오게
      const particles: Array<{ electron: any; x: number; y: number; scale: number }> = electrons.map((electron: any, electronIndex: number) => {
        const perElectronPhase = baseRand(seed + (orbitIndex + 1) * 1000 + electronIndex * 97) * (angleStep * 0.3);
        const baseAngle = angleOffset + electronIndex * angleStep + perElectronPhase;
        const floatOffset = Math.sin(time * 0.0015 + electronIndex * 0.6 + orbitIndex * 0.4) * 4; // 반경 미세 진동 (정렬은 유지)
        const radial = orbit.radius + floatOffset;
        const ex = x + Math.cos(baseAngle) * radial;
        const ey = y + Math.sin(baseAngle) * radial;

        // 피시아이 효과
        let scale = 1;
        let dx = 0, dy = 0;
        if (mousePos) {
          const dist = Math.hypot(ex - mousePos.x, ey - mousePos.y);
          const influence = Math.max(0, 1 - dist / Math.max(60, size));
          scale = 1 + influence * 0.9;
          const repel = influence * 10;
          const dirX = (ex - mousePos.x) / (dist || 1);
          const dirY = (ey - mousePos.y) / (dist || 1);
          dx = dirX * repel;
          dy = dirY * repel;
        }
        return { electron, x: ex + dx, y: ey + dy, scale };
      });

      particles.sort((a, b): number => a.scale - b.scale);

      particles.forEach(({ electron, x: electronX, y: electronY, scale }: { electron: any; x: number; y: number; scale: number }) => {
        // 전자 배경 원
        ctx.beginPath();
        ctx.arc(electronX, electronY, 8 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = orbit.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 전자 이모티콘
        const emoji = electron.emoji || '⚡';
        ctx.font = `${Math.floor(12 * scale)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, electronX, electronY);
      });
    });
  };

  // 이미지 캐시 (Data URL -> HTMLImageElement)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // 형태 그리기 함수
  const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, shape: string) => {
    // 이모티콘 모양들을 텍스트로 렌더링
    const emojiShapes = ['smile', 'fire', 'sun', 'moon', 'rainbow', 'flower', 'butterfly', 'cat', 'dog', 'panda'];
    
    if (emojiShapes.includes(shape)) {
      // 이모티콘을 텍스트로 렌더링
      const emojiMap: { [key: string]: string } = {
        'smile': '😊',
        'fire': '🔥',
        'sun': '☀️',
        'moon': '🌙',
        'rainbow': '🌈',
        'flower': '🌸',
        'butterfly': '🦋',
        'cat': '🐱',
        'dog': '🐶',
        'panda': '🐼'
      };
      
      const emoji = emojiMap[shape];
      if (emoji) {
        ctx.font = `${size * 2}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, x, y);
        return;
      }
    }
    
    // 기본 모양들 (원, 사각형, 삼각형, 별, 하트)
    ctx.beginPath();
    
    switch (shape) {
      case 'circle':
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        break;
      case 'square':
        ctx.rect(x - size, y - size, size * 2, size * 2);
        break;
      case 'triangle':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        break;
      case 'star':
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case 'heart':
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
        ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size * 0.7, x, y + size);
        ctx.bezierCurveTo(x, y + size * 0.7, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
        ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
        break;
      default:
        ctx.arc(x, y, size, 0, 2 * Math.PI);
    }
    
    ctx.fill();
  };

  // 패턴 그리기 함수
  const drawPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, pattern: string, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    switch (pattern) {
      case 'stripes':
        for (let i = -size; i <= size; i += 4) {
          ctx.beginPath();
          ctx.moveTo(x - size, y + i);
          ctx.lineTo(x + size, y + i);
          ctx.stroke();
        }
        break;
      case 'dots':
        for (let i = -size; i <= size; i += 6) {
          for (let j = -size; j <= size; j += 6) {
            if (i * i + j * j <= size * size) {
              ctx.beginPath();
              ctx.arc(x + i, y + j, 1, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
        break;
      case 'waves':
        ctx.beginPath();
        for (let angle = 0; angle < 2 * Math.PI; angle += 0.1) {
          const radius = size + Math.sin(angle * 3) * 3;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (angle === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;
      case 'grid':
        for (let i = -size; i <= size; i += 4) {
          ctx.beginPath();
          ctx.moveTo(x + i, y - size);
          ctx.lineTo(x + i, y + size);
          ctx.moveTo(x - size, y + i);
          ctx.lineTo(x + size, y + i);
          ctx.stroke();
        }
        break;
      case 'spiral':
        ctx.beginPath();
        for (let t = 0; t < 4 * Math.PI; t += 0.1) {
          const radius = (t / (4 * Math.PI)) * size;
          const px = x + Math.cos(t) * radius;
          const py = y + Math.sin(t) * radius;
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  };

  // 존재 기반 연결 판단
  const shouldConnectByExistence = (student1: Student, student2: Student): boolean => {
    const existence1 = student1.existence;
    const existence2 = student2.existence;
    
    if (!existence1 || !existence2) return false;
    
    // 같은 활동
    if (existence1.activity === existence2.activity) return true;
    
    // 비슷한 에너지 레벨 (20 이내)
    if (Math.abs(existence1.energy - existence2.energy) <= 20) return true;
    
    // 같은 개성
    if (existence1.personality === existence2.personality) return true;
    
    // 같은 패턴
    if (existence1.pattern === existence2.pattern) return true;
    
    return false;
  };

  // 연결선 그리기
  const drawConnection = (ctx: CanvasRenderingContext2D, fromNode: any, toNode: any, type: string, color: string) => {
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    
    if (type === 'direct') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else if (type === 'existence') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // 점선
    }
    
    ctx.stroke();
    ctx.setLineDash([]); // 점선 초기화
  };

  // 학생의 존재 생성 (기본값)
  const generateStudentExistence = (name: string, id: number) => {
    const baseColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    const personalities = ['active', 'calm', 'creative', 'friendly', 'energetic', 'thoughtful'];
    const seed = name.charCodeAt(0) + id;
    
    return {
      color: baseColors[seed % baseColors.length],
      shape: 'circle',
      pattern: 'solid',
      size: 1.0,
      glow: false,
      border: 'normal',
      activity: '',
      activities: [],
      energy: 50 + (seed % 40), // 50-90 사이의 에너지 레벨
      personality: personalities[seed % personalities.length],
      customName: '', // 사용자 정의 이름 초기화
      records: [],
      showElectrons: false, // 초기/리셋 시 전자는 보이지 않음
      showProtonsNeutrons: false, // 초기/리셋 시 양성자/중성자는 보이지 않음
      // 원자 모델 초기화 - 처음에는 모두 빈 배열
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
    };
  };

  // 학생 위치 초기화 및 불러오기
  useEffect(() => {
    if (students.length > 0 && canvasSize.width > 0 && canvasSize.height > 0) {
      loadStudentPositions();
    }
  }, [students, canvasSize]);

  // 저장된 학생 위치 불러오기 (자동 배치 우선)
  const loadStudentPositions = async () => {
    try {
      // 자동 배치 적용 (저장된 위치 무시하고 항상 자동 배치)
      updateAutoLayout(students);
      
      const { groups } = findConnectedGroups(students);
      setStudentGroups(groups);
    } catch (error) {
      console.error('Error loading positions:', error);
      // 에러 시에도 자동 배치 적용
      updateAutoLayout(students);
      
      const { groups } = findConnectedGroups(students);
      setStudentGroups(groups);
    }
  };

  // 그래프 그리기 (애니메이션을 위해 지속적으로 호출)
  useEffect(() => {
    const animate = () => {
      drawGraph();
      requestAnimationFrame(animate);
    };
    animate();
  }, [students, hoveredStudent, draggedStudent, canvasSize, studentPositions, studentGroups]);


  // 캔버스 그리기 함수
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    // 캔버스 클리어 (투명하게)
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 그룹 색상 계산
    const { groupColors } = findConnectedGroups(students);
    // 원 크기 고정 (모바일에서도 동일한 크기)
    const baseNodeSize = 50; // 고정 크기 (픽셀)
    
    const nodes = students.map((student, index) => {
      const position = studentPositions.get(student.id);
      const groupId = studentGroups.get(student.id);
      const groupColor = groupColors.get(groupId || student.id);
      const existence = student.existence;
      
      // 존재의 특성에 따른 크기 조절 (크기 비율만 적용, 절대 크기는 고정)
      const existenceSize = existence?.size || 1.0;
      const energySize = (existence?.energy || 60) / 100;
      const finalSize = baseNodeSize * existenceSize * energySize;
      
      return {
        id: student.id,
        name: student.name,
        x: position?.x || canvasSize.width / 2,
        y: position?.y || canvasSize.height / 2,
        size: finalSize + (student.connections?.length || 0) * 2,
        color: existence?.color || groupColor || colors[index % colors.length],
        existence,
        student
      };
    });

    // 연결선 그리기 (직접 연결만)
    const drawnConnections = new Set<string>(); // 중복 연결 방지
    
    students.forEach(student => {
      const fromNode = nodes.find(n => n.id === student.id);
      if (!fromNode) return;

      // 직접 연결만 표시 (학생이 직접 설정한 연결)
      if (student.connections && student.connections.length > 0) {
        student.connections.forEach(connectionId => {
          const connectionKey = `${Math.min(student.id, connectionId)}-${Math.max(student.id, connectionId)}`;
          if (!drawnConnections.has(connectionKey)) {
            const toNode = nodes.find(n => n.id === connectionId);
            if (toNode) {
              ctx.beginPath();
              ctx.moveTo(fromNode.x, fromNode.y);
              ctx.lineTo(toNode.x, toNode.y);
              ctx.strokeStyle = '#FF6B6B';
              ctx.lineWidth = 2;
              ctx.stroke();
              drawnConnections.add(connectionKey);
            }
          }
        });
      }
    });

    // 노드 그리기 (학생 커스터마이징 반영)
    nodes.forEach(node => {
      const existence = node.existence;
      
      // 드래그/호버 효과
      if (draggedStudent === node.id) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 10;
      } else if (hoveredStudent === node.id) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.shadowBlur = 5;
      } else {
        ctx.fillStyle = node.color;
        if (existence?.glow) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowBlur = 0;
        }
      }
      
      // 이미지가 있으면 이미지를 우선 그리기
      const imageData = existence?.imageData;
      const hasImage = !!imageData;
      if (hasImage && imageData) {
        const cache = imageCacheRef.current;
        let cached = cache.get(imageData);
        
        // 이미지가 캐시에 없거나 아직 로드 중이면 새로 로드
        if (!cached || !cached.complete) {
          if (!cached) {
            cached = new Image();
            cache.set(imageData, cached);
            cached.onload = () => {
              // 이미지 로드 완료 후 다음 프레임에 다시 그리기
              requestAnimationFrame(() => drawGraph());
            };
            cached.onerror = () => {
              // 이미지 로드 실패 시 캐시에서 제거
              cache.delete(imageData);
            };
            cached.src = imageData;
          }
          
          // 로딩 중에는 얇은 테두리만 표시
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // 이미지가 완전히 로드되었으면 그리기
          ctx.save();
          // 원형 클리핑(옵션): 이미지 가장자리를 둥글게
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(cached, node.x - node.size, node.y - node.size, node.size * 2, node.size * 2);
          ctx.restore();
        }
      } else {
        // 형태에 따른 그리기
        drawShape(ctx, node.x, node.y, node.size, existence?.shape || 'circle');
      }
      
      // 패턴 그리기
      if (existence?.pattern && existence.pattern !== 'solid') {
        drawPattern(ctx, node.x, node.y, node.size, existence.pattern, node.color);
      }
      
      // 테두리 그리기
      const borderWidth = existence?.border === 'thick' ? 4 : 2;
      ctx.strokeStyle = node.color;
      ctx.lineWidth = draggedStudent === node.id ? borderWidth + 2 : borderWidth;
      
      if (existence?.border === 'dotted') {
        ctx.setLineDash([2, 2]);
      } else if (existence?.border === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);

      // 원자 모델이 수정되었는지 확인 (실제로 양성자/중성자/전자가 하나라도 있을 때만 true)
      const hasProtons = existence?.atom?.protons && Array.isArray(existence.atom.protons) && existence.atom.protons.length > 0;
      const hasNeutrons = existence?.atom?.neutrons && Array.isArray(existence.atom.neutrons) && existence.atom.neutrons.length > 0;
      const hasElectrons = existence?.atom?.electrons && (
        (existence.atom.electrons.kShell && Array.isArray(existence.atom.electrons.kShell) && existence.atom.electrons.kShell.length > 0) ||
        (existence.atom.electrons.lShell && Array.isArray(existence.atom.electrons.lShell) && existence.atom.electrons.lShell.length > 0) ||
        (existence.atom.electrons.mShell && Array.isArray(existence.atom.electrons.mShell) && existence.atom.electrons.mShell.length > 0) ||
        (existence.atom.electrons.valence && Array.isArray(existence.atom.electrons.valence) && existence.atom.electrons.valence.length > 0)
      );
      const hasCustomization = hasProtons || hasNeutrons || hasElectrons;

      // 노드의 외형: 사용자가 이모티콘 모양을 선택했다면, 원자 여부와 관계없이 우선 표시
      const shape = existence?.shape || 'circle';
      const isEmojiShape = isEmojiLike(shape);
      if (isEmojiShape) {
        ctx.font = `${Math.floor(node.size * 2)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape, node.x, node.y);
      } else if (!hasCustomization) {
        // 원자 모델이 없고 이모티콘 모양이 아니면 기본 원
        const simpleSize = baseNodeSize; // 모든 번호 원 동일 크기
        ctx.beginPath();
        ctx.arc(node.x, node.y, simpleSize, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 원자 모델 그리기 (실제로 입자가 있을 때만)
      if (hasCustomization && existence?.atom) {
        const seed = sessionSeedRef.current + node.id;
        
        // 양성자/중성자가 하나라도 있고, showProtonsNeutrons가 true일 때만 표시
        if ((hasProtons || hasNeutrons) && existence?.showProtonsNeutrons === true) {
          drawProtonNeutronSatellites(ctx, node.x, node.y, existence.atom, node.size, Date.now(), seed);
        }
        
        // 전자가 하나라도 있고, showElectrons가 true일 때만 전자 궤도를 표시
        if (hasElectrons && existence?.showElectrons === true) {
          // 전자는 궤도에서 떠다니도록 표시
          drawElectronOrbits(ctx, node.x, node.y, existence.atom, node.size, Date.now(), seed);
        }
      }
      
      // 번호 표시 (원 아래 텍스트는 제거, 초기 간단 원일 때만 원 안에 번호 표시)
      const displayNumber = node.id.toString();
      if (!isEmojiShape && !hasCustomization) {
        // 간단한 원인 경우 - 원 안에 번호 표시
        const simpleSize = baseNodeSize;
        const maxTextWidth = simpleSize * 1.6; // 원의 지름의 80%
        const maxTextHeight = simpleSize * 0.6; // 원의 높이의 60%
        
        ctx.fillStyle = '#fff';
        const optimalFontSize = getOptimalFontSize(ctx, displayNumber, maxTextWidth, maxTextHeight);
        ctx.font = `bold ${optimalFontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayNumber, node.x, node.y);
      }
      
      // 활동 기록 이모티콘을 달처럼 한 궤도로 표시 (records 기반, 중복 제거)
      if (existence?.records && existence.records.length > 0) {
        const activities = existence.records.map(record => record.activity);
        const uniqueActivities = activities.filter((activity, index) => activities.indexOf(activity) === index);
        // 달 궤도는 전자 껍질과 구분되도록 반지름과 스타일을 다르게 설정
        const now = Date.now();
        const moonRadius = hasCustomization ? node.size * 1.1 : node.size * 1.2; // 원자 주변 짧은 궤도
        const moonSize = Math.max(10, node.size * 0.35);
        uniqueActivities.forEach((activity, idx) => {
          const angle = (now * 0.001 + idx * (2 * Math.PI / Math.max(uniqueActivities.length, 3))) % (2 * Math.PI);
          const moonX = node.x + Math.cos(angle) * moonRadius;
          const moonY = node.y + Math.sin(angle) * moonRadius;

          // 달 배경
          ctx.beginPath();
          ctx.arc(moonX, moonY, moonSize * 0.6, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // 달 이모티콘 (활동 이모티콘)
          const emoji = getActivityEmoji(activity);
          ctx.font = `${Math.floor(moonSize)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, moonX, moonY);
        });
      }
      
      // 그림자 초기화
      ctx.shadowBlur = 0;
    });
  };

  // 좌표를 캔버스 좌표로 변환하는 공통 함수
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    return {
      x: (clientX - rect.left) * (canvas.width / (rect.width * devicePixelRatio)),
      y: (clientY - rect.top) * (canvas.height / (rect.height * devicePixelRatio))
    };
  };

  // 마우스/터치 다운 이벤트 공통 처리
  const handlePointerDown = (clientX: number, clientY: number) => {
    const coords = getCanvasCoordinates(clientX, clientY);
    if (!coords) return;
    
    const { x, y } = coords;
    
    // 드래그 시작 위치 저장
    setDragStartPos({ x, y });
    setHasDragged(false);

    // 원 크기 고정 (모바일에서도 동일)
    const nodeSize = 50;
    
    const clickedStudent = students.find((student) => {
      const position = studentPositions.get(student.id);
      if (!position) return false;
      
      const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2);
      return distance <= nodeSize;
    });

    if (clickedStudent) {
      const position = studentPositions.get(clickedStudent.id);
      if (position) {
        setDraggedStudent(clickedStudent.id);
        setIsDragging(true);
        setDragOffset({
          x: x - position.x,
          y: y - position.y
        });
      }
    }
  };

  // 마우스 다운 이벤트 (드래그 시작)
  const handleMouseDown = (e: React.MouseEvent) => {
    handlePointerDown(e.clientX, e.clientY);
  };

  // 터치 다운 이벤트
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // 스크롤 방지
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }
  };

  // 마우스/터치 이동 이벤트 공통 처리
  const handlePointerMove = (clientX: number, clientY: number) => {
    const coords = getCanvasCoordinates(clientX, clientY);
    if (!coords) return;
    
    const { x, y } = coords;

    // 피시아이/호버 효과용 마우스 위치 저장 (데스크톱만)
    if (!isDragging) {
      setMousePos({ x, y });
    }

    if (isDragging && draggedStudent) {
      // 드래그 거리 계산 (5px 이상 움직였을 때만 드래그로 인식)
      const dragDistance = Math.sqrt(
        (x - dragStartPos.x) ** 2 + (y - dragStartPos.y) ** 2
      );
      
      if (dragDistance > 5) {
        setHasDragged(true);
      }
      
      // 드래그 중인 경우 위치 업데이트
      const newPosition = {
        x: x - dragOffset.x,
        y: y - dragOffset.y
      };
      
      setStudentPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.set(draggedStudent, newPosition);
        return newPositions;
      });
    } else {
      // 호버 효과 (데스크톱만)
      const nodeSize = 50; // 고정 크기
      
      const hoveredNode = students.find((student) => {
        const position = studentPositions.get(student.id);
        if (!position) return false;
        
        const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2);
        return distance <= nodeSize;
      });

      setHoveredStudent(hoveredNode?.id || null);
    }
  };

  // 마우스 이동 이벤트 (드래그 중 또는 호버)
  const handleMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  // 터치 이동 이벤트
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // 스크롤 방지
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  };

  // 마우스가 캔버스를 벗어나면 효과 초기화
  const handleMouseLeave = () => {
    setHoveredStudent(null);
    setMousePos(null);
  };

  // 터치 종료 이벤트
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // 실제 드래그 거리 확인
    const actualDragged = hasDragged;
    const currentDraggedStudent = draggedStudent;
    
    // 먼저 마우스 업 처리 (드래그 종료)
    handleMouseUp();
    
    // 클릭 이벤트 처리 (드래그가 아닌 경우)
    // 실제로 드래그가 발생하지 않았고, 학생이 선택되어 있었던 경우 클릭으로 처리
    if (!actualDragged && currentDraggedStudent !== null && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      if (coords) {
        const { x, y } = coords;
        const nodeSize = 50; // 고정 크기
        
        const clickedStudent = students.find((student) => {
          const position = studentPositions.get(student.id);
          if (!position) return false;
          
          const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2);
          return distance <= nodeSize;
        });
        
        if (clickedStudent && clickedStudent.id === currentDraggedStudent) {
          // 약간의 지연을 두어 드래그 상태 초기화 후 클릭 처리
          setTimeout(() => {
            handleStudentClick(clickedStudent);
          }, 50);
        }
      }
    }
  };

  // 마우스 업 이벤트 (드래그 종료)
  const handleMouseUp = () => {
    if (isDragging && draggedStudent) {
      // 드래그된 학생의 새 위치 저장
      const newPositions = new Map(studentPositions);
      const currentPos = newPositions.get(draggedStudent);
      if (currentPos) {
        // 위치를 데이터베이스에 저장
        saveStudentPosition(draggedStudent, currentPos.x, currentPos.y);
      }
      
      setIsDragging(false);
      setDraggedStudent(null);
      setDragOffset({ x: 0, y: 0 });
      
      // 드래그 상태 초기화는 약간의 지연 후에 (클릭 이벤트 처리 후)
      setTimeout(() => {
        setHasDragged(false);
      }, 100);
    }
  };

  // 학생 위치 저장
  const saveStudentPosition = async (studentId: number, x: number, y: number) => {
    try {
      await fetch(`${API_URL}/api/students/${studentId}/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ x, y }),
      });
    } catch (error) {
      console.error('Error saving position:', error);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // 실제 드래그가 발생했으면 클릭 이벤트 무시
    if (hasDragged) return;
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;
    
    const { x, y } = coords;
    const nodeSize = 50; // 고정 크기
    
    const clickedStudent = students.find((student) => {
      const position = studentPositions.get(student.id);
      if (!position) return false;
      
      const distance = Math.sqrt((x - position.x) ** 2 + (y - position.y) ** 2);
      return distance <= nodeSize;
    });

    if (clickedStudent) {
      handleStudentClick(clickedStudent);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    
    // 관리자 모드가 아닌 경우 비밀번호 입력 요구
    if (!isAdmin) {
      setShowPasswordModal(true);
      setPasswordInput('');
    } else {
      // 관리자 모드인 경우 바로 커스터마이징 모달 열기
      setShowCustomizeModal(true);
    }
  };

  // 비밀번호 확인 함수
  const handlePasswordSubmit = () => {
    const currentPassword = selectedStudent ? (students.find(s => s.id === selectedStudent.id)?.password || selectedStudent.password) : undefined;
    if (selectedStudent && passwordInput === currentPassword) {
      setShowPasswordModal(false);
      setShowCustomizeModal(true);
      setPasswordInput('');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  // 비밀번호 모달 닫기
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordInput('');
    setSelectedStudent(null);
  };

  // 리셋 함수 (관리자 전용)
  const handleReset = async () => {
    if (!isAdmin) return;
    
    if (window.confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        // 모든 학생 위치 초기화
        setStudentPositions(new Map());
        
        // 모든 학생 데이터 초기화 (existence 제외하고 기본값으로)
        const resetStudents = students.map(student => ({
          ...student,
          existence: generateStudentExistence(student.name, student.id)
        }));
        
        setStudents(resetStudents);
        
        // 서버에서도 위치 데이터 삭제
        await fetch(`${API_URL}/api/classes/${classId}/positions`, {
          method: 'DELETE'
        });
        
        // 각 학생의 existence 데이터도 서버에서 초기화
        for (const student of resetStudents) {
          await fetch(`${API_URL}/api/students/${student.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(student),
          });
        }
        
        alert('모든 데이터가 초기화되었습니다.');
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('데이터 초기화 중 오류가 발생했습니다.');
      }
    }
  };

  // 색상 팔레트
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // 문자열 유사도 계산
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  // 레벤슈타인 거리 계산
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  const handleSaveStudent = async (updatedStudent: Student) => {
    try {
      console.log('💾 학생 저장 시작:', updatedStudent.id, updatedStudent.name);
      console.log('📸 이미지 데이터:', updatedStudent.existence?.imageData ? `있음 (${(updatedStudent.existence.imageData.length / 1024).toFixed(2)}KB)` : '없음');
      console.log('📏 크기:', updatedStudent.existence?.size);
      
      const response = await fetch(`${API_URL}/api/students/${updatedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStudent),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 저장 실패:', response.status, errorText);
        alert(`저장 실패: ${response.status} ${errorText}`);
        return;
      }
      
      const savedStudent = await response.json();
      console.log('✅ 학생 저장 완료:', savedStudent.id);
      console.log('📸 저장된 이미지 데이터:', savedStudent.existence?.imageData ? `있음 (${(savedStudent.existence.imageData.length / 1024).toFixed(2)}KB)` : '없음');
      console.log('📏 저장된 크기:', savedStudent.existence?.size);
      
      setStudents(students.map(student => student.id === savedStudent.id ? savedStudent : student));
      
      // 모달 상태에 따라 적절한 모달 닫기
      if (showDetailsModal) {
        handleCloseDetailsModal();
      }
      // 커스터마이징 모달은 자동으로 닫지 않음 (사용자가 직접 닫기 버튼을 눌러야 함)
    } catch (error) {
      console.error('❌ Error saving student:', error);
      alert(`저장 중 오류가 발생했습니다: ${error}`);
    }
  };

  const handleAddStudent = async (count: number) => {
    try {
      const newStudents: Student[] = [];
      for (let i = 0; i < count; i++) {
        const response = await fetch(`${API_URL}/api/classes/${classId}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: `학생 ${students.length + i + 1}`, classId: parseInt(classId!) }),
        });
        const newStudent = await response.json();
        newStudents.push(newStudent);
      }
      setStudents([...students, ...newStudents]);
      setShowAddModal(false);
      
      // 자동 배치 업데이트
      setTimeout(() => {
        updateAutoLayout([...students, ...newStudents]);
      }, 100);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  // 자동 배치 함수 (원형/격자 배치)
  const updateAutoLayout = (studentList: Student[]) => {
    if (studentList.length === 0) return;
    
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight - 200;
    
    // 원 크기 고정 (모바일에서도 동일)
    const circleRadius = 50; // 고정 크기
    const spacing = 120; // 원 사이 간격
    
    // 격자 배치 계산
    const cols = Math.ceil(Math.sqrt(studentList.length * 1.2)); // 약간의 여유
    const rows = Math.ceil(studentList.length / cols);
    
    const totalWidth = cols * spacing;
    const totalHeight = rows * spacing;
    
    const startX = (containerWidth - totalWidth) / 2 + spacing / 2;
    const startY = (containerHeight - totalHeight) / 2 + spacing / 2;
    
    const newPositions = new Map<number, {x: number, y: number}>();
    
    studentList.forEach((student, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      
      newPositions.set(student.id, { x, y });
    });
    
    setStudentPositions(newPositions);
    
    // 위치를 서버에 저장
    savePositionsToServer(newPositions);
  };
  
  const savePositionsToServer = async (positions: Map<number, {x: number, y: number}>) => {
    for (const [studentId, pos] of positions.entries()) {
      try {
        await fetch(`${API_URL}/api/students/${studentId}/position`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ x: pos.x, y: pos.y }),
        });
      } catch (error) {
        console.error(`Error saving position for student ${studentId}:`, error);
      }
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await fetch(`${API_URL}/api/students/${studentId}`, {
          method: 'DELETE',
        });
        setStudents(students.filter(student => student.id !== studentId));
        handleCloseDetailsModal();
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  return (
    <div className="class-details">
      <div className="header-controls">
        <Link to="/" className="modern-btn back-btn">
          <span className="btn-icon">←</span>
          <span className="btn-text">반 선택으로 돌아가기</span>
        </Link>
        {isAdmin && (
          <button className="modern-btn add-btn" onClick={() => setShowAddModal(true)}>
            <span className="btn-icon">+</span>
            <span className="btn-text">학생 추가하기</span>
          </button>
        )}
        {isAdmin && (
          <button className="modern-btn reset-btn" onClick={handleReset}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">리셋</span>
          </button>
        )}
      </div>
      <h2 className="class-title">{classId}반</h2>
      
      <div className="graph-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="graph-canvas"
          style={{ touchAction: 'none' }} // 스크롤 방지
        />
        
        
      </div>
      <StudentDetailsModal student={selectedStudent} show={showDetailsModal} onHide={handleCloseDetailsModal} onSave={handleSaveStudent} onDelete={handleDeleteStudent} />
      <AddStudentModal show={showAddModal} onHide={() => setShowAddModal(false)} onSave={handleAddStudent} />
      <StudentCustomizeModal 
        student={selectedStudent} 
        show={showCustomizeModal} 
        onHide={() => setShowCustomizeModal(false)} 
        onSave={handleSaveStudent} 
      />
      
      {/* 비밀번호 입력 모달 */}
      <div className={`password-modal-overlay ${showPasswordModal ? 'show' : ''}`} onClick={handlePasswordModalClose}>
        <div className="password-modal" onClick={(e) => e.stopPropagation()}>
          <div className="password-modal-header">
            <h3>🔐 비밀번호 입력</h3>
            <button className="close-btn" onClick={handlePasswordModalClose}>×</button>
          </div>
          <div className="password-modal-body">
            <p>학생 <strong>{selectedStudent?.name}</strong>의 비밀번호를 입력하세요</p>
            <div className="password-input-group">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="4자리 비밀번호"
                maxLength={4}
                className="password-input"
                autoFocus
              />
            </div>
          </div>
          <div className="password-modal-footer">
            <button className="btn-cancel" onClick={handlePasswordModalClose}>
              취소
            </button>
            <button className="btn-submit" onClick={handlePasswordSubmit}>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
