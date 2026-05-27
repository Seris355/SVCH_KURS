import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setItemsPerPage } from '../../../store/slices/userSettingsSlice';
import { usePersistedListPage } from '../../../hooks/usePersistedListPage';
import { instructorService } from '../../../services/instructorService';
import InstructorForm from '../../../components/InstructorForm/InstructorForm';
import InstructorList from '../../../components/InstructorList/InstructorList';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import './Instructors.css';

const Instructors = () => {
  const dispatch = useAppDispatch();
  const { itemsPerPage } = useAppSelector((state) => state.userSettings);
  const {
    filters,
    inputFilters,
    currentPage,
    update: updateListPage,
    reset: resetListPage,
  } = usePersistedListPage('adminInstructors');

  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  const loadInstructors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
      };

      const response = await instructorService.getAll(params);

      setInstructors(response.data || []);
      setPagination({
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке инструкторов');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage]);

  useEffect(() => {
    loadInstructors();
  }, [loadInstructors]);

  const handleCreate = () => {
    setEditingInstructor(null);
    setShowForm(true);
  };

  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого инструктора?')) {
      try {
        setLoading(true);
        await instructorService.delete(id);
        await loadInstructors();
      } catch (err) {
        alert(err.message || 'Ошибка при удалении инструктора');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInstructor(null);
  };

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      if (editingInstructor) {
        await instructorService.update(editingInstructor.id, data);
      } else {
        await instructorService.create(data);
      }
      handleCloseForm();
      await loadInstructors();
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    updateListPage({
      inputFilters: { ...inputFilters, [field]: value },
    });
  };

  const handleSearch = () => {
    updateListPage({
      filters: inputFilters,
      currentPage: 1,
    });
  };

  const handleResetFilters = () => {
    resetListPage();
  };

  const handlePageChange = (newPage) => {
    updateListPage({ currentPage: newPage });
  };

  const handleItemsPerPageChange = (value) => {
    const numValue = parseInt(value, 10);
    if (numValue > 0 && numValue <= 100) {
      dispatch(setItemsPerPage(numValue));
      updateListPage({ currentPage: 1 });
    }
  };

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="instructors-page">
          <div className="instructors-header">
            <h1>Управление инструкторами</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          <InstructorList
            instructors={instructors}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
            <InstructorForm
              instructor={editingInstructor}
              onSubmit={handleFormSubmit}
              onClose={handleCloseForm}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Instructors;
