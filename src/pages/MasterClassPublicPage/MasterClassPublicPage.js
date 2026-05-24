import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { masterClassService } from '../../services/masterClassService';
import { reviewService } from '../../services/reviewService';
import { authUtils } from '../../utils/auth';
import './MasterClassPublicPage.css';

const formatDateTime = (value) =>
  new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
        'Нет будущих сеансов для записи. Попробуйте позже или откройте каталог в личном кабинете.'
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

  const renderEnrollActions = () => {
    if (!isParticipant) {
      return (
        <>
          <Link className="btn-primary mc-public-btn-full" to="/login">
            Войти для записи
          </Link>
          <Link className="btn-secondary mc-public-btn-full" to="/register">
            Регистрация
          </Link>
        </>
      );
    }

    if (data.viewerHasEnrollment) {
      return (
        <>
          <p className="mc-public-status-note">Вы уже записаны на этот мастер-класс.</p>
          <Link className="btn-primary mc-public-btn-full" to="/participant/classes">
            Мои мастер-классы
          </Link>
        </>
      );
    }

    return (
      <>
        <button type="button" className="btn-primary mc-public-btn-full" onClick={openEnrollModal}>
          Записаться
        </button>
        <Link className="btn-secondary mc-public-btn-full" to="/participant/classes">
          Каталог в личном кабинете
        </Link>
      </>
    );
  };

  if (loading) {
    return (
      <div>
        <Header />
        <main className="mc-public-page">
          <div className="mc-public-state">Загрузка…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Header />
        <main className="mc-public-page">
          <div className="mc-public-card mc-public-state-card">
            <p className="mc-public-error">{error || 'Нет данных'}</p>
            <Link to="/masterclass" className="mc-public-back-link">
              ← Вернуться в каталог
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const reviews = data.reviews || [];
  const hasPhoto = Boolean(data.photo);

  return (
    <div>
      <Header />
      <main className="mc-public-page">
        <nav className="mc-public-breadcrumbs" aria-label="Навигация">
          <Link to="/">Главная</Link>
          <span className="mc-public-breadcrumbs-sep">/</span>
          <Link to="/masterclass">Каталог</Link>
          <span className="mc-public-breadcrumbs-sep">/</span>
          <span className="mc-public-breadcrumbs-current">{data.name}</span>
        </nav>

        <div className={`mc-public-top ${hasPhoto ? '' : 'mc-public-top--no-photo'}`}>
          {hasPhoto && (
            <div className="mc-public-hero">
              <img src={data.photo} alt={data.name} />
            </div>
          )}

          <aside className="mc-public-summary">
            <h1 className="mc-public-title">{data.name}</h1>

            <div className="mc-public-meta">
              <div className="mc-public-meta-row">
                <span className="mc-public-meta-label">Стоимость</span>
                <span className="mc-public-price">
                  {parseFloat(data.price).toFixed(2)} Br
                </span>
              </div>

              {data.avgRating != null && (
                <div className="mc-public-meta-row">
                  <span className="mc-public-meta-label">Оценка</span>
                  <span className="mc-public-rating">
                    {data.avgRating} ★
                    <span className="mc-public-rating-count">
                      ({data.reviewCount ?? reviews.length} отзывов)
                    </span>
                  </span>
                </div>
              )}

              {data.instructor && (
                <div className="mc-public-meta-row">
                  <span className="mc-public-meta-label">Инструктор</span>
                  <span className="mc-public-meta-value">
                    <Link to={`/instructors/${data.instructor.id}`}>
                      {data.instructor.fullName}
                    </Link>
                    <span className="mc-public-meta-sub">{data.instructor.specialization}</span>
                  </span>
                </div>
              )}
            </div>

            {enrollError && !enrollDialog && (
              <p className="mc-public-error" role="alert">
                {enrollError}
              </p>
            )}

            <div className="mc-public-actions">{renderEnrollActions()}</div>
          </aside>
        </div>

        <section className="mc-public-card">
          <h2 className="mc-public-section-title">О программе</h2>
          <p className="mc-public-desc">{data.description}</p>
        </section>

        {data.schedules && data.schedules.length > 0 && (
          <section className="mc-public-card">
            <h2 className="mc-public-section-title">Расписание</h2>
            <div className="mc-public-schedule-grid">
              {data.schedules.map((schedule) => (
                <article key={schedule.id} className="mc-public-schedule-item">
                  <p className="mc-public-schedule-date">
                    {formatDateTime(schedule.startDate)}
                  </p>
                  <p className="mc-public-schedule-end">
                    до {formatDateTime(schedule.endDate)}
                  </p>
                  {schedule.location?.name && (
                    <p className="mc-public-schedule-place">{schedule.location.name}</p>
                  )}
                  {schedule.location?.address && (
                    <p className="mc-public-schedule-address">{schedule.location.address}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mc-public-card">
          <h2 className="mc-public-section-title">Отзывы</h2>

          {data.viewerHasReview && isParticipant && (
            <p className="mc-public-hint">Вы уже оставили отзыв об этом мастер-классе.</p>
          )}

          {reviews.length === 0 && (
            <p className="mc-public-empty">Пока нет отзывов — будьте первым после участия.</p>
          )}

          {reviews.length > 0 && (
            <ul className="mc-public-reviews">
              {reviews.map((review) => (
                <li key={review.id} className="mc-public-review-item">
                  <div className="mc-public-review-head">
                    <strong>{review.participant?.fullName || 'Участник'}</strong>
                    <span className="mc-public-review-stars">{review.rating} ★</span>
                  </div>
                  {review.comment && <p className="mc-public-review-text">{review.comment}</p>}
                </li>
              ))}
            </ul>
          )}

          {data.viewerCanSubmitReview && (
            <form className="mc-public-review-form" onSubmit={handleSubmitReview}>
              <h3 className="mc-public-review-form-title">Оставить отзыв</h3>
              <p className="mc-public-hint">
                Доступно, потому что вы записаны на этот мастер-класс.
              </p>
              {formMessage && (
                <p className="mc-public-success" role="status">
                  {formMessage}
                </p>
              )}
              {formError && <p className="mc-public-error">{formError}</p>}
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
                  placeholder="Расскажите, что понравилось или что можно улучшить"
                  disabled={submittingReview}
                  maxLength={2000}
                />
              </label>
              <button type="submit" className="btn-primary" disabled={submittingReview}>
                {submittingReview ? 'Отправка…' : 'Отправить отзыв'}
              </button>
            </form>
          )}

          {isParticipant && !data.viewerHasEnrollment && (
            <p className="mc-public-hint">
              После записи на мастер-класс здесь появится форма отзыва.
            </p>
          )}
        </section>

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
              <p className="mc-public-enroll-subtitle">{data.name}</p>
              {enrollError && enrollDialog && (
                <p className="mc-public-error">{enrollError}</p>
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
                {enrollDialog.schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {formatDateTime(schedule.startDate)}
                    {schedule.location?.name ? ` — ${schedule.location.name}` : ''}
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
