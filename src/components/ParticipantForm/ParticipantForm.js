import React, { useState, useEffect } from 'react';
import './ParticipantForm.css';

const ParticipantForm = ({ participant, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (participant) {
      setFormData({
        fullName: participant.fullName || '',
        email: participant.email || '',
        phone: participant.phone || '',
        password: '',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
      });
    }
    setServerError(null);
  }, [participant]);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'ФИО обязательно для заполнения';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'ФИО должно содержать минимум 2 символа';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'ФИО не должно превышать 100 символов';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Email должен содержать @ и .';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = 'Телефон должен содержать минимум 10 символов';
    } else if (formData.phone.trim().length > 50) {
      newErrors.phone = 'Телефон не должен превышать 50 символов';
    }

    if (!participant && !formData.password) {
      newErrors.password = 'Пароль обязателен для заполнения';
    } else if (!participant && formData.password && formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
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
      const submitData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      await onSubmit(submitData);
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
          <h2>{participant ? 'Редактировать участника' : 'Добавить участника'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="participant-form">
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
              placeholder="Введите ФИО участника"
            />
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="example@mail.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Телефон <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="Введите номер телефона"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {!participant && (
            <div className="form-group">
              <label htmlFor="password">
                Пароль <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Введите пароль"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Сохранение...' : (participant ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParticipantForm;

