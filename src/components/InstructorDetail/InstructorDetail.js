import React from 'react';
import './InstructorDetail.css';

const InstructorDetail = ({ instructor, onClose }) => {
  if (!instructor) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Детальная информация об инструкторе</h2>
        </div>

        <div className="detail-content">
          <div className="detail-field">
            <label>ID:</label>
            <span>{instructor.id}</span>
          </div>

          <div className="detail-field">
            <label>ФИО:</label>
            <span>{instructor.fullName}</span>
          </div>

          <div className="detail-field">
            <label>Специализация:</label>
            <span>{instructor.specialization}</span>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorDetail;
