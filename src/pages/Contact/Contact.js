import React from 'react';
import Header from '../../components/Header/Header.js';
import './contact_styles.css';

const Contact = () => {
  return (
    <div>
      <Header/>
    <main>
      <section className="contact">
        <h2 className="text1">Контакты</h2>
        <div className="flex_container_for_main">
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1998.598942412404!2d30.320894616096975!3d59.93879486904801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4696310fca5ba729%3A0xea9c53d4493c879f!2z0JHQvtC70YzRiNCw0Y8g0JrQvtC90Y7RiNC10L3QvdCw0Y8g0YPQuy4sIDM2LCDQodCw0L3QutGCLdCf0LXRgtC10YDQsdGD0YDQsywgMTkxMTg2!5e0!3m2!1sru!2sru!4v1234567890"
              className="map-iframe"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="flex">
            <div className="contact_info">
              <h3>Контакты</h3>
              <p className="phone">+7 (812) 123-45-67</p>
              <p className="phone">+7 (911) 123-45-67</p>
              <p className="adress">Новоостровский проспект, дом 36 лит.</p>
            </div>
            <div className="contact_info">
              <h3>Режим работы</h3>
              <p className="phone">C 10:00 до 21:00 (Пн-Пт)</p>
              <p className="phone">С 11:00 до 20:00 (Сб-Вс)</p>
            </div>
            <div className="contact_info">
              <h3>Дополнительная</h3>
              <p className="phone">Будем рады вас видеть!</p>
              <p className="phone">Не забудьте взять бахилы</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    </div>
  );
};

export default Contact;