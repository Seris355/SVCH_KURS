import React from 'react';
import './MasterClassList.css';

const MasterClassList = ({
  masterClasses,
  loading,
  onEdit,
  onDelete,
  onView,
  filters,
  onFilterChange,
  onSearch,
  onResetFilters,
  pagination,
  onPageChange,
  onAdd,
  itemsPerPage,
  onItemsPerPageChange,
  defaultSortField,
  onSortFieldChange,
  defaultSortDirection,
  onSortDirectionChange,
}) => {
  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="masterclass-list-container">
      {onAdd && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onAdd}>
            Добавить мастер-класс
          </button>
        </div>
      )}
      <div className="filters">
        <div className="filter-group">
          <label>Поиск:</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            onKeyPress={(e) => {                      
              if (e.key === 'Enter' && onSearch) {
                onSearch();
              }
            }}
            placeholder="Поиск по названию или описанию..."
          />
        </div>
        <div className="filter-group">
          <label>ID Инструктора:</label>
          <input
            type="number"
            value={filters.instructorId}
            onChange={(e) => onFilterChange('instructorId', e.target.value)}
            placeholder="Фильтр по инструктору..."
          />
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>Цена от:</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              placeholder="0"
              step="0.01"
            />
          </div>
          <div className="filter-group">
            <label>Цена до:</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              placeholder="10000"
              step="0.01"
            />
          </div>
        </div>
        <div className="filter-group filter-sort">
          <label>Сортировка:</label>
          <div className="sort-controls">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
            >
              <option value="id">ID</option>
              <option value="name">Название</option>
              <option value="price">Цена</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => onFilterChange('sortOrder', e.target.value)}
            >
              <option value="ASC">По возрастанию</option>
              <option value="DESC">По убыванию</option>
            </select>
          </div>
        </div>
        {onItemsPerPageChange && (
          <div className="filter-group">
            <label>Элементов на странице:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(e.target.value)}
              style={{ width: '60px', padding: '5px' }}
            />
          </div>
        )}
        <div className="filter-group filter-buttons">
          {onSearch && (
            <button
              className="btn-primary"
              onClick={onSearch}
            >
              Найти
            </button>
          )}
          {onResetFilters && (
            <button
              className="btn-secondary"
              onClick={onResetFilters}
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {masterClasses.length === 0 ? (
        <div className="empty-state">Мастер-классы не найдены</div>
      ) : (
        <div className="masterclass-grid">
          {masterClasses.map((masterClass) => (
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
                    onClick={() => onView(masterClass)}
                  >
                    Просмотр
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => onEdit(masterClass)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(masterClass.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Назад
          </button>
          <span>
            Страница {pagination.page} из {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
};

export default MasterClassList;

