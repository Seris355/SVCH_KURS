import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import { reminderService } from '../../services/reminderService';
import './SessionReminderPopup.css';

const STORAGE_KEY = 'dismissedSiteReminders';

function readDismissedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDismissedIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function formatDate(value) {
  return new Date(value).toLocaleString('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

const SessionReminderPopup = () => {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(false);

  const loadReminders = useCallback(async () => {
    const user = authUtils.getUser();
    if (!authUtils.isLoggedIn() || user.role !== 'participant') {
      setItems([]);
      setVisible(false);
      return;
    }

    try {
      const response = await reminderService.getUpcoming();
      const dismissed = new Set(readDismissedIds());
      const upcoming = (response?.data || []).filter(
        (item) => !dismissed.has(item.scheduleId)
      );
      setItems(upcoming);
      setVisible(upcoming.length > 0);
    } catch {
      setItems([]);
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders, location.pathname]);

  const handleDismiss = () => {
    const dismissed = new Set(readDismissedIds());
    items.forEach((item) => dismissed.add(item.scheduleId));
    saveDismissedIds([...dismissed]);
    setVisible(false);
    setItems([]);
  };

  if (!visible || items.length === 0) {
    return null;
  }

  return (
    <div className="session-reminder-overlay" role="dialog" aria-modal="true">
      <div className="session-reminder-popup">
        <h2>Напоминание о занятиях</h2>
        <p className="session-reminder-intro">
          В ближайшие 3 дня у вас запланированы следующие мероприятия:
        </p>

        {items.map((item) => (
          <div key={item.scheduleId} className="session-reminder-item">
            <strong>{item.masterClassName}</strong>
            <p>Дата: {formatDate(item.startDate)}</p>
            {item.location && <p>Место: {item.location}</p>}
            <p>{item.message}</p>
          </div>
        ))}

        <div className="session-reminder-actions">
          <button type="button" onClick={handleDismiss}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionReminderPopup;
