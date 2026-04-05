import { createSlice } from '@reduxjs/toolkit';

const userSettingsSlice = createSlice({
  name: 'userSettings',
  initialState: {
    itemsPerPage: 10,
  },
  reducers: {
    setItemsPerPage: (state, action) => {
      const value = parseInt(action.payload, 10);
      if (value > 0 && value <= 100) {
        state.itemsPerPage = value;
      }
    },
  },
});

export const {
  setItemsPerPage,
} = userSettingsSlice.actions;

export default userSettingsSlice.reducer;
