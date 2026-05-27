import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  resetListSettings,
  updateListSettings,
} from '../store/slices/userSettingsSlice';

export function usePersistedListPage(listKey) {
  const dispatch = useAppDispatch();
  const listSettings = useAppSelector((state) => state.userSettings.lists[listKey]);

  const update = useCallback(
    (patch) => {
      dispatch(updateListSettings({ key: listKey, patch }));
    },
    [dispatch, listKey]
  );

  const reset = useCallback(() => {
    dispatch(resetListSettings({ key: listKey }));
  }, [dispatch, listKey]);

  return {
    ...listSettings,
    update,
    reset,
  };
}
