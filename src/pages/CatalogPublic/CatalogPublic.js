import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { masterClassService } from '../../services/masterClassService';
import '../ParticipantClasses/ParticipantClasses.css';
import './CatalogPublic.css';

const ITEMS_PER_PAGE = 12;

const CatalogPublic = () => {
  const [masterClasses, setMasterClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterClassService.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'name',
        sortOrder: 'ASC',
      });
      setMasterClasses(res.data || []);
      setPagination({
        totalPages: res.pagination?.totalPages || 1,
        total: res.pagination?.total || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtDate = (mc) => {
    const s = mc.schedules?.[0]?.startDate;
    return s ? new Date(s).toLocaleString('ru-RU') : '—';
  };

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="masterclasses-page">
          <div className="masterclasses-header">
            <h1>Каталог мастер-классов</h1>
            <p className="catalog-public-hint">
              Просмотр доступен всем. Запись и расширенные фильтры — после{' '}
              <Link to="/login">входа</Link> в личный кабинет.
            </p>
          </div>
          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading">Загрузка...</div>}
          {!loading && masterClasses.length === 0 && (
            <div className="empty-state">Мастер-классы пока не добавлены</div>
          )}
          {!loading && masterClasses.length > 0 && (
            <div className="masterclass-grid">
              {masterClasses.map((mc) => (
                <div key={mc.id} className="masterclass-card">
                  {mc.photo && (
                    <div className="mc-public-card-photo">
                      <img src={mc.photo} alt="" />
                    </div>
                  )}
                  <div className="masterclass-info">
                    <h3>{mc.name}</h3>
                    <p className="masterclass-description">{mc.description}</p>
                    <div className="masterclass-details">
                      <div className="detail-item">
                        <strong>Цена:</strong> {parseFloat(mc.price).toFixed(2)} Br
                      </div>
                      {mc.instructor && (
                        <div className="detail-item">
                          <strong>Инструктор:</strong> {mc.instructor.fullName}
                        </div>
                      )}
                      <div className="detail-item">
                        <strong>Дата:</strong> {fmtDate(mc)}
                      </div>
                      <div className="detail-item">
                        <strong>Средняя оценка:</strong>{' '}
                        {mc.avgRating != null ? `${mc.avgRating} ★` : '—'}
                      </div>
                      <div className="detail-item">
                        <strong>Записалось:</strong> {mc.participantCount ?? 0}
                      </div>
                    </div>
                    <div className="card-actions">
                      <Link className="btn-view" to={`/masterclass/${mc.id}`}>
                        Подробнее
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Назад
              </button>
              <span>
                Страница {page} из {pagination.totalPages} (всего {pagination.total})
              </span>
              <button
                type="button"
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CatalogPublic;
