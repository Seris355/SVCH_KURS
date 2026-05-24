import React from 'react';
import '../Header/header_and_footer_styles.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="f_list">
        <div className="logo_footer">
          <img src="/images/images_foote_header/logo2.svg" alt="Логотип школы здорового питания" className="logo_footer" />
        </div>
        <div className="footer_phone_flex_error">
          <p>+375 (17) 338-88-88</p>
          <p>7766 (A1, MTC, life:)</p>
        </div>
        <div className="footer_phone_flex_error">
          <p>г. Минск, пр. Независимости, 95</p>
        </div>
        <div className="footer_phone_flex_error">
          <p>Пн–Пт: 10:00–21:00</p>
          <p>Сб–Вс: 11:00–20:00</p>
        </div>
        <div className="footer_inst">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <img src="/images/images_foote_header/insta2.svg" alt="" />
          </a>
        </div>
      </div>
      <div className="footer_copy">
        <p>&copy; 2026 Школа здорового питания и диабета. Все права защищены.</p>
      </div>
    </footer>
  );
};

export default Footer;
