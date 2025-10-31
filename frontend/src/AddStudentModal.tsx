
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Props {
  show: boolean;
  onHide: () => void;
  onSave: (count: number) => void;
}

const AddStudentModal: React.FC<Props> = ({ show, onHide, onSave }) => {
  const [count, setCount] = useState(1);

  const handleSave = () => {
    if (count > 0 && count <= 50) {
      onSave(count);
      setCount(1);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>학생 추가하기</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label><strong>추가할 학생 수를 입력하세요:</strong></Form.Label>
          <Form.Control 
            type="number" 
            min="1" 
            max="50"
            value={count} 
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setCount(Math.max(1, Math.min(50, val)));
            }}
            style={{ fontSize: '18px', textAlign: 'center', padding: '12px' }}
          />
          <Form.Text className="text-muted">
            {count}명의 학생이 추가됩니다. (최대 50명)
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSave}>
          추가하기
        </Button>
        <Button variant="secondary" onClick={onHide}>
          취소
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddStudentModal;
