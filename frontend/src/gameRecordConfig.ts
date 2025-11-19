export type SportType =
  | 'soccer'
  | 'basketball'
  | 'volleyball'
  | 'baseball'
  | 'tabletennis'
  | 'badminton'
  | 'handball';

export const sportNames: Record<SportType, string> = {
  soccer: '축구 ⚽',
  basketball: '농구 🏀',
  volleyball: '배구 🏐',
  baseball: '야구 ⚾',
  tabletennis: '탁구 🏓',
  badminton: '배드민턴 🏸',
  handball: '핸드볼 🥅',
};

export const sportStats: Record<
  SportType,
  Array<{ key: string; label: string; emoji: string; category?: 'attempt' | 'success' | 'defense' | 'other' }>
> = {
  soccer: [
    { key: 'goals', label: '골', emoji: '⚽', category: 'success' },
    { key: 'shotAttempts', label: '슛 시도', emoji: '🎯', category: 'attempt' },
    { key: 'shotSuccess', label: '슛 성공', emoji: '✅', category: 'success' },
    { key: 'assists', label: '도움', emoji: '🎯', category: 'other' },
    { key: 'passAttempts', label: '패스 시도', emoji: '📤', category: 'attempt' },
    { key: 'passSuccess', label: '패스 성공', emoji: '✅', category: 'success' },
    { key: 'defenseSuccess', label: '수비 성공', emoji: '🛡️', category: 'defense' },
    { key: 'tackles', label: '태클', emoji: '⚔️', category: 'defense' },
    { key: 'interceptions', label: '인터셉트', emoji: '👋', category: 'defense' },
    { key: 'fouls', label: '파울', emoji: '⚠️', category: 'other' },
    { key: 'sportsmanship', label: '스포츠맨십', emoji: '🤝', category: 'other' },
    { key: 'unsportsmanship', label: '언스포츠맨십', emoji: '❌', category: 'other' },
  ],
  basketball: [
    { key: 'points', label: '득점', emoji: '🏀', category: 'success' },
    { key: 'shotAttempts', label: '슛 시도', emoji: '🎯', category: 'attempt' },
    { key: 'shotSuccess', label: '슛 성공', emoji: '✅', category: 'success' },
    { key: 'freeThrowAttempts', label: '자유투 시도', emoji: '🎯', category: 'attempt' },
    { key: 'freeThrowSuccess', label: '자유투 성공', emoji: '✅', category: 'success' },
    { key: 'passAttempts', label: '패스 시도', emoji: '📤', category: 'attempt' },
    { key: 'passSuccess', label: '패스 성공', emoji: '✅', category: 'success' },
    { key: 'dribbleAttempts', label: '드리블 시도', emoji: '🏃', category: 'attempt' },
    { key: 'dribbleFailure', label: '드리블 실패', emoji: '❌', category: 'other' },
    { key: 'assists', label: '어시스트', emoji: '🎯', category: 'other' },
    { key: 'rebounds', label: '리바운드', emoji: '📊', category: 'other' },
    { key: 'steals', label: '스틸', emoji: '👋', category: 'defense' },
    { key: 'blocks', label: '블록', emoji: '🛡️', category: 'defense' },
    { key: 'defenseSuccess', label: '수비 성공', emoji: '🛡️', category: 'defense' },
    { key: 'fouls', label: '파울', emoji: '⚠️', category: 'other' },
    { key: 'sportsmanship', label: '스포츠맨십', emoji: '🤝', category: 'other' },
    { key: 'unsportsmanship', label: '언스포츠맨십', emoji: '❌', category: 'other' },
  ],
  volleyball: [
    { key: 'spikeAttempts', label: '스파이크 시도', emoji: '💥', category: 'attempt' },
    { key: 'spikeSuccess', label: '스파이크 성공', emoji: '✅', category: 'success' },
    { key: 'blockAttempts', label: '블로킹 시도', emoji: '🛡️', category: 'attempt' },
    { key: 'blockSuccess', label: '블로킹 성공', emoji: '✅', category: 'success' },
    { key: 'serveAttempts', label: '서브 시도', emoji: '🎾', category: 'attempt' },
    { key: 'serveSuccess', label: '서브 성공', emoji: '✅', category: 'success' },
    { key: 'digs', label: '디그', emoji: '🤲', category: 'defense' },
    { key: 'sets', label: '세트', emoji: '👆', category: 'other' },
    { key: 'defenseSuccess', label: '수비 성공', emoji: '🛡️', category: 'defense' },
    { key: 'fouls', label: '파울', emoji: '⚠️', category: 'other' },
    { key: 'sportsmanship', label: '스포츠맨십', emoji: '🤝', category: 'other' },
    { key: 'unsportsmanship', label: '언스포츠맨십', emoji: '❌', category: 'other' },
  ],
  baseball: [
    { key: 'hits', label: '안타', emoji: '⚾', category: 'success' },
    { key: 'atBats', label: '타석', emoji: '🎯', category: 'attempt' },
    { key: 'runs', label: '득점', emoji: '🏃', category: 'success' },
    { key: 'rbis', label: '타점', emoji: '💯', category: 'other' },
    { key: 'strikeouts', label: '삼진', emoji: '❌', category: 'other' },
    { key: 'walks', label: '볼넷', emoji: '🚶', category: 'other' },
    { key: 'defenseSuccess', label: '수비 성공', emoji: '🛡️', category: 'defense' },
    { key: 'errors', label: '실책', emoji: '⚠️', category: 'other' },
    { key: 'sportsmanship', label: '스포츠맨십', emoji: '🤝', category: 'other' },
    { key: 'unsportsmanship', label: '언스포츠맨십', emoji: '❌', category: 'other' },
  ],
  tabletennis: [
    { key: 'points', label: '득점', emoji: '🏓', category: 'success' },
    { key: 'serveAttempts', label: '서브 시도', emoji: '🎾', category: 'attempt' },
    { key: 'serveSuccess', label: '서브 성공', emoji: '✅', category: 'success' },
    { key: 'smashAttempts', label: '스매시 시도', emoji: '💥', category: 'attempt' },
    { key: 'smashSuccess', label: '스매시 성공', emoji: '✅', category: 'success' },
    { key: 'spin', label: '회전', emoji: '🌀', category: 'other' },
    { key: 'defenseSuccess', label: '수비 성공', emoji: '🛡️', category: 'defense' },
    { key: 'fouls', label: '파울', emoji: '⚠️', category: 'other' },
    { key: 'sportsmanship', label: '스포츠맨십', emoji: '🤝', category: 'other' },
    { key: 'unsportsmanship', label: '언스포츠맨십', emoji: '❌', category: 'other' },
  ],
  badminton: [
    { key: 'points', label: '득점', emoji: '🏸', category: 'success' },
    { key: 'smashAttempts', label: '스매시 시도', emoji: '💥', category: 'attempt' },
    { key: 'smashSuccess', label: '스매시 성공', emoji: '✅', category: 'success' },
    { key: 'serveAttempts', label: '서브 시도', emoji: '🎾', category: 'attempt' },
    { key: 'serveSuccess', label: '서브 성공', emoji: '✅', category: 'success' },
    { key: 'drops', label: '드롭', emoji: '⬇️', category: 'other' },
    { key: 'clears', label: '클리어', emoji: '⬆️', category: 'other' },
    { key: 'defenseSuccess', label: '수비 성공', emoji: '🛡️', category: 'defense' },
    { key: 'fouls', label: '파울', emoji: '⚠️', category: 'other' },
    { key: 'sportsmanship', label: '스포츠맨십', emoji: '🤝', category: 'other' },
    { key: 'unsportsmanship', label: '언스포츠맨십', emoji: '❌', category: 'other' },
  ],
  handball: [
    { key: 'goals', label: '골', emoji: '🥅', category: 'success' },
    { key: 'shotAttempts', label: '슛 시도', emoji: '🎯', category: 'attempt' },
    { key: 'shotSuccess', label: '슛 성공', emoji: '✅', category: 'success' },
    { key: 'assists', label: '도움', emoji: '🎯', category: 'other' },
    { key: 'saves', label: '세이브', emoji: '🛡️', category: 'defense' },
    { key: 'steals', label: '스틸', emoji: '👋', category: 'defense' },
    { key: 'defenseSuccess', label: '수비 성공', emoji: '🛡️', category: 'defense' },
    { key: 'fouls', label: '파울', emoji: '⚠️', category: 'other' },
    { key: 'sportsmanship', label: '스포츠맨십', emoji: '🤝', category: 'other' },
    { key: 'unsportsmanship', label: '언스포츠맨십', emoji: '❌', category: 'other' },
  ],
};

