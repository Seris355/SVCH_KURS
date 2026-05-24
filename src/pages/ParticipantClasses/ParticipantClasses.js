import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { masterClassService } from '../../services/masterClassService';
import { favoriteService } from '../../services/favoriteService';
import { paymentService } from '../../services/paymentService';
import { instructorService } from '../../services/instructorService';
import MasterClassDetail from '../../components/MasterClassDetail/MasterClassDetail';
import ReviewForm from '../../components/ReviewForm/ReviewForm';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { authUtils } from '../../utils/auth';
import { useOverlayDismiss } from '../../utils/useOverlayDismiss';
import './ParticipantClasses.css';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const MIN_DAYS_BEFORE_MODIFY = 7;

const formatSessionDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const defaultFilterState = {
  search: '',
  instructorIds: [],
  minPrice: '',
  maxPrice: '',
  sortBy: 'price',
  sortOrder: 'ASC',
};

const ParticipantClasses = () => {
  const [searchParams] = useSearchParams();
  const [masterClasses, setMasterClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [catalogLimit, setCatalogLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMasterClass, setSelectedMasterClass] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [enrollDialog, setEnrollDialog] = useState(null);
  const [rescheduleDialog, setRescheduleDialog] = useState(null);
  const [myPayments, setMyPayments] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState(defaultFilterState);
  const [inputFilters, setInputFilters] = useState(defaultFilterState);

  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const closeEnrollDialog = useCallback(() => setEnrollDialog(null), []);
  const enrollOverlayDismiss = useOverlayDismiss(closeEnrollDialog);
  const closeRescheduleDialog = useCallback(() => setRescheduleDialog(null), []);
  const rescheduleOverlayDismiss = useOverlayDismiss(closeRescheduleDialog);

  useEffect(() => {
    const instructorId = parseInt(searchParams.get('instructorId'), 10);
    if (Number.isNaN(instructorId)) return;

    const nextFilters = {
      ...defaultFilterState,
      instructorIds: [instructorId],
    };
    setActiveTab('all');
    setInputFilters(nextFilters);
    setFilters(nextFilters);
    setCurrentPage(1);
  }, [searchParams]);

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
    if (activeTab === 'payments' || activeTab === 'my') {
      loadPayments();
      if (activeTab === 'my') {
        loadMyClasses();
      }
    }
  }, [activeTab, loadPayments, loadMyClasses]);

  useEffect(() => {
    if (!enrollDialog && !rescheduleDialog) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEnrollDialog(null);
        setRescheduleDialog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enrollDialog, rescheduleDialog]);

  const reloadEnrollmentData = async () => {
    await loadMasterClasses();
    await loadMyClasses();
    await loadPayments();
  };

  const handleConfirmEnroll = async () => {
    if (!enrollDialog) return;
    const { masterClass, selectedScheduleId } = enrollDialog;
    try {
      setLoading(true);
      const response = await masterClassService.enroll(masterClass.id, {
        scheduleId: selectedScheduleId,
      });
      setEnrollDialog(null);
      await reloadEnrollmentData();
      await loadFavoriteIds();
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

  const handleCancelEnrollment = async (masterClass) => {
    const enrollment = getEnrollmentInfo(masterClass);
    const manage = enrollment.manage;
    if (enrollment.schedule && manage && !manage.canModify) {
      window.alert(
        manage.modifyBlockedReason ||
          `Отмена доступна не позднее чем за ${MIN_DAYS_BEFORE_MODIFY} дней до сеанса`
      );
      return;
    }

    const sessionLabel = formatSessionDateTime(enrollment.schedule?.startDate);
    if (
      !window.confirm(
        `Отписаться от «${masterClass.name}»?\nСеанс: ${sessionLabel}\n\nЭто действие нельзя отменить.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await masterClassService.cancelEnrollment(masterClass.id);
      await reloadEnrollmentData();
      window.alert('Вы отписались от мастер-класса.');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не удалось отписаться');
    } finally {
      setLoading(false);
    }
  };

  const openRescheduleDialog = async (masterClass) => {
    const enrollment = getEnrollmentInfo(masterClass);
    const manage = enrollment.manage;
    if (manage && !manage.canModify) {
      window.alert(
        manage.modifyBlockedReason ||
          `Смена даты доступна не позднее чем за ${MIN_DAYS_BEFORE_MODIFY} дней до сеанса`
      );
      return;
    }

    try {
      setLoading(true);
      const response = await masterClassService.getById(masterClass.id);
      const full = response.data;
      const currentScheduleId = Number(
        enrollment.schedule?.id || getEnrolledScheduleId(full.id)
      );
      const schedules = (full.schedules || []).filter((schedule) => {
        if (Number(schedule.id) === currentScheduleId) return false;
        if (!schedule.isUpcoming && new Date(schedule.startDate) <= new Date()) return false;
        if (schedule.canEnroll === false) return false;
        if (schedule.capacityLeft != null && schedule.capacityLeft <= 0) return false;
        return new Date(schedule.startDate) > new Date();
      });

      if (!schedules.length) {
        window.alert('Нет других доступных сеансов для переноса.');
        return;
      }

      setRescheduleDialog({
        masterClass: full,
        schedules,
        selectedScheduleId: schedules[0].id,
        currentScheduleId,
        currentSchedule: enrollment.schedule,
      });
    } catch {
      window.alert('Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDialog) return;
    const { masterClass, selectedScheduleId, currentScheduleId } = rescheduleDialog;

    if (
      currentScheduleId != null &&
      Number(selectedScheduleId) === Number(currentScheduleId)
    ) {
      setRescheduleDialog(null);
      return;
    }

    try {
      setLoading(true);
      const result = await masterClassService.rescheduleEnrollment(masterClass.id, {
        scheduleId: selectedScheduleId,
      });
      setRescheduleDialog(null);
      await reloadEnrollmentData();
      if (!result.data?.unchanged) {
        window.alert('Дата сеанса успешно изменена.');
      }
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не удалось изменить дату сеанса');
    } finally {
      setLoading(false);
    }
  };

  const openEnrollDialog = async (masterClass) => {
    try {
      setLoading(true);
      const response = await masterClassService.getById(masterClass.id);
      const full = response.data;
      const schedules = getBookableSchedules(full.schedules || [], full.id);
      if (!schedules.length) {
        window.alert(
          isEnrolled(full.id)
            ? 'Вы уже записаны на сеанс этого мастер-класса.'
            : 'Для этого мастер-класса сейчас нет доступных сеансов. Обратитесь к администратору.'
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

  const getPaymentMasterClassId = (payment) =>
    payment?.schedule?.masterClassId ?? payment?.schedule?.masterClass?.id ?? null;

  const buildEnrollmentManage = (startDate) => {
    if (!startDate) {
      return {
        canModify: false,
        daysUntilSession: null,
        modifyBlockedReason: 'Сеанс не назначен',
      };
    }

    const daysUntil =
      (new Date(startDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000);

    if (daysUntil <= 0) {
      return {
        canModify: false,
        daysUntilSession: 0,
        modifyBlockedReason: 'Сеанс уже начался или прошёл',
      };
    }

    if (daysUntil < MIN_DAYS_BEFORE_MODIFY) {
      return {
        canModify: false,
        daysUntilSession: Math.ceil(daysUntil),
        modifyBlockedReason: `Отмена и смена даты доступны не позднее чем за ${MIN_DAYS_BEFORE_MODIFY} дней до начала сеанса`,
      };
    }

    return {
      canModify: true,
      daysUntilSession: Math.ceil(daysUntil),
      modifyBlockedReason: null,
    };
  };

  const getEnrollmentInfo = (masterClass) => {
    if (masterClass.enrolledSchedule?.startDate) {
      return {
        schedule: masterClass.enrolledSchedule,
        manage:
          masterClass.enrollmentManage ||
          buildEnrollmentManage(masterClass.enrolledSchedule.startDate),
        hasActivePayment: Boolean(masterClass.enrolledPayment?.id),
      };
    }

    const payment = myPayments.find(
      (p) =>
        getPaymentMasterClassId(p) === masterClass.id &&
        ['pending', 'paid'].includes(p.status)
    );

    if (payment?.schedule?.startDate) {
      return {
        schedule: payment.schedule,
        manage: buildEnrollmentManage(payment.schedule.startDate),
        hasActivePayment: true,
      };
    }

    return {
      schedule: null,
      manage: null,
      hasActivePayment: false,
    };
  };

  const getEnrolledScheduleId = (classId) => {
    const payment = myPayments.find(
      (p) =>
        getPaymentMasterClassId(p) === classId &&
        ['pending', 'paid'].includes(p.status)
    );
    return payment?.scheduleId || payment?.schedule?.id || null;
  };

  const isEnrolled = (classId) =>
    myClasses.some((mc) => mc.id === classId) || Boolean(getEnrolledScheduleId(classId));

  const getBookableSchedules = (schedules, classId) => {
    const enrolledScheduleId = getEnrolledScheduleId(classId);
    const now = new Date();

    return (schedules || []).filter((schedule) => {
      if (enrolledScheduleId && schedule.id === enrolledScheduleId) return false;
      if (new Date(schedule.startDate) <= now) return false;
      if (schedule.capacityLeft != null && schedule.capacityLeft <= 0) return false;
      if (schedule.canEnroll === false) return false;
      return true;
    });
  };

  const formatScheduleOption = (schedule) => {
    const dateLabel = new Date(schedule.startDate).toLocaleString('ru-RU');
    const place = schedule.location?.name ? ` — ${schedule.location.name}` : '';
    const capacity =
      schedule.capacityLeft != null ? ` (свободно: ${schedule.capacityLeft})` : '';
    return `${dateLabel}${place}${capacity}`;
  };

  const user = authUtils.getUser();
  const participantId = user?.id;

  const hasReviewForSelected =
    selectedMasterClass?.reviews?.some((r) => r.participantId === participantId) ?? false;

  const fmtEnrolledLabel = (classId) => {
    const payment = myPayments.find(
      (p) =>
        getPaymentMasterClassId(p) === classId &&
        ['pending', 'paid'].includes(p.status)
    );
    if (payment?.schedule?.startDate) {
      return `Записаны: ${formatSessionDateTime(payment.schedule.startDate)}`;
    }
    return 'Вы записаны';
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
              <div className="filter-group instructor-filter-group">
                <label>Инструкторы:</label>
                <div className="instructor-filter-list">
                  {instructors.map((ins) => (
                    <label
                      key={ins.id}
                      className={
                        inputFilters.instructorIds.includes(ins.id)
                          ? 'instructor-filter-item instructor-filter-item--selected'
                          : 'instructor-filter-item'
                      }
                    >
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
                  {displayClasses.map((masterClass) => {
                    const enrollment =
                      activeTab === 'my' ? getEnrollmentInfo(masterClass) : null;
                    const canManageEnrollment =
                      activeTab === 'my' &&
                      Boolean(enrollment?.schedule) &&
                      enrollment?.manage?.canModify === true;
                    const manageBlocked =
                      activeTab === 'my' &&
                      Boolean(enrollment?.schedule) &&
                      enrollment?.manage?.canModify === false;

                    return (
                    <div
                      key={masterClass.id}
                      className={
                        activeTab === 'my'
                          ? 'masterclass-card masterclass-card--mine'
                          : 'masterclass-card'
                      }
                    >
                      {masterClass.photo && activeTab === 'all' && (
                        <div className="participant-mc-card-photo">
                          <img src={masterClass.photo} alt="" />
                        </div>
                      )}
                      <div className="masterclass-info">
                        <h3>{masterClass.name}</h3>
                        <p className="masterclass-description">{masterClass.description}</p>

                        {activeTab === 'my' && (
                          <div className="participant-enrollment-banner">
                            {enrollment?.schedule ? (
                              <>
                                <span className="participant-enrollment-badge">
                                  Вы записаны на сеанс
                                </span>
                                <p className="participant-enrollment-date">
                                  {formatSessionDateTime(enrollment.schedule.startDate)}
                                </p>
                                {enrollment.schedule.endDate && (
                                  <p className="participant-enrollment-time">
                                    до {formatSessionDateTime(enrollment.schedule.endDate)}
                                  </p>
                                )}
                                {enrollment.schedule.location?.name && (
                                  <p className="participant-enrollment-place">
                                    {enrollment.schedule.location.name}
                                    {enrollment.schedule.location.address
                                      ? ` · ${enrollment.schedule.location.address}`
                                      : ''}
                                  </p>
                                )}
                                {enrollment.manage?.daysUntilSession != null && (
                                  <p className="participant-enrollment-countdown">
                                    До начала: {enrollment.manage.daysUntilSession} дн.
                                  </p>
                                )}
                                {manageBlocked && enrollment.manage?.modifyBlockedReason && (
                                  <p className="participant-enrollment-note">
                                    {enrollment.manage.modifyBlockedReason}
                                  </p>
                                )}
                                {!manageBlocked && (
                                  <p className="participant-enrollment-note participant-enrollment-note--ok">
                                    Отмена и смена даты доступны не позднее чем за{' '}
                                    {MIN_DAYS_BEFORE_MODIFY} дней до сеанса.
                                  </p>
                                )}
                                <div className="participant-enrollment-actions">
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    disabled={loading || !canManageEnrollment}
                                    onClick={() => openRescheduleDialog(masterClass)}
                                  >
                                    Изменить дату
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-cancel-enrollment"
                                    disabled={loading || !canManageEnrollment}
                                    onClick={() => handleCancelEnrollment(masterClass)}
                                  >
                                    Отписаться
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="participant-enrollment-badge participant-enrollment-badge--warn">
                                  Дата сеанса не назначена
                                </span>
                                <p className="participant-enrollment-note">
                                  Вы записаны на мастер-класс, но сеанс ещё не выбран.
                                  Выберите дату в расписании.
                                </p>
                                <div className="participant-enrollment-actions">
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    disabled={loading}
                                    onClick={() => openEnrollDialog(masterClass)}
                                  >
                                    Выбрать дату сеанса
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-cancel-enrollment"
                                    disabled={loading}
                                    onClick={() => handleCancelEnrollment(masterClass)}
                                  >
                                    Отписаться
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

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
                              <strong>Ближайший сеанс:</strong>{' '}
                              {formatSessionDateTime(masterClass.schedules?.[0]?.startDate)}
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
                          {activeTab === 'my' && (
                            <button
                              type="button"
                              className="btn-view"
                              onClick={() => handleView(masterClass)}
                            >
                              Подробнее
                            </button>
                          )}
                          {activeTab === 'all' && (
                            <>
                              <button
                                type="button"
                                className="btn-view"
                                onClick={() => handleView(masterClass)}
                              >
                                Просмотр
                              </button>
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
                                {isEnrolled(masterClass.id)
                                  ? fmtEnrolledLabel(masterClass.id)
                                  : 'Выбрать дату и записаться'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
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
                    onSuccess={async () => {
                      await refreshSelectedDetail(selectedMasterClass.id);
                      await loadMasterClasses();
                      await loadMyClasses();
                    }}
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
              {...enrollOverlayDismiss}
            >
              <div
                className="enroll-modal-box"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="enroll-modal-title">Выберите дату сеанса</h2>
                <p>{enrollDialog.masterClass.name}</p>
                <p className="enroll-modal-hint">
                  После записи будет выставлен счёт на выбранный сеанс.
                </p>
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
                      {formatScheduleOption(s)}
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

          {rescheduleDialog && (
            <div
              className="enroll-modal-overlay"
              role="presentation"
              {...rescheduleOverlayDismiss}
            >
              <div
                className="enroll-modal-box"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="enroll-modal-title">Изменить дату сеанса</h2>
                <p>{rescheduleDialog.masterClass.name}</p>
                {rescheduleDialog.currentSchedule?.startDate && (
                  <p className="enroll-modal-hint">
                    Текущий сеанс:{' '}
                    {formatSessionDateTime(rescheduleDialog.currentSchedule.startDate)}
                  </p>
                )}
                <label className="enroll-modal-label" htmlFor="reschedule-schedule">
                  Новая дата и место
                </label>
                <select
                  id="reschedule-schedule"
                  className="enroll-modal-select"
                  value={rescheduleDialog.selectedScheduleId}
                  onChange={(e) =>
                    setRescheduleDialog((prev) =>
                      prev
                        ? {
                            ...prev,
                            selectedScheduleId: parseInt(e.target.value, 10),
                          }
                        : prev
                    )
                  }
                >
                  {rescheduleDialog.schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatScheduleOption(s)}
                    </option>
                  ))}
                </select>
                <div className="enroll-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setRescheduleDialog(null)}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleConfirmReschedule}
                    disabled={loading}
                  >
                    {loading ? '…' : 'Сохранить новую дату'}
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
