import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setItemsPerPage } from '../../../store/slices/userSettingsSlice';
import { paymentService } from '../../../services/paymentService';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import '../ContactRequests/ContactRequests.css';

const statusLabel = (s) => {
  if (s === 'paid') return 'Оплачено';
  if (s === 'cancelled') return 'Отменён';
  return 'Ожидает оплаты';
};

const formatWhen = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return String(value);
  }
};

const Payments = () => {
  const dispatch = useAppDispatch();
  const { itemsPerPage } = useAppSelector((state) => state.userSettings);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  const [inputFilters, setInputFilters] = useState({
    search: '',
    status: '',
  });
  const [filters, setFilters] = useState(inputFilters);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await paymentService.getAll(params);

      setItems(response.data || []);
      setPagination({
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Ошибка при загрузке счетов'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleFilterChange = (field, value) => {
    setInputFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setFilters(inputFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const empty = { search: '', status: '' };
    setInputFilters(empty);
    setFilters(empty);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value) => {
    const numValue = parseInt(value, 10);
    if (numValue > 0 && numValue <= 100) {
      dispatch(setItemsPerPage(numValue));
      setCurrentPage(1);
    }
  };

  const handleMarkPaid = async (paymentId) => {
    if (!window.confirm('Отметить счёт как оплаченный?')) return;
    try {
      setLoading(true);
      await paymentService.markPaid(paymentId);
      await loadList();
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          err.message ||
          'Не удалось обновить счёт'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="contact-requests-page">
          <div className="contact-requests-header">
            <h1>Счета участников</h1>
          </div>

          {error && <div className="contact-requests-error">{error}</div>}

          <div className="contact-requests-filters">
            <div className="contact-requests-filter-row">
              <label className="contact-requests-label">
                Код счёта
                <input
                  type="text"
                  className="contact-requests-input"
                  value={inputFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="DB-…"
                />
              </label>
              <label className="contact-requests-label">
                Статус
                <select
                  className="contact-requests-input"
                  value={inputFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Все</option>
                  <option value="pending">Ожидает оплаты</option>
                  <option value="paid">Оплачено</option>
                  <option value="cancelled">Отменён</option>
                </select>
              </label>
            </div>
            <div className="contact-requests-filter-actions">
              <button
                type="button"
                className="contact-requests-btn"
                onClick={handleSearch}
              >
                Применить
              </button>
              <button
                type="button"
                className="contact-requests-btn contact-requests-btn--ghost"
                onClick={handleResetFilters}
              >
                Сбросить
              </button>
              <label className="contact-requests-label contact-requests-label--inline">
                На странице
                <select
                  className="contact-requests-input contact-requests-input--narrow"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {loading && !items.length ? (
            <p className="contact-requests-muted">Загрузка…</p>
          ) : null}

          {!loading && !items.length && !error ? (
            <p className="contact-requests-muted">Нет счетов по условию.</p>
          ) : null}

          <ul className="contact-requests-list">
            {items.map((row) => (
              <li key={row.id} className="contact-requests-card">
                <div className="contact-requests-card-head">
                  <span className="contact-requests-when">
                    {formatWhen(row.createdAt)}
                  </span>
                  <span className="contact-requests-badge contact-requests-badge--new">
                    {statusLabel(row.status)}
                  </span>
                </div>
                <p>
                  <strong>Код:</strong> {row.invoiceCode}
                </p>
                <p>
                  <strong>Сумма:</strong>{' '}
                  {parseFloat(row.amount).toFixed(2)}
                </p>
                <p>
                  <strong>Участник:</strong> {row.participant?.fullName} (
                  {row.participant?.email})
                </p>
                <p>
                  <strong>Мастер-класс:</strong>{' '}
                  {row.schedule?.masterClass?.name || '—'}
                </p>
                <p>
                  <strong>Сеанс:</strong>{' '}
                  {formatWhen(row.schedule?.startDate)} —{' '}
                  {formatWhen(row.schedule?.endDate)}
                </p>
                {row.status === 'pending' && (
                  <button
                    type="button"
                    className="contact-requests-btn contact-requests-btn--small"
                    onClick={() => handleMarkPaid(row.id)}
                    disabled={loading}
                  >
                    Отметить оплаченным
                  </button>
                )}
              </li>
            ))}
          </ul>

          {pagination.totalPages > 1 && (
            <div className="contact-requests-pagination">
              <button
                type="button"
                className="contact-requests-btn contact-requests-btn--ghost"
                disabled={currentPage <= 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Назад
              </button>
              <span className="contact-requests-pageinfo">
                Стр. {currentPage} из {pagination.totalPages} (всего{' '}
                {pagination.total})
              </span>
              <button
                type="button"
                className="contact-requests-btn contact-requests-btn--ghost"
                disabled={currentPage >= pagination.totalPages || loading}
                onClick={() => handlePageChange(currentPage + 1)}
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

export default Payments;
