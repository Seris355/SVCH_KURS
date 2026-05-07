import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import { authUtils } from '../../utils/auth';
import { testService } from '../../services/testService';
import './tests.css';

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = authUtils.getUser();
  const isParticipant = user?.role === 'participant';

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getAll({ page: 1, limit: 50 });
      setTests(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Не удалось загрузить тесты');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  return (
    <div className="tests-page">
      <Header />

      <main className="tests-main">
        <h1 className="tests-title">Тесты для самопроверки</h1>
        {loading && <p className="tests-muted">Загрузка...</p>}
        {error && <p className="tests-error">{error}</p>}

        {!loading && !error && (
          <ul className="tests-list">
            {tests.length === 0 ? (
              <li className="tests-muted">Пока нет доступных тестов.</li>
            ) : (
              tests.map((test) => (
                <li key={test.id} className="tests-list-item">
                  <div className="tests-list-text">
                    <strong>{test.title}</strong>
                    {test.description && (
                      <p className="tests-desc">{test.description}</p>
                    )}
                  </div>
                  {isParticipant ? (
                    <Link className="tests-link" to={`/tests/${test.id}`}>
                      Пройти
                    </Link>
                  ) : (
                    <span className="tests-muted">
                      Войдите как участник, чтобы пройти тест
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Tests;
