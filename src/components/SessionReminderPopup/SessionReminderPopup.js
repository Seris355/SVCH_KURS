import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSessionReminders, REMINDER_DAYS_AHEAD } from '../../hooks/useSessionReminders';
import './SessionReminderPopup.css';

function formatDate(value) {
  return new Date(value).toLocaleString('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

const SessionReminderPopup = () => {
  const location = useLocation();
  const { toastItems, dismissToast } = useSessionReminders({
    enabled: true,
    reloadKey: location.pathname,
  });

  if (toastItems.length === 0) {
    return null;
  }

  return (
    <div className="session-reminder-toast-wrap" aria-live="polite">
      <div className="session-reminder-toast" role="status">
        <div className="session-reminder-toast-header">
          <h2>Напоминание о занятиях</h2>
          <button
            type="button"
            className="session-reminder-close"
            onClick={dismissToast}
            aria-label="Закрыть напоминание"
          >
            ×
          </button>
        </div>
        <p className="session-reminder-intro">
          В ближайшие {REMINDER_DAYS_AHEAD} дня у вас запланированы следующие мероприятия:
        </p>

        {toastItems.map((item) => (
          <div key={item.scheduleId} className="session-reminder-item">
            <strong>{item.masterClassName}</strong>
            <p>Дата: {formatDate(item.startDate)}</p>
            {item.location && <p>Место: {item.location}</p>}
            <p>{item.message}</p>
          </div>
        ))}

        <div className="session-reminder-actions">
          <button type="button" onClick={dismissToast}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionReminderPopup;
