import { useCallback, useEffect, useMemo, useState } from 'react';
import { authUtils } from '../utils/auth';
import { reminderService } from '../services/reminderService';
import {
  readDismissedReminderIds,
  saveDismissedReminderIds,
} from '../utils/sessionReminderStorage';

export const REMINDER_DAYS_AHEAD = 3;

export function useSessionReminders({ enabled = true, reloadKey } = {}) {
  const [allItems, setAllItems] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => new Set(readDismissedReminderIds()));

  const loadReminders = useCallback(async () => {
    const user = authUtils.getUser();
    if (!enabled || !authUtils.isLoggedIn() || user?.role !== 'participant') {
      setAllItems([]);
      return;
    }

    try {
      const response = await reminderService.getUpcoming();
      setAllItems(response?.data || []);
    } catch {
      setAllItems([]);
    }
  }, [enabled]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders, reloadKey]);

  const toastItems = useMemo(
    () => allItems.filter((item) => !dismissedIds.has(item.scheduleId)),
    [allItems, dismissedIds]
  );

  const dismissToast = useCallback(() => {
    if (toastItems.length === 0) return;

    const next = new Set(dismissedIds);
    toastItems.forEach((item) => next.add(item.scheduleId));
    saveDismissedReminderIds([...next]);
    setDismissedIds(next);
  }, [dismissedIds, toastItems]);

  return {
    allItems,
    toastItems,
    dismissToast,
    reloadReminders: loadReminders,
  };
}
