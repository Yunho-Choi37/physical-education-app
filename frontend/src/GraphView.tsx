import React, { useState, useEffect, useRef } from 'react';
import './GraphView.css';

interface Student {
  id: number;
  name: string;
  classId: number;
  tags?: string[];
  connections?: number[];
}

interface GraphNode {
  id: number;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  tags: string[];
  connections: number[];
}

interface GraphEdge {
  from: number;
  to: number;
  type: 'tag' | 'connection' | 'similar';
  strength: number;
}

interface GraphViewProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
  onClose: () => void;
}

const GraphView: React.FC<GraphViewProps> = ({ students, onStudentClick, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<string>('all');

  // 색상 팔레트
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // 노드 생성
  useEffect(() => {
    const newNodes: GraphNode[] = students.map((student, index) => {
      const angle = (index / students.length) * 2 * Math.PI;
      const radius = 200;
      const x = 300 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      return {
        id: student.id,
        name: student.name,
        x,
        y,
        size: 30 + (student.connections?.length || 0) * 5, // 연결이 많을수록 큰 노드
        color: colors[index % colors.length],
        tags: student.tags || [],
        connections: student.connections || []
      };
    });
    setNodes(newNodes);
  }, [students]);

  // 엣지 생성 (연결 관계 분석)
  useEffect(() => {
    const newEdges: GraphEdge[] = [];
    
    students.forEach(student => {
      // 태그 기반 연결
      student.tags?.forEach(tag => {
        students.forEach(otherStudent => {
          if (otherStudent.id !== student.id && 
              otherStudent.tags?.includes(tag)) {
            newEdges.push({
              from: student.id,
              to: otherStudent.id,
              type: 'tag',
              strength: 1
            });
          }
        });
      });

      // 직접 연결
      student.connections?.forEach(connectionId => {
        newEdges.push({
          from: student.id,
          to: connectionId,
          type: 'connection',
          strength: 2
        });
      });

      // 이름 유사성 기반 연결 (간단한 예시)
      students.forEach(otherStudent => {
        if (otherStudent.id !== student.id) {
          const similarity = calculateSimilarity(student.name, otherStudent.name);
          if (similarity > 0.3) {
            newEdges.push({
              from: student.id,
              to: otherStudent.id,
              type: 'similar',
              strength: similarity
            });
          }
        }
      });
    });

    setEdges(newEdges);
  }, [students]);

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

  // 캔버스 그리기
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // 줌과 팬 적용
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 엣지 그리기
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        // 엣지 타입별 색상
        switch (edge.type) {
          case 'tag':
            ctx.strokeStyle = '#4ECDC4';
            break;
          case 'connection':
            ctx.strokeStyle = '#FF6B6B';
            break;
          case 'similar':
            ctx.strokeStyle = '#96CEB4';
            break;
        }
        
        ctx.lineWidth = edge.strength;
        ctx.stroke();
      }
    });

    // 노드 그리기
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
      ctx.fillStyle = selectedNode === node.id ? '#FFD700' : node.color;
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 노드 이름
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 4);
    });

    ctx.restore();
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // 클릭된 노드 찾기
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      const student = students.find(s => s.id === clickedNode.id);
      if (student) {
        onStudentClick(student);
      }
    }
  };

  // 필터링된 노드와 엣지
  const filteredNodes = filter === 'all' ? nodes : nodes.filter(node => 
    node.tags.some(tag => tag.includes(filter))
  );

  const filteredEdges = edges.filter(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    return fromNode && toNode && 
           filteredNodes.includes(fromNode) && 
           filteredNodes.includes(toNode);
  });

  useEffect(() => {
    drawGraph();
  }, [nodes, edges, selectedNode, zoom, pan, filteredNodes, filteredEdges]);

  return (
    <div className="graph-view-overlay">
      <div className="graph-view-container">
        <div className="graph-controls">
          <button onClick={onClose} className="close-btn">×</button>
          <div className="filter-controls">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">모든 연결</option>
              <option value="tag">태그 연결</option>
              <option value="connection">직접 연결</option>
              <option value="similar">유사성</option>
            </select>
          </div>
          <div className="zoom-controls">
            <button onClick={() => setZoom(1)}>리셋</button>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
          className="graph-canvas"
        />
        
        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4ECDC4' }}></div>
            <span>태그 연결</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FF6B6B' }}></div>
            <span>직접 연결</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#96CEB4' }}></div>
            <span>유사성 연결</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView;

