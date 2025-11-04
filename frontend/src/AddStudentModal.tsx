
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
        <Modal.Title>Add Circle</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label><strong>Enter the number of circles to add:</strong></Form.Label>
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
            {count} circle(s) will be added. (Max 50)
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSave}>
          Add
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddStudentModal;
