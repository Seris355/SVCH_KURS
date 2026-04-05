import { configureStore } from '@reduxjs/toolkit';
import userSettingsSlice from './slices/userSettingsSlice';

export const store = configureStore({
  reducer: {
    userSettings: userSettingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
    }),
});