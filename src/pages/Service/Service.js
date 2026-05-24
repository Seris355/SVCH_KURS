import React from 'react';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import './service_style.css';

const servicesData = [
  { id: 1, name: 'Первичная консультация диетолога', price: 'от 80 Br', description: 'Оценка рациона, целей и рекомендации по питанию' },
  { id: 2, name: 'Консультация эндокринолога', price: 'от 95 Br', description: 'Разбор гормонального фона и тактики наблюдения' },
  { id: 3, name: 'Подбор программы питания', price: 'от 120 Br', description: 'Индивидуальный план с учётом диагноза и образа жизни' },
  { id: 4, name: 'Онлайн-консультация', price: 'от 70 Br', description: 'Дистанционная встреча со специалистом по видеосвязи' },
  { id: 5, name: 'Мастер-класс по питанию', price: 'от 45 Br', description: 'Групповое занятие с практическими рекомендациями' },
  { id: 6, name: 'Расшифровка анализов', price: 'от 55 Br', description: 'Пояснение результатов исследований простым языком' },
  { id: 7, name: 'Программа при диабете', price: 'от 150 Br', description: 'Сопровождение питания и контроля сахара' },
  { id: 8, name: 'Программа снижения веса', price: 'от 140 Br', description: 'Пошаговый план снижения веса под контролем врача' },
  { id: 9, name: 'Подбор витаминов и добавок', price: 'от 60 Br', description: 'Рекомендации по микроэлементам по результатам анализов' },
  { id: 10, name: 'Ведение пациента (месяц)', price: 'от 200 Br', description: 'Регулярная поддержка и коррекция плана питания' },
  { id: 11, name: 'Школа правильного питания', price: 'от 180 Br', description: 'Курс из нескольких занятий с домашними заданиями' },
  { id: 12, name: 'Семейная консультация', price: 'от 110 Br', description: 'Рекомендации для всей семьи по здоровому рациону' },
];

const Services = () => {
  const cards = [
    { id: 1, image: '/images/images_for_service/image1.png', className: 'price_card1' },
    { id: 2, image: '/images/images_for_service/image2.png', className: 'price_card2' },
    { id: 3, image: '/images/images_for_service/image3.png', className: 'price_card3' },
  ];

  return (
    <div>
      <main>
        <Header />
        <section className="services">
          <h2 className="h2_underh">Услуги и консультации</h2>
          <p className="services-intro">
            Консультации, мастер-классы и программы сопровождения для здорового питания и контроля диабета.
          </p>
          <div className="services_section">
            {cards.map((card) => (
              <div key={card.id} className={card.className}>
                <img src={card.image} alt="Направления услуг" className={`service_img img${card.id}`} />
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
