import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setItemsPerPage } from '../../store/slices/userSettingsSlice';
import { masterClassService } from '../../services/masterClassService';
import MasterClassDetail from '../../components/MasterClassDetail/MasterClassDetail';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './ParticipantClasses.css';

const ParticipantClasses = () => {
  const dispatch = useAppDispatch();
  const { itemsPerPage } = useAppSelector(
    (state) => state.userSettings
  );

  const [masterClasses, setMasterClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMasterClass, setSelectedMasterClass] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  
  const [filters, setFilters] = useState({
    search: '',
    instructorId: '',
    minPrice: '',
    maxPrice: '',
  });
  
  const [inputFilters, setInputFilters] = useState(filters);

  const loadMasterClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      };
      
      const response = await masterClassService.getAll(params);
      setMasterClasses(response.data || []);
      setPagination({
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке мастер-классов');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage]);

  const loadMyClasses = useCallback(async () => {
    try {
      const response = await masterClassService.getMyClasses();
      setMyClasses(response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки моих мастер-классов:', err);
    }
  }, []);

  useEffect(() => {
    loadMasterClasses();
    loadMyClasses();
  }, [loadMasterClasses, loadMyClasses]);


  const handleEnroll = async (masterClass) => {
    try {
      setLoading(true);
      await masterClassService.enroll(masterClass.id);
      await loadMasterClasses();
      await loadMyClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка при записи на мастер-класс');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (masterClass) => {
    try {
      setLoading(true);
      const response = await masterClassService.getById(masterClass.id);
      setSelectedMasterClass(response.data);
    } catch (err) {
      alert('Ошибка при загрузке детальной информации');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedMasterClass(null);
  };

  const handleFilterChange = (field, value) => {
    setInputFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setFilters(inputFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      search: '',
      instructorId: '',
      minPrice: '',
      maxPrice: '',
    };
    setInputFilters(defaultFilters);
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value) => {
    const numValue = parseInt(value, 10);
    if (numValue > 0 && numValue <= 100) {
      dispatch(setItemsPerPage(numValue));
      setCurrentPage(1);
    }
  };


  const isEnrolled = (classId) => {
    return myClasses.some(mc => mc.id === classId);
  };

  const displayClasses = activeTab === 'all' ? masterClasses : myClasses;

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="masterclasses-page">
          <div className="masterclasses-header">
            <h1>Мастер-классы</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="tabs">
            <button
              className={activeTab === 'all' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('all')}
            >
              Все мастер-классы
            </button>
            <button
              className={activeTab === 'my' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('my')}
            >
              Мои мастер-классы ({myClasses.length})
            </button>
          </div>

          {activeTab === 'all' && (
            <>
              <div className="filters">
                <div className="filter-group">
                  <label>Поиск:</label>
                  <input
                    type="text"
                    value={inputFilters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    placeholder="Поиск по названию или описанию..."
                  />
                </div>
                <div className="filter-group">
                  <label>ID Инструктора:</label>
                  <input
                    type="number"
                    value={inputFilters.instructorId}
                    onChange={(e) => handleFilterChange('instructorId', e.target.value)}
                    placeholder="Фильтр по инструктору..."
                  />
                </div>
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Цена от:</label>
                    <input
                      type="number"
                      value={inputFilters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="0"
                      step="0.01"
                    />
                  </div>
                  <div className="filter-group">
                    <label>Цена до:</label>
                    <input
                      type="number"
                      value={inputFilters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="10000"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label>Элементов на странице:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    style={{ width: '60px', padding: '5px' }}
                  />
                </div>
                <div className="filter-group filter-buttons">
                  <button className="btn-primary" onClick={handleSearch}>
                    Найти
                  </button>
                  <button className="btn-secondary" onClick={handleResetFilters}>
                    Сбросить
                  </button>
                </div>
              </div>
            </>
          )}

          {loading && <div className="loading">Загрузка...</div>}

          {!loading && displayClasses.length === 0 ? (
            <div className="empty-state">Мастер-классы не найдены</div>
          ) : (
            <div className="masterclass-grid">
              {displayClasses.map((masterClass) => (
                <div key={masterClass.id} className="masterclass-card">
                  <div className="masterclass-info">
                    <h3>{masterClass.name}</h3>
                    <p className="masterclass-description">
                      {masterClass.description}
                    </p>
                    <div className="masterclass-details">
                      <div className="detail-item">
                        <strong>Цена:</strong> {parseFloat(masterClass.price).toFixed(2)} ₽
                      </div>
                      {masterClass.instructor && (
                        <div className="detail-item">
                          <strong>Инструктор:</strong> {masterClass.instructor.fullName}
                        </div>
                      )}
                      <div className="detail-item">
                        <strong>Участников:</strong> {masterClass.participants?.length || 0}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-view"
                        onClick={() => handleView(masterClass)}
                      >
                        Просмотр
                      </button>
                      {activeTab === 'all' && (
                        <button
                          className={isEnrolled(masterClass.id) ? 'btn-enrolled' : 'btn-enroll'}
                          onClick={() => handleEnroll(masterClass)}
                          disabled={isEnrolled(masterClass.id)}
                        >
                          {isEnrolled(masterClass.id) ? 'Вы записаны' : 'Записаться'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'all' && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Назад
              </button>
              <span>
                Страница {currentPage} из {pagination.totalPages}
              </span>
              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Вперед
              </button>
            </div>
          )}

          {selectedMasterClass && (
            <MasterClassDetail
              masterClass={selectedMasterClass}
              onClose={handleCloseDetail}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ParticipantClasses;
