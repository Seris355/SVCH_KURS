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

const isoDateMinusDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const isoTodayLocal = () => new Date().toISOString().slice(0, 10);

const AdminReports = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [reportPayload, setReportPayload] = useState(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);

  const [financeDraftFrom, setFinanceDraftFrom] = useState(() =>
    isoDateMinusDays(30)
  );
  const [financeDraftTo, setFinanceDraftTo] = useState(() =>
    isoTodayLocal()
  );
  const [financeAppliedFrom, setFinanceAppliedFrom] = useState(() =>
    isoDateMinusDays(30)
  );
  const [financeAppliedTo, setFinanceAppliedTo] = useState(() =>
    isoTodayLocal()
  );
  const [financePage, setFinancePage] = useState(1);
  const [financePayload, setFinancePayload] = useState(null);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeError, setFinanceError] = useState(null);

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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingFinance(true);
      setFinanceError(null);
      try {
        const res = await reportService.paymentsPeriod({
          dateFrom: financeAppliedFrom,
          dateTo: financeAppliedTo,
          page: financePage,
          limit: 25,
        });
        if (!cancelled) {
          setFinancePayload(res?.data ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setFinancePayload(null);
          setFinanceError(
            err.response?.data?.message ||
              err.message ||
              'Не удалось загрузить финансовый отчёт'
          );
        }
      } finally {
        if (!cancelled) setLoadingFinance(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [financeAppliedFrom, financeAppliedTo, financePage]);

  const applyFinanceRange = () => {
    setFinanceAppliedFrom(financeDraftFrom);
    setFinanceAppliedTo(financeDraftTo);
    setFinancePage(1);
  };

  const sch = reportPayload?.schedule;

  const financePag = financePayload?.pagination;
  const financeTotalSum = (financePayload?.summaryByStatus ?? []).reduce(
    (acc, row) =>
      row.amountSum != null && !Number.isNaN(row.amountSum)
        ? acc + Number(row.amountSum)
        : acc,
    0
  );

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="contact-requests-page">
          <div className="contact-requests-header">
            <h1>Отчёты</h1>
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

          <section style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="contact-requests-header" style={{ paddingTop: 0 }}>
              <h2 style={{ margin: 0 }}>Отчёт по участникам сеанса</h2>
            </div>

          {!loadingReport && selectedId && reportPayload && sch ? (
            <>
              <div
                className="contact-requests-card-head"
                style={{ marginBottom: '8px' }}
              >
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
            </>
          ) : !selectedId ? (
            <p className="contact-requests-muted">Выберите сеанс, чтобы увидеть список.</p>
          ) : null}
          </section>

          <section style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="contact-requests-header" style={{ paddingTop: 0 }}>
              <h2 style={{ margin: 0 }}>Финансовый отчёт (счета за период)</h2>
            </div>

            {financeError && (
              <div className="contact-requests-error">{financeError}</div>
            )}

            <div className="contact-requests-filters">
              <label className="contact-requests-label">
                С даты
                <input
                  type="date"
                  className="contact-requests-input"
                  value={financeDraftFrom}
                  onChange={(e) => setFinanceDraftFrom(e.target.value)}
                />
              </label>
              <label className="contact-requests-label">
                По дату
                <input
                  type="date"
                  className="contact-requests-input"
                  value={financeDraftTo}
                  onChange={(e) => setFinanceDraftTo(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="contact-requests-input"
                style={{ cursor: 'pointer', alignSelf: 'flex-end', minHeight: '40px' }}
                onClick={applyFinanceRange}
              >
                Показать
              </button>
            </div>
            <p className="contact-requests-muted">
              Период на сервере: с начала первого дня по конец последнего (
              <strong>{financeAppliedFrom}</strong> — <strong>{financeAppliedTo}</strong>).
              {loadingFinance ? ' Обновление…' : ''}
            </p>

            {financePayload?.summaryByStatus?.length ? (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '8px 0' }}>
                  Сумма по всем счетам в разрезе:{' '}
                  <strong>{financeTotalSum.toFixed(2)}</strong>
                </p>
                <ul className="contact-requests-list">
                  {financePayload.summaryByStatus.map((row) => (
                    <li
                      key={row.status}
                      className="contact-requests-card"
                      style={{ marginBottom: '8px' }}
                    >
                      <div className="contact-requests-card-head">
                        <span>{paymentStatusRu(row.status)}</span>
                        <span className="contact-requests-badge contact-requests-badge--new">
                          шт.: {row.count}
                        </span>
                      </div>
                      <p>
                        На сумму:{' '}
                        <strong>
                          {row.amountSum != null ? row.amountSum.toFixed(2) : '—'}
                        </strong>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              !loadingFinance && financePayload ? (
                <p className="contact-requests-muted">Нет платежей в выбранном периоде.</p>
              ) : null
            )}

            {financePag && financePag.totalPages > 1 ? (
              <div className="contact-requests-filters" style={{ gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="contact-requests-input"
                  style={{ cursor: 'pointer' }}
                  disabled={financePage <= 1 || loadingFinance}
                  onClick={() => setFinancePage((p) => Math.max(1, p - 1))}
                >
                  Назад
                </button>
                <span className="contact-requests-muted">
                  Страница {financePage} из {financePag.totalPages} (записей:{' '}
                  {financePag.total})
                </span>
                <button
                  type="button"
                  className="contact-requests-input"
                  style={{ cursor: 'pointer' }}
                  disabled={financePage >= financePag.totalPages || loadingFinance}
                  onClick={() =>
                    setFinancePage((p) =>
                      financePag.totalPages ? Math.min(financePag.totalPages, p + 1) : p + 1
                    )
                  }
                >
                  Вперёд
                </button>
              </div>
            ) : null}

            {!loadingFinance &&
            financePayload?.rows?.length ? (
              <ul className="contact-requests-list" style={{ marginTop: '12px' }}>
                {financePayload.rows.map((pay) => (
                  <li key={pay.id} className="contact-requests-card">
                    <div className="contact-requests-card-head">
                      <span className="contact-requests-when">
                        {pay.participant?.fullName || 'Участник'}
                      </span>
                      <span className="contact-requests-badge contact-requests-badge--new">
                        {paymentStatusRu(pay.status)}
                      </span>
                    </div>
                    <p>
                      МК: {pay.schedule?.masterClass?.name || '—'} · сеанс:{' '}
                      {formatDt(pay.schedule?.startDate)}
                    </p>
                    <p>Сумма: {pay.amount != null ? String(pay.amount) : '—'}</p>
                    <p>Счёт: {pay.invoiceCode || '—'}</p>
                    <p className="contact-requests-muted">
                      Создан: {formatDt(pay.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              null
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReports;
