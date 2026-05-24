import React, { useCallback, useEffect, useState } from 'react';
import { contactService } from '../../../services/contactService';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import './ContactRequests.css';

const formatWhen = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ContactRequests = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [startEmail, setStartEmail] = useState('');
  const [startMessage, setStartMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactService.getThreads(search.trim() ? { search: search.trim() } : {});
      const list = res.data || [];
      setThreads(list);
      if (!selectedThreadId && list.length > 0) {
        setSelectedThreadId(list[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка при загрузке чатов');
    } finally {
      setLoading(false);
    }
  }, [search, selectedThreadId]);

  const loadThread = useCallback(async (threadId) => {
    if (!threadId) {
      setSelectedChat(null);
      return;
    }
    try {
      const res = await contactService.getThread(threadId);
      setSelectedChat(res.data || null);
      await loadThreads();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка при загрузке переписки');
    }
  }, [loadThreads]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    loadThread(selectedThreadId);
  }, [selectedThreadId, loadThread]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedThreadId || !reply.trim()) return;
    setSending(true);
    try {
      await contactService.sendAdminMessage(selectedThreadId, reply);
      setReply('');
      await loadThread(selectedThreadId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleStartThread = async (e) => {
    e.preventDefault();
    if (!startEmail.trim() || !startMessage.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await contactService.startThread({
        email: startEmail,
        message: startMessage,
      });
      setStartEmail('');
      setStartMessage('');
      setSelectedThreadId(res.data?.threadId || null);
      await loadThreads();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Не удалось создать чат');
    } finally {
      setSending(false);
    }
  };

  const participant = selectedChat?.thread?.participant;
  const messages = selectedChat?.messages || [];

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="contact-requests-page">
          <div className="contact-requests-header">
            <h1>Обращения</h1>
            <p>Переписка с участниками в формате чатов.</p>
          </div>

          {error && <div className="contact-requests-error">{error}</div>}

          <section className="contact-start-card">
            <h2>Написать участнику первым</h2>
            <form className="contact-start-form" onSubmit={handleStartThread}>
              <input
                type="email"
                value={startEmail}
                onChange={(e) => setStartEmail(e.target.value)}
                placeholder="Email участника в системе"
                required
              />
              <input
                value={startMessage}
                onChange={(e) => setStartMessage(e.target.value)}
                placeholder="Первое сообщение"
                required
              />
              <button type="submit" className="contact-requests-btn" disabled={sending}>
                Отправить
              </button>
            </form>
          </section>

          <div className="contact-chat-admin">
            <aside className="contact-thread-list">
              <div className="contact-thread-search">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по имени или email"
                />
                <button type="button" onClick={loadThreads} className="contact-requests-btn">
                  Найти
                </button>
              </div>

              {loading && threads.length === 0 ? (
                <p className="contact-requests-muted">Загрузка...</p>
              ) : null}

              {threads.length === 0 && !loading ? (
                <p className="contact-requests-muted">Чатов пока нет.</p>
              ) : (
                <ul>
                  {threads.map((thread) => (
                    <li key={thread.id}>
                      <button
                        type="button"
                        className={
                          selectedThreadId === thread.id
                            ? 'contact-thread-item contact-thread-item--active'
                            : 'contact-thread-item'
                        }
                        onClick={() => setSelectedThreadId(thread.id)}
                      >
                        <span className="contact-thread-name">
                          {thread.participant?.fullName || 'Участник'}
                          {thread.unreadCount > 0 && (
                            <span className="contact-thread-badge">{thread.unreadCount}</span>
                          )}
                        </span>
                        <span className="contact-thread-email">{thread.participant?.email}</span>
                        <span className="contact-thread-preview">
                          {thread.lastMessage?.message || 'Нет сообщений'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <section className="contact-chat-panel">
              {!selectedThreadId ? (
                <p className="contact-requests-muted">Выберите чат слева.</p>
              ) : (
                <>
                  <div className="contact-chat-admin-head">
                    <div>
                      <h2>{participant?.fullName || 'Участник'}</h2>
                      <p>{participant?.email}</p>
                    </div>
                  </div>

                  <div className="contact-chat-admin-messages">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={
                          message.senderRole === 'admin'
                            ? 'contact-admin-message contact-admin-message--mine'
                            : 'contact-admin-message contact-admin-message--participant'
                        }
                      >
                        <p>{message.message}</p>
                        <span>{formatWhen(message.createdAt)}</span>
                      </div>
                    ))}
                  </div>

                  <form className="contact-admin-reply" onSubmit={handleSendReply}>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Напишите ответ"
                      rows={3}
                    />
                    <button type="submit" className="contact-requests-btn" disabled={sending}>
                      {sending ? 'Отправка...' : 'Отправить'}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactRequests;
