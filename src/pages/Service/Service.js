import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import './service_style.css';

const servicesData = [
  { id: 1, name: 'Укладка волос', price: 'от 500 ₽', description: 'Профессиональная укладка волос любой сложности' },
  { id: 2, name: 'Стрижка женская', price: 'от 1500 ₽', description: 'Стрижка с учетом индивидуальных особенностей' },
  { id: 3, name: 'Окрашивание волос', price: 'от 2500 ₽', description: 'Полное окрашивание, мелирование, колорирование' },
  { id: 4, name: 'Уход за волосами', price: 'от 800 ₽', description: 'Маски, SPA-процедуры для волос' },
  { id: 5, name: 'Маникюр классический', price: 'от 600 ₽', description: 'Гигиенический маникюр с покрытием' },
  { id: 6, name: 'Педикюр классический', price: 'от 1000 ₽', description: 'Комплексный уход за ногами' },
  { id: 7, name: 'Наращивание ресниц', price: 'от 1200 ₽', description: 'Классическое и объемное наращивание' },
  { id: 8, name: 'Коррекция бровей', price: 'от 400 ₽', description: 'Моделирование и окрашивание бровей' },
  { id: 9, name: 'Массаж лица', price: 'от 800 ₽', description: 'Расслабляющий массаж лица и шеи' },
  { id: 10, name: 'Чистка лица', price: 'от 1500 ₽', description: 'Ультразвуковая или механическая чистка' },
  { id: 11, name: 'Уходовые процедуры', price: 'от 1000 ₽', description: 'Маски, пилинги, увлажнение' },
  { id: 12, name: 'Визаж', price: 'от 2000 ₽', description: 'Дневной и вечерний макияж' }
]; 

const Services = () => {
  const cards = [
    { id: 1, image: "/images/images_for_service/image1.png", className: "price_card1" },
    { id: 2, image: "/images/images_for_service/image2.png", className: "price_card2" },
    { id: 3, image: "/images/images_for_service/image3.png", className: "price_card3" },
  ];

  return (
    <div>
    <main>
      <Header />
      <section className="services">
        <h2 className="h2_underh">Цены на услуги</h2>
        <div className="services_section">
          {cards.map((card) => (
            <div key={card.id} className={card.className}>
              <img src={card.image} alt="Наши услуги" className={`service_img img${card.id}`} />
              <div className={`service_price service_price${card.id}`}>
                {servicesData
                  .filter((service) => {
                    if (card.id === 1) return service.id <= 4;
                    if (card.id === 2) return service.id > 4 && service.id <= 8;
                    if (card.id === 3) return service.id > 8;
                    return false;
                  })
                  .map((service) => (
                    <div key={service.id}>
                      <h3 className="flex_price">
                        <span>{service.name}</span>
                        <span className="price_money">{service.price}</span>
                      </h3>
                      <p className="services">{service.description}</p>
                      <hr />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
    <Footer />
    </div>
  );
};

export default Services;