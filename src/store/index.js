import { configureStore } from '@reduxjs/toolkit';
import userSettingsSlice from './slices/userSettingsSlice';
import { clearUserSettings, saveUserSettings } from '../utils/userSettingsStorage';

export const store = configureStore({
  reducer: {
    userSettings: userSettingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
    }).concat((storeApi) => (next) => (action) => {
      const result = next(action);
      if (action.type === 'userSettings/resetAllUserSettings') {
        clearUserSettings();
        return result;
      }
      if (typeof action.type === 'string' && action.type.startsWith('userSettings/')) {
        saveUserSettings(storeApi.getState().userSettings);
      }
      return result;
    }),
});
