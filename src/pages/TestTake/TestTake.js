import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import { testService } from '../../services/testService';
import './testTake.css';

const buildInitialSelections = (questions) => {
  const map = {};
  (questions || []).forEach((q) => {
    map[q.id] = q.allowMultiple ? [] : null;
  });
  return map;
};

const isQuestionAnswered = (question, value) => {
  if (question.allowMultiple) {
    return Array.isArray(value) && value.length > 0;
  }
  return value != null;
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

  const handleSingleSelect = (questionId, answerId) => {
    setSelections((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleMultipleToggle = (questionId, answerId) => {
    setSelections((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId];
      return { ...prev, [questionId]: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!test?.questions?.length) {
      return;
    }

    const missing = test.questions.filter((q) => !isQuestionAnswered(q, selections[q.id]));
    if (missing.length > 0) {
      setError('Ответьте на все вопросы');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const answers = test.questions.map((q) => {
        const value = selections[q.id];
        const answerIds = q.allowMultiple
          ? value
          : value != null
            ? [value]
            : [];
        return { questionId: q.id, answerIds };
      });
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
    <div>
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
              <form className="test-take-form" onSubmit={handleSubmit}>
                {(test.questions || []).map((q, idx) => (
                  <fieldset key={q.id} className="test-take-block">
                    <legend className="test-take-q-title">
                      {idx + 1}. {q.text}
                    </legend>
                    {q.allowMultiple && (
                      <p className="test-take-hint">Можно выбрать несколько ответов</p>
                    )}
                    <div className="test-take-options">
                      {(q.answers || []).map((a) => (
                        <label key={a.id} className="test-take-option">
                          <input
                            type={q.allowMultiple ? 'checkbox' : 'radio'}
                            name={`question-${q.id}`}
                            value={a.id}
                            checked={
                              q.allowMultiple
                                ? (selections[q.id] || []).includes(a.id)
                                : selections[q.id] === a.id
                            }
                            onChange={() =>
                              q.allowMultiple
                                ? handleMultipleToggle(q.id, a.id)
                                : handleSingleSelect(q.id, a.id)
                            }
                          />
                          <span>{a.text}</span>
                        </label>
                      ))}
                    </div>
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
