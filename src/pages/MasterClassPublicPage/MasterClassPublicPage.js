import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { masterClassService } from '../../services/masterClassService';
import { authUtils } from '../../utils/auth';
import './MasterClassPublicPage.css';

const MasterClassPublicPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const user = authUtils.getUser();
  const isParticipant = authUtils.isLoggedIn() && user.role === 'participant';

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
          <strong>Цена:</strong> {parseFloat(data.price).toFixed(2)} ₽
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
        </section>
        <div className="mc-public-actions">
          {isParticipant ? (
            <Link className="btn-primary" to="/participant/classes">
              Записаться в личном кабинете
            </Link>
          ) : (
            <>
              <Link className="btn-primary" to="/login">
                Войти для записи
              </Link>
              <Link className="btn-secondary" to="/register">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MasterClassPublicPage;
