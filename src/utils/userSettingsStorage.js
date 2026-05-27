const STORAGE_KEY = 'svch_user_settings';

export function loadUserSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserSettings(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
}

export function clearUserSettings() {
  localStorage.removeItem(STORAGE_KEY);
}

export { STORAGE_KEY };
