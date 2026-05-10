import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import { analyticsService } from '../../../services/analyticsService';
import '../ContactRequests/ContactRequests.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const WEEK_OPTIONS = [8, 12, 16, 24];

const shortName = (name, max = 22) => {
  if (!name) return '—';
  return name.length <= max ? name : `${name.slice(0, max - 1)}…`;
};

const paymentPieLabel = (status) => {
  if (status === 'paid') return 'Оплачено';
  if (status === 'cancelled') return 'Отменён';
  return 'Ожидает оплаты';
};

const PIE_COLORS = {
  paid: '#4ade80',
  pending: '#facc15',
  cancelled: '#fb7185',
};

const weekTick = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
};

const AdminAnalytics = () => {
  const [weeks, setWeeks] = useState(12);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsService.getDashboard({ weeks });
        if (!cancelled) {
          setPayload(res?.data ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setPayload(null);
          setError(
            err.response?.data?.message ||
              err.message ||
              'Не удалось загрузить аналитику'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [weeks]);

  const enrollmentRows = payload?.enrollmentsByWeek?.length
    ? payload.enrollmentsByWeek.map((row) => ({
        ...row,
        weekLabel: weekTick(row.weekStart),
      }))
    : [];

  const categoryRows = payload?.masterClassesByCategory ?? [];

  const fillRows =
    payload?.upcomingScheduleFill?.map((row) => ({
      ...row,
      label: `${shortName(row.masterClassName)} (#${row.scheduleId})`,
    })) ?? [];

  const paymentPie =
    payload?.paymentsByStatus
      ?.filter((row) => row.count > 0)
      .map((row) => ({
        key: row.status,
        name: paymentPieLabel(row.status),
        value: row.count,
        status: row.status,
      })) ?? [];

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="contact-requests-page">
          <div className="contact-requests-header">
            <h1>Аналитика</h1>
          </div>

          {error && <div className="contact-requests-error">{error}</div>}

          <div className="contact-requests-filters">
            <label className="contact-requests-label">
              Окно для графика записей (недель)
              <select
                className="contact-requests-input"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
              >
                {WEEK_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w} нед.
                  </option>
                ))}
              </select>
            </label>
            <p className="contact-requests-muted">
              После смены значения блок перезапросится. Остальные графики — по
              текущим данным в БД.
            </p>
          </div>

          {loading ? (
            <p className="contact-requests-muted">Загрузка…</p>
          ) : (
            <>
              <section style={{ marginTop: '28px' }}>
                <div className="contact-requests-card-head" style={{ marginBottom: '8px' }}>
                  <strong>Записи по неделям</strong>
                </div>
                <p className="contact-requests-muted">
                  Количество счетов в статусах «ожидает» и «оплачено» по дате создания
                  счёта.
                </p>
                <div style={{ width: '100%', height: 300, marginTop: 12 }}>
                  {enrollmentRows.length ? (
                    <ResponsiveContainer>
                      <BarChart
                        data={enrollmentRows}
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="weekLabel" tick={{ fill: '#ccc', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: '#ccc', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a1a',
                            border: '1px solid #444',
                          }}
                          labelFormatter={(_, p) =>
                            p?.[0]?.payload?.weekStart
                              ? new Date(
                                  p[0].payload.weekStart
                                ).toLocaleDateString('ru-RU')
                              : ''
                          }
                        />
                        <Legend />
                        <Bar dataKey="count" name="Записей" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="contact-requests-muted">Нет данных за выбранный период.</p>
                  )}
                </div>
              </section>

              <section style={{ marginTop: '40px' }}>
                <div className="contact-requests-card-head" style={{ marginBottom: '8px' }}>
                  <strong>Мастер-классы по категориям</strong>
                </div>
                <div style={{ width: '100%', height: 320, marginTop: 12 }}>
                  {categoryRows.length ? (
                    <ResponsiveContainer>
                      <BarChart
                        data={categoryRows}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: '#ccc' }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fill: '#ccc', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a1a',
                            border: '1px solid #444',
                          }}
                        />
                        <Bar dataKey="masterClassCount" name="Мастер-классов" fill="#c084fc" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="contact-requests-muted">Нет связей категорий с МК.</p>
                  )}
                </div>
              </section>

              <section style={{ marginTop: '40px' }}>
                <div className="contact-requests-card-head" style={{ marginBottom: '8px' }}>
                  <strong>Заполняемость ближайших сеансов</strong>
                </div>
                <p className="contact-requests-muted">
                  Доля занятых мест (по счетам pending/paid). До 30 ближайших сеансов.
                </p>
                <div style={{ width: '100%', height: Math.min(420, 140 + fillRows.length * 24), marginTop: 12 }}>
                  {fillRows.length ? (
                    <ResponsiveContainer>
                      <BarChart
                        data={fillRows}
                        layout="vertical"
                        margin={{ top: 8, right: 36, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fill: '#ccc' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={220}
                          tick={{ fill: '#ccc', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a1a',
                            border: '1px solid #444',
                          }}
                          formatter={(value) => [`${value}%`, 'Заполнение']}
                          labelFormatter={(l, p) =>
                            p?.[0]?.payload
                              ? `${p[0].payload.enrolled}/${p[0].payload.maxParticipants} мест · ${formatSessionDate(p[0].payload.startDate)}`
                              : l
                          }
                        />
                        <Bar dataKey="fillPercent" name="% заполнения" fill="#34d399" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="contact-requests-muted">Нет предстоящих сеансов.</p>
                  )}
                </div>
              </section>

              <section style={{ marginTop: '40px' }}>
                <div className="contact-requests-card-head" style={{ marginBottom: '8px' }}>
                  <strong>Счета по статусам (все время)</strong>
                </div>
                <div style={{ width: '100%', height: 300, marginTop: 12 }}>
                  {paymentPie.length ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={paymentPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={96}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {paymentPie.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={
                                PIE_COLORS[entry.status] || '#94a3b8'
                              }
                              stroke="#111"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a1a',
                            border: '1px solid #444',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="contact-requests-muted">Нет платежных записей.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

function formatSessionDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

export default AdminAnalytics;
