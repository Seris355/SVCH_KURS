const STORAGE_KEY = 'dismissedSiteReminders';

export function readDismissedReminderIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDismissedReminderIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
