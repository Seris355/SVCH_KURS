import React from 'react';
import { useAppDispatch } from '../../store/hooks';
import { resetAllUserSettings } from '../../store/slices/userSettingsSlice';
import './ResetUserSettingsButton.css';

const ResetUserSettingsButton = ({ className = '' }) => {
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
  };

  return (
    <button
      type="button"
      className={`reset-user-settings-btn ${className}`.trim()}
      onClick={handleReset}
      title="Очистить localStorage и сбросить фильтры"
    >
      Сбросить настройки
    </button>
  );
};

export default ResetUserSettingsButton;
