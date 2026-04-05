import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setItemsPerPage } from '../../../store/slices/userSettingsSlice';
import { participantService } from '../../../services/participantService';
import ParticipantForm from '../../../components/ParticipantForm/ParticipantForm';
import ParticipantList from '../../../components/ParticipantList/ParticipantList';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import './Participants.css';

const Participants = () => {
  const dispatch = useAppDispatch();
  
  // ⬇️ НАСТРОЙКИ ИЗ REDUX
  const { itemsPerPage } = useAppSelector(
    (state) => state.userSettings
  );

  // ⬇️ ДАННЫЕ ИЗ БД - В ЛОКАЛЬНОМ СОСТОЯНИИ
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [changingPasswordParticipant, setChangingPasswordParticipant] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // ⬇️ ПАГИНАЦИЯ - ЛОКАЛЬНОЕ СОСТОЯНИЕ
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  
  // ⬇️ ФИЛЬТРЫ - ЛОКАЛЬНОЕ СОСТОЯНИЕ
  const [filters, setFilters] = useState({
    search: '',
    email: '',
    phone: '',
  });
  
  const [inputFilters, setInputFilters] = useState(filters);

  // ⬇️ ЗАГРУЗКА ДАННЫХ НАПРЯМУЮ ЧЕРЕЗ СЕРВИС
  const loadParticipants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
      };
      
      // ⬇️ ЗАПРОС НАПРЯМУЮ, БЕЗ REDUX
      const response = await participantService.getAll(params);
      
      setParticipants(response.data || []);
      setPagination({
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке участников');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage]);

  // Загружаем при изменении страницы, фильтров или itemsPerPage
  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleCreate = () => {
    setEditingParticipant(null);
    setShowForm(true);
  };

  const handleEdit = (participant) => {
    setEditingParticipant(participant);
    setShowForm(true);
  };

  // ⬇️ УДАЛЕНИЕ - ЗАПРОС НАПРЯМУЮ
  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого участника?')) {
      try {
        setLoading(true);
        await participantService.delete(id); // ⬅️ НАПРЯМУЮ
        await loadParticipants(); // Перезагружаем список
      } catch (err) {
        alert(err.message || 'Ошибка при удалении участника');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingParticipant(null);
  };

  const handleChangePassword = (participant) => {
    setChangingPasswordParticipant(participant);
    setNewPassword('');
    setShowPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    setChangingPasswordParticipant(null);
    setNewPassword('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      setLoading(true);
      await participantService.changePassword(changingPasswordParticipant.id, newPassword);
      alert('Пароль успешно изменён');
      handleClosePasswordDialog();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка при изменении пароля');
    } finally {
      setLoading(false);
    }
  };

  // ⬇️ СОЗДАНИЕ/ОБНОВЛЕНИЕ - ЗАПРОС НАПРЯМУЮ
  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      if (editingParticipant) {
        await participantService.update(editingParticipant.id, data); // ⬅️ НАПРЯМУЮ
      } else {
        await participantService.create(data); // ⬅️ НАПРЯМУЮ
      }
      handleCloseForm();
      await loadParticipants(); // Перезагружаем список
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setInputFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setFilters(inputFilters);
    setCurrentPage(1); // Сбрасываем на первую страницу
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      search: '',
      email: '',
      phone: '',
    };
    setInputFilters(defaultFilters);
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // ⬇️ ИЗМЕНЕНИЕ НАСТРОЕК (сохраняем в Redux)
  const handleItemsPerPageChange = (value) => {
    const numValue = parseInt(value, 10);
    if (numValue > 0 && numValue <= 100) {
      dispatch(setItemsPerPage(numValue));
      setCurrentPage(1); // Сбрасываем на первую страницу
    }
  };


  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="participants-page">
          <div className="participants-header">
            <h1>Управление участниками</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          <ParticipantList
            participants={participants}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onChangePassword={handleChangePassword}
            filters={inputFilters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onResetFilters={handleResetFilters}
            pagination={{
              ...pagination,
              page: currentPage,
              limit: itemsPerPage,
            }}
            onPageChange={handlePageChange}
            onAdd={handleCreate}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />

          {showForm && (
            <ParticipantForm
              participant={editingParticipant}
              onSubmit={handleFormSubmit}
              onClose={handleCloseForm}
            />
          )}

          {showPasswordDialog && (
            <div className="modal-overlay" onClick={handleClosePasswordDialog}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Смена пароля</h2>
                  <button className="modal-close" onClick={handleClosePasswordDialog}>×</button>
                </div>
                <form onSubmit={handlePasswordSubmit} className="password-form">
                  <p>Участник: <strong>{changingPasswordParticipant?.fullName}</strong></p>
                  <p>Email: <strong>{changingPasswordParticipant?.email}</strong></p>

                  <div className="form-group">
                    <label htmlFor="newPassword">
                      Новый пароль <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Введите новый пароль"
                      minLength="6"
                      required
                    />
                    <small className="form-hint">Пароль должен содержать минимум 6 символов</small>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={handleClosePasswordDialog} className="btn-secondary">
                      Отмена
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Сохранение...' : 'Изменить пароль'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Participants;
