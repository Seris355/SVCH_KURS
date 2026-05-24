import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { masterClassService } from '../../services/masterClassService';
import { favoriteService } from '../../services/favoriteService';
import { paymentService } from '../../services/paymentService';
import { instructorService } from '../../services/instructorService';
import MasterClassDetail from '../../components/MasterClassDetail/MasterClassDetail';
import ReviewForm from '../../components/ReviewForm/ReviewForm';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { authUtils } from '../../utils/auth';
import './ParticipantClasses.css';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const defaultFilterState = {
  search: '',
  instructorIds: [],
  minPrice: '',
  maxPrice: '',
  sortBy: 'price',
  sortOrder: 'ASC',
};

const ParticipantClasses = () => {
  const [masterClasses, setMasterClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [catalogLimit, setCatalogLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMasterClass, setSelectedMasterClass] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [enrollDialog, setEnrollDialog] = useState(null);
  const [myPayments, setMyPayments] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState(defaultFilterState);
  const [inputFilters, setInputFilters] = useState(defaultFilterState);

  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const loadMasterClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        instructorIds,
        search,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      } = filters;

      const params = {
        page: currentPage,
        limit: catalogLimit,
        sortBy: sortBy || 'price',
        sortOrder: sortOrder || 'ASC',
      };

      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (instructorIds?.length > 0) {
        params.instructorId = instructorIds.join(',');
      }

      const response = await masterClassService.getAll(params);
      setMasterClasses(response.data || []);
      setPagination({
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке мастер-классов');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, catalogLimit]);

  const loadMyClasses = useCallback(async () => {
    try {
      const response = await masterClassService.getMyClasses();
      setMyClasses(response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки моих мастер-классов:', err);
    }
  }, []);

  const loadFavoriteIds = useCallback(async () => {
    try {
      const response = await favoriteService.getMy();
      const ids = new Set((response.data || []).map((mc) => mc.id));
      setFavoriteIds(ids);
    } catch (err) {
      console.error('Ошибка загрузки избранного:', err);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      const res = await paymentService.getMy();
      setMyPayments(res.data || []);
    } catch (err) {
      console.error('Ошибка загрузки счетов:', err);
    }
  }, []);

  const loadInstructors = useCallback(async () => {
    try {
      const res = await instructorService.getAll({ limit: 200, sortBy: 'fullName', sortOrder: 'ASC' });
      setInstructors(res.data || []);
    } catch {
      setInstructors([]);
    }
  }, []);

  useEffect(() => {
    loadMasterClasses();
    loadMyClasses();
    loadFavoriteIds();
    loadPayments();
    loadInstructors();
  }, [loadMasterClasses, loadMyClasses, loadFavoriteIds, loadPayments, loadInstructors]);

  useEffect(() => {
    if (activeTab === 'payments') {
      loadPayments();
    }
  }, [activeTab, loadPayments]);

  useEffect(() => {
    if (!enrollDialog) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setEnrollDialog(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enrollDialog]);

  const handleConfirmEnroll = async () => {
    if (!enrollDialog) return;
    const { masterClass, selectedScheduleId } = enrollDialog;
    try {
      setLoading(true);
      const response = await masterClassService.enroll(masterClass.id, {
        scheduleId: selectedScheduleId,
      });
      setEnrollDialog(null);
      await loadMasterClasses();
      await loadMyClasses();
      await loadFavoriteIds();
      await loadPayments();
      if (response.payment) {
        window.alert(
          `Запись оформлена.\nКод счёта: ${response.payment.invoiceCode}\nСумма к оплате: ${parseFloat(response.payment.amount).toFixed(2)}`
        );
      } else {
        window.alert('Вы записаны.');
      }
    } catch (err) {
      window.alert(
        err.response?.data?.message || 'Ошибка при записи на мастер-класс'
      );
    } finally {
      setLoading(false);
    }
  };

  const openEnrollDialog = async (masterClass) => {
    try {
      setLoading(true);
      const response = await masterClassService.getById(masterClass.id);
      const full = response.data;
      const schedules = full.schedules || [];
      if (!schedules.length) {
        window.alert(
          'Для этого мастер-класса пока нет сеансов в расписании. Запись с выставлением счёта недоступна — обратитесь к администратору.'
        );
        return;
      }
      setEnrollDialog({
        masterClass: full,
        schedules,
        selectedScheduleId: schedules[0].id,
      });
    } catch {
      window.alert('Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (masterClass) => {
    const id = masterClass.id;
    try {
      if (favoriteIds.has(id)) {
        await favoriteService.remove(id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await favoriteService.add(id);
        setFavoriteIds((prev) => new Set(prev).add(id));
      }
    } catch (err) {
      window.alert(
        err.response?.data?.message || 'Ошибка при работе с избранным'
      );
    }
  };

  const refreshSelectedDetail = async (classId) => {
    try {
      const response = await masterClassService.getById(classId);
      setSelectedMasterClass(response.data);
    } catch {
      /* ignore */
    }
  };

  const handleView = async (masterClass) => {
    try {
      setLoading(true);
      const response = await masterClassService.getById(masterClass.id);
      setSelectedMasterClass(response.data);
    } catch {
      alert('Ошибка при загрузке детальной информации');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedMasterClass(null);
  };

  const handleFilterChange = (field, value) => {
    setInputFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleInstructorToggle = (instructorId) => {
    const current = inputFilters.instructorIds || [];
    const next = current.includes(instructorId)
      ? current.filter((id) => id !== instructorId)
      : [...current, instructorId];
    handleFilterChange('instructorIds', next);
  };

  const handlePayInvoice = async (paymentId) => {
    try {
      setLoading(true);
      await paymentService.markPaid(paymentId);
      await loadPayments();
      window.alert('Счёт отмечен как оплаченный.');
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || 'Не удалось оплатить счёт');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(inputFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setInputFilters(defaultFilterState);
    setFilters(defaultFilterState);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleExportPdf = async () => {
    try {
      await masterClassService.exportMyClassesPdf();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не удалось скачать PDF');
    }
  };

  const isEnrolled = (classId) => myClasses.some((mc) => mc.id === classId);

  const user = authUtils.getUser();
  const participantId = user?.id;

  const hasReviewForSelected =
    selectedMasterClass?.reviews?.some((r) => r.participantId === participantId) ?? false;

  const fmtSchedule = (mc) => {
    const s = mc.schedules?.[0]?.startDate;
    return s ? new Date(s).toLocaleString('ru-RU') : '—';
  };

  const displayClasses =
    activeTab === 'all' ? masterClasses : activeTab === 'my' ? myClasses : [];

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="masterclasses-page">
          <div className="masterclasses-header">
            <h1>Мастер-классы</h1>
            <div className="cabinet-actions-row">
              <button type="button" className="btn-secondary" onClick={handleExportPdf}>
                Скачать PDF — мои записи
              </button>
              <Link className="btn-view" to="/masterclass">
                Открыть публичный каталог
              </Link>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="tabs">
            <button
              className={activeTab === 'all' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('all')}
              type="button"
            >
              Все мастер-классы
            </button>
            <button
              className={activeTab === 'my' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('my')}
              type="button"
            >
              Мои мастер-классы ({myClasses.length})
            </button>
            <button
              className={activeTab === 'payments' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('payments')}
              type="button"
            >
              Мои счета ({myPayments.length})
            </button>
          </div>

          {activeTab === 'all' && (
            <div className="filters">
              <div className="filter-group">
                <label>Поиск:</label>
                <input
                  type="text"
                  value={inputFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="Название или описание"
                />
              </div>
              <div className="filter-group">
                <label>Инструкторы:</label>
                <div className="instructor-filter-list">
                  {instructors.map((ins) => (
                    <label key={ins.id} className="instructor-filter-item">
                      <span>{ins.fullName}</span>
                      <input
                        type="checkbox"
                        checked={inputFilters.instructorIds.includes(ins.id)}
                        onChange={() => handleInstructorToggle(ins.id)}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="filter-row">
                <div className="filter-group">
                  <label>Цена от:</label>
                  <input
                    type="number"
                    value={inputFilters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="0"
                    step="0.01"
                  />
                </div>
                <div className="filter-group">
                  <label>Цена до:</label>
                  <input
                    type="number"
                    value={inputFilters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="10000"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="filter-group filter-sort">
                <label>Сортировка:</label>
                <div className="sort-controls">
                  <select
                    value={inputFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="price">Цена</option>
                    <option value="name">Название</option>
                    <option value="id">ID</option>
                  </select>
                  <select
                    value={inputFilters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <option value="ASC">По возрастанию</option>
                    <option value="DESC">По убыванию</option>
                  </select>
                </div>
              </div>
              <div className="filter-group">
                <label>Элементов на странице:</label>
                <select
                  value={catalogLimit}
                  onChange={(e) => {
                    setCatalogLimit(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group filter-buttons">
                <button className="btn-primary" type="button" onClick={handleSearch}>
                  Найти
                </button>
                <button className="btn-secondary" type="button" onClick={handleResetFilters}>
                  Сбросить
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="participant-payments-block">
              {myPayments.length === 0 ? (
                <div className="empty-state">У вас пока нет выставленных счетов</div>
              ) : (
                <div className="masterclass-grid">
                  {myPayments.map((p) => (
                    <div key={p.id} className="masterclass-card">
                      <div className="masterclass-info">
                        <h3>Счёт {p.invoiceCode}</h3>
                        <p className="masterclass-description">
                          {p.schedule?.masterClass?.name || 'Мастер-класс'}
                        </p>
                        <div className="masterclass-details">
                          <div className="detail-item">
                            <strong>Сумма:</strong> {parseFloat(p.amount).toFixed(2)} Br
                          </div>
                          <div className="detail-item">
                            <strong>Статус:</strong>{' '}
                            {p.status === 'paid'
                              ? 'Оплачено'
                              : p.status === 'cancelled'
                                ? 'Отменён'
                                : 'Ожидает оплаты'}
                          </div>
                          {p.schedule?.startDate && (
                            <div className="detail-item">
                              <strong>Сеанс:</strong>{' '}
                              {new Date(p.schedule.startDate).toLocaleString('ru-RU')}
                            </div>
                          )}
                        </div>
                        {p.status === 'pending' && (
                          <div className="card-actions">
                            <button
                              type="button"
                              className="btn-pay"
                              onClick={() => handlePayInvoice(p.id)}
                              disabled={loading}
                            >
                              Оплатить счёт
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab !== 'payments' && (
            <>
              {loading && <div className="loading">Загрузка...</div>}

              {!loading && displayClasses.length === 0 ? (
                <div className="empty-state">Мастер-классы не найдены</div>
              ) : (
                <div className="masterclass-grid">
                  {displayClasses.map((masterClass) => (
                    <div key={masterClass.id} className="masterclass-card">
                      {masterClass.photo && activeTab === 'all' && (
                        <div className="participant-mc-card-photo">
                          <img src={masterClass.photo} alt="" />
                        </div>
                      )}
                      <div className="masterclass-info">
                        <h3>{masterClass.name}</h3>
                        <p className="masterclass-description">{masterClass.description}</p>
                        <div className="masterclass-details">
                          <div className="detail-item">
                            <strong>Цена:</strong> {parseFloat(masterClass.price).toFixed(2)} Br
                          </div>
                          {masterClass.instructor && (
                            <div className="detail-item">
                              <strong>Инструктор:</strong> {masterClass.instructor.fullName}
                            </div>
                          )}
                          {activeTab === 'all' && (
                            <div className="detail-item">
                              <strong>Дата (ближайший сеанс):</strong> {fmtSchedule(masterClass)}
                            </div>
                          )}
                          <div className="detail-item">
                            <strong>Средняя оценка:</strong>{' '}
                            {masterClass.avgRating != null ? `${masterClass.avgRating} ★` : '—'}
                          </div>
                          <div className="detail-item">
                            <strong>Участников:</strong>{' '}
                            {masterClass.participantCount ??
                              masterClass.participants?.length ??
                              0}
                          </div>
                        </div>
                        <div className="card-actions">
                          <button
                            type="button"
                            className="btn-view"
                            onClick={() => handleView(masterClass)}
                          >
                            Просмотр
                          </button>
                          {activeTab === 'all' && (
                            <>
                              <button
                                type="button"
                                className={
                                  favoriteIds.has(masterClass.id)
                                    ? 'btn-favorite-active'
                                    : 'btn-favorite'
                                }
                                onClick={() => handleToggleFavorite(masterClass)}
                              >
                                {favoriteIds.has(masterClass.id)
                                  ? 'В избранном'
                                  : 'В избранное'}
                              </button>
                              <button
                                type="button"
                                className={
                                  isEnrolled(masterClass.id) ? 'btn-enrolled' : 'btn-enroll'
                                }
                                onClick={() => openEnrollDialog(masterClass)}
                                disabled={isEnrolled(masterClass.id)}
                              >
                                {isEnrolled(masterClass.id) ? 'Вы записаны' : 'Записаться'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'all' && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Назад
              </button>
              <span>
                Страница {currentPage} из {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Вперед
              </button>
            </div>
          )}

          {selectedMasterClass && (
            <MasterClassDetail
              masterClass={selectedMasterClass}
              onClose={handleCloseDetail}
              reviewFormSlot={
                isEnrolled(selectedMasterClass.id) && !hasReviewForSelected ? (
                  <ReviewForm
                    masterClassId={selectedMasterClass.id}
                    onSuccess={() => refreshSelectedDetail(selectedMasterClass.id)}
                  />
                ) : null
              }
              noteBelowReviews={
                isEnrolled(selectedMasterClass.id) && hasReviewForSelected ? (
                  <p className="review-note">Вы уже оставили отзыв на этот мастер-класс.</p>
                ) : null
              }
            />
          )}

          {enrollDialog && (
            <div
              className="enroll-modal-overlay"
              role="presentation"
              onClick={() => setEnrollDialog(null)}
            >
              <div
                className="enroll-modal-box"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="enroll-modal-title">Выберите сеанс</h2>
                <p>{enrollDialog.masterClass.name}</p>
                <label className="enroll-modal-label" htmlFor="enroll-schedule">
                  Дата и место
                </label>
                <select
                  id="enroll-schedule"
                  className="enroll-modal-select"
                  value={enrollDialog.selectedScheduleId}
                  onChange={(e) =>
                    setEnrollDialog((prev) => ({
                      ...prev,
                      selectedScheduleId: parseInt(e.target.value, 10),
                    }))
                  }
                >
                  {enrollDialog.schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.startDate).toLocaleString('ru-RU')}
                      {s.location?.name ? ` — ${s.location.name}` : ''}
                    </option>
                  ))}
                </select>
                <div className="enroll-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEnrollDialog(null)}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleConfirmEnroll}
                    disabled={loading}
                  >
                    {loading ? '…' : 'Записаться и получить счёт'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ParticipantClasses;
