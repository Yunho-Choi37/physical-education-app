/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Card, Badge } from 'react-bootstrap';
import { getApiUrl } from './config';
import { SportType, sportNames, sportStats } from './gameRecordConfig';

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
    showGameRecords?: boolean; // 경기 기록 표시 여부
    records: Array<{
      date: string;
      activity: string;
      duration: number;
      notes: string;
      gameRecord?: {
        sport: string;
        stats: Record<string, number>;
      };
    }>;
    // 원자 모델 구조
    atom?: {
      protons: Array<{
        keyword: string;
        strength: number;
        color: string;
        emoji: string;
        hashtags?: string[];
      }>;
      neutrons: Array<{
        keyword: string;
        category: string;
        color: string;
        emoji: string;
        hashtags?: string[];
      }>;
      electrons: {
        kShell: Array<{
          activity: string;
          frequency: number;
          emoji: string;
          description?: string;
          hashtags?: string[];
          goalItem?: string; // 목표 항목
          attemptCount?: number; // 시도 횟수
          successCount?: number; // 성공 횟수
          activityTime?: number; // 활동 시간 (분)
          date?: string; // 날짜 (YYYY-MM-DD)
        }>;
        lShell: Array<{
          activity: string;
          frequency: number;
          emoji: string;
          description?: string;
          hashtags?: string[];
          goalItem?: string;
          attemptCount?: number;
          successCount?: number;
          activityTime?: number;
          date?: string;
        }>;
        mShell: Array<{
          activity: string;
          frequency: number;
          emoji: string;
          description?: string;
          hashtags?: string[];
          goalItem?: string;
          attemptCount?: number;
          successCount?: number;
          activityTime?: number;
          date?: string;
        }>;
        valence: Array<{
          activity: string;
          cooperation: number;
          social: boolean;
          emoji: string;
          description?: string;
          hashtags?: string[];
          goalItem?: string;
          attemptCount?: number;
          successCount?: number;
          activityTime?: number;
          date?: string;
        }>;
      };
    };
  };
}

interface StudentCustomizeModalProps {
  student: Student | null;
  show: boolean;
  onHide: () => void;
  onSave: (updatedStudent: Student) => void | Promise<void>;
}

const normalizeHashtagValue = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const primaryToken = trimmed
    .split(/[\s,]+/)
    .find(segment => segment.replace(/[#\s]/g, '').length > 0);

  if (!primaryToken) {
    return '';
  }

  const withHash = primaryToken.startsWith('#') ? primaryToken : `#${primaryToken}`;
  const cleaned = withHash.replace(/[,.;:!?~\u3001\u3002\uff0c\uff01\uff1f\uff1b\uff1a]+$/g, '');

  if (cleaned === '#') {
    return '';
  }

  return cleaned.toLowerCase();
};

const normalizeHashtagArray = (input: unknown): string[] => {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : [input];
  const normalized = raw
    .map(item => typeof item === 'string' ? normalizeHashtagValue(item) : '')
    .filter((tag): tag is string => Boolean(tag));
  return Array.from(new Set(normalized));
};

const StudentCustomizeModal: React.FC<StudentCustomizeModalProps> = ({
  student,
  show,
  onHide,
  onSave
}) => {
  const hashtagPlaceholder = '#태그 입력 후 Enter';

  const addHashtag = (current: string[] | undefined, value: string): string[] => {
    const tag = normalizeHashtagValue(value);
    if (!tag) return current || [];
    const set = new Set(current || []);
    set.add(tag);
    return Array.from(set);
  };

  type InputLikeElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

  const handleHashtagKeyDown = (
    event: React.KeyboardEvent<InputLikeElement>,
    onAdd: (tag: string) => void
  ) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      const input = event.currentTarget as HTMLInputElement | HTMLTextAreaElement;
      const normalized = normalizeHashtagValue(input.value);
      if (normalized) {
        onAdd(normalized);
        input.value = '';
      }
    }
  };

  const renderHashtagChips = (tags: string[], onRemove: (index: number) => void) => (
    <div className="d-flex flex-wrap gap-2 mb-2">
      {tags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          bg="light"
          text="dark"
          className="d-inline-flex align-items-center gap-1"
        >
          {tag}
          <Button
            type="button"
            variant="link"
            size="sm"
            className="p-0 text-muted text-decoration-none"
            onClick={() => onRemove(index)}
            aria-label={`${tag} 삭제`}
          >
            ×
          </Button>
        </Badge>
      ))}
    </div>
  );

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

  const [selectedSport, setSelectedSport] = useState<SportType | ''>('');
  const [gameRecord, setGameRecord] = useState<{
    date: string;
    sport: SportType;
    stats: Record<string, number>;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    sport: '' as SportType,
    stats: {},
    notes: ''
  });

  const [localRecords, setLocalRecords] = useState<Array<{
    date: string;
    activity: string;
    duration: number;
    notes: string;
    gameRecord?: {
      sport: SportType;
      stats: Record<string, number>;
    };
  }>>([]);

  // 전자 표시 여부 상태
  const [showElectrons, setShowElectrons] = useState(false);
  // 양성자/중성자 표시 여부 상태
  const [showProtonsNeutrons, setShowProtonsNeutrons] = useState(false);
  // 경기 기록 표시 여부 상태
  const [showGameRecords, setShowGameRecords] = useState(false);

  // 목표 선택 관련 상태
  const [goals, setGoals] = useState<Array<{ id: string; title: string; description: string; items: string[] }>>([]);
  const [showGoalSelectModal, setShowGoalSelectModal] = useState(false);
  const [selectedShellType, setSelectedShellType] = useState<'kShell' | 'lShell' | 'mShell' | 'valence' | null>(null);

  // 원자 모델 편집 상태 - 처음에는 모두 빈 배열
  const [atomModel, setAtomModel] = useState<{
    protons: Array<{ keyword: string; strength: number; color: string; emoji: string; imageData?: string; images?: string[]; primaryImageIndex?: number; description?: string; name?: string; hashtags?: string[] }>;
    neutrons: Array<{ keyword: string; category: string; color: string; emoji: string; imageData?: string; images?: string[]; primaryImageIndex?: number; description?: string; name?: string; hashtags?: string[] }>;
    electrons: {
      kShell: Array<{ activity: string; frequency: number; emoji: string; description: string; imageData?: string; images?: string[]; primaryImageIndex?: number; name?: string; hashtags?: string[]; goalItem?: string; attemptCount?: number; successCount?: number; activityTime?: number; date?: string }>;
      lShell: Array<{ activity: string; frequency: number; emoji: string; description: string; imageData?: string; images?: string[]; primaryImageIndex?: number; name?: string; hashtags?: string[]; goalItem?: string; attemptCount?: number; successCount?: number; activityTime?: number; date?: string }>;
      mShell: Array<{ activity: string; frequency: number; emoji: string; description: string; imageData?: string; images?: string[]; primaryImageIndex?: number; name?: string; hashtags?: string[]; goalItem?: string; attemptCount?: number; successCount?: number; activityTime?: number; date?: string }>;
      valence: Array<{ activity: string; cooperation: number; social: boolean; emoji: string; description: string; imageData?: string; images?: string[]; primaryImageIndex?: number; name?: string; hashtags?: string[]; goalItem?: string; attemptCount?: number; successCount?: number; activityTime?: number; date?: string }>;
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

  // 목표 목록 가져오기
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/goals`);
        if (response.ok) {
          const data = await response.json();
          setGoals(data);
        }
      } catch (error) {
        console.error('목표를 가져오는 중 오류:', error);
      }
    };
    if (show) {
      fetchGoals();
    }
  }, [show]);

  // 학생이 변경될 때마다 상태 초기화 (모달이 처음 열릴 때만 탭 리셋)
  const prevStudentIdRef = useRef<number | undefined>(undefined);
  const prevShowRef = useRef<boolean>(false);

  useEffect(() => {
    // 모달이 닫혔다가 다시 열릴 때 리셋
    if (!prevShowRef.current && show && student) {
      prevStudentIdRef.current = undefined;
    }
    prevShowRef.current = show;
  }, [show]);

  // student prop의 existence를 JSON으로 직렬화하여 비교 (깊은 비교)
  const prevExistenceRef = useRef<string>('');

  useEffect(() => {
    if (student && show) {
      const currentExistenceJson = JSON.stringify(student.existence);
      const studentIdChanged = prevStudentIdRef.current !== student.id;
      const existenceChanged = prevExistenceRef.current !== currentExistenceJson;

      // 학생 ID가 변경되거나 existence가 실제로 변경된 경우에만 상태 업데이트
      if (studentIdChanged || existenceChanged) {
        // 학생 ID가 변경될 때만 탭을 리셋 (같은 학생의 경우 탭 유지)
        if (studentIdChanged) {
          setActivePanel('shape');
          prevStudentIdRef.current = student.id;
        }

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
        // records 배열을 정확히 복사하여 초기화 (타입 변환 포함)
        setLocalRecords(student.existence?.records ? student.existence.records.map(record => ({
          ...record,
          gameRecord: record.gameRecord ? {
            ...record.gameRecord,
            sport: record.gameRecord.sport as SportType
          } : undefined
        })) : []);
        // 경기기록 초기화
        setGameRecord({
          date: new Date().toISOString().split('T')[0],
          sport: '' as SportType,
          stats: {},
          notes: ''
        });
        setSelectedSport('');

        // 전자 표시 여부 초기화
        setShowElectrons(student.existence?.showElectrons || false);
        // 양성자/중성자 표시 여부 초기화
        setShowProtonsNeutrons(student.existence?.showProtonsNeutrons || false);
        // 경기 기록 표시 여부 초기화
        setShowGameRecords(student.existence?.showGameRecords !== false);

        // 원자 모델 초기화 (description 필드를 기본값 ''로 보정)
        if (student.existence?.atom) {
          const a = student.existence.atom as any;

          // imageData를 images 배열로 마이그레이션하는 헬퍼 함수
          const migrateImageData = (items: any[]) => {
            return items.map((item: any) => {
              const normalizedHashtags = normalizeHashtagArray(item?.hashtags);
              let migrated = {
                ...item,
                hashtags: normalizedHashtags
              };

              if (migrated.imageData && !migrated.images) {
                migrated = {
                  ...migrated,
                  images: [migrated.imageData],
                  primaryImageIndex: 0,
                  imageData: undefined
                };
              } else if (!migrated.images) {
                migrated = {
                  ...migrated,
                  images: [],
                  primaryImageIndex: undefined
                };
              }

              return migrated;
            });
          };
          setAtomModel({
            protons: migrateImageData(a.protons || []),
            neutrons: migrateImageData(a.neutrons || []),
            electrons: {
              kShell: migrateImageData((a.electrons?.kShell || []).map((e: any) => ({ ...e, description: e.description || '' }))),
              lShell: migrateImageData((a.electrons?.lShell || []).map((e: any) => ({ ...e, description: e.description || '' }))),
              mShell: migrateImageData((a.electrons?.mShell || []).map((e: any) => ({ ...e, description: e.description || '' }))),
              valence: migrateImageData((a.electrons?.valence || []).map((e: any) => ({ ...e, description: e.description || '' }))),
            }
          });
        }

        prevExistenceRef.current = currentExistenceJson;
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
        activity: student.existence?.activity || '',
        activities: [], // activities 배열은 더 이상 사용하지 않음
        energy: student.existence?.energy || 60,
        personality: student.existence?.personality || 'active',
        customName: customization.customName,
        imageData: customization.imageData || '', // 빈 문자열로 초기화
        showElectrons: showElectrons, // 전자 표시 여부 저장
        showProtonsNeutrons: showProtonsNeutrons, // 양성자/중성자 표시 여부 저장
        showGameRecords: showGameRecords, // 경기 기록 표시 여부 저장
        records: localRecords, // localRecords를 그대로 사용
        atom: atomModel // 원자 모델 저장
      }
    };

    console.log('💾 저장되는 학생 데이터:');
    console.log('  - 이미지:', updatedStudent.existence.imageData ? `있음 (${(updatedStudent.existence.imageData.length / 1024).toFixed(2)}KB)` : '없음');
    console.log('  - 크기:', updatedStudent.existence.size);
    console.log('  - 전체 데이터 크기:', `${(JSON.stringify(updatedStudent).length / 1024).toFixed(2)}KB`);

    // onSave가 Promise를 반환하면 await하고, 성공 시에만 모달 닫기
    const saveResult = onSave(updatedStudent);
    if (saveResult instanceof Promise) {
      saveResult
        .then(() => {
          // 저장 성공 시에만 모달 닫기
          onHide();
        })
        .catch((error) => {
          console.error('저장 중 오류:', error);
          // 저장 실패 시 모달은 열어둠
        });
    } else {
      // 동기 함수인 경우 바로 모달 닫기
      onHide();
    }
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

  // 이모티콘 선택 컴포넌트 삭제됨

  if (!student) return null;

  return (
    <>
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
                모양 편집
              </Button>
              <Button
                variant={activePanel === 'nucleus' ? 'success' : 'outline-success'}
                size="sm"
                onClick={() => setActivePanel('nucleus')}
              >
                원 편집
              </Button>
              <Button
                variant={activePanel === 'shells' ? 'info' : 'outline-info'}
                size="sm"
                onClick={() => setActivePanel('shells')}
              >
                원 편집
              </Button>
              <Button
                variant={activePanel === 'records' ? 'warning' : 'outline-warning'}
                size="sm"
                onClick={() => setActivePanel('records')}
              >
                경기기록
              </Button>
            </div>
            <hr className="mt-3" />
          </div>
          {/* 원 모양 선택 - 패널 전환: shape */}
          {activePanel === 'shape' && (
            <Card className="mb-3">
              <Card.Header>모양 선택</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>색상</Form.Label>
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
                          title={disabled ? '이모지 모양에는 색상이 적용되지 않습니다.' : ''}
                        />
                      );
                    })}
                  </div>
                  {isEmojiLike(customization.shape) && (
                    <div className="mt-1 small text-muted">이모지 모양에는 색상이 적용되지 않습니다.</div>
                  )}
                </Form.Group>

                {/* 이미지 업로드 */}
                <Form.Group className="mb-3">
                  <Form.Label>사진 업로드 (원 모양으로 사용)</Form.Label>
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
                          제거
                        </Button>
                      </>
                    )}
                  </div>
                  <Form.Text className="text-muted">업로드한 사진이 이모지/모양보다 우선순위가 높습니다.</Form.Text>
                </Form.Group>


                <Form.Group className="mb-3">
                  <Form.Label>패턴</Form.Label>
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
                  <Form.Label>테두리</Form.Label>
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
                <Card.Header>원 이름 설정</Card.Header>
                <Card.Body>
                  <Form.Group>
                    <Form.Label>원 안에 표시할 이름</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="이름을 입력하세요 (예: 홍길동, 별명 등)"
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
              <Card.Header>⚛️ 원자 편집</Card.Header>
              <Card.Body>
                {/* 양성자/중성자 표시 여부 체크박스 */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="원 표시"
                    checked={showProtonsNeutrons}
                    onChange={(e) => setShowProtonsNeutrons(e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    편집한 원을 화면에 표시하려면 체크하세요.
                  </Form.Text>
                </Form.Group>
                <hr className="mb-3" />
                <Row>
                  <Col md={6}>
                    <h6>🔴 원</h6>
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
                            placeholder="이름"
                            value={proton.name || ''}
                            onChange={(e) => {
                              const newProtons = [...atomModel.protons];
                              newProtons[index].name = e.target.value;
                              setAtomModel({ ...atomModel, protons: newProtons });
                            }}
                          />
                        </div>
                        <Form.Group>
                          <Form.Label>색상</Form.Label>
                          <div className="d-flex flex-wrap gap-2">
                            {colors.map(color => (
                              <div
                                key={color}
                                className={`color-option ${proton.color === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  const newProtons = [...atomModel.protons];
                                  newProtons[index].color = color;
                                  setAtomModel({ ...atomModel, protons: newProtons });
                                }}
                              />
                            ))}
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>사진 업로드 (여러 개)</Form.Label>
                          <div className="d-flex flex-column gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.currentTarget.files || []);
                                if (files.length === 0) return;

                                const validFiles = files.filter(file => {
                                  if (file.size > 10 * 1024 * 1024) {
                                    alert(`${file.name}: Image size must be 10MB or less.`);
                                    return false;
                                  }
                                  return true;
                                });

                                if (validFiles.length === 0) return;

                                const processFile = (file: File, fileIndex: number) => {
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
                                        if (!newProtons[index].images) {
                                          newProtons[index].images = [];
                                        }
                                        newProtons[index].images!.push(compressedDataUrl);
                                        if (newProtons[index].primaryImageIndex === undefined && newProtons[index].images!.length === 1) {
                                          newProtons[index].primaryImageIndex = 0;
                                        }
                                        setAtomModel({ ...atomModel, protons: newProtons });

                                        if (fileIndex === validFiles.length - 1) {
                                          alert(`${validFiles.length}개의 사진이 업로드되었습니다.`);
                                        }
                                      };
                                      img.src = dataUrl;
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                };

                                validFiles.forEach((file, idx) => processFile(file, idx));
                              }}
                              style={{ fontSize: '14px', padding: '6px' }}
                            />
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                              {(proton.images || (proton.imageData ? [proton.imageData] : [])).map((img: string, imgIndex: number) => {
                                const isPrimary = proton.primaryImageIndex === imgIndex || (proton.primaryImageIndex === undefined && imgIndex === 0);
                                return (
                                  <div key={imgIndex} className="position-relative" style={{ border: isPrimary ? '3px solid #007bff' : '1px solid #ccc', borderRadius: 4, padding: 2 }}>
                                    <img
                                      src={img}
                                      alt={`preview ${imgIndex + 1}`}
                                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 2 }}
                                    />
                                    {isPrimary && (
                                      <div style={{ position: 'absolute', top: 0, right: 0, background: '#007bff', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '0 2px 0 2px' }}>
                                        Primary
                                      </div>
                                    )}
                                    <div className="d-flex gap-1 mt-1">
                                      <Button
                                        variant={isPrimary ? "primary" : "outline-primary"}
                                        size="sm"
                                        style={{ fontSize: '10px', padding: '2px 6px' }}
                                        onClick={() => {
                                          const newProtons = [...atomModel.protons];
                                          newProtons[index].primaryImageIndex = imgIndex;
                                          setAtomModel({ ...atomModel, protons: newProtons });
                                        }}
                                      >
                                        Set Primary
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        style={{ fontSize: '10px', padding: '2px 6px' }}
                                        onClick={() => {
                                          const newProtons = [...atomModel.protons];
                                          if (newProtons[index].images) {
                                            newProtons[index].images = newProtons[index].images!.filter((_, i) => i !== imgIndex);
                                            if (newProtons[index].primaryImageIndex === imgIndex) {
                                              newProtons[index].primaryImageIndex = newProtons[index].images!.length > 0 ? 0 : undefined;
                                            } else if (newProtons[index].primaryImageIndex !== undefined && newProtons[index].primaryImageIndex! > imgIndex) {
                                              newProtons[index].primaryImageIndex = newProtons[index].primaryImageIndex! - 1;
                                            }
                                          }
                                          setAtomModel({ ...atomModel, protons: newProtons });
                                        }}
                                      >
                                        제거
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>설명</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={6}
                            placeholder="설명을 입력하세요..."
                            value={proton.description || ''}
                            onChange={(e) => {
                              const newProtons = [...atomModel.protons];
                              newProtons[index].description = e.target.value;
                              setAtomModel({ ...atomModel, protons: newProtons });
                            }}
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>해시태그</Form.Label>
                          {renderHashtagChips(proton.hashtags ?? [], (tagIndex) => {
                            const newProtons = [...atomModel.protons];
                            const currentTags = newProtons[index].hashtags ?? [];
                            newProtons[index].hashtags = currentTags.filter((_tag, i) => i !== tagIndex);
                            setAtomModel({ ...atomModel, protons: newProtons });
                          })}
                          <Form.Control
                            type="text"
                            placeholder={hashtagPlaceholder}
                            onKeyDown={(e) =>
                              handleHashtagKeyDown(e, (tag) => {
                                const newProtons = [...atomModel.protons];
                                newProtons[index].hashtags = addHashtag(newProtons[index].hashtags, tag);
                                setAtomModel({ ...atomModel, protons: newProtons });
                              })
                            }
                          />
                        </Form.Group>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            const newProtons = atomModel.protons.filter((_, i) => i !== index);
                            setAtomModel({ ...atomModel, protons: newProtons });
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
                          protons: [...atomModel.protons, { keyword: '', strength: 3, color: '#FF6B6B', emoji: '✨', name: '', hashtags: [] }]
                        });
                      }}
                    >
                      + Add
                    </Button>
                  </Col>

                  <Col md={6}>
                    <h6>🔵 원</h6>
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
                            placeholder="이름"
                            value={neutron.name || ''}
                            onChange={(e) => {
                              const newNeutrons = [...atomModel.neutrons];
                              newNeutrons[index].name = e.target.value;
                              setAtomModel({ ...atomModel, neutrons: newNeutrons });
                            }}
                          />
                        </div>
                        <Form.Group>
                          <Form.Label>색상</Form.Label>
                          <div className="d-flex flex-wrap gap-2">
                            {colors.map(color => (
                              <div
                                key={color}
                                className={`color-option ${neutron.color === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  const newNeutrons = [...atomModel.neutrons];
                                  newNeutrons[index].color = color;
                                  setAtomModel({ ...atomModel, neutrons: newNeutrons });
                                }}
                              />
                            ))}
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>사진 업로드 (여러 개)</Form.Label>
                          <div className="d-flex flex-column gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.currentTarget.files || []);
                                if (files.length === 0) return;

                                const validFiles = files.filter(file => {
                                  if (file.size > 10 * 1024 * 1024) {
                                    alert(`${file.name}: Image size must be 10MB or less.`);
                                    return false;
                                  }
                                  return true;
                                });

                                if (validFiles.length === 0) return;

                                const processFile = (file: File, fileIndex: number) => {
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
                                        if (!newNeutrons[index].images) {
                                          newNeutrons[index].images = [];
                                        }
                                        newNeutrons[index].images!.push(compressedDataUrl);
                                        if (newNeutrons[index].primaryImageIndex === undefined && newNeutrons[index].images!.length === 1) {
                                          newNeutrons[index].primaryImageIndex = 0;
                                        }
                                        setAtomModel({ ...atomModel, neutrons: newNeutrons });

                                        if (fileIndex === validFiles.length - 1) {
                                          alert(`${validFiles.length}개의 사진이 업로드되었습니다.`);
                                        }
                                      };
                                      img.src = dataUrl;
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                };

                                validFiles.forEach((file, idx) => processFile(file, idx));
                              }}
                              style={{ fontSize: '14px', padding: '6px' }}
                            />
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                              {(neutron.images || (neutron.imageData ? [neutron.imageData] : [])).map((img: string, imgIndex: number) => {
                                const isPrimary = neutron.primaryImageIndex === imgIndex || (neutron.primaryImageIndex === undefined && imgIndex === 0);
                                return (
                                  <div key={imgIndex} className="position-relative" style={{ border: isPrimary ? '3px solid #007bff' : '1px solid #ccc', borderRadius: 4, padding: 2 }}>
                                    <img
                                      src={img}
                                      alt={`preview ${imgIndex + 1}`}
                                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 2 }}
                                    />
                                    {isPrimary && (
                                      <div style={{ position: 'absolute', top: 0, right: 0, background: '#007bff', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '0 2px 0 2px' }}>
                                        Primary
                                      </div>
                                    )}
                                    <div className="d-flex gap-1 mt-1">
                                      <Button
                                        variant={isPrimary ? "primary" : "outline-primary"}
                                        size="sm"
                                        style={{ fontSize: '10px', padding: '2px 6px' }}
                                        onClick={() => {
                                          const newNeutrons = [...atomModel.neutrons];
                                          newNeutrons[index].primaryImageIndex = imgIndex;
                                          setAtomModel({ ...atomModel, neutrons: newNeutrons });
                                        }}
                                      >
                                        Set Primary
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        style={{ fontSize: '10px', padding: '2px 6px' }}
                                        onClick={() => {
                                          const newNeutrons = [...atomModel.neutrons];
                                          if (newNeutrons[index].images) {
                                            newNeutrons[index].images = newNeutrons[index].images!.filter((_, i) => i !== imgIndex);
                                            if (newNeutrons[index].primaryImageIndex === imgIndex) {
                                              newNeutrons[index].primaryImageIndex = newNeutrons[index].images!.length > 0 ? 0 : undefined;
                                            } else if (newNeutrons[index].primaryImageIndex !== undefined && newNeutrons[index].primaryImageIndex! > imgIndex) {
                                              newNeutrons[index].primaryImageIndex = newNeutrons[index].primaryImageIndex! - 1;
                                            }
                                          }
                                          setAtomModel({ ...atomModel, neutrons: newNeutrons });
                                        }}
                                      >
                                        제거
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>설명</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={6}
                            placeholder="설명을 입력하세요..."
                            value={neutron.description || ''}
                            onChange={(e) => {
                              const newNeutrons = [...atomModel.neutrons];
                              newNeutrons[index].description = e.target.value;
                              setAtomModel({ ...atomModel, neutrons: newNeutrons });
                            }}
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>해시태그</Form.Label>
                          {renderHashtagChips(neutron.hashtags ?? [], (tagIndex) => {
                            const newNeutrons = [...atomModel.neutrons];
                            const currentTags = newNeutrons[index].hashtags ?? [];
                            newNeutrons[index].hashtags = currentTags.filter((_tag, i) => i !== tagIndex);
                            setAtomModel({ ...atomModel, neutrons: newNeutrons });
                          })}
                          <Form.Control
                            type="text"
                            placeholder={hashtagPlaceholder}
                            onKeyDown={(e) =>
                              handleHashtagKeyDown(e, (tag) => {
                                const newNeutrons = [...atomModel.neutrons];
                                newNeutrons[index].hashtags = addHashtag(newNeutrons[index].hashtags, tag);
                                setAtomModel({ ...atomModel, neutrons: newNeutrons });
                              })
                            }
                          />
                        </Form.Group>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            const newNeutrons = atomModel.neutrons.filter((_, i) => i !== index);
                            setAtomModel({ ...atomModel, neutrons: newNeutrons });
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
                          neutrons: [...atomModel.neutrons, { keyword: '', category: '취미', color: '#96CEB4', emoji: '🌟', name: '', hashtags: [] }]
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
              <Card.Header>⚡ 전자 편집</Card.Header>
              <Card.Body>
                {/* 전자 표시 여부 체크박스 */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="전자 껍질 표시"
                    checked={showElectrons}
                    onChange={(e) => setShowElectrons(e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    전자 껍질을 화면에 표시하려면 체크하세요.
                  </Form.Text>
                </Form.Group>

                {/* 경기 기록 표시 여부 체크박스 */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="경기 기록 표시"
                    checked={showGameRecords}
                    onChange={(e) => setShowGameRecords(e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    경기 기록을 원 주변에 표시하려면 체크하세요.
                  </Form.Text>
                </Form.Group>
                <hr className="mb-3" />
                <Row>
                  <Col md={3}>
                    <h6>🟠 원</h6>
                    {atomModel.electrons.kShell.map((electron, index) => (
                      <div key={index} className="mb-2 p-2 border rounded">
                        <div className="d-flex align-items-center mb-2">
                          <div
                            className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: '30px',
                              height: '30px',
                              backgroundColor: '#FF6B6B',
                              color: 'white',
                              fontSize: '16px'
                            }}
                          >
                            {electron.emoji}
                          </div>
                          <Form.Control
                            type="text"
                            placeholder="이름"
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
                        </div>
                        <Form.Group className="mb-2">
                          <Form.Label>사진 업로드 (여러 개)</Form.Label>
                          <div className="d-flex flex-column gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.currentTarget.files || []);
                                if (files.length === 0) return;

                                const validFiles = files.filter(file => {
                                  if (file.size > 10 * 1024 * 1024) {
                                    alert(`${file.name}: Image size must be 10MB or less.`);
                                    return false;
                                  }
                                  return true;
                                });

                                if (validFiles.length === 0) return;

                                const processFile = (file: File, fileIndex: number) => {
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
                                        if (!newKShell[index].images) {
                                          newKShell[index].images = [];
                                        }
                                        newKShell[index].images!.push(compressedDataUrl);
                                        if (newKShell[index].primaryImageIndex === undefined && newKShell[index].images!.length === 1) {
                                          newKShell[index].primaryImageIndex = 0;
                                        }
                                        setAtomModel({
                                          ...atomModel,
                                          electrons: { ...atomModel.electrons, kShell: newKShell }
                                        });

                                        if (fileIndex === validFiles.length - 1) {
                                          alert(`${validFiles.length}개의 사진이 업로드되었습니다.`);
                                        }
                                      };
                                      img.src = dataUrl;
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                };

                                validFiles.forEach((file, idx) => processFile(file, idx));
                              }}
                              style={{ fontSize: '14px', padding: '6px' }}
                            />
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                              {(electron.images || (electron.imageData ? [electron.imageData] : [])).map((img: string, imgIndex: number) => {
                                const isPrimary = electron.primaryImageIndex === imgIndex || (electron.primaryImageIndex === undefined && imgIndex === 0);
                                return (
                                  <div key={imgIndex} className="position-relative" style={{ border: isPrimary ? '3px solid #007bff' : '1px solid #ccc', borderRadius: 4, padding: 2 }}>
                                    <img
                                      src={img}
                                      alt={`preview ${imgIndex + 1}`}
                                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 2 }}
                                    />
                                    {isPrimary && (
                                      <div style={{ position: 'absolute', top: 0, right: 0, background: '#007bff', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '0 2px 0 2px' }}>
                                        Primary
                                      </div>
                                    )}
                                    <div className="d-flex gap-1 mt-1">
                                      <Button
                                        variant={isPrimary ? "primary" : "outline-primary"}
                                        size="sm"
                                        style={{ fontSize: '10px', padding: '2px 6px' }}
                                        onClick={() => {
                                          const newKShell = [...atomModel.electrons.kShell];
                                          newKShell[index].primaryImageIndex = imgIndex;
                                          setAtomModel({
                                            ...atomModel,
                                            electrons: { ...atomModel.electrons, kShell: newKShell }
                                          });
                                        }}
                                      >
                                        Set Primary
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        style={{ fontSize: '10px', padding: '2px 6px' }}
                                        onClick={() => {
                                          const newKShell = [...atomModel.electrons.kShell];
                                          if (newKShell[index].images) {
                                            newKShell[index].images = newKShell[index].images!.filter((_, i) => i !== imgIndex);
                                            if (newKShell[index].primaryImageIndex === imgIndex) {
                                              newKShell[index].primaryImageIndex = newKShell[index].images!.length > 0 ? 0 : undefined;
                                            } else if (newKShell[index].primaryImageIndex !== undefined && newKShell[index].primaryImageIndex! > imgIndex) {
                                              newKShell[index].primaryImageIndex = newKShell[index].primaryImageIndex! - 1;
                                            }
                                          }
                                          setAtomModel({
                                            ...atomModel,
                                            electrons: { ...atomModel.electrons, kShell: newKShell }
                                          });
                                        }}
                                      >
                                        제거
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>설명</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={6}
                            placeholder="설명을 입력하세요..."
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
                          <Form.Label>목표 항목 선택</Form.Label>
                          <Form.Select
                            value={electron.goalItem || ''}
                            onChange={(e) => {
                              const newKShell = [...atomModel.electrons.kShell];
                              newKShell[index].goalItem = e.target.value;
                              setAtomModel({
                                ...atomModel,
                                electrons: { ...atomModel.electrons, kShell: newKShell }
                              });
                            }}
                          >
                            <option value="">목표 항목 선택...</option>
                            {goals.map((goal) =>
                              goal.items && goal.items.length > 0
                                ? goal.items.map((item, itemIndex) => (
                                  <option key={`${goal.id}-${itemIndex}`} value={item}>
                                    {goal.title} - {item}
                                  </option>
                                ))
                                : null
                            )}
                          </Form.Select>
                        </Form.Group>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>시도 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.attemptCount || ''}
                                onChange={(e) => {
                                  const newKShell = [...atomModel.electrons.kShell];
                                  newKShell[index].attemptCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, kShell: newKShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>성공 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.successCount || ''}
                                onChange={(e) => {
                                  const newKShell = [...atomModel.electrons.kShell];
                                  newKShell[index].successCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, kShell: newKShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>활동 시간 (분)</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.activityTime || ''}
                                onChange={(e) => {
                                  const newKShell = [...atomModel.electrons.kShell];
                                  newKShell[index].activityTime = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, kShell: newKShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>날짜</Form.Label>
                              <Form.Control
                                type="date"
                                value={electron.date || ''}
                                onChange={(e) => {
                                  const newKShell = [...atomModel.electrons.kShell];
                                  newKShell[index].date = e.target.value;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, kShell: newKShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group className="mb-2">
                          <Form.Label>해시태그</Form.Label>
                          {renderHashtagChips(electron.hashtags ?? [], (tagIndex) => {
                            const newKShell = [...atomModel.electrons.kShell];
                            const currentTags = newKShell[index].hashtags ?? [];
                            newKShell[index].hashtags = currentTags.filter((_tag, i) => i !== tagIndex);
                            setAtomModel({
                              ...atomModel,
                              electrons: { ...atomModel.electrons, kShell: newKShell }
                            });
                          })}
                          <Form.Control
                            type="text"
                            placeholder={hashtagPlaceholder}
                            onKeyDown={(e) =>
                              handleHashtagKeyDown(e, (tag) => {
                                const newKShell = [...atomModel.electrons.kShell];
                                newKShell[index].hashtags = addHashtag(newKShell[index].hashtags, tag);
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, kShell: newKShell }
                                });
                              })
                            }
                          />
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
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => {
                          setAtomModel({
                            ...atomModel,
                            electrons: {
                              ...atomModel.electrons,
                              kShell: [...atomModel.electrons.kShell, { activity: '', frequency: 4, emoji: '📖', description: '', name: '', hashtags: [] }]
                            }
                          });
                        }}
                      >
                        + 직접 추가
                      </Button>
                    </div>
                  </Col>

                  <Col md={3}>
                    <h6>🟡 원</h6>
                    {atomModel.electrons.lShell.map((electron, index) => (
                      <div key={index} className="mb-2 p-2 border rounded">
                        <div className="d-flex align-items-center mb-2">
                          <div
                            className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: '30px',
                              height: '30px',
                              backgroundColor: '#4ECDC4',
                              color: 'white',
                              fontSize: '16px'
                            }}
                          >
                            {electron.emoji}
                          </div>
                          <Form.Control
                            type="text"
                            placeholder="이름"
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
                        </div>
                        <Form.Group className="mb-2">
                          <Form.Label>사진 업로드</Form.Label>
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
                                  제거
                                </Button>
                              </>
                            )}
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>설명</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={6}
                            placeholder="설명을 입력하세요..."
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
                          <Form.Label>목표 항목 선택</Form.Label>
                          <Form.Select
                            value={electron.goalItem || ''}
                            onChange={(e) => {
                              const newLShell = [...atomModel.electrons.lShell];
                              newLShell[index].goalItem = e.target.value;
                              setAtomModel({
                                ...atomModel,
                                electrons: { ...atomModel.electrons, lShell: newLShell }
                              });
                            }}
                          >
                            <option value="">목표 항목 선택...</option>
                            {goals.map((goal) =>
                              goal.items && goal.items.length > 0
                                ? goal.items.map((item, itemIndex) => (
                                  <option key={`${goal.id}-${itemIndex}`} value={item}>
                                    {goal.title} - {item}
                                  </option>
                                ))
                                : null
                            )}
                          </Form.Select>
                        </Form.Group>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>시도 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.attemptCount || ''}
                                onChange={(e) => {
                                  const newLShell = [...atomModel.electrons.lShell];
                                  newLShell[index].attemptCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, lShell: newLShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>성공 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.successCount || ''}
                                onChange={(e) => {
                                  const newLShell = [...atomModel.electrons.lShell];
                                  newLShell[index].successCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, lShell: newLShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>활동 시간 (분)</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.activityTime || ''}
                                onChange={(e) => {
                                  const newLShell = [...atomModel.electrons.lShell];
                                  newLShell[index].activityTime = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, lShell: newLShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>날짜</Form.Label>
                              <Form.Control
                                type="date"
                                value={electron.date || ''}
                                onChange={(e) => {
                                  const newLShell = [...atomModel.electrons.lShell];
                                  newLShell[index].date = e.target.value;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, lShell: newLShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group className="mb-2">
                          <Form.Label>해시태그</Form.Label>
                          {renderHashtagChips(electron.hashtags ?? [], (tagIndex) => {
                            const newLShell = [...atomModel.electrons.lShell];
                            const currentTags = newLShell[index].hashtags ?? [];
                            newLShell[index].hashtags = currentTags.filter((_tag, i) => i !== tagIndex);
                            setAtomModel({
                              ...atomModel,
                              electrons: { ...atomModel.electrons, lShell: newLShell }
                            });
                          })}
                          <Form.Control
                            type="text"
                            placeholder={hashtagPlaceholder}
                            onKeyDown={(e) =>
                              handleHashtagKeyDown(e, (tag) => {
                                const newLShell = [...atomModel.electrons.lShell];
                                newLShell[index].hashtags = addHashtag(newLShell[index].hashtags, tag);
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, lShell: newLShell }
                                });
                              })
                            }
                          />
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
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          setAtomModel({
                            ...atomModel,
                            electrons: {
                              ...atomModel.electrons,
                              lShell: [...atomModel.electrons.lShell, { activity: '', frequency: 4, emoji: '🏃', description: '', name: '', hashtags: [] }]
                            }
                          });
                        }}
                      >
                        + 직접 추가
                      </Button>
                    </div>
                  </Col>

                  <Col md={3}>
                    <h6>🟢 원</h6>
                    {atomModel.electrons.mShell.map((electron, index) => (
                      <div key={index} className="mb-2 p-2 border rounded">
                        <div className="d-flex align-items-center mb-2">
                          <div
                            className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: '30px',
                              height: '30px',
                              backgroundColor: '#45B7D1',
                              color: 'white',
                              fontSize: '16px'
                            }}
                          >
                            {electron.emoji}
                          </div>
                          <Form.Control
                            type="text"
                            placeholder="이름"
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
                        </div>
                        <Form.Group className="mb-2">
                          <Form.Label>사진 업로드</Form.Label>
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
                                  제거
                                </Button>
                              </>
                            )}
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>설명</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={6}
                            placeholder="설명을 입력하세요..."
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
                          <Form.Label>목표 항목 선택</Form.Label>
                          <Form.Select
                            value={electron.goalItem || ''}
                            onChange={(e) => {
                              const newMShell = [...atomModel.electrons.mShell];
                              newMShell[index].goalItem = e.target.value;
                              setAtomModel({
                                ...atomModel,
                                electrons: { ...atomModel.electrons, mShell: newMShell }
                              });
                            }}
                          >
                            <option value="">목표 항목 선택...</option>
                            {goals.map((goal) =>
                              goal.items && goal.items.length > 0
                                ? goal.items.map((item, itemIndex) => (
                                  <option key={`${goal.id}-${itemIndex}`} value={item}>
                                    {goal.title} - {item}
                                  </option>
                                ))
                                : null
                            )}
                          </Form.Select>
                        </Form.Group>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>시도 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.attemptCount || ''}
                                onChange={(e) => {
                                  const newMShell = [...atomModel.electrons.mShell];
                                  newMShell[index].attemptCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, mShell: newMShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>성공 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.successCount || ''}
                                onChange={(e) => {
                                  const newMShell = [...atomModel.electrons.mShell];
                                  newMShell[index].successCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, mShell: newMShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>활동 시간 (분)</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.activityTime || ''}
                                onChange={(e) => {
                                  const newMShell = [...atomModel.electrons.mShell];
                                  newMShell[index].activityTime = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, mShell: newMShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>날짜</Form.Label>
                              <Form.Control
                                type="date"
                                value={electron.date || ''}
                                onChange={(e) => {
                                  const newMShell = [...atomModel.electrons.mShell];
                                  newMShell[index].date = e.target.value;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, mShell: newMShell }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group className="mb-2">
                          <Form.Label>해시태그</Form.Label>
                          {renderHashtagChips(electron.hashtags ?? [], (tagIndex) => {
                            const newMShell = [...atomModel.electrons.mShell];
                            const currentTags = newMShell[index].hashtags ?? [];
                            newMShell[index].hashtags = currentTags.filter((_tag, i) => i !== tagIndex);
                            setAtomModel({
                              ...atomModel,
                              electrons: { ...atomModel.electrons, mShell: newMShell }
                            });
                          })}
                          <Form.Control
                            type="text"
                            placeholder={hashtagPlaceholder}
                            onKeyDown={(e) =>
                              handleHashtagKeyDown(e, (tag) => {
                                const newMShell = [...atomModel.electrons.mShell];
                                newMShell[index].hashtags = addHashtag(newMShell[index].hashtags, tag);
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, mShell: newMShell }
                                });
                              })
                            }
                          />
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
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => {
                          setAtomModel({
                            ...atomModel,
                            electrons: {
                              ...atomModel.electrons,
                              mShell: [...atomModel.electrons.mShell, { activity: '', frequency: 2, emoji: '🤝', description: '', name: '', hashtags: [] }]
                            }
                          });
                        }}
                      >
                        + 직접 추가
                      </Button>
                    </div>
                  </Col>

                  <Col md={3}>
                    <h6>🔵 원</h6>
                    {atomModel.electrons.valence.map((electron, index) => (
                      <div key={index} className="mb-2 p-2 border rounded">
                        <div className="d-flex align-items-center mb-2">
                          <div
                            className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: '30px',
                              height: '30px',
                              backgroundColor: '#96CEB4',
                              color: 'white',
                              fontSize: '16px'
                            }}
                          >
                            {electron.emoji}
                          </div>
                          <Form.Control
                            type="text"
                            placeholder="이름"
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
                        </div>
                        <Form.Group className="mb-2">
                          <Form.Label>사진 업로드</Form.Label>
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
                                  제거
                                </Button>
                              </>
                            )}
                          </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>설명</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={6}
                            placeholder="설명을 입력하세요..."
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
                          <Form.Label>목표 항목 선택</Form.Label>
                          <Form.Select
                            value={electron.goalItem || ''}
                            onChange={(e) => {
                              const newValence = [...atomModel.electrons.valence];
                              newValence[index].goalItem = e.target.value;
                              setAtomModel({
                                ...atomModel,
                                electrons: { ...atomModel.electrons, valence: newValence }
                              });
                            }}
                          >
                            <option value="">목표 항목 선택...</option>
                            {goals.map((goal) =>
                              goal.items && goal.items.length > 0
                                ? goal.items.map((item, itemIndex) => (
                                  <option key={`${goal.id}-${itemIndex}`} value={item}>
                                    {goal.title} - {item}
                                  </option>
                                ))
                                : null
                            )}
                          </Form.Select>
                        </Form.Group>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>시도 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.attemptCount || ''}
                                onChange={(e) => {
                                  const newValence = [...atomModel.electrons.valence];
                                  newValence[index].attemptCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, valence: newValence }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>성공 횟수</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.successCount || ''}
                                onChange={(e) => {
                                  const newValence = [...atomModel.electrons.valence];
                                  newValence[index].successCount = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, valence: newValence }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>활동 시간 (분)</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                placeholder="0"
                                value={electron.activityTime || ''}
                                onChange={(e) => {
                                  const newValence = [...atomModel.electrons.valence];
                                  newValence[index].activityTime = e.target.value ? parseInt(e.target.value) : undefined;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, valence: newValence }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>날짜</Form.Label>
                              <Form.Control
                                type="date"
                                value={electron.date || ''}
                                onChange={(e) => {
                                  const newValence = [...atomModel.electrons.valence];
                                  newValence[index].date = e.target.value;
                                  setAtomModel({
                                    ...atomModel,
                                    electrons: { ...atomModel.electrons, valence: newValence }
                                  });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group className="mb-2">
                          <Form.Label>해시태그</Form.Label>
                          {renderHashtagChips(electron.hashtags ?? [], (tagIndex) => {
                            const newValence = [...atomModel.electrons.valence];
                            const currentTags = newValence[index].hashtags ?? [];
                            newValence[index].hashtags = currentTags.filter((_tag, i) => i !== tagIndex);
                            setAtomModel({
                              ...atomModel,
                              electrons: { ...atomModel.electrons, valence: newValence }
                            });
                          })}
                          <Form.Control
                            type="text"
                            placeholder={hashtagPlaceholder}
                            onKeyDown={(e) =>
                              handleHashtagKeyDown(e, (tag) => {
                                const newValence = [...atomModel.electrons.valence];
                                newValence[index].hashtags = addHashtag(newValence[index].hashtags, tag);
                                setAtomModel({
                                  ...atomModel,
                                  electrons: { ...atomModel.electrons, valence: newValence }
                                });
                              })
                            }
                          />
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
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setAtomModel({
                            ...atomModel,
                            electrons: {
                              ...atomModel.electrons,
                              valence: [...atomModel.electrons.valence, { activity: '', cooperation: 3, social: true, emoji: '🔧', description: '', name: '', hashtags: [] }]
                            }
                          });
                        }}
                      >
                        + 직접 추가
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* 경기기록 - 패널 전환: records */}
          {activePanel === 'records' && (
            <>
              <Card className="mb-3">
                <Card.Header>🏆 경기기록 추가</Card.Header>
                <Card.Body>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                      경기 날짜
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={gameRecord.date}
                      onChange={(e) => setGameRecord(prev => ({ ...prev, date: e.target.value }))}
                      style={{ fontSize: '16px', padding: '10px' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                      스포츠 선택
                    </Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {(Object.keys(sportNames) as SportType[]).map((sport) => (
                        <Button
                          key={sport}
                          variant={selectedSport === sport ? 'primary' : 'outline-primary'}
                          onClick={() => {
                            setSelectedSport(sport);
                            setGameRecord(prev => ({
                              ...prev,
                              sport: sport,
                              stats: {}
                            }));
                          }}
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          {sportNames[sport]}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>

                  {selectedSport && (
                    <>
                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#2d2d2d' }}>
                          📊 기록 항목
                        </Form.Label>
                        {(['attempt', 'success', 'defense', 'other'] as const).map((category) => {
                          const categoryStats = sportStats[selectedSport].filter(stat => stat.category === category);
                          if (categoryStats.length === 0) return null;

                          const categoryLabels = {
                            attempt: { label: '시도', emoji: '🎯', color: '#ff9800' },
                            success: { label: '성공', emoji: '✅', color: '#4caf50' },
                            defense: { label: '수비', emoji: '🛡️', color: '#2196f3' },
                            other: { label: '기타', emoji: '📝', color: '#9e9e9e' }
                          };

                          return (
                            <div key={category} className="mb-4">
                              <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginBottom: '15px',
                                color: categoryLabels[category].color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span>{categoryLabels[category].emoji}</span>
                                <span>{categoryLabels[category].label}</span>
                              </div>
                              <div className="row g-2">
                                {categoryStats.map((stat) => (
                                  <Col key={stat.key} xs={6} sm={3} md={2} lg={2}>
                                    <Card className="text-center" style={{
                                      border: `1.2px solid ${categoryLabels[category].color}`,
                                      borderRadius: '7px',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                      transition: 'all 0.2s ease',
                                      cursor: 'pointer'
                                    }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                                      }}
                                    >
                                      <Card.Body style={{ padding: '7px 6px' }}>
                                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                                          {stat.emoji}
                                        </div>
                                        <div style={{
                                          fontSize: '9px',
                                          fontWeight: '600',
                                          marginBottom: '6px',
                                          color: '#333',
                                          minHeight: '20px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          lineHeight: '1.2'
                                        }}>
                                          {stat.label}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-center gap-1" style={{ width: '100%' }}>
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const currentValue = gameRecord.stats[stat.key] || 0;
                                              if (currentValue > 0) {
                                                setGameRecord(prev => ({
                                                  ...prev,
                                                  stats: { ...prev.stats, [stat.key]: currentValue - 1 }
                                                }));
                                              }
                                            }}
                                            style={{
                                              minWidth: '20px',
                                              height: '20px',
                                              fontSize: '13px',
                                              fontWeight: 'bold',
                                              borderRadius: '5px',
                                              border: '1.2px solid #ddd',
                                              padding: 0,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center'
                                            }}
                                          >
                                            −
                                          </Button>
                                          <div
                                            style={{
                                              fontSize: '14px',
                                              fontWeight: 'bold',
                                              minWidth: '26px',
                                              color: categoryLabels[category].color,
                                              textAlign: 'center',
                                              lineHeight: 1
                                            }}
                                          >
                                            {gameRecord.stats[stat.key] || 0}
                                          </div>
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const currentValue = gameRecord.stats[stat.key] || 0;
                                              setGameRecord(prev => ({
                                                ...prev,
                                                stats: { ...prev.stats, [stat.key]: currentValue + 1 }
                                              }));
                                            }}
                                            style={{
                                              minWidth: '20px',
                                              height: '20px',
                                              fontSize: '13px',
                                              fontWeight: 'bold',
                                              borderRadius: '5px',
                                              border: `1.2px solid ${categoryLabels[category].color}`,
                                              color: categoryLabels[category].color,
                                              padding: 0,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center'
                                            }}
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                          메모 작성
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={gameRecord.notes}
                          onChange={(e) => setGameRecord(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="경기에 대한 메모를 작성하세요..."
                          style={{ fontSize: '15px', padding: '12px', resize: 'vertical' }}
                        />
                      </Form.Group>

                      <Button
                        onClick={() => {
                          const newRecord = {
                            date: gameRecord.date,
                            activity: `${sportNames[selectedSport]} 경기`,
                            duration: 0,
                            notes: gameRecord.notes,
                            gameRecord: {
                              sport: selectedSport,
                              stats: { ...gameRecord.stats }
                            }
                          };
                          setLocalRecords(prev => [...prev, newRecord]);
                          setGameRecord({
                            date: new Date().toISOString().split('T')[0],
                            sport: '' as SportType,
                            stats: {},
                            notes: ''
                          });
                          setSelectedSport('');
                        }}
                        size="lg"
                        style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
                      >
                        ✨ 경기기록 추가하기
                      </Button>
                    </>
                  )}
                </Card.Body>
              </Card>

              <Card>
                <Card.Header style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  📋 경기기록 내역 ({localRecords.length}개)
                </Card.Header>
                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto', padding: '15px' }}>
                  {localRecords.length === 0 ? (
                    <div className="text-center text-muted p-4" style={{ fontSize: '16px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</div>
                      <div>아직 기록된 경기가 없습니다.</div>
                      <div className="mt-2" style={{ fontSize: '14px' }}>위에서 경기기록을 추가해보세요!</div>
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
                              <span style={{ fontSize: '20px', marginRight: '10px', fontWeight: 'bold' }}>
                                {record.activity}
                              </span>
                              {record.duration > 0 && (
                                <span className="badge bg-warning text-dark" style={{ fontSize: '14px' }}>
                                  {record.duration}분
                                </span>
                              )}
                            </div>
                            <div className="text-muted mb-2" style={{ fontSize: '14px' }}>
                              📅 {record.date}
                            </div>
                            {record.gameRecord && (
                              <div className="mt-2 p-3 bg-white rounded" style={{ fontSize: '14px', border: '1px solid #e0e0e0' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px', color: '#2d2d2d' }}>
                                  📊 경기 기록
                                </div>
                                {(['attempt', 'success', 'defense', 'other'] as const).map((category) => {
                                  const categoryStats = sportStats[record.gameRecord!.sport as SportType]?.filter(stat => stat.category === category) || [];
                                  const categoryRecords = categoryStats
                                    .map(stat => ({ stat, value: record.gameRecord!.stats[stat.key] || 0 }))
                                    .filter(item => item.value > 0);

                                  if (categoryRecords.length === 0) return null;

                                  const categoryLabels = {
                                    attempt: { label: '시도', emoji: '🎯', color: '#ff9800' },
                                    success: { label: '성공', emoji: '✅', color: '#4caf50' },
                                    defense: { label: '수비', emoji: '🛡️', color: '#2196f3' },
                                    other: { label: '기타', emoji: '📝', color: '#9e9e9e' }
                                  };

                                  return (
                                    <div key={category} className="mb-3">
                                      <div style={{
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        marginBottom: '8px',
                                        color: categoryLabels[category].color
                                      }}>
                                        {categoryLabels[category].emoji} {categoryLabels[category].label}
                                      </div>
                                      <div className="d-flex flex-wrap gap-2">
                                        {categoryRecords.map(({ stat, value }) => (
                                          <span
                                            key={stat.key}
                                            className="badge"
                                            style={{
                                              backgroundColor: categoryLabels[category].color,
                                              color: 'white',
                                              fontSize: '12px',
                                              padding: '6px 10px',
                                              borderRadius: '6px'
                                            }}
                                          >
                                            {stat.emoji} {stat.label}: {value}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {record.notes && (
                              <div className="mt-2 p-2 bg-white rounded" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                {record.notes}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setLocalRecords(prev => prev.filter((_, i) => i !== index));
                            }}
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
            저장하고 나가기
          </Button>
          <Button variant="outline-secondary" onClick={onHide}>
            나가기
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 목표 선택 모달 */}
      <Modal show={showGoalSelectModal} onHide={() => setShowGoalSelectModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>목표에서 선택</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>생성된 목표가 없습니다.</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Purpose 페이지에서 먼저 목표를 생성해주세요.
              </p>
            </div>
          ) : (
            <div>
              {goals.map((goal) => (
                <Card key={goal.id} className="mb-3" style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!selectedShellType) return;

                    // 목표의 항목들을 전자로 추가
                    const newElectrons = goal.items.map((item) => {
                      const defaultEmoji = selectedShellType === 'kShell' ? '📖' :
                        selectedShellType === 'lShell' ? '🏃' :
                          selectedShellType === 'mShell' ? '🤝' : '🔧';
                      const defaultFrequency = selectedShellType === 'valence' ? 3 :
                        selectedShellType === 'mShell' ? 2 : 4;

                      return {
                        activity: item,
                        frequency: defaultFrequency,
                        emoji: defaultEmoji,
                        description: goal.description || '',
                        name: goal.title,
                        hashtags: []
                      };
                    });

                    // 선택된 shell 타입에 전자 추가
                    const currentElectrons = atomModel.electrons[selectedShellType];
                    setAtomModel({
                      ...atomModel,
                      electrons: {
                        ...atomModel.electrons,
                        [selectedShellType]: [...currentElectrons, ...newElectrons]
                      }
                    });

                    setShowGoalSelectModal(false);
                    setSelectedShellType(null);
                  }}
                >
                  <Card.Header style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Title style={{ margin: 0, fontSize: '1.2rem' }}>
                      {goal.title}
                    </Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {goal.description && (
                      <p style={{ color: '#666', marginBottom: '10px', fontSize: '0.9rem' }}>
                        {goal.description}
                      </p>
                    )}
                    {goal.items && goal.items.length > 0 && (
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>항목 ({goal.items.length}개):</strong>
                        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                          {goal.items.map((item, index) => (
                            <li key={index} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#999' }}>
                      클릭하여 이 목표의 항목들을 전자로 추가
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowGoalSelectModal(false);
            setSelectedShellType(null);
          }}>
            취소
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StudentCustomizeModal;
