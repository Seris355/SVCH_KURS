import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { scheduleService } from '../../services/scheduleService';
import { reportService } from '../../services/reportService';
import '../ContactRequests/ContactRequests.css';

const formatDt = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
};

const scheduleLabel = (s) => {
  const name = s.masterClass?.name || `МК #${s.masterClassId}`;
  return `${name} · ${formatDt(s.startDate)}`;
};

const paymentStatusRu = (status) => {
  if (status === 'paid') return 'Оплачено';
  if (status === 'cancelled') return 'Отменён';
  return 'Ожидает оплаты';
};

const AdminReports = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [reportPayload, setReportPayload] = useState(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);

  const loadSchedules = useCallback(async () => {
    setLoadingLists(true);
    setError(null);
    try {
      const res = await scheduleService.getAll({
        limit: 300,
        page: 1,
        sortBy: 'startDate',
        sortOrder: 'ASC',
      });
      setSchedules(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось загрузить сеансы'
      );
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const loadReport = useCallback(async () => {
    if (!selectedId) {
      setReportPayload(null);
      return;
    }
    setLoadingReport(true);
    setError(null);
    try {
      const res = await reportService.scheduleParticipants(selectedId);
      setReportPayload(res.data || null);
    } catch (err) {
      setReportPayload(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось сформировать отчёт'
      );
    } finally {
      setLoadingReport(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      loadReport();
    } else {
      setReportPayload(null);
    }
  }, [selectedId, loadReport]);

  const sch = reportPayload?.schedule;

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="contact-requests-page">
          <div className="contact-requests-header">
            <h1>Отчёт по участникам сеанса</h1>
          </div>

          {error && <div className="contact-requests-error">{error}</div>}

          <div className="contact-requests-filters">
            <label className="contact-requests-label">
              Сеанс
              <select
                className="contact-requests-input"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loadingLists}
              >
                <option value="">— выберите —</option>
                {schedules.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {scheduleLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <p className="contact-requests-muted">
              После выбора отчёт обновится автоматически.
            </p>
          </div>

          {loadingReport && selectedId ? (
            <p className="contact-requests-muted">Формируется…</p>
          ) : null}

          {!loadingReport && selectedId && reportPayload && sch && (
            <section>
              <div className="contact-requests-card-head" style={{ marginBottom: '8px' }}>
                <strong>{sch.masterClass?.name}</strong>
              </div>
              <p className="contact-requests-muted">
                {formatDt(sch.startDate)} — {formatDt(sch.endDate)}
                {sch.location?.name ? ` · ${sch.location.name}` : ''}
              </p>
              <p style={{ margin: '12px 0' }}>
                В группе: <strong>{reportPayload.enrolledCount}</strong> из{' '}
                {sch.maxParticipants} (осталось мест:{' '}
                {reportPayload.capacityLeft})
              </p>

              {!reportPayload.rows?.length ? (
                <p className="contact-requests-muted">На сеансе никого.</p>
              ) : (
                <ul className="contact-requests-list">
                  {reportPayload.rows.map((row) => (
                    <li key={row.id} className="contact-requests-card">
                      <div className="contact-requests-card-head">
                        <span className="contact-requests-when">
                          {row.participant?.fullName || 'Участник'}
                        </span>
                        <span className="contact-requests-badge contact-requests-badge--new">
                          {paymentStatusRu(row.status)}
                        </span>
                      </div>
                      <p>E-mail: {row.participant?.email || '—'}</p>
                      <p>Сумма: {row.amount != null ? String(row.amount) : '—'}</p>
                      <p>Счёт: {row.invoiceCode || '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReports;
