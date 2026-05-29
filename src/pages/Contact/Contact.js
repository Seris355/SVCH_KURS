import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header.js';
import { contactService } from '../../services/contactService';
import { authUtils } from '../../utils/auth';
import './contact_styles.css';

const formatWhen = (value) =>
  new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const Contact = () => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const user = authUtils.getUser();
  const isParticipant = authUtils.isLoggedIn() && user.role === 'participant';

  const loadThread = useCallback(async () => {
    if (!isParticipant) return;
    try {
      const res = await contactService.getMyThread();
      setMessages(res.data?.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось загрузить переписку'
      );
    }
  }, [isParticipant]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setFeedback(null);
    setError(null);
    try {
      await contactService.sendMyMessage(draft);
      setFeedback('Сообщение отправлено.');
      setDraft('');
      await loadThread();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Не удалось отправить сообщение';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Header />
      <main>
        <section className="contact">
          <h2 className="text1">Контакты</h2>

          <div className="contact_feedback_block">
            <h3 className="contact_feedback_title">Чат с администратором</h3>
            {!isParticipant ? (
              <div className="contact-chat-login">
                <p>Войдите как участник, чтобы написать администратору и видеть историю переписки.</p>
                <Link className="contact-form-submit" to="/login">
                  Войти
                </Link>
              </div>
            ) : (
              <>
                <div className="contact-chat-window">
                  {messages.length === 0 ? (
                    <p className="contact-chat-empty">Пока сообщений нет. Напишите первый вопрос.</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={
                          message.senderRole === 'participant'
                            ? 'contact-chat-message contact-chat-message--mine'
                            : 'contact-chat-message contact-chat-message--admin'
                        }
                      >
                        <p>{message.message}</p>
                        <span>{formatWhen(message.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
                <form className="contact-form contact-chat-form" onSubmit={handleSubmit}>
                  <label className="contact-form-label">
                    Сообщение
                    <textarea
                      className="contact-form-textarea"
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        setFeedback(null);
                        setError(null);
                      }}
                      required
                      rows={4}
                      placeholder="Напишите сообщение администратору"
                    />
                  </label>
                  {feedback && (
                    <p className="contact-form-success" role="status">
                      {feedback}
                    </p>
                  )}
                  {error && (
                    <p className="contact-form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="contact-form-submit"
                    disabled={sending}
                  >
                    {sending ? 'Отправка...' : 'Отправить'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="flex_container_for_main">
            <div className="contact-map-row">
              <div className="map-container">
                <iframe
                  title="Карта"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2350.448509139887!2d27.5615!3d53.9045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46dbcfd25b1c23a1%3A0x400a089f2a490c0!2z0JzQuNC90YHQutC40Lkg0L%2BQvNC10YLRgdC60LDRjyDQv9GA0L7QstC10YDRgtC40Y8!5e0!3m2!1sru!2sby!4v1234567890"
                  className="map-iframe"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
            <div className="flex">
              <div className="contact_info">
                <h3>Контакты</h3>
                <p className="phone">+375 (17) 338-88-88</p>
                <p className="phone">7766 (A1, MTC, life:)</p>
                <p className="adress">г. Минск, пр. Независимости, 95</p>
              </div>
              <div className="contact_info">
                <h3>Режим работы</h3>
                <p className="phone">Пн–Пт: 10:00–21:00</p>
                <p className="phone">Сб–Вс: 11:00–20:00</p>
              </div>
              <div className="contact_info">
                <h3>Запись</h3>
                <p className="phone">Мастер-классы — в каталоге на сайте</p>
                <p className="phone">Вопросы — через чат с администратором</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
