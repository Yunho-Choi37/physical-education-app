
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Student {
  id: number;
  name: string;
  classId: number;
}

interface Props {
  student: Student | null;
  show: boolean;
  onHide: () => void;
  onSave: (student: Student) => void;
  onDelete: (studentId: number) => void;
}

const StudentDetailsModal: React.FC<Props> = ({ student, show, onHide, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (student) {
      setName(student.name);
    }
  }, [student]);

  if (!student) {
    return null;
  }

  const handleSave = () => {
    onSave({ ...student, name });
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(student.id);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Student Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>ID:</strong> {student.id}</p>
        {isEditing ? (
          <Form.Group>
            <Form.Label><strong>Name:</strong></Form.Label>
            <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </Form.Group>
        ) : (
          <p><strong>Name:</strong> {student.name}</p>
        )}
        <p><strong>Class ID:</strong> {student.classId}</p>
      </Modal.Body>
      <Modal.Footer>
        {isEditing ? (
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StudentDetailsModal;
