import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './MasterClassDetail.css';

const MasterClassDetail = ({
  masterClass,
  onClose,
  reviewFormSlot = null,
  noteBelowReviews = null,
}) => {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  if (!masterClass) return null;

  const avg = masterClass.avgRating;
  const reviews = masterClass.reviews || [];

  const modalContent = (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
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
            <span>{parseFloat(masterClass.price).toFixed(2)} Br</span>
          </div>

          {avg != null && (
            <div className="detail-field">
              <label>Средняя оценка:</label>
              <span>
                {avg} ★ ({masterClass.reviewCount ?? reviews.length} отзывов)
              </span>
            </div>
          )}

          {masterClass.instructor && (
            <div className="detail-field">
              <label>Инструктор:</label>
              <span>
                {masterClass.instructor.fullName} ({masterClass.instructor.specialization})
              </span>
            </div>
          )}

          {masterClass.schedules && masterClass.schedules.length > 0 && (
            <div className="detail-field">
              <label>Ближайшие сеансы:</label>
              <ul className="schedules-list">
                {masterClass.schedules.map((s) => (
                  <li key={s.id}>
                    {new Date(s.startDate).toLocaleString('ru-RU')}
                    {' — '}
                    {new Date(s.endDate).toLocaleString('ru-RU')}
                    {s.location?.name && ` · ${s.location.name}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="detail-field masterclass-reviews-block">
              <label>Отзывы</label>
              <ul className="reviews-list">
                {reviews.map((r) => (
                  <li key={r.id} className="review-item">
                    <div className="review-item-head">
                      <strong>{r.participant?.fullName || 'Участник'}</strong>
                      <span className="review-rating">{r.rating} ★</span>
                    </div>
                    {r.comment && <p className="review-comment">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {noteBelowReviews}

          {masterClass.participants && masterClass.participants.length > 0 && (
            <div className="detail-field">
              <label>Участники ({masterClass.participants.length}):</label>
              <div className="participants-list">
                {masterClass.participants.map((participant) => (
                  <div key={participant.id} className="participant-item">
                    <strong>{participant.fullName}</strong>
                    <span>{participant.email}</span>
                    <span>{participant.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviewFormSlot}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MasterClassDetail;
