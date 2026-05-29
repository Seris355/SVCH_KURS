import React from 'react';
import { useAppDispatch } from '../../store/hooks';
import { resetAllUserSettings } from '../../store/slices/userSettingsSlice';

const ResetUserSettingsButton = ({ className = 'hn_link', onAfterReset }) => {
  const dispatch = useAppDispatch();

  const handleReset = () => {
    if (
      !window.confirm(
        'Сбросить все сохранённые фильтры, сортировку и настройки списков?'
      )
    ) {
      return;
    }
    dispatch(resetAllUserSettings());
    if (onAfterReset) onAfterReset();
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleReset}
      title="Сбросить фильтры, сортировку и настройки списков"
    >
      Сбросить настройки
    </button>
  );
};

export default ResetUserSettingsButton;
