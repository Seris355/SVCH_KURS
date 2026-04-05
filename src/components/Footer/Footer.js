import React from 'react';
import '../Header/header_and_footer_styles.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="f_list">
        <div className="logo_footer">
          <img src="/images/images_foote_header/logo2.svg" alt="Логотип салона красоты" className="logo_footer" />
        </div>
        <div className="footer_phone_flex_error">
          <p>+7 (812) 123-45-67</p>
          <p>+7 (911) 123-45-67</p>
        </div>
        <div className="footer_phone_flex_error">
          <p>Новоостровский проспект, дом 36 лит.</p>
        </div>
        <div className="footer_phone_flex_error">
          <p>С 10:00 до 21:00 (Пн-Пт)</p>
          <p>С 11:00 до 20:00 (Сб-Вс)</p>
        </div>
        <div className="footer_inst">
          <a href="#">
            <img src="/images/images_foote_header/insta2.svg" alt="Instagram" />
          </a>
        </div>
      </div>
      <div className="footer_copy">
        <p>&copy; 2024 Салон красоты «Delote-Beauty». Все права защищены.</p>
      </div>
    </footer>
  );
};

export default Footer;