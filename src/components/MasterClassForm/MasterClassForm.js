import React, { useState, useEffect } from 'react';
import { instructorService } from '../../services/instructorService';
import { participantService } from '../../services/participantService';
import './MasterClassForm.css';

const MasterClassForm = ({ masterClass, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    photo: '',
    instructorId: '',
    participantIds: [],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    fetchInstructorsAndParticipants();

    if (masterClass) {
      setFormData({
        name: masterClass.name || '',
        description: masterClass.description || '',
        price: masterClass.price || '',
        photo: masterClass.photo || '',
        instructorId: masterClass.instructorId || '',
        participantIds: masterClass.participantIds || [],
      });
    }
    setServerError(null);
  }, [masterClass]);

  const fetchInstructorsAndParticipants = async () => {
    setLoading(true);
    try {
      const [instructorsRes, participantsRes] = await Promise.all([
        instructorService.getAll({ limit: 100 }),
        participantService.getAll({ limit: 100 }),
      ]);
      setInstructors(instructorsRes.data);
      setParticipants(participantsRes.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно для заполнения';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Название не должно превышать 200 символов';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно для заполнения';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Описание должно содержать минимум 10 символов';
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'Описание не должно превышать 5000 символов';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Цена обязательна для заполнения';
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Цена должна быть неотрицательным числом';
      }
    }

    if (formData.photo.trim() && !isValidUrl(formData.photo.trim())) {
      newErrors.photo = 'Фото должно быть валидным URL';
    }

    if (!formData.instructorId) {
      newErrors.instructorId = 'Инструктор обязателен для выбора';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
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

  const handleParticipantChange = (participantId) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(participantId)
        ? prev.participantIds.filter(id => id !== participantId)
        : [...prev.participantIds, participantId],
    }));
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
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        photo: formData.photo.trim() || null,
        instructorId: parseInt(formData.instructorId),
        participantIds: formData.participantIds,
      };

      await onSubmit(submitData);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Ошибка при сохранении';
      setServerError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content masterclass-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{masterClass ? 'Редактировать мастер-класс' : 'Добавить мастер-класс'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="masterclass-form">
          {serverError && (
            <div className="server-error-message">
              {serverError}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="name">
              Название <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Введите название мастер-класса"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Описание <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              placeholder="Введите описание мастер-класса"
              rows="4"
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price">
              Цена (BYN) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={errors.price ? 'error' : ''}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="photo">
              Фото (URL)
            </label>
            <input
              type="url"
              id="photo"
              name="photo"
              value={formData.photo}
              onChange={handleChange}
              className={errors.photo ? 'error' : ''}
              placeholder="https://example.com/photo.jpg"
            />
            {errors.photo && <span className="error-message">{errors.photo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="instructorId">
              Инструктор <span className="required">*</span>
            </label>
            <select
              id="instructorId"
              name="instructorId"
              value={formData.instructorId}
              onChange={handleChange}
              className={errors.instructorId ? 'error' : ''}
            >
              <option value="">Выберите инструктора</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.fullName} - {instructor.specialization}
                </option>
              ))}
            </select>
            {errors.instructorId && <span className="error-message">{errors.instructorId}</span>}
          </div>

          <div className="form-group">
            <label>Участники</label>
            <div className="participants-checkboxes">
              {participants.map(participant => (
                <label key={participant.id} className="participant-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.participantIds.includes(participant.id)}
                    onChange={() => handleParticipantChange(participant.id)}
                  />
                  <span className="checkmark"></span>
                  {participant.fullName} ({participant.email})
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Сохранение...' : (masterClass ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterClassForm;
