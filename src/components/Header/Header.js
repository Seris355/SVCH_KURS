import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import { contactService } from '../../services/contactService';
import ResetUserSettingsButton from '../ResetUserSettingsButton/ResetUserSettingsButton';
import './header_and_footer_styles.css';

const Header = () => {
  const navigate = useNavigate();
  const user = authUtils.getUser();
  const isLoggedIn = authUtils.isLoggedIn();
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || user.role !== 'admin') {
      setUnreadContactCount(0);
      return undefined;
    }

    let cancelled = false;
    const loadUnread = async () => {
      try {
        const res = await contactService.getUnreadCount();
        if (!cancelled) {
          setUnreadContactCount(res.data?.count || 0);
        }
      } catch {
        if (!cancelled) setUnreadContactCount(0);
      }
    };

    loadUnread();
    window.addEventListener('contact-unread-updated', loadUnread);
    const timer = window.setInterval(loadUnread, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener('contact-unread-updated', loadUnread);
      window.clearInterval(timer);
    };
  }, [isLoggedIn, user.role]);

  useEffect(() => {
    document.body.classList.toggle('header-menu-open', menuOpen);
    return () => document.body.classList.remove('header-menu-open');
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    authUtils.logout();
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  const renderMainLinks = (mobile = false) => {
    const linkClass = mobile ? 'header-mobile-link' : 'hn_link';

    return (
      <>
        <NavLink to="/" className={linkClass} end onClick={closeMenu}>
          Главная
        </NavLink>
        <NavLink to="/service" className={linkClass} onClick={closeMenu}>
          Услуги
        </NavLink>
        <NavLink to="/our_team" className={linkClass} onClick={closeMenu}>
          Мастера
        </NavLink>
        <NavLink to="/contact" className={linkClass} onClick={closeMenu}>
          Контакты
        </NavLink>
        <NavLink to="/tests" className={linkClass} onClick={closeMenu}>
          Тесты
        </NavLink>
        {!isLoggedIn && (
          <>
            <NavLink to="/masterclass" className={linkClass} onClick={closeMenu}>
              Мастер-классы
            </NavLink>
            <NavLink to="/login" className={linkClass} onClick={closeMenu}>
              Вход
            </NavLink>
          </>
        )}
        {isLoggedIn && user.role === 'participant' && (
          <>
            <NavLink to="/participant/classes" className={linkClass} onClick={closeMenu}>
              Мои мастер-классы
            </NavLink>
            <NavLink to="/participant/favorites" className={linkClass} onClick={closeMenu}>
              Избранное
            </NavLink>
          </>
        )}
        {isLoggedIn && (
          <>
            <ResetUserSettingsButton className={linkClass} onAfterReset={closeMenu} />
            <button type="button" onClick={handleLogout} className={linkClass}>
              Выйти
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <header>
      <div className="h_items">
        <nav className="h_nav h_nav--desktop" aria-label="Основная навигация">
          {renderMainLinks(false)}
        </nav>

        <button
          type="button"
          className={`header-burger${menuOpen ? ' header-burger--open' : ''}`}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="header-burger-line" />
          <span className="header-burger-line" />
          <span className="header-burger-line" />
        </button>

        <nav
          className={`header-mobile-menu${menuOpen ? ' header-mobile-menu--open' : ''}`}
          aria-label="Мобильная навигация"
        >
          {renderMainLinks(true)}
        </nav>
      </div>

      {isLoggedIn && user.role === 'admin' && (
        <div className="h_nav_admin">
          <NavLink to="/admin/instructors" className="hn_link_admin" end>
            Инструкторы
          </NavLink>
          <NavLink to="/admin/participants" className="hn_link_admin" end>
            Участники
          </NavLink>
          <NavLink to="/admin/masterclasses" className="hn_link_admin" end>
            Управление мастер-классами
          </NavLink>
          <NavLink to="/admin/schedules" className="hn_link_admin" end>
            Сеансы
          </NavLink>
          <NavLink to="/admin/groups" className="hn_link_admin" end>
            Группы (сеансы)
          </NavLink>
          <NavLink to="/admin/contact-requests" className="hn_link_admin" end>
            Обращения
            {unreadContactCount > 0 && (
              <span className="admin-nav-badge">({unreadContactCount})</span>
            )}
          </NavLink>
          <NavLink to="/admin/payments" className="hn_link_admin" end>
            Счета
          </NavLink>
          <NavLink to="/admin/reports" className="hn_link_admin" end>
            Отчёты
          </NavLink>
          <NavLink to="/admin/analytics" className="hn_link_admin" end>
            Аналитика
          </NavLink>
          <NavLink to="/admin/tests" className="hn_link_admin" end>
            Тесты (админ)
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Header;
