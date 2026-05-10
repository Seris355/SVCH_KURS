import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import './header_and_footer_styles.css';

const Header = () => {
  const navigate = useNavigate();
  const user = authUtils.getUser();
  const isLoggedIn = authUtils.isLoggedIn();

  const handleLogout = () => {
    authUtils.logout();
    navigate('/');
  };

  return (
    <header>
      <div className="h_items">
        <div className="h_nav">
          <NavLink to="/" className="hn_link">
            Главная
          </NavLink>
          <NavLink to="/service" className="hn_link">
            Услуги
          </NavLink>
          {!isLoggedIn && (
            <NavLink to="/login" className="hn_link">
              Вход
            </NavLink>
          )}
        </div>
        <div className="h_nav_2">
          <img src="/images/images_foote_header/logo.svg" alt="Логотип салона красоты" className="logo_header" />
        </div>
        <div className="h_nav">
          {isLoggedIn && (
            <>
              <NavLink to="/our_team" className="hn_link">
                Мастера
              </NavLink>
              <NavLink to="/contact" className="hn_link">
                Контакты
              </NavLink>
              <NavLink to="/tests" className="hn_link">
                Тесты
              </NavLink>
              {user.role === 'participant' && (
                <>
                  <NavLink to="/participant/classes" className="hn_link">
                    Мои мастер-классы
                  </NavLink>
                  <NavLink to="/participant/favorites" className="hn_link">
                    Избранное
                  </NavLink>
                </>
              )}
              <a onClick={handleLogout} className="hn_link">
                Выйти
              </a>
            </>
          )}
          {!isLoggedIn && (
            <>
              <NavLink to="/our_team" className="hn_link">
                Мастера
              </NavLink>
              <NavLink to="/contact" className="hn_link">
                Контакты
              </NavLink>
              <NavLink to="/tests" className="hn_link">
                Тесты
              </NavLink>
              <NavLink to="/masterclass" className="hn_link">
                Мастер-классы
              </NavLink>
            </>
          )}
        </div>
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
          <NavLink to="/admin/groups" className="hn_link_admin" end>
            Группы (сеансы)
          </NavLink>
          <NavLink to="/admin/contact-requests" className="hn_link_admin" end>
            Обращения
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