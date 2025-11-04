import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card } from 'react-bootstrap';

interface Student {
  id: number;
  name: string;
  classId: number;
  password?: string;  // 4자리 비밀번호
  tags?: string[];
  connections?: number[];
  existence?: {
    color: string;
    shape: string;
    pattern: string;
    size: number;
    glow: boolean;
    border: string;
    activity: string;
    activities: string[];
    energy: number;
    personality: string;
    customName?: string;
    imageData?: string;
    showElectrons?: boolean; // 전자 표시 여부
    showProtonsNeutrons?: boolean; // 양성자/중성자 표시 여부
    records: Array<{
      date: string;
      activity: string;
      duration: number;
      notes: string;
    }>;
    // 원자 모델 구조
    atom?: {
      protons: Array<{
        keyword: string;
        strength: number;
        color: string;
        emoji: string;
      }>;
      neutrons: Array<{
        keyword: string;
        category: string;
        color: string;
        emoji: string;
      }>;
      electrons: {
        kShell: Array<{
          activity: string;
          frequency: number;
          emoji: string;
          description?: string;
        }>;
        lShell: Array<{
          activity: string;
          frequency: number;
          emoji: string;
          description?: string;
        }>;
        mShell: Array<{
          activity: string;
          frequency: number;
          emoji: string;
          description?: string;
        }>;
        valence: Array<{
          activity: string;
          cooperation: number;
          social: boolean;
          emoji: string;
          description?: string;
        }>;
      };
    };
  };
}

interface StudentCustomizeModalProps {
  student: Student | null;
  show: boolean;
  onHide: () => void;
  onSave: (updatedStudent: Student) => void;
}

const StudentCustomizeModal: React.FC<StudentCustomizeModalProps> = ({
  student,
  show,
  onHide,
  onSave
}) => {
  const [customization, setCustomization] = useState({
    color: '#FF6B6B',
    shape: 'circle',
    pattern: 'solid',
    size: 1.0,
    glow: false,
    border: 'normal',
    customName: '',
    imageData: '' as string
  });

  const [password, setPassword] = useState('');

  // 간소화된 편집 패널 전환: shape | nucleus | shells | records
  const [activePanel, setActivePanel] = useState<'shape' | 'nucleus' | 'shells' | 'records'>('shape');

  const [selectedActivity, setSelectedActivity] = useState('');
  const [activityRecord, setActivityRecord] = useState({
    duration: 30,
    notes: ''
  });
  const [localRecords, setLocalRecords] = useState<Array<{
    date: string;
    activity: string;
    duration: number;
    notes: string;
  }>>([]);

  // 전자 표시 여부 상태
  const [showElectrons, setShowElectrons] = useState(false);
  // 양성자/중성자 표시 여부 상태
  const [showProtonsNeutrons, setShowProtonsNeutrons] = useState(false);

  // 원자 모델 편집 상태 - 처음에는 모두 빈 배열
  const [atomModel, setAtomModel] = useState<{
    protons: Array<{ keyword: string; strength: number; color: string; emoji: string; imageData?: string; description?: string; name?: string }>;
    neutrons: Array<{ keyword: string; category: string; color: string; emoji: string; imageData?: string; description?: string; name?: string }>;
    electrons: {
      kShell: Array<{ activity: string; frequency: number; emoji: string; description: string; imageData?: string; name?: string }>;
      lShell: Array<{ activity: string; frequency: number; emoji: string; description: string; imageData?: string; name?: string }>;
      mShell: Array<{ activity: string; frequency: number; emoji: string; description: string; imageData?: string; name?: string }>;
      valence: Array<{ activity: string; cooperation: number; social: boolean; emoji: string; description: string; imageData?: string; name?: string }>;
    };
  }>({
    protons: [],
    neutrons: [],
    electrons: {
      kShell: [],
      lShell: [],
      mShell: [],
      valence: []
    }
  });

  // 학생이 변경될 때마다 상태 초기화
  useEffect(() => {
    if (student && show) {
      setActivePanel('shape');
      setCustomization({
        color: student.existence?.color || '#FF6B6B',
        shape: student.existence?.shape || 'circle',
        pattern: student.existence?.pattern || 'solid',
        size: student.existence?.size || 1.0,
        glow: student.existence?.glow || false,
        border: student.existence?.border || 'normal',
        customName: student.existence?.customName || '',
        imageData: student.existence?.imageData || ''
      });
      setPassword(student.password || '0000');
      setSelectedActivity(student.existence?.activity || '');
      setActivityRecord({
        duration: 30,
        notes: ''
      });
      // records 배열을 정확히 복사하여 초기화
      setLocalRecords(student.existence?.records ? [...student.existence.records] : []);
      
      // 전자 표시 여부 초기화
      setShowElectrons(student.existence?.showElectrons || false);
      // 양성자/중성자 표시 여부 초기화
      setShowProtonsNeutrons(student.existence?.showProtonsNeutrons || false);
      
      // 원자 모델 초기화 (description 필드를 기본값 ''로 보정)
      if (student.existence?.atom) {
        const a = student.existence.atom as any;
        setAtomModel({
          protons: a.protons || [],
          neutrons: a.neutrons || [],
          electrons: {
            kShell: (a.electrons?.kShell || []).map((e: any) => ({ ...e, description: e.description || '' })),
            lShell: (a.electrons?.lShell || []).map((e: any) => ({ ...e, description: e.description || '' })),
            mShell: (a.electrons?.mShell || []).map((e: any) => ({ ...e, description: e.description || '' })),
            valence: (a.electrons?.valence || []).map((e: any) => ({ ...e, description: e.description || '' })),
          }
        });
      }
    }
  }, [student, show]);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#FF9F43', '#10AC84', '#EE5A24', '#0984E3', '#6C5CE7'
  ];

  const shapes = [
    { value: 'circle', label: '원', icon: '⭕' },
    { value: 'square', label: '사각형', icon: '⬜' },
    { value: 'triangle', label: '삼각형', icon: '🔺' },
    { value: 'star', label: '별', icon: '⭐' },
    { value: 'heart', label: '하트', icon: '❤️' },
    { value: 'smile', label: '웃음', icon: '😊' },
    { value: 'fire', label: '불꽃', icon: '🔥' },
    { value: 'sun', label: '태양', icon: '☀️' },
    { value: 'moon', label: '달', icon: '🌙' },
    { value: 'rainbow', label: '무지개', icon: '🌈' },
    { value: 'flower', label: '꽃', icon: '🌸' },
    { value: 'butterfly', label: '나비', icon: '🦋' },
    { value: 'cat', label: '고양이', icon: '🐱' },
    { value: 'dog', label: '강아지', icon: '🐶' },
    { value: 'panda', label: '판다', icon: '🐼' }
  ];

  const patterns = [
    { value: 'solid', label: '단색' },
    { value: 'stripes', label: '줄무늬' },
    { value: 'dots', label: '점' },
    { value: 'waves', label: '파도' },
    { value: 'grid', label: '격자' }
  ];

  // 이모지 모양 여부 판별(모양 이모티콘 선택 시 색상은 적용되지 않음)
  const isEmojiLike = (text: string): boolean => {
    if (!text) return false;
    const chars = Array.from(text);
    return chars.some(ch => {
      const cp = ch.codePointAt(0) || 0;
      return cp >= 0x1F300 || (cp >= 0x2600 && cp <= 0x27BF);
    });
  };

  const borders = [
    { value: 'normal', label: '일반' },
    { value: 'thick', label: '두꺼운' },
    { value: 'dotted', label: '점선' },
    { value: 'dashed', label: '대시선' }
  ];

  const activities = [
    { value: '축구', emoji: '⚽' },
    { value: '농구', emoji: '🏀' },
    { value: '배구', emoji: '🏐' },
    { value: '테니스', emoji: '🎾' },
    { value: '수영', emoji: '🏊' },
    { value: '달리기', emoji: '🏃' },
    { value: '체조', emoji: '🤸' },
    { value: '댄스', emoji: '💃' },
    { value: '요가', emoji: '🧘' },
    { value: '복싱', emoji: '🥊' },
    { value: '탁구', emoji: '🏓' },
    { value: '배드민턴', emoji: '🏸' },
    { value: '야구', emoji: '⚾' },
    { value: '골프', emoji: '⛳' },
    { value: '스키', emoji: '🎿' },
    { value: '스케이트', emoji: '⛸️' },
    { value: '자전거', emoji: '🚴' },
    { value: '등산', emoji: '🥾' },
    { value: '클라이밍', emoji: '🧗' },
    { value: '명상', emoji: '🧘‍♀️' },
    { value: '공부', emoji: '📚' },
    { value: '독서', emoji: '📖' },
    { value: '그림', emoji: '🎨' },
    { value: '음악', emoji: '🎵' },
    { value: '요리', emoji: '👨‍🍳' },
    { value: '청소', emoji: '🧹' },
    { value: '산책', emoji: '🚶' },
    { value: '게임', emoji: '🎮' },
    { value: '영화감상', emoji: '🎬' }
  ];

  const handleSave = () => {
    if (!student) return;

    console.log('💾 저장하기 전 상태 확인:');
    console.log('  - 이미지:', customization.imageData ? `있음 (${(customization.imageData.length / 1024).toFixed(2)}KB)` : '없음');
    console.log('  - 크기:', customization.size);
    console.log('  - 색상:', customization.color);
    console.log('  - 모양:', customization.shape);

    const updatedStudent = {
      ...student,
      password: password,
      existence: {
        color: customization.color,
        shape: customization.shape,
        pattern: customization.pattern,
        size: customization.size, // 크기 저장 확인
        glow: customization.glow,
        border: customization.border,
        activity: selectedActivity,
        activities: [], // activities 배열은 더 이상 사용하지 않음
        energy: student.existence?.energy || 60,
        personality: student.existence?.personality || 'active',
        customName: customization.customName,
        imageData: customization.imageData || '', // 빈 문자열로 초기화
        showElectrons: showElectrons, // 전자 표시 여부 저장
        showProtonsNeutrons: showProtonsNeutrons, // 양성자/중성자 표시 여부 저장
        records: localRecords, // localRecords를 그대로 사용
        atom: atomModel // 원자 모델 저장
      }
    };

    console.log('💾 저장되는 학생 데이터:');
    console.log('  - 이미지:', updatedStudent.existence.imageData ? `있음 (${(updatedStudent.existence.imageData.length / 1024).toFixed(2)}KB)` : '없음');
    console.log('  - 크기:', updatedStudent.existence.size);
    console.log('  - 전체 데이터 크기:', `${(JSON.stringify(updatedStudent).length / 1024).toFixed(2)}KB`);

    onSave(updatedStudent);
    onHide();
  };

  const handleAddRecord = () => {
    if (!student || !selectedActivity) return;

    const record = {
      date: new Date().toISOString().split('T')[0], // 오늘 날짜 자동 저장
      activity: selectedActivity,
      duration: activityRecord.duration,
      notes: activityRecord.notes
    };

    // 로컬 상태에 즉시 추가하여 UI에 바로 반영
    const newRecords = [...localRecords, record];
    setLocalRecords(newRecords);

    // 즉시 서버에 저장
    const updatedStudent = {
      ...student,
      existence: {
        color: student.existence?.color || '#FF6B6B',
        shape: student.existence?.shape || 'circle',
        pattern: student.existence?.pattern || 'solid',
        size: student.existence?.size || 1.0,
        glow: student.existence?.glow || false,
        border: student.existence?.border || 'normal',
        activity: selectedActivity,
        activities: [], // activities 배열은 더 이상 사용하지 않음
        energy: student.existence?.energy || 60,
        personality: student.existence?.personality || 'active',
        customName: customization.customName,
        records: newRecords,
        atom: atomModel // 원자 모델 포함
      }
    };

    onSave(updatedStudent);
    setActivityRecord({ duration: 30, notes: '' });
    // 모달을 닫지 않고 기록만 추가
  };

  const handleDeleteRecord = (index: number) => {
    if (!student) return;

    // 로컬 상태에서 삭제
    const newRecords = localRecords.filter((_, i) => i !== index);
    setLocalRecords(newRecords);

    // 즉시 서버에 저장
    const updatedStudent = {
      ...student,
      existence: {
        color: student.existence?.color || '#FF6B6B',
        shape: student.existence?.shape || 'circle',
        pattern: student.existence?.pattern || 'solid',
        size: student.existence?.size || 1.0,
        glow: student.existence?.glow || false,
        border: student.existence?.border || 'normal',
        activity: student.existence?.activity || '',
        activities: [], // activities 배열은 더 이상 사용하지 않음
        energy: student.existence?.energy || 60,
        personality: student.existence?.personality || 'active',
        customName: customization.customName,
        records: newRecords,
        atom: atomModel // 원자 모델 포함
      }
    };

    onSave(updatedStudent);
  };

  // 이모티콘 옵션들
  // 이모티콘 카테고리 정의
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

  // 이모티콘 선택 컴포넌트 (카테고리별)
  const EmojiSelector = ({ 
    selectedEmoji, 
    onEmojiSelect, 
    type 
  }: { 
    selectedEmoji: string; 
    onEmojiSelect: (emoji: string) => void; 
    type: 'proton' | 'neutron' | 'electron';
  }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('faces');
    
    return (
      <div className="emoji-selector">
        {/* 카테고리 선택 버튼들 */}
        <div className="d-flex flex-wrap gap-1 mb-3">
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              type="button"
              className={`btn btn-sm ${selectedCategory === key ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setSelectedCategory(key)}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* 선택된 카테고리의 이모티콘들 - 3줄 고정 그리드, 스크롤 가능 */}
        <div
          className="mb-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 32px)',
            gap: '6px',
            height: '110px', // 3줄 (32px) + 여백
            overflowY: 'auto',
            paddingRight: '4px',
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab'
          }}
        >
          {emojiCategories[selectedCategory as keyof typeof emojiCategories].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`btn btn-sm ${selectedEmoji === emoji ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => onEmojiSelect(emoji)}
              style={{ fontSize: '16px', width: '32px', height: '32px' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!student) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Existence</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {/* 상단 패널 전환 버튼 */}
        <div className="mb-3">
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant={activePanel === 'shape' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setActivePanel('shape')}
            >
              Shape Edit
            </Button>
            <Button
              variant={activePanel === 'nucleus' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => setActivePanel('nucleus')}
            >
              Circle Edit
            </Button>
            <Button
              variant={activePanel === 'shells' ? 'info' : 'outline-info'}
              size="sm"
              onClick={() => setActivePanel('shells')}
            >
              Circle Edit
            </Button>
            <Button
              variant={activePanel === 'records' ? 'warning' : 'outline-warning'}
              size="sm"
              onClick={() => setActivePanel('records')}
            >
              Activity Records
            </Button>
          </div>
          <hr className="mt-3" />
        </div>
        {/* 원 모양 선택 - 패널 전환: shape */}
        {activePanel === 'shape' && (
        <Card className="mb-3">
          <Card.Header>Shape Selection</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {colors.map(color => {
                  const disabled = isEmojiLike(customization.shape);
                  return (
                    <div
                      key={color}
                      className={`color-picker ${customization.color === color ? 'selected' : ''}`}
                      style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: color,
                        border: '2px solid #ddd',
                        borderRadius: '50%',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1,
                        // 선택된 색상은 바깥쪽 링(동일 색상)으로 확실히 표시
                        boxShadow: customization.color === color
                          ? `0 0 0 4px ${color}, 0 0 8px 2px ${color}55`
                          : 'none'
                      }}
                      onClick={() => {
                        if (disabled) return;
                        setCustomization(prev => ({ ...prev, color }));
                      }}
                      title={disabled ? 'Color is not applied to emoji shapes.' : ''}
                    />
                  );
                })}
              </div>
              {isEmojiLike(customization.shape) && (
                <div className="mt-1 small text-muted">Color is not applied to emoji shapes.</div>
              )}
            </Form.Group>

            {/* 이미지 업로드 */}
            <Form.Group className="mb-3">
              <Form.Label>Upload Photo (Use as Circle Shape)</Form.Label>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input
                  key={`image-upload-${student?.id || 'new'}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const input = e.currentTarget as HTMLInputElement;
                    const file = input.files?.[0];
                    if (!file) {
                      console.log('📸 이미지 업로드: 파일이 선택되지 않았습니다.');
                      return;
                    }
                    console.log('📸 이미지 업로드 시작:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
                    
                    // 파일 크기 제한 (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      alert('Image size must be 10MB or less.');
                      return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                      if (dataUrl) {
                        console.log('📸 이미지 업로드 완료, Data URL 길이:', `${(dataUrl.length / 1024).toFixed(2)}KB`);
                        // 이미지 로드 후 저장 및 압축
                        const img = new Image();
                        img.onload = () => {
                          // 이미지가 성공적으로 로드되면 크기 조정 및 압축
                          console.log('✅ 이미지 로드 완료, 원본 크기:', img.width, 'x', img.height);
                          
                          // 최대 크기 제한 (800x800 픽셀) - Firestore 필드 크기 제한(1MB) 고려
                          const maxSize = 800;
                          let targetWidth = img.width;
                          let targetHeight = img.height;
                          
                          if (img.width > maxSize || img.height > maxSize) {
                            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                            targetWidth = Math.floor(img.width * ratio);
                            targetHeight = Math.floor(img.height * ratio);
                            console.log('📐 이미지 크기 조정:', targetWidth, 'x', targetHeight);
                          }
                          
                          // Canvas를 사용하여 이미지 리사이즈 및 압축
                          const canvas = document.createElement('canvas');
                          canvas.width = targetWidth;
                          canvas.height = targetHeight;
                          const ctx = canvas.getContext('2d');
                          
                          if (!ctx) {
                            console.error('❌ Canvas 컨텍스트를 생성할 수 없습니다.');
                            alert('Error occurred while processing image.');
                            return;
                          }
                          
                          // 이미지 그리기 (고품질 스케일링)
                          ctx.imageSmoothingEnabled = true;
                          ctx.imageSmoothingQuality = 'high';
                          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                          
                          // JPEG로 압축 (품질 0.8, 약 1MB 이하로 압축 목표)
                          let quality = 0.8;
                          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                          
                          // 데이터 크기가 여전히 크면 품질을 더 낮춤 (최소 0.5)
                          while (compressedDataUrl.length > 800 * 1024 && quality > 0.5) {
                            quality -= 0.1;
                            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                          }
                          
                          console.log('📸 압축 완료, 최종 크기:', `${(compressedDataUrl.length / 1024).toFixed(2)}KB`, `(품질: ${quality.toFixed(1)})`);
                          
                          // 유효성 검사: data:image/ 접두사 확인
                          if (!compressedDataUrl.startsWith('data:image/')) {
                            console.error('❌ 압축된 이미지 데이터 형식이 올바르지 않습니다.');
                            alert('Error occurred while processing image.');
                            return;
                          }
                          
                          setCustomization(prev => {
                            const updated = { ...prev, imageData: compressedDataUrl };
                            console.log('📸 customization 상태 업데이트:', updated.imageData ? `있음 (${(updated.imageData.length / 1024).toFixed(2)}KB)` : '없음');
                            return updated;
                          });
                          alert('Image uploaded. Please click Save button.');
                        };
                        img.onerror = () => {
                          console.error('❌ 이미지 로드 실패');
                          alert('Cannot load image. Please select a different image.');
                        };
                        img.src = dataUrl;
                      } else {
                        console.error('❌ 이미지 업로드 실패: Data URL을 생성할 수 없습니다.');
                        alert('Cannot read image.');
                      }
                    };
                    reader.onerror = (error) => {
                      console.error('❌ 이미지 업로드 에러:', error);
                      alert('Error occurred while reading file.');
                    };
                    reader.readAsDataURL(file);
                  }}
                  style={{ 
                    maxWidth: '100%',
                    fontSize: '16px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                />
                {customization.imageData && (
                  <>
                    <img
                      src={customization.imageData}
                      alt="preview"
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setCustomization(prev => ({ ...prev, imageData: '' }))}
                    >
                      Remove
                    </Button>
                  </>
                )}
              </div>
              <Form.Text className="text-muted">Uploaded photos take priority over emoji/shape.</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Shape Emoji</Form.Label>
              <EmojiSelector
                selectedEmoji={customization.shape}
                onEmojiSelect={(emoji) => setCustomization(prev => ({ ...prev, shape: emoji }))}
                type="proton"
              />
              <div className="mt-1 small text-muted">Selected emoji will be used as the circle shape.</div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pattern</Form.Label>
              <Form.Select
                value={customization.pattern}
                onChange={(e) => setCustomization(prev => ({ ...prev, pattern: e.target.value }))}
              >
                {patterns.map(pattern => (
                  <option key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Size: {customization.size.toFixed(1)}</strong>
              </Form.Label>
              <Form.Range
                min="0.5"
                max="3.0"
                step="0.1"
                value={customization.size}
                onChange={(e) => {
                  const newSize = parseFloat(e.target.value);
                  console.log('📏 크기 변경:', newSize);
                  setCustomization(prev => ({ ...prev, size: newSize }));
                }}
                style={{ 
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
              <Form.Text className="text-muted">
                0.5 (Small) ~ 3.0 (Large)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Border</Form.Label>
              <Form.Select
                value={customization.border}
                onChange={(e) => setCustomization(prev => ({ ...prev, border: e.target.value }))}
              >
                {borders.map(border => (
                  <option key={border.value} value={border.value}>
                    {border.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Glow Effect"
                checked={customization.glow}
                onChange={(e) => setCustomization(prev => ({ ...prev, glow: e.target.checked }))}
              />
            </Form.Group>
          </Card.Body>
        </Card>
        )}
        {activePanel === 'shape' && (
          <>
            {/* 사용자 정의 이름 입력 (모양 편집에서만 표시) */}
            <Card className="mb-3">
              <Card.Header>Circle Name Settings</Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label>Name to display inside circle</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter name (e.g., John, nickname, etc.)"
                    value={customization.customName}
                    onChange={(e) => setCustomization(prev => ({ ...prev, customName: e.target.value }))}
                    maxLength={10}
                  />
                  <Form.Text className="text-muted">
                    빈칸으로 두면 기본 번호가 표시됩니다. (최대 10자)
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* 비밀번호 설정 (모양 편집에서만 표시) */}
            <Card className="mb-3">
              <Card.Header>🔐 비밀번호 설정</Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label>4자리 비밀번호</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="0000"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={4}
                    style={{ 
                      textAlign: 'center', 
                      letterSpacing: '2px',
                      fontFamily: 'Courier New, monospace'
                    }}
                  />
                  <Form.Text className="text-muted">
                    원자 클릭 시 입력해야 하는 4자리 비밀번호입니다.
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </>
        )}

        {/* 원자 모델 편집 - 패널 전환: nucleus */}
        {activePanel === 'nucleus' && (
        <Card className="mb-3">
          <Card.Header>⚛️ Circle Edit</Card.Header>
          <Card.Body>
            {/* 양성자/중성자 표시 여부 체크박스 */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Show Circles"
                checked={showProtonsNeutrons}
                onChange={(e) => setShowProtonsNeutrons(e.target.checked)}
              />
              <Form.Text className="text-muted">
                Check to display edited circles on screen.
              </Form.Text>
            </Form.Group>
            <hr className="mb-3" />
            <Row>
              <Col md={6}>
                <h6>🔴 Circle</h6>
                {atomModel.protons.map((proton, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          backgroundColor: proton.color,
                          color: 'white',
                          fontSize: '16px'
                        }}
                      >
                        {proton.emoji}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Name"
                        value={proton.name || ''}
                        onChange={(e) => {
                          const newProtons = [...atomModel.protons];
                          newProtons[index].name = e.target.value;
                          setAtomModel({...atomModel, protons: newProtons});
                        }}
                      />
                    </div>
                    <Form.Group>
                      <Form.Label>Color</Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        {colors.map(color => (
                          <div
                            key={color}
                            className={`color-option ${proton.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              const newProtons = [...atomModel.protons];
                              newProtons[index].color = color;
                              setAtomModel({...atomModel, protons: newProtons});
                            }}
                          />
                        ))}
                      </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Upload Photo</Form.Label>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 10 * 1024 * 1024) {
                              alert('Image size must be 10MB or less.');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = () => {
                              const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                              if (dataUrl) {
                                const img = new Image();
                                img.onload = () => {
                                  const maxSize = 400;
                                  let targetWidth = img.width;
                                  let targetHeight = img.height;
                                  
                                  if (img.width > maxSize || img.height > maxSize) {
                                    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                                    targetWidth = Math.floor(img.width * ratio);
                                    targetHeight = Math.floor(img.height * ratio);
                                  }
                                  
                                  const canvas = document.createElement('canvas');
                                  canvas.width = targetWidth;
                                  canvas.height = targetHeight;
                                  const ctx = canvas.getContext('2d');
                                  
                                  if (!ctx) return;
                                  
                                  ctx.imageSmoothingEnabled = true;
                                  ctx.imageSmoothingQuality = 'high';
                                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                                  
                                  let quality = 0.8;
                                  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  
                                  while (compressedDataUrl.length > 400 * 1024 && quality > 0.5) {
                                    quality -= 0.1;
                                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  }
                                  
                                  const newProtons = [...atomModel.protons];
                                  newProtons[index].imageData = compressedDataUrl;
                                  setAtomModel({...atomModel, protons: newProtons});
                                  alert('사진이 업로드되었습니다.');
                                };
                                img.src = dataUrl;
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          style={{ fontSize: '14px', padding: '6px' }}
                        />
                        {proton.imageData && (
                          <>
                            <img
                              src={proton.imageData}
                              alt="preview"
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newProtons = [...atomModel.protons];
                                newProtons[index].imageData = undefined;
                                setAtomModel({...atomModel, protons: newProtons});
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="설명을 입력하세요..."
                        value={proton.description || ''}
                        onChange={(e) => {
                          const newProtons = [...atomModel.protons];
                          newProtons[index].description = e.target.value;
                          setAtomModel({...atomModel, protons: newProtons});
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Select Emoji</Form.Label>
                      <EmojiSelector
                        selectedEmoji={proton.emoji}
                        onEmojiSelect={(emoji) => {
                          const newProtons = [...atomModel.protons];
                          newProtons[index].emoji = emoji;
                          setAtomModel({...atomModel, protons: newProtons});
                        }}
                        type="proton"
                      />
                    </Form.Group>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        const newProtons = atomModel.protons.filter((_, i) => i !== index);
                        setAtomModel({...atomModel, protons: newProtons});
                      }}
                      style={{ marginTop: '8px' }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    setAtomModel({
                      ...atomModel,
                      protons: [...atomModel.protons, { keyword: '', strength: 3, color: '#FF6B6B', emoji: '✨', name: '' }]
                    });
                  }}
                >
                  + Add
                </Button>
              </Col>
              
              <Col md={6}>
                <h6>🔵 Circle</h6>
                {atomModel.neutrons.map((neutron, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          backgroundColor: neutron.color,
                          color: 'white',
                          fontSize: '16px'
                        }}
                      >
                        {neutron.emoji}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Name"
                        value={neutron.name || ''}
                        onChange={(e) => {
                          const newNeutrons = [...atomModel.neutrons];
                          newNeutrons[index].name = e.target.value;
                          setAtomModel({...atomModel, neutrons: newNeutrons});
                        }}
                      />
                    </div>
                    <Form.Group>
                      <Form.Label>Color</Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        {colors.map(color => (
                          <div
                            key={color}
                            className={`color-option ${neutron.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              const newNeutrons = [...atomModel.neutrons];
                              newNeutrons[index].color = color;
                              setAtomModel({...atomModel, neutrons: newNeutrons});
                            }}
                          />
                        ))}
                      </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Upload Photo</Form.Label>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 10 * 1024 * 1024) {
                              alert('Image size must be 10MB or less.');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = () => {
                              const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                              if (dataUrl) {
                                const img = new Image();
                                img.onload = () => {
                                  const maxSize = 400;
                                  let targetWidth = img.width;
                                  let targetHeight = img.height;
                                  
                                  if (img.width > maxSize || img.height > maxSize) {
                                    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                                    targetWidth = Math.floor(img.width * ratio);
                                    targetHeight = Math.floor(img.height * ratio);
                                  }
                                  
                                  const canvas = document.createElement('canvas');
                                  canvas.width = targetWidth;
                                  canvas.height = targetHeight;
                                  const ctx = canvas.getContext('2d');
                                  
                                  if (!ctx) return;
                                  
                                  ctx.imageSmoothingEnabled = true;
                                  ctx.imageSmoothingQuality = 'high';
                                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                                  
                                  let quality = 0.8;
                                  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  
                                  while (compressedDataUrl.length > 400 * 1024 && quality > 0.5) {
                                    quality -= 0.1;
                                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  }
                                  
                                  const newNeutrons = [...atomModel.neutrons];
                                  newNeutrons[index].imageData = compressedDataUrl;
                                  setAtomModel({...atomModel, neutrons: newNeutrons});
                                  alert('사진이 업로드되었습니다.');
                                };
                                img.src = dataUrl;
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          style={{ fontSize: '14px', padding: '6px' }}
                        />
                        {neutron.imageData && (
                          <>
                            <img
                              src={neutron.imageData}
                              alt="preview"
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newNeutrons = [...atomModel.neutrons];
                                newNeutrons[index].imageData = undefined;
                                setAtomModel({...atomModel, neutrons: newNeutrons});
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="설명을 입력하세요..."
                        value={neutron.description || ''}
                        onChange={(e) => {
                          const newNeutrons = [...atomModel.neutrons];
                          newNeutrons[index].description = e.target.value;
                          setAtomModel({...atomModel, neutrons: newNeutrons});
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Select Emoji</Form.Label>
                      <EmojiSelector
                        selectedEmoji={neutron.emoji}
                        onEmojiSelect={(emoji) => {
                          const newNeutrons = [...atomModel.neutrons];
                          newNeutrons[index].emoji = emoji;
                          setAtomModel({...atomModel, neutrons: newNeutrons});
                        }}
                        type="neutron"
                      />
                    </Form.Group>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        const newNeutrons = atomModel.neutrons.filter((_, i) => i !== index);
                        setAtomModel({...atomModel, neutrons: newNeutrons});
                      }}
                      style={{ marginTop: '8px' }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    setAtomModel({
                      ...atomModel,
                      neutrons: [...atomModel.neutrons, { keyword: '', category: '취미', color: '#96CEB4', emoji: '🌟', name: '' }]
                    });
                  }}
                >
                  + Add
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        )}

        {/* 전자 껍질 편집 - 패널 전환: shells */}
        {activePanel === 'shells' && (
        <Card className="mb-3">
          <Card.Header>⚡ Circle Edit</Card.Header>
          <Card.Body>
            {/* 전자 표시 여부 체크박스 */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Show Circles"
                checked={showElectrons}
                onChange={(e) => setShowElectrons(e.target.checked)}
              />
              <Form.Text className="text-muted">
                Check to display edited circles on screen.
              </Form.Text>
            </Form.Group>
            <hr className="mb-3" />
            <Row>
              <Col md={3}>
                <h6>🟠 Circle</h6>
                {atomModel.electrons.kShell.map((electron, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="mb-2">Selected Emoji: <span style={{fontSize:'18px'}}>{electron.emoji}</span></div>
                    <Form.Group className="mb-2">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Name"
                        value={electron.name || ''}
                        onChange={(e) => {
                          const newKShell = [...atomModel.electrons.kShell];
                          newKShell[index].name = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, kShell: newKShell }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Select Emoji</Form.Label>
                      <EmojiSelector
                        selectedEmoji={electron.emoji}
                        onEmojiSelect={(emoji) => {
                          const newKShell = [...atomModel.electrons.kShell];
                          newKShell[index].emoji = emoji;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, kShell: newKShell }
                          });
                        }}
                        type="electron"
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter description for selected emoji"
                        value={electron.description || ''}
                        onChange={(e) => {
                          const newKShell = [...atomModel.electrons.kShell];
                          newKShell[index].description = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, kShell: newKShell }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Upload Photo</Form.Label>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 10 * 1024 * 1024) {
                              alert('Image size must be 10MB or less.');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = () => {
                              const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                              if (dataUrl) {
                                const img = new Image();
                                img.onload = () => {
                                  const maxSize = 400;
                                  let targetWidth = img.width;
                                  let targetHeight = img.height;
                                  
                                  if (img.width > maxSize || img.height > maxSize) {
                                    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                                    targetWidth = Math.floor(img.width * ratio);
                                    targetHeight = Math.floor(img.height * ratio);
                                  }
                                  
                                  const canvas = document.createElement('canvas');
                                  canvas.width = targetWidth;
                                  canvas.height = targetHeight;
                                  const ctx = canvas.getContext('2d');
                                  
                                  if (!ctx) return;
                                  
                                  ctx.imageSmoothingEnabled = true;
                                  ctx.imageSmoothingQuality = 'high';
                                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                                  
                                  let quality = 0.8;
                                  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  
                                  while (compressedDataUrl.length > 400 * 1024 && quality > 0.5) {
                                    quality -= 0.1;
                                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  }
                                  
                                  const newKShell = [...atomModel.electrons.kShell];
                                  newKShell[index].imageData = compressedDataUrl;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, kShell: newKShell }
                                  });
                                  alert('사진이 업로드되었습니다.');
                                };
                                img.src = dataUrl;
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          style={{ fontSize: '14px', padding: '6px' }}
                        />
                        {electron.imageData && (
                          <>
                            <img
                              src={electron.imageData}
                              alt="preview"
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newKShell = [...atomModel.electrons.kShell];
                                newKShell[index].imageData = undefined;
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, kShell: newKShell }
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </Form.Group>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        const newKShell = atomModel.electrons.kShell.filter((_, i) => i !== index);
                        setAtomModel({
                          ...atomModel,
                          electrons: { ...atomModel.electrons, kShell: newKShell }
                        });
                      }}
                      style={{ marginTop: '8px' }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  onClick={() => {
                    setAtomModel({
                      ...atomModel,
                      electrons: {
                        ...atomModel.electrons,
                        kShell: [...atomModel.electrons.kShell, { activity: '', frequency: 4, emoji: '📖', description: '', name: '' }]
                      }
                    });
                  }}
                >
                  + Add
                </Button>
              </Col>

              <Col md={3}>
                <h6>🟡 Circle</h6>
                {atomModel.electrons.lShell.map((electron, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '25px', 
                          height: '25px', 
                          backgroundColor: '#4ECDC4',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        {electron.emoji}
                      </div>
                      <div className="ms-1 small text-muted">Select an emoji</div>
                    </div>
                    <Form.Group className="mb-2">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Name"
                        value={electron.name || ''}
                        onChange={(e) => {
                          const newLShell = [...atomModel.electrons.lShell];
                          newLShell[index].name = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, lShell: newLShell }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Select Emoji</Form.Label>
                      <EmojiSelector
                        selectedEmoji={electron.emoji}
                        onEmojiSelect={(emoji) => {
                          const newLShell = [...atomModel.electrons.lShell];
                          newLShell[index].emoji = emoji;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, lShell: newLShell }
                          });
                        }}
                        type="electron"
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter description for selected emoji"
                        value={electron.description || ''}
                        onChange={(e) => {
                          const newLShell = [...atomModel.electrons.lShell];
                          newLShell[index].description = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, lShell: newLShell }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Upload Photo</Form.Label>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 10 * 1024 * 1024) {
                              alert('Image size must be 10MB or less.');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = () => {
                              const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                              if (dataUrl) {
                                const img = new Image();
                                img.onload = () => {
                                  const maxSize = 400;
                                  let targetWidth = img.width;
                                  let targetHeight = img.height;
                                  
                                  if (img.width > maxSize || img.height > maxSize) {
                                    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                                    targetWidth = Math.floor(img.width * ratio);
                                    targetHeight = Math.floor(img.height * ratio);
                                  }
                                  
                                  const canvas = document.createElement('canvas');
                                  canvas.width = targetWidth;
                                  canvas.height = targetHeight;
                                  const ctx = canvas.getContext('2d');
                                  
                                  if (!ctx) return;
                                  
                                  ctx.imageSmoothingEnabled = true;
                                  ctx.imageSmoothingQuality = 'high';
                                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                                  
                                  let quality = 0.8;
                                  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  
                                  while (compressedDataUrl.length > 400 * 1024 && quality > 0.5) {
                                    quality -= 0.1;
                                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  }
                                  
                                  const newLShell = [...atomModel.electrons.lShell];
                                  newLShell[index].imageData = compressedDataUrl;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, lShell: newLShell }
                                  });
                                  alert('사진이 업로드되었습니다.');
                                };
                                img.src = dataUrl;
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          style={{ fontSize: '14px', padding: '6px' }}
                        />
                        {electron.imageData && (
                          <>
                            <img
                              src={electron.imageData}
                              alt="preview"
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newLShell = [...atomModel.electrons.lShell];
                                newLShell[index].imageData = undefined;
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, lShell: newLShell }
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </Form.Group>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        const newLShell = atomModel.electrons.lShell.filter((_, i) => i !== index);
                        setAtomModel({
                          ...atomModel,
                          electrons: { ...atomModel.electrons, lShell: newLShell }
                        });
                      }}
                      style={{ marginTop: '8px' }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline-info" 
                  size="sm"
                  onClick={() => {
                    setAtomModel({
                      ...atomModel,
                      electrons: {
                        ...atomModel.electrons,
                        lShell: [...atomModel.electrons.lShell, { activity: '', frequency: 4, emoji: '🏃', description: '', name: '' }]
                      }
                    });
                  }}
                >
                  + Add
                </Button>
              </Col>

              <Col md={3}>
                <h6>🟢 Circle</h6>
                {atomModel.electrons.mShell.map((electron, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="me-2 rounded-circle d-flex align_items-center justify-content-center"
                        style={{ 
                          width: '25px', 
                          height: '25px', 
                          backgroundColor: '#45B7D1',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        {electron.emoji}
                      </div>
                      <div className="ms-1 small text-muted">Select an emoji</div>
                    </div>
                    <Form.Group className="mb-2">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Name"
                        value={electron.name || ''}
                        onChange={(e) => {
                          const newMShell = [...atomModel.electrons.mShell];
                          newMShell[index].name = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, mShell: newMShell }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Select Emoji</Form.Label>
                      <EmojiSelector
                        selectedEmoji={electron.emoji}
                        onEmojiSelect={(emoji) => {
                          const newMShell = [...atomModel.electrons.mShell];
                          newMShell[index].emoji = emoji;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, mShell: newMShell }
                          });
                        }}
                        type="electron"
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter description for selected emoji"
                        value={electron.description || ''}
                        onChange={(e) => {
                          const newMShell = [...atomModel.electrons.mShell];
                          newMShell[index].description = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, mShell: newMShell }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Upload Photo</Form.Label>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 10 * 1024 * 1024) {
                              alert('Image size must be 10MB or less.');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = () => {
                              const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                              if (dataUrl) {
                                const img = new Image();
                                img.onload = () => {
                                  const maxSize = 400;
                                  let targetWidth = img.width;
                                  let targetHeight = img.height;
                                  
                                  if (img.width > maxSize || img.height > maxSize) {
                                    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                                    targetWidth = Math.floor(img.width * ratio);
                                    targetHeight = Math.floor(img.height * ratio);
                                  }
                                  
                                  const canvas = document.createElement('canvas');
                                  canvas.width = targetWidth;
                                  canvas.height = targetHeight;
                                  const ctx = canvas.getContext('2d');
                                  
                                  if (!ctx) return;
                                  
                                  ctx.imageSmoothingEnabled = true;
                                  ctx.imageSmoothingQuality = 'high';
                                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                                  
                                  let quality = 0.8;
                                  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  
                                  while (compressedDataUrl.length > 400 * 1024 && quality > 0.5) {
                                    quality -= 0.1;
                                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  }
                                  
                                  const newMShell = [...atomModel.electrons.mShell];
                                  newMShell[index].imageData = compressedDataUrl;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, mShell: newMShell }
                                  });
                                  alert('사진이 업로드되었습니다.');
                                };
                                img.src = dataUrl;
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          style={{ fontSize: '14px', padding: '6px' }}
                        />
                        {electron.imageData && (
                          <>
                            <img
                              src={electron.imageData}
                              alt="preview"
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newMShell = [...atomModel.electrons.mShell];
                                newMShell[index].imageData = undefined;
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, mShell: newMShell }
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </Form.Group>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        const newMShell = atomModel.electrons.mShell.filter((_, i) => i !== index);
                        setAtomModel({
                          ...atomModel,
                          electrons: { ...atomModel.electrons, mShell: newMShell }
                        });
                      }}
                      style={{ marginTop: '8px' }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => {
                    setAtomModel({
                      ...atomModel,
                      electrons: {
                        ...atomModel.electrons,
                        mShell: [...atomModel.electrons.mShell, { activity: '', frequency: 2, emoji: '🤝', description: '', name: '' }]
                      }
                    });
                  }}
                >
                  + Add
                </Button>
              </Col>

              <Col md={3}>
                <h6>🔵 Circle</h6>
                {atomModel.electrons.valence.map((electron, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '25px', 
                          height: '25px', 
                          backgroundColor: '#96CEB4',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        {electron.emoji}
                      </div>
                      <div className="ms-1 small text-muted">Select an emoji</div>
                    </div>
                    <Form.Group className="mb-2">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Name"
                        value={electron.name || ''}
                        onChange={(e) => {
                          const newValence = [...atomModel.electrons.valence];
                          newValence[index].name = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, valence: newValence }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Select Emoji</Form.Label>
                      <EmojiSelector
                        selectedEmoji={electron.emoji}
                        onEmojiSelect={(emoji) => {
                          const newValence = [...atomModel.electrons.valence];
                          newValence[index].emoji = emoji;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, valence: newValence }
                          });
                        }}
                        type="electron"
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter description for selected emoji"
                        value={electron.description || ''}
                        onChange={(e) => {
                          const newValence = [...atomModel.electrons.valence];
                          newValence[index].description = e.target.value;
                          setAtomModel({
                            ...atomModel,
                            electrons: { ...atomModel.electrons, valence: newValence }
                          });
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Upload Photo</Form.Label>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 10 * 1024 * 1024) {
                              alert('Image size must be 10MB or less.');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = () => {
                              const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                              if (dataUrl) {
                                const img = new Image();
                                img.onload = () => {
                                  const maxSize = 400;
                                  let targetWidth = img.width;
                                  let targetHeight = img.height;
                                  
                                  if (img.width > maxSize || img.height > maxSize) {
                                    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                                    targetWidth = Math.floor(img.width * ratio);
                                    targetHeight = Math.floor(img.height * ratio);
                                  }
                                  
                                  const canvas = document.createElement('canvas');
                                  canvas.width = targetWidth;
                                  canvas.height = targetHeight;
                                  const ctx = canvas.getContext('2d');
                                  
                                  if (!ctx) return;
                                  
                                  ctx.imageSmoothingEnabled = true;
                                  ctx.imageSmoothingQuality = 'high';
                                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                                  
                                  let quality = 0.8;
                                  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  
                                  while (compressedDataUrl.length > 400 * 1024 && quality > 0.5) {
                                    quality -= 0.1;
                                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                  }
                                  
                                  const newValence = [...atomModel.electrons.valence];
                                  newValence[index].imageData = compressedDataUrl;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, valence: newValence }
                                  });
                                  alert('사진이 업로드되었습니다.');
                                };
                                img.src = dataUrl;
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          style={{ fontSize: '14px', padding: '6px' }}
                        />
                        {electron.imageData && (
                          <>
                            <img
                              src={electron.imageData}
                              alt="preview"
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newValence = [...atomModel.electrons.valence];
                                newValence[index].imageData = undefined;
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, valence: newValence }
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </Form.Group>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        const newValence = atomModel.electrons.valence.filter((_, i) => i !== index);
                        setAtomModel({
                          ...atomModel,
                          electrons: { ...atomModel.electrons, valence: newValence }
                        });
                      }}
                      style={{ marginTop: '8px' }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    setAtomModel({
                      ...atomModel,
                      electrons: {
                        ...atomModel.electrons,
                        valence: [...atomModel.electrons.valence, { activity: '', cooperation: 3, social: true, emoji: '🔧', description: '', name: '' }]
                      }
                    });
                  }}
                >
                  + Add
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        )}

        {/* 활동 기록 - 패널 전환: records */}
        {activePanel === 'records' && (
          <>
            <Card className="mb-3">
              <Card.Header>📝 활동 기록 추가</Card.Header>
              <Card.Body>
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                    활동 이모티콘 선택
                  </Form.Label>
                  <EmojiSelector
                    selectedEmoji={selectedActivity}
                    onEmojiSelect={(emoji) => setSelectedActivity(emoji)}
                    type="electron"
                  />
                  <Form.Text className="text-muted mt-2 d-block">
                    활동을 나타내는 이모티콘을 선택하세요
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                    시간 (분)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={activityRecord.duration}
                    onChange={(e) => setActivityRecord(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    style={{ fontSize: '16px', padding: '10px' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                    메모 작성
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={activityRecord.notes}
                    onChange={(e) => setActivityRecord(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="활동에 대한 메모를 자세히 작성하세요..."
                    style={{ fontSize: '15px', padding: '12px', resize: 'vertical' }}
                  />
                  <Form.Text className="text-muted mt-2 d-block">
                    활동에 대한 상세한 내용, 느낀 점, 배운 점 등을 자유롭게 작성하세요
                  </Form.Text>
                </Form.Group>

                <Button 
                  onClick={handleAddRecord} 
                  disabled={!selectedActivity}
                  size="lg"
                  style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
                >
                  ✨ 기록 추가하기
                </Button>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header style={{ fontSize: '18px', fontWeight: 'bold' }}>
                📋 활동 기록 내역 ({localRecords.length}개)
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto', padding: '15px' }}>
                {localRecords.length === 0 ? (
                  <div className="text-center text-muted p-4" style={{ fontSize: '16px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
                    <div>아직 기록된 활동이 없습니다.</div>
                    <div className="mt-2" style={{ fontSize: '14px' }}>위에서 활동을 추가해보세요!</div>
                  </div>
                ) : (
                  localRecords.map((record, index) => (
                    <div 
                      key={index} 
                      className="mb-3 p-3 border rounded shadow-sm"
                      style={{ 
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #ffc107'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-items-center mb-2">
                            <span style={{ fontSize: '24px', marginRight: '10px' }}>
                              {record.activity}
                            </span>
                            <span className="badge bg-warning text-dark" style={{ fontSize: '14px' }}>
                              {record.duration}분
                            </span>
                          </div>
                          <div className="text-muted mb-2" style={{ fontSize: '14px' }}>
                            📅 {record.date}
                          </div>
                          {record.notes && (
                            <div className="mt-2 p-2 bg-white rounded" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                              {record.notes}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteRecord(index)}
                          style={{ 
                            minWidth: '35px', 
                            height: '35px', 
                            padding: '0', 
                            fontSize: '20px',
                            marginLeft: '10px'
                          }}
                          title="Delete this record"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" onClick={handleSave}>
          Save and Exit
        </Button>
        <Button variant="outline-secondary" onClick={onHide}>
          Exit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StudentCustomizeModal;
