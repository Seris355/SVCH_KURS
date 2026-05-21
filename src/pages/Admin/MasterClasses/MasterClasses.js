import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setItemsPerPage } from '../../../store/slices/userSettingsSlice';
import { masterClassService } from '../../../services/masterClassService';
import MasterClassForm from '../../../components/MasterClassForm/MasterClassForm';
import MasterClassList from '../../../components/MasterClassList/MasterClassList';
import MasterClassDetail from '../../../components/MasterClassDetail/MasterClassDetail';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import './MasterClasses.css';

const MasterClasses = () => {
  const dispatch = useAppDispatch();
  const { itemsPerPage } = useAppSelector((state) => state.userSettings);

  const [masterClasses, setMasterClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMasterClass, setEditingMasterClass] = useState(null);
  const [selectedMasterClass, setSelectedMasterClass] = useState(null);

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
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
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

  useEffect(() => {
    loadMasterClasses();
  }, [loadMasterClasses]);

  const handleCreate = () => {
    setEditingMasterClass(null);
    setShowForm(true);
  };

  const handleEdit = (masterClass) => {
    setEditingMasterClass(masterClass);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот мастер-класс?')) {
      try {
        setLoading(true);
        await masterClassService.delete(id);
        await loadMasterClasses();
      } catch (err) {
        alert(err.message || 'Ошибка при удалении мастер-класса');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleView = async (masterClass) => {
    try {
      setLoading(true);
      const response = await masterClassService.getById(masterClass.id);
      setSelectedMasterClass(response.data);
    } catch {
      alert('Ошибка при загрузке детальной информации');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMasterClass(null);
  };

  const handleCloseDetail = () => {
    setSelectedMasterClass(null);
  };

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      if (editingMasterClass) {
        await masterClassService.update(editingMasterClass.id, data);
      } else {
        await masterClassService.create(data);
      }
      handleCloseForm();
      await loadMasterClasses();
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setInputFilters((prev) => ({ ...prev, [field]: value }));
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

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="masterclasses-page">
          <div className="masterclasses-header">
            <h1>Управление мастер-классами</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          <MasterClassList
            masterClasses={masterClasses}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
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
            <MasterClassForm
              masterClass={editingMasterClass}
              onSubmit={handleFormSubmit}
              onClose={handleCloseForm}
            />
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

export default MasterClasses;
