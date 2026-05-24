import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import { scheduleService } from '../../../services/scheduleService';
import { masterClassService } from '../../../services/masterClassService';
import { locationService } from '../../../services/locationService';
import { useOverlayDismiss } from '../../../utils/useOverlayDismiss';
import './AdminSchedules.css';

const emptyForm = {
  masterClassId: '',
  locationId: '',
  startDate: '',
  endDate: '',
  maxParticipants: '10',
};

const formatWhen = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [masterClasses, setMasterClasses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const closeForm = useCallback(() => {
    if (submitting) return;
    setFormOpen(false);
    setEditing(null);
    setFormData(emptyForm);
    setFormError(null);
  }, [submitting]);

  const overlayDismiss = useOverlayDismiss(closeForm, submitting);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schRes, mcRes, locRes] = await Promise.all([
        scheduleService.getAll({
          limit: 300,
          page: 1,
          sortBy: 'startDate',
          sortOrder: 'ASC',
        }),
        masterClassService.getAll({ limit: 200, page: 1, sortBy: 'name', sortOrder: 'ASC' }),
        locationService.getAll({ limit: 200, page: 1, sortBy: 'name', sortOrder: 'ASC' }),
      ]);
      setSchedules(schRes.data || []);
      setMasterClasses(mcRes.data || []);
      setLocations(locRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Не удалось загрузить данные'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!formOpen) return undefined;
    document.body.classList.add('modal-open');
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) closeForm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [formOpen, submitting, closeForm]);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (schedule) => {
    setEditing(schedule);
    setFormData({
      masterClassId: String(schedule.masterClassId),
      locationId: String(schedule.locationId),
      startDate: toDatetimeLocal(schedule.startDate),
      endDate: toDatetimeLocal(schedule.endDate),
      maxParticipants: String(schedule.maxParticipants),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const selectedLocation = locations.find(
    (loc) => String(loc.id) === String(formData.locationId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const masterClassId = parseInt(formData.masterClassId, 10);
    const locationId = parseInt(formData.locationId, 10);
    const maxParticipants = parseInt(formData.maxParticipants, 10);

    if (Number.isNaN(masterClassId) || Number.isNaN(locationId)) {
      setFormError('Выберите мастер-класс и место проведения');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError('Укажите дату и время начала и окончания');
      return;
    }
    if (Number.isNaN(maxParticipants) || maxParticipants < 1) {
      setFormError('Укажите корректное число мест');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      setFormError('Время окончания должно быть позже начала');
      return;
    }
    if (selectedLocation && maxParticipants > selectedLocation.capacity) {
      setFormError(
        `Максимум участников не может превышать вместимость зала (${selectedLocation.capacity})`
      );
      return;
    }

    const payload = {
      masterClassId,
      locationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      maxParticipants,
    };

    try {
      setSubmitting(true);
      if (editing) {
        await scheduleService.update(editing.id, payload);
      } else {
        await scheduleService.create(payload);
      }
      closeForm();
      await loadData();
    } catch (err) {
      setFormError(
        err.response?.data?.message || err.message || 'Не удалось сохранить сеанс'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (schedule) => {
    const label = `${schedule.masterClass?.name || 'Мастер-класс'} · ${formatWhen(schedule.startDate)}`;
    if (!window.confirm(`Удалить сеанс?\n${label}`)) return;

    try {
      setLoading(true);
      await scheduleService.delete(schedule.id);
      await loadData();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не удалось удалить сеанс');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-schedules-page">
      <Header />
      <main className="page-container">
        <div className="admin-schedules-main">
          <div className="admin-schedules-header">
            <div>
              <h1>Сеансы мастер-классов</h1>
              <p className="admin-schedules-subtitle">
                Создавайте даты и места проведения — участники смогут записываться на них.
              </p>
            </div>
            <div className="admin-schedules-header-actions">
              <Link to="/admin/groups" className="btn-secondary">
                Группы по сеансам
              </Link>
              <button type="button" className="btn-primary" onClick={openCreate}>
                + Создать сеанс
              </button>
            </div>
          </div>

          {error && <div className="admin-schedules-error">{error}</div>}

          {loading && <p className="admin-schedules-muted">Загрузка…</p>}

          {!loading && schedules.length === 0 ? (
            <div className="admin-schedules-empty">
              <p>Сеансов пока нет.</p>
              <button type="button" className="btn-primary" onClick={openCreate}>
                Создать первый сеанс
              </button>
            </div>
          ) : (
            <div className="admin-schedules-table-wrap">
              <table className="admin-schedules-table">
                <thead>
                  <tr>
                    <th>Мастер-класс</th>
                    <th>Начало</th>
                    <th>Окончание</th>
                    <th>Место</th>
                    <th>Мест</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>{schedule.masterClass?.name || `МК #${schedule.masterClassId}`}</td>
                      <td>{formatWhen(schedule.startDate)}</td>
                      <td>{formatWhen(schedule.endDate)}</td>
                      <td>
                        {schedule.location?.name || '—'}
                        {schedule.location?.address ? (
                          <span className="admin-schedules-place-sub">
                            {schedule.location.address}
                          </span>
                        ) : null}
                      </td>
                      <td>{schedule.maxParticipants}</td>
                      <td className="admin-schedules-actions-cell">
                        <button
                          type="button"
                          className="btn-secondary admin-schedules-btn-sm"
                          onClick={() => openEdit(schedule)}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className="btn-danger admin-schedules-btn-sm"
                          onClick={() => handleDelete(schedule)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {formOpen && (
        <div className="modal-overlay" role="presentation" {...overlayDismiss}>
          <div
            className="modal-content admin-schedules-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h2>{editing ? 'Редактировать сеанс' : 'Новый сеанс'}</h2>
            </div>

            <form className="admin-schedules-form" onSubmit={handleSubmit}>
              {formError && <div className="admin-schedules-error">{formError}</div>}

              <label className="admin-schedules-field">
                Мастер-класс
                <select
                  value={formData.masterClassId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, masterClassId: e.target.value }))
                  }
                  required
                  disabled={submitting}
                >
                  <option value="">— Выберите —</option>
                  {masterClasses.map((mc) => (
                    <option key={mc.id} value={String(mc.id)}>
                      {mc.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-schedules-field">
                Место проведения
                <select
                  value={formData.locationId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, locationId: e.target.value }))
                  }
                  required
                  disabled={submitting}
                >
                  <option value="">— Выберите —</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={String(loc.id)}>
                      {loc.name} (вместимость: {loc.capacity})
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-schedules-row">
                <label className="admin-schedules-field">
                  Начало
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    required
                    disabled={submitting}
                  />
                </label>
                <label className="admin-schedules-field">
                  Окончание
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    required
                    disabled={submitting}
                  />
                </label>
              </div>

              <label className="admin-schedules-field">
                Максимум участников
                <input
                  type="number"
                  min="1"
                  max={selectedLocation?.capacity || 9999}
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxParticipants: e.target.value }))
                  }
                  required
                  disabled={submitting}
                />
                {selectedLocation && (
                  <span className="admin-schedules-hint">
                    Вместимость зала: {selectedLocation.capacity}
                  </span>
                )}
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedules;
