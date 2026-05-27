import { createSlice } from '@reduxjs/toolkit';
import { loadUserSettings } from '../../utils/userSettingsStorage';

export const participantClassesFilterDefaults = {
  search: '',
  instructorIds: [],
  minPrice: '',
  maxPrice: '',
  sortBy: 'price',
  sortOrder: 'ASC',
};

export const adminInstructorsFilterDefaults = {
  search: '',
  specialization: '',
  sortBy: 'id',
  sortOrder: 'ASC',
};

export const adminMasterClassesFilterDefaults = {
  search: '',
  instructorId: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'id',
  sortOrder: 'ASC',
};

export const adminParticipantsFilterDefaults = {
  search: '',
  email: '',
  phone: '',
  sortBy: 'id',
  sortOrder: 'ASC',
};

export const adminPaymentsFilterDefaults = {
  search: '',
  status: '',
};

export const defaultUserSettingsState = {
  itemsPerPage: 10,
  lists: {
    participantClasses: {
      filters: { ...participantClassesFilterDefaults },
      inputFilters: { ...participantClassesFilterDefaults },
      activeTab: 'all',
      catalogLimit: 10,
      currentPage: 1,
    },
    adminInstructors: {
      filters: { ...adminInstructorsFilterDefaults },
      inputFilters: { ...adminInstructorsFilterDefaults },
      currentPage: 1,
    },
    adminMasterClasses: {
      filters: { ...adminMasterClassesFilterDefaults },
      inputFilters: { ...adminMasterClassesFilterDefaults },
      currentPage: 1,
    },
    adminParticipants: {
      filters: { ...adminParticipantsFilterDefaults },
      inputFilters: { ...adminParticipantsFilterDefaults },
      currentPage: 1,
    },
    adminPayments: {
      filters: { ...adminPaymentsFilterDefaults },
      inputFilters: { ...adminPaymentsFilterDefaults },
      currentPage: 1,
    },
  },
};

const mergeListSettings = (defaults, saved) => {
  if (!saved || typeof saved !== 'object') {
    return defaults;
  }
  return {
    ...defaults,
    ...saved,
    filters: { ...defaults.filters, ...(saved.filters || {}) },
    inputFilters: { ...defaults.inputFilters, ...(saved.inputFilters || {}) },
  };
};

const buildInitialState = () => {
  const loaded = loadUserSettings();
  if (!loaded) {
    return defaultUserSettingsState;
  }

  return {
    itemsPerPage:
      Number.isFinite(loaded.itemsPerPage) && loaded.itemsPerPage > 0
        ? loaded.itemsPerPage
        : defaultUserSettingsState.itemsPerPage,
    lists: {
      participantClasses: mergeListSettings(
        defaultUserSettingsState.lists.participantClasses,
        loaded.lists?.participantClasses
      ),
      adminInstructors: mergeListSettings(
        defaultUserSettingsState.lists.adminInstructors,
        loaded.lists?.adminInstructors
      ),
      adminMasterClasses: mergeListSettings(
        defaultUserSettingsState.lists.adminMasterClasses,
        loaded.lists?.adminMasterClasses
      ),
      adminParticipants: mergeListSettings(
        defaultUserSettingsState.lists.adminParticipants,
        loaded.lists?.adminParticipants
      ),
      adminPayments: mergeListSettings(
        defaultUserSettingsState.lists.adminPayments,
        loaded.lists?.adminPayments
      ),
    },
  };
};

const userSettingsSlice = createSlice({
  name: 'userSettings',
  initialState: buildInitialState(),
  reducers: {
    setItemsPerPage: (state, action) => {
      const value = parseInt(action.payload, 10);
      if (value > 0 && value <= 100) {
        state.itemsPerPage = value;
      }
    },
    updateListSettings: (state, action) => {
      const { key, patch } = action.payload;
      const current = state.lists[key];
      if (!current) return;

      const next = { ...current, ...patch };
      if (patch.filters) {
        next.filters = { ...current.filters, ...patch.filters };
      }
      if (patch.inputFilters) {
        next.inputFilters = { ...current.inputFilters, ...patch.inputFilters };
      }
      state.lists[key] = next;
    },
    resetListSettings: (state, action) => {
      const { key } = action.payload;
      if (defaultUserSettingsState.lists[key]) {
        state.lists[key] = {
          ...defaultUserSettingsState.lists[key],
          filters: { ...defaultUserSettingsState.lists[key].filters },
          inputFilters: { ...defaultUserSettingsState.lists[key].inputFilters },
        };
      }
    },
    resetAllUserSettings: () => ({
      ...defaultUserSettingsState,
      lists: {
        participantClasses: {
          ...defaultUserSettingsState.lists.participantClasses,
          filters: { ...participantClassesFilterDefaults },
          inputFilters: { ...participantClassesFilterDefaults },
        },
        adminInstructors: {
          ...defaultUserSettingsState.lists.adminInstructors,
          filters: { ...adminInstructorsFilterDefaults },
          inputFilters: { ...adminInstructorsFilterDefaults },
        },
        adminMasterClasses: {
          ...defaultUserSettingsState.lists.adminMasterClasses,
          filters: { ...adminMasterClassesFilterDefaults },
          inputFilters: { ...adminMasterClassesFilterDefaults },
        },
        adminParticipants: {
          ...defaultUserSettingsState.lists.adminParticipants,
          filters: { ...adminParticipantsFilterDefaults },
          inputFilters: { ...adminParticipantsFilterDefaults },
        },
        adminPayments: {
          ...defaultUserSettingsState.lists.adminPayments,
          filters: { ...adminPaymentsFilterDefaults },
          inputFilters: { ...adminPaymentsFilterDefaults },
        },
      },
    }),
  },
});

export const {
  setItemsPerPage,
  updateListSettings,
  resetListSettings,
  resetAllUserSettings,
} = userSettingsSlice.actions;

export default userSettingsSlice.reducer;
