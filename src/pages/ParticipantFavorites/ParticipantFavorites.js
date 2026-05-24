import React, { useState, useEffect, useCallback } from 'react';
import { favoriteService } from '../../services/favoriteService';
import { masterClassService } from '../../services/masterClassService';
import MasterClassDetail from '../../components/MasterClassDetail/MasterClassDetail';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import '../ParticipantClasses/ParticipantClasses.css';

const ParticipantFavorites = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMasterClass, setSelectedMasterClass] = useState(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await favoriteService.getMy();
      setItems(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Ошибка при загрузке избранного'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemove = async (masterClassId) => {
    try {
      await favoriteService.remove(masterClassId);
      await loadFavorites();
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          err.message ||
          'Не удалось убрать из избранного'
      );
    }
  };

  const handleView = async (masterClass) => {
    try {
      setLoading(true);
      const response = await masterClassService.getById(masterClass.id);
      setSelectedMasterClass(response.data);
    } catch {
      window.alert('Ошибка при загрузке детальной информации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="masterclasses-page">
          <div className="masterclasses-header">
            <h1>Избранные мастер-классы</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading && items.length === 0 && (
            <div className="loading">Загрузка...</div>
          )}

          {!loading && items.length === 0 ? (
            <div className="empty-state">
              В избранном пока пусто. Добавляйте мастер-классы со страницы «Мои
              мастер-классы» → вкладка «Все мастер-классы».
            </div>
          ) : (
            <div className="masterclass-grid">
              {items.map((masterClass) => (
                <div key={masterClass.id} className="masterclass-card">
                  <div className="masterclass-info">
                    <h3>{masterClass.name}</h3>
                    <p className="masterclass-description">
                      {masterClass.description}
                    </p>
                    <div className="masterclass-details">
                      <div className="detail-item">
                        <strong>Цена:</strong>{' '}
                        {parseFloat(masterClass.price).toFixed(2)} Br
                      </div>
                      {masterClass.instructor && (
                        <div className="detail-item">
                          <strong>Инструктор:</strong>{' '}
                          {masterClass.instructor.fullName}
                        </div>
                      )}
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn-view"
                        onClick={() => handleView(masterClass)}
                      >
                        Просмотр
                      </button>
                      <button
                        type="button"
                        className="btn-favorite-active"
                        onClick={() => handleRemove(masterClass.id)}
                        disabled={loading}
                      >
                        Убрать из избранного
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedMasterClass && (
            <MasterClassDetail
              masterClass={selectedMasterClass}
              onClose={() => setSelectedMasterClass(null)}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ParticipantFavorites;
