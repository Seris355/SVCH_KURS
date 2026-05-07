import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import { testService } from '../../services/testService';
import './testTake.css';

const buildInitialSelections = (questions) => {
  const map = {};
  (questions || []).forEach((q) => {
    map[q.id] = null;
  });
  return map;
};

const TestTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const testId = parseInt(id, 10);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [test, setTest] = useState(null);
  const [selections, setSelections] = useState({});
  const [summary, setSummary] = useState(null);

  const loadTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const response = await testService.getForTaking(testId);
      const payload = response.data;
      setTest(payload);
      setSelections(buildInitialSelections(payload.questions));
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Не удалось открыть тест';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (Number.isNaN(testId)) {
      setError('Некорректный идентификатор теста');
      setLoading(false);
      return;
    }
    loadTest();
  }, [loadTest, testId]);

  const handleSelect = (questionId, answerId) => {
    setSelections((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!test?.questions?.length) {
      return;
    }

    const missing = test.questions.filter((q) => selections[q.id] == null);
    if (missing.length > 0) {
      setError('Ответьте на все вопросы');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const answers = test.questions.map((q) => ({
        questionId: q.id,
        answerId: selections[q.id],
      }));
      const response = await testService.submit(testId, answers);
      setSummary(response.data?.summary || null);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Не удалось отправить ответы';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToList = () => {
    navigate('/tests');
  };

  return (
    <div className="test-take-page">
      <Header />

      <main className="test-take-main">
        {loading && <p className="test-take-muted">Загрузка теста...</p>}

        {!loading && error && !test && (
          <p className="test-take-error">{error}</p>
        )}

        {!loading && test && (
          <>
            <h1 className="test-take-title">{test.title}</h1>
            {test.description && (
              <p className="test-take-desc">{test.description}</p>
            )}

            {summary && (
              <div className="test-take-result">
                <p>
                  Результат: {summary.correctCount} из {summary.questionCount}{' '}
                  верных ({summary.scorePercent}%).
                </p>
                <button type="button" onClick={handleBackToList}>
                  К списку тестов
                </button>
              </div>
            )}

            {!summary && (
              <form onSubmit={handleSubmit}>
                {(test.questions || []).map((q, idx) => (
                  <fieldset key={q.id} className="test-take-block">
                    <legend className="test-take-q-title">
                      {idx + 1}. {q.text}
                    </legend>
                    {(q.answers || []).map((a) => (
                      <label key={a.id} className="test-take-option">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={a.id}
                          checked={selections[q.id] === a.id}
                          onChange={() => handleSelect(q.id, a.id)}
                        />
                        <span>{a.text}</span>
                      </label>
                    ))}
                  </fieldset>
                ))}

                {error && test && (
                  <p className="test-take-error">{error}</p>
                )}

                <div className="test-take-actions">
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Отправка...' : 'Проверить'}
                  </button>
                  <button type="button" onClick={handleBackToList}>
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TestTake;
