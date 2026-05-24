import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import { scheduleService } from '../../../services/scheduleService';
import { scheduleGroupService } from '../../../services/scheduleGroupService';
import { participantService } from '../../../services/participantService';
import './scheduleGroups.css';

const formatDt = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
};

const formatScheduleLabel = (s) => {
  const mc = s.masterClass?.name || `МК #${s.masterClassId}`;
  return `${mc} · ${formatDt(s.startDate)}`;
};

const ScheduleGroups = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  const [groupData, setGroupData] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [pickParticipantId, setPickParticipantId] = useState('');

  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [error, setError] = useState(null);

  const loadReferences = useCallback(async () => {
    setLoadingLists(true);
    setError(null);
    try {
      const [schRes, partRes] = await Promise.all([
        scheduleService.getAll({
          limit: 300,
          page: 1,
          sortBy: 'startDate',
          sortOrder: 'ASC',
        }),
        participantService.getAll({ limit: 500, page: 1 }),
      ]);
      setSchedules(schRes.data || []);
      setParticipants(partRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось загрузить сеансы или участников'
      );
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  const loadGroup = useCallback(async (scheduleId) => {
    if (!scheduleId) {
      setGroupData(null);
      return;
    }
    setLoadingGroup(true);
    setError(null);
    try {
      const res = await scheduleGroupService.getGroup(scheduleId);
      setGroupData(res.data || null);
    } catch (err) {
      setGroupData(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось загрузить состав группы'
      );
    } finally {
      setLoadingGroup(false);
    }
  }, []);

  useEffect(() => {
    loadGroup(selectedId);
  }, [selectedId, loadGroup]);

  const activeParticipantIds = useMemo(() => {
    const set = new Set();
    const pays = groupData?.payments || [];
    pays.forEach((p) => {
      if (
        ['pending', 'paid'].includes(p.status) &&
        p.participant &&
        p.participant.id != null
      ) {
        set.add(p.participant.id);
      }
    });
    return set;
  }, [groupData]);

  const selectableParticipants = useMemo(
    () => participants.filter((p) => !activeParticipantIds.has(p.id)),
    [participants, activeParticipantIds]
  );

  const handleAdd = async () => {
    const pid = parseInt(pickParticipantId, 10);
    if (!selectedId || Number.isNaN(pid)) {
      window.alert('Выберите сеанс и участника');
      return;
    }
    try {
      await scheduleGroupService.addParticipant(selectedId, pid);
      setPickParticipantId('');
      await loadGroup(selectedId);
      await loadReferences();
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          err.message ||
          'Не удалось добавить участника'
      );
    }
  };

  const handleRemove = async (participantId) => {
    if (!window.confirm('Исключить участника с этого сеанса?')) return;
    try {
      await scheduleGroupService.removeParticipant(selectedId, participantId);
      await loadGroup(selectedId);
      await loadReferences();
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          err.message ||
          'Не удалось исключить участника'
      );
    }
  };

  const sch = groupData?.schedule;

  return (
    <div className="sg-page-wrap">
      <Header />
      <main className="page-container">
        <div className="sg-main">
          <h1 className="sg-title">Группы по сеансам</h1>
          <p className="sg-muted sg-top-link">
            Нет нужного сеанса?{' '}
            <Link to="/admin/schedules">Создайте сеанс в разделе «Сеансы»</Link>
          </p>

          {error && <div className="sg-error">{error}</div>}

          <div className="sg-section">
            <label className="sg-label">
              Выберите сеанс расписания
              <select
                className="sg-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loadingLists}
              >
                <option value="">—</option>
                {schedules.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {formatScheduleLabel(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadingGroup && selectedId ? (
            <p className="sg-muted">Загрузка состава…</p>
          ) : null}

          {!loadingGroup && selectedId && groupData && sch && (
            <>
              <div className="sg-summary">
                <p>
                  <strong>Мастер-класс:</strong>{' '}
                  {sch.masterClass?.name || '—'}
                </p>
                <p>
                  <strong>Время:</strong> {formatDt(sch.startDate)} —{' '}
                  {formatDt(sch.endDate)}
                </p>
                {sch.location?.name && (
                  <p>
                    <strong>Место:</strong> {sch.location.name}
                  </p>
                )}
                <p>
                  <strong>Записано:</strong> {groupData.enrolledCount} из{' '}
                  {sch.maxParticipants} (свободно: {groupData.capacityLeft})
                </p>
              </div>

              <h2 className="sg-subtitle">Добавить участника</h2>
              <div className="sg-add-form">
                <label className="sg-label sg-label--grow">
                  Участник
                  <select
                    className="sg-select"
                    value={pickParticipantId}
                    onChange={(e) => setPickParticipantId(e.target.value)}
                  >
                    <option value="">—</option>
                    {selectableParticipants.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.fullName} ({p.email})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="sg-btn sg-btn-primary"
                  onClick={handleAdd}
                  disabled={!pickParticipantId || groupData.capacityLeft <= 0}
                >
                  Добавить в группу
                </button>
              </div>
              {groupData.capacityLeft <= 0 && (
                <p className="sg-muted">Лимит мест на сеансе исчерпан.</p>
              )}

              <h2 className="sg-subtitle">Записи и оплаты</h2>
              {!groupData.payments?.length ? (
                <p className="sg-muted">Пока никого нет.</p>
              ) : (
                <div className="sg-table-wrap">
                  <table className="sg-table">
                    <thead>
                      <tr>
                        <th>Участник</th>
                        <th>E-mail</th>
                        <th>Статус оплаты</th>
                        <th>Счёт</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {groupData.payments.map((row) => (
                        <tr key={row.id}>
                          <td>{row.participant?.fullName || '—'}</td>
                          <td>{row.participant?.email || '—'}</td>
                          <td>{row.status}</td>
                          <td>{row.invoiceCode || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="sg-btn sg-btn-danger"
                              onClick={() =>
                                handleRemove(row.participantId)
                              }
                            >
                              Исключить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!selectedId && !loadingLists ? (
            <p className="sg-muted">Выберите сеанс, чтобы увидеть группу.</p>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScheduleGroups;
