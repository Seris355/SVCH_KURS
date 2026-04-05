import React, { useState } from 'react';

const Modal = ({ item, isEdit, onSave, onClose }) => {
  const [formData, setFormData] = useState(item || {});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {isEdit ? (
          <div className="modal-form">
            <h2>Редактировать мастер-класс</h2>
            <input
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Название"
              className="modal-input"
            />
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Описание"
              className="modal-textarea"
            />
            <input
              type="number"
              name="participants"
              value={formData.participants || 0}
              onChange={handleChange}
              placeholder="Участники"
              className="modal-input"
            />
            <input
              type="number"
              name="doctors"
              value={formData.doctors || 0}
              onChange={handleChange}
              placeholder="Врачи"
              className="modal-input"
            />
            <div className="modal-actions">
              <button className="action-btn" onClick={handleSubmit}>Сохранить</button>
              <button className="action-btn" onClick={onClose}>Отмена</button>
            </div>
          </div>
        ) : (
          <div className="modal-view">
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <p>Участники: {item.participants}</p>
            <p>Врачи: {item.doctors}</p>
            <button className="action-btn" onClick={onClose}>Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;