import React from 'react';
import './MasterClassDetail.css';

const MasterClassDetail = ({ masterClass, onClose }) => {
  if (!masterClass) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Детальная информация о мастер-классе</h2>
        </div>

        <div className="detail-content">
          {masterClass.photo && (
            <div className="detail-photo">
              <img src={masterClass.photo} alt={masterClass.name} />
            </div>
          )}

          <div className="detail-field">
            <label>ID:</label>
            <span>{masterClass.id}</span>
          </div>

          <div className="detail-field">
            <label>Название:</label>
            <span>{masterClass.name}</span>
          </div>

          <div className="detail-field">
            <label>Описание:</label>
            <span>{masterClass.description}</span>
          </div>

          <div className="detail-field">
            <label>Цена:</label>
            <span>{parseFloat(masterClass.price).toFixed(2)} ₽</span>
          </div>

          {masterClass.instructor && (
            <div className="detail-field">
              <label>Инструктор:</label>
              <span>
                {masterClass.instructor.fullName} ({masterClass.instructor.specialization})
              </span>
            </div>
          )}

          {masterClass.participants && masterClass.participants.length > 0 && (
            <div className="detail-field">
              <label>Участники ({masterClass.participants.length}):</label>
              <div className="participants-list">
                {masterClass.participants.map(participant => (
                  <div key={participant.id} className="participant-item">
                    <strong>{participant.fullName}</strong>
                    <span>{participant.email}</span>
                    <span>{participant.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

export default MasterClassDetail;

