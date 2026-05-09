import React, { useState } from 'react';
import { reviewService } from '../../services/reviewService';
import './ReviewForm.css';

const ReviewForm = ({ masterClassId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await reviewService.create({
        masterClassId,
        rating: parseInt(rating, 10),
        comment: comment.trim() || undefined,
      });
      setComment('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось сохранить отзыв');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h4 className="review-form-title">Оставить отзыв</h4>
      {error && <div className="review-form-error">{error}</div>}
      <label className="review-form-label">
        Оценка (1–5)
        <select
          className="review-form-select"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </select>
      </label>
      <label className="review-form-label">
        Комментарий
        <textarea
          className="review-form-textarea"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Расскажите о мастер-классе"
        />
      </label>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Отправка…' : 'Отправить отзыв'}
      </button>
    </form>
  );
};

export default ReviewForm;
