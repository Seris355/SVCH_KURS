import React from 'react';
import './InstructorList.css';

const InstructorList = ({
  instructors,
  loading,
  onEdit,
  onDelete,
  filters,
  onFilterChange,
  onSearch,
  onResetFilters,
  pagination,
  onPageChange,
  onAdd,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="instructor-list-container">
      {onAdd && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onAdd}>
            Добавить инструктора
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
            placeholder="Поиск по ФИО или специализации..."
          />
        </div>
        <div className="filter-group">
          <label>Специализация:</label>
          <input
            type="text"
            value={filters.specialization}
            onChange={(e) => onFilterChange('specialization', e.target.value)}
            placeholder="Фильтр по специализации..."
          />
        </div>
        <div className="filter-group">
          <label>Сортировка:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
          >
            <option value="id">ID</option>
            <option value="fullName">ФИО</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFilterChange('sortOrder', e.target.value)}
          >
            <option value="ASC">По возрастанию</option>
            <option value="DESC">По убыванию</option>
          </select>
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

      {instructors.length === 0 ? (
        <div className="empty-state">Инструкторы не найдены</div>
      ) : (
        <table className="instructor-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>Специализация</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((instructor) => (
              <tr key={instructor.id}>
                <td>{instructor.id}</td>
                <td>{instructor.fullName}</td>
                <td>{instructor.specialization}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => onEdit(instructor)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(instructor.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default InstructorList;
