import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { masterClassService } from '../../services/masterClassService';
import { reviewService } from '../../services/reviewService';
import { authUtils } from '../../utils/auth';
import './MasterClassPublicPage.css';

const MasterClassPublicPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const [formError, setFormError] = useState(null);
  const [enrollDialog, setEnrollDialog] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterClassService.getById(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Мастер-класс не найден');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setFormMessage(null);
    setFormError(null);
    setComment('');
    setRating(5);
    setEnrollDialog(null);
    setEnrollError(null);
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormMessage(null);
    setFormError(null);
    setSubmittingReview(true);
    try {
      await reviewService.create({
        masterClassId: Number(id),
        rating: Number(rating),
        comment: comment.trim() ? comment.trim() : null,
      });
      setFormMessage('Спасибо, отзыв опубликован.');
      setComment('');
      await load();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось отправить отзыв'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const user = authUtils.getUser();
  const isParticipant = authUtils.isLoggedIn() && user.role === 'participant';

  const openEnrollModal = () => {
    if (!data) return;
    const now = new Date();
    const upcoming = (data.schedules || []).filter((s) => new Date(s.startDate) > now);
    if (upcoming.length === 0) {
      setEnrollError(
        'Нет будущих сеансов для онлайн-записи. Попробуйте позже или откройте каталог в личном кабинете.'
      );
      return;
    }
    setEnrollError(null);
    setEnrollDialog({
      schedules: upcoming,
      selectedScheduleId: upcoming[0].id,
    });
  };

  const handleConfirmEnroll = async () => {
    if (!enrollDialog) return;
    setEnrolling(true);
    setEnrollError(null);
    try {
      await masterClassService.enroll(Number(id), {
        scheduleId: enrollDialog.selectedScheduleId,
      });
      setEnrollDialog(null);
      await load();
    } catch (err) {
      setEnrollError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось выполнить запись'
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <main className="mc-public-page"><div className="loading">Загрузка...</div></main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Header />
        <main className="mc-public-page">
          <p className="error-message">{error || 'Нет данных'}</p>
          <Link to="/masterclass">← К каталогу</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const reviews = data.reviews || [];

  return (
    <div>
      <Header />
      <main className="mc-public-page">
        <nav className="mc-public-breadcrumbs">
          <Link to="/masterclass">Каталог</Link>
          <span> / </span>
          <span>{data.name}</span>
        </nav>
        {data.photo && (
          <div className="mc-public-hero">
            <img src={data.photo} alt={data.name} />
          </div>
        )}
        <h1>{data.name}</h1>
        <p className="mc-public-desc">{data.description}</p>
        <p>
          <strong>Цена:</strong> {parseFloat(data.price).toFixed(2)} Br
        </p>
        {data.avgRating != null && (
          <p>
            <strong>Средняя оценка:</strong> {data.avgRating} ★ ({data.reviewCount ?? reviews.length}{' '}
            отзывов)
          </p>
        )}
        {data.instructor && (
          <p>
            <strong>Инструктор:</strong>{' '}
            <Link to={`/instructors/${data.instructor.id}`}>{data.instructor.fullName}</Link>
            {' — '}
            {data.instructor.specialization}
          </p>
        )}
        {data.schedules && data.schedules.length > 0 && (
          <section className="mc-public-section">
            <h2>Расписание</h2>
            <ul>
              {data.schedules.map((s) => (
                <li key={s.id}>
                  {new Date(s.startDate).toLocaleString('ru-RU')} —{' '}
                  {new Date(s.endDate).toLocaleString('ru-RU')}
                  {s.location?.name ? ` · ${s.location.name}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="mc-public-section">
          <h2>Отзывы</h2>
          {data.viewerHasReview && isParticipant && (
            <p className="mc-public-review-hint">Вы уже оставили отзыв об этом мастер-классе.</p>
          )}
          {reviews.length === 0 && <p>Пока нет отзывов.</p>}
          {reviews.length > 0 && (
            <ul className="mc-public-reviews">
              {reviews.map((r) => (
                <li key={r.id}>
                  <strong>{r.participant?.fullName || 'Участник'}</strong> — {r.rating} ★
                  {r.comment && <p>{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
          {data.viewerCanSubmitReview && (
            <form className="mc-public-review-form" onSubmit={handleSubmitReview}>
              <h3 className="mc-public-review-form-title">Оставить отзыв</h3>
              <p className="mc-public-review-hint">
                Доступно, потому что вы записаны на этот мастер-класс.
              </p>
              {formMessage && (
                <p className="mc-public-review-success" role="status">
                  {formMessage}
                </p>
              )}
              {formError && <p className="error-message">{formError}</p>}
              <label className="mc-public-review-label">
                Оценка
                <select
                  className="mc-public-review-input"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  disabled={submittingReview}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} ★
                    </option>
                  ))}
                </select>
              </label>
              <label className="mc-public-review-label">
                Комментарий
                <textarea
                  className="mc-public-review-textarea"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="По желанию"
                  disabled={submittingReview}
                  maxLength={2000}
                />
              </label>
              <button
                type="submit"
                className="btn-primary"
                disabled={submittingReview}
              >
                {submittingReview ? 'Отправка…' : 'Отправить отзыв'}
              </button>
            </form>
          )}
          {isParticipant && !data.viewerHasEnrollment && (
            <p className="mc-public-review-hint">
              После записи на мастер-класс здесь появится форма отзыва.
            </p>
          )}
        </section>
        {enrollError && !enrollDialog && (
          <p className="error-message" role="alert">
            {enrollError}
          </p>
        )}
        <div className="mc-public-actions">
          {!isParticipant ? (
            <>
              <Link className="btn-primary" to="/login">
                Войти для записи
              </Link>
              <Link className="btn-secondary" to="/register">
                Регистрация
              </Link>
            </>
          ) : data.viewerHasEnrollment ? (
            <>
              <span className="mc-public-review-hint" style={{ width: '100%', marginBottom: '0.25rem' }}>
                Вы уже записаны на этот мастер-класс.
              </span>
              <Link className="btn-primary" to="/participant/classes">
                Мои мастер-классы
              </Link>
            </>
          ) : (
            <>
              <button type="button" className="btn-primary" onClick={openEnrollModal}>
                Записаться
              </button>
              <Link className="btn-secondary" to="/participant/classes">
                Расширенный каталог и фильтры в кабинете
              </Link>
            </>
          )}
        </div>

        {enrollDialog && (
          <div
            className="mc-public-enroll-overlay"
            role="presentation"
            onClick={() => !enrolling && setEnrollDialog(null)}
          >
            <div
              className="mc-public-enroll-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mc-enroll-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="mc-enroll-title" className="mc-public-enroll-title">
                Выберите сеанс
              </h2>
              <p>{data.name}</p>
              {enrollError && enrollDialog && (
                <p className="error-message">{enrollError}</p>
              )}
              <label htmlFor="mc-public-enroll-schedule" className="mc-public-enroll-label">
                Дата и место
              </label>
              <select
                id="mc-public-enroll-schedule"
                className="mc-public-enroll-select"
                value={enrollDialog.selectedScheduleId}
                disabled={enrolling}
                onChange={(e) =>
                  setEnrollDialog((prev) =>
                    prev
                      ? {
                          ...prev,
                          selectedScheduleId: Number(e.target.value),
                        }
                      : prev
                  )
                }
              >
                {enrollDialog.schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.startDate).toLocaleString('ru-RU')}
                    {s.location?.name ? ` — ${s.location.name}` : ''}
                  </option>
                ))}
              </select>
              <div className="mc-public-enroll-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={enrolling}
                  onClick={() => setEnrollDialog(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={enrolling}
                  onClick={handleConfirmEnroll}
                >
                  {enrolling ? 'Подождите…' : 'Записаться и получить счёт'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MasterClassPublicPage;
