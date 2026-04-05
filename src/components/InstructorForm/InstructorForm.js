import React, { useState, useEffect } from 'react';
import './InstructorForm.css';

const InstructorForm = ({ instructor, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (instructor) {
      setFormData({
        fullName: instructor.fullName || '',
        specialization: instructor.specialization || '',
      });
    }
    setServerError(null);
  }, [instructor]);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'ФИО обязательно для заполнения';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'ФИО должно содержать минимум 2 символа';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'ФИО не должно превышать 100 символов';
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Специализация обязательна для заполнения';
    } else if (formData.specialization.trim().length < 2) {
      newErrors.specialization = 'Специализация должна содержать минимум 2 символа';
    } else if (formData.specialization.trim().length > 200) {
      newErrors.specialization = 'Специализация не должна превышать 200 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        fullName: formData.fullName.trim(),
        specialization: formData.specialization.trim(),
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Ошибка при сохранении';
      setServerError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{instructor ? 'Редактировать инструктора' : 'Добавить инструктора'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="instructor-form">
          {serverError && (
            <div className="server-error-message">
              {serverError}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="fullName">
              ФИО <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'error' : ''}
              placeholder="Введите ФИО инструктора"
            />
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="specialization">
              Специализация <span className="required">*</span>
            </label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className={errors.specialization ? 'error' : ''}
              placeholder="Введите специализацию"
            />
            {errors.specialization && <span className="error-message">{errors.specialization}</span>}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Сохранение...' : (instructor ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorForm;
