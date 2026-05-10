import React, { useEffect, useState, useCallback } from 'react';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import { reminderService } from '../../../services/reminderService';
import '../ContactRequests/ContactRequests.css';

const AdminReminders = () => {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await reminderService.getStatus();
      setStatus(res?.data ?? null);
    } catch (err) {
      setStatus(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось загрузить статус'
      );
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await reminderService.runSessionReminders();
      setResult(res);
      await loadStatus();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Запуск задачи не удался'
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="contact-requests-page">
          <div className="contact-requests-header">
            <h1>E-mail напоминания</h1>
          </div>

          <p className="contact-requests-muted">
            За ~24 часа до начала сеанса участникам со счетами «ожидает» или «оплачено»
            уходит одно письмо на каждый сеанс. Дубликаты блокируются записью в таблице{' '}
            <code>schedule_reminder_logs</code>.
          </p>

          {error && <div className="contact-requests-error">{error}</div>}

          <div className="contact-requests-filters" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {loadingStatus ? (
              <p className="contact-requests-muted">Проверка конфигурации…</p>
            ) : (
              <ul className="contact-requests-muted" style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>
                  SMTP на сервере:{' '}
                  <strong>{status?.smtpConfigured ? 'задан' : 'не задан'}</strong>
                </li>
                <li>
                  Cron по env <code>ENABLE_SESSION_REMINDERS</code>:{' '}
                  <strong>
                    {status?.remindersEnabledEnv ? 'включён' : 'выключен'}
                  </strong>
                </li>
              </ul>
            )}
            <button
              type="button"
              className="contact-requests-input"
              style={{ cursor: 'pointer', maxWidth: 320, marginTop: 12 }}
              disabled={running}
              onClick={handleRun}
            >
              {running ? 'Выполняется…' : 'Запустить проверку напоминаний сейчас'}
            </button>
          </div>

          {result && (
            <section style={{ marginTop: 24 }}>
              <div className="contact-requests-card-head">
                <strong>Результат последнего запуска</strong>
              </div>
              <p className="contact-requests-muted">{result.message}</p>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  padding: 12,
                  borderRadius: 8,
                  overflow: 'auto',
                  fontSize: 13,
                }}
              >
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReminders;
