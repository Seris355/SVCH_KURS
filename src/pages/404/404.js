import React from 'react';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import '../../components/Header/header_and_footer_styles.css';
import './404.css';

const NotFound = () => {
  return (
    <div>
      <Header />
      <main className="not-found-container">
        <h1 className="not-found-title">404</h1>
        <p className="not-found-text">Страница не найдена</p>
        <p className="not-found-description">Такой страницы не существует</p>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;