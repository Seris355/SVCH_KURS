import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import { testService } from '../../../services/testService';
import './testBuilder.css';

const TestBuilder = () => {
  const [tests, setTests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [questionDraft, setQuestionDraft] = useState('');
  const [answerDraft, setAnswerDraft] = useState({});

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await testService.getAll({ limit: 100, page: 1 });
      setTests(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка списка');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setDetail(null);
      return;
    }
    setLoading(true);
    try {
      const res = await testService.getById(id);
      setDetail(res.data);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не удалось загрузить тест');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      window.alert('Введите название');
      return;
    }
    try {
      await testService.create({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      });
      setNewTitle('');
      setNewDescription('');
      await loadTests();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Ошибка создания теста');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedId || !questionDraft.trim()) return;
    try {
      await testService.createQuestion(selectedId, { text: questionDraft.trim() });
      setQuestionDraft('');
      await loadDetail(selectedId);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Ошибка добавления вопроса');
    }
  };

  const handleDeleteQuestion = async (qid) => {
    if (!window.confirm('Удалить вопрос и все ответы?')) return;
    try {
      await testService.deleteQuestion(qid);
      await loadDetail(selectedId);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleAddAnswer = async (questionId, e) => {
    e.preventDefault();
    const draft = answerDraft[questionId] || { text: '', isCorrect: false };
    if (!draft.text.trim()) return;
    try {
      await testService.createAnswer(questionId, {
        text: draft.text.trim(),
        isCorrect: draft.isCorrect,
      });
      setAnswerDraft((prev) => ({
        ...prev,
        [questionId]: { text: '', isCorrect: false },
      }));
      await loadDetail(selectedId);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Ошибка добавления ответа');
    }
  };

  const handleToggleAnswerCorrect = async (answer, nextVal) => {
    try {
      await testService.updateAnswer(answer.id, { isCorrect: nextVal });
      await loadDetail(selectedId);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleDeleteAnswer = async (aid) => {
    try {
      await testService.deleteAnswer(aid);
      await loadDetail(selectedId);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleUpdateQuestionText = async (questionId, text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      window.alert('Текст вопроса не может быть пустым');
      await loadDetail(selectedId);
      return;
    }
    try {
      await testService.updateQuestion(questionId, { text: trimmed });
      await loadDetail(selectedId);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не удалось сохранить вопрос');
      await loadDetail(selectedId);
    }
  };

  const handleUpdateAnswerText = async (answerId, text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      window.alert('Текст ответа не может быть пустым');
      await loadDetail(selectedId);
      return;
    }
    try {
      await testService.updateAnswer(answerId, { text: trimmed });
      await loadDetail(selectedId);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не удалось сохранить ответ');
      await loadDetail(selectedId);
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedId) return;
    if (!window.confirm('Удалить весь тест?')) return;
    try {
      await testService.delete(selectedId);
      setSelectedId(null);
      await loadTests();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const questions = detail?.questions || [];

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="test-builder-page masterclasses-page">
          <div className="masterclasses-header">
            <h1>Конструктор тестов</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          <section className="tb-new-test">
            <h2>Новый тест</h2>
            <form className="tb-form-inline" onSubmit={handleCreateTest}>
              <input
                placeholder="Название"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                placeholder="Описание (необязательно)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                Создать
              </button>
            </form>
          </section>

          <div className="tb-split">
            <aside className="tb-list">
              <h3>Тесты</h3>
              {tests.length === 0 && (
                <p className="tb-muted">Пока пусто</p>
              )}
              <ul>
                {tests.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={
                        selectedId === t.id ? 'tb-list-btn tb-list-btn-active' : 'tb-list-btn'
                      }
                      onClick={() => setSelectedId(t.id)}
                    >
                      #{t.id} {t.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="tb-detail">
              {!selectedId && (
                <p className="tb-muted">Выберите тест слева</p>
              )}

              {selectedId && detail && (
                <>
                  <div className="tb-detail-head">
                    <h2>{detail.title}</h2>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleDeleteTest}
                      disabled={loading}
                    >
                      Удалить тест
                    </button>
                  </div>
                  {detail.description && (
                    <p className="tb-desc">{detail.description}</p>
                  )}

                  <form className="tb-add-q" onSubmit={handleAddQuestion}>
                    <label>Добавить вопрос</label>
                    <textarea
                      value={questionDraft}
                      onChange={(e) => setQuestionDraft(e.target.value)}
                      rows={3}
                      placeholder="Текст вопроса"
                    />
                    <button type="submit" className="btn-primary">
                      Добавить вопрос
                    </button>
                  </form>

                  {questions.map((q, idx) => {
                    const d = answerDraft[q.id] || { text: '', isCorrect: false };
                    return (
                      <div key={q.id} className="tb-question-card">
                        <div className="tb-question-head">
                          <strong>Вопрос {idx + 1}</strong>
                          <button
                            type="button"
                            className="tb-link-del"
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            Удалить вопрос
                          </button>
                        </div>
                        <label className="tb-edit-label" htmlFor={`question-text-${q.id}`}>
                          Текст вопроса
                        </label>
                        <textarea
                          id={`question-text-${q.id}`}
                          className="tb-edit-field"
                          defaultValue={q.text}
                          rows={2}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== q.text) {
                              handleUpdateQuestionText(q.id, e.target.value);
                            }
                          }}
                        />
                        <ul className="tb-answers">
                          {(q.answers || []).map((a) => (
                            <li key={a.id} className="tb-answer-row">
                              <input
                                className="tb-edit-field tb-edit-field-inline"
                                defaultValue={a.text}
                                aria-label="Текст ответа"
                                onBlur={(e) => {
                                  if (e.target.value.trim() !== a.text) {
                                    handleUpdateAnswerText(a.id, e.target.value);
                                  }
                                }}
                              />
                              <label className="tb-checkbox">
                                <input
                                  type="checkbox"
                                  checked={a.isCorrect}
                                  onChange={(e) =>
                                    handleToggleAnswerCorrect(a, e.target.checked)
                                  }
                                />
                                верный
                              </label>
                              <button
                                type="button"
                                className="tb-link-del"
                                onClick={() => handleDeleteAnswer(a.id)}
                              >
                                удалить
                              </button>
                            </li>
                          ))}
                        </ul>
                        <form
                          className="tb-add-a"
                          onSubmit={(ev) => handleAddAnswer(q.id, ev)}
                        >
                          <input
                            placeholder="Новый вариант ответа"
                            value={d.text}
                            onChange={(e) =>
                              setAnswerDraft((prev) => ({
                                ...prev,
                                [q.id]: {
                                  ...(prev[q.id] || { text: '', isCorrect: false }),
                                  text: e.target.value,
                                },
                              }))
                            }
                          />
                          <label className="tb-checkbox">
                            <input
                              type="checkbox"
                              checked={!!d.isCorrect}
                              onChange={(e) =>
                                setAnswerDraft((prev) => ({
                                  ...prev,
                                  [q.id]: {
                                    ...(prev[q.id] || { text: '', isCorrect: false }),
                                    isCorrect: e.target.checked,
                                  },
                                }))
                              }
                            />
                            верный ответ
                          </label>
                          <button type="submit" className="btn-secondary">
                            Добавить ответ
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </>
              )}
            </section>
          </div>

          {loading && <div className="loading">Загрузка…</div>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TestBuilder;
