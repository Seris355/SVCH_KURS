import React from 'react';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import './style.css'; 

const Index = () => {
  const backgroundStyle = {
    backgroundImage: 'url(/images/main_page_images/main_background.png)',
    backgroundAttachment: 'fixed',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
  return (
    <div className="index-container">
      <Header />
      <main className="main">
        <section className="H1_sec" style={backgroundStyle}>
          <div className="container">
            <div className="H1_scroll">
              <h1 className="white">Школа инсулинорезистентности и диабета «Delote-Beauty» на Крестовском</h1>
            </div>
          </div>
        </section>

        <section className="reviews">
          <div className="container">
            <div className="reviews_items">
              <img src="/images/main_page_images/idk.svg" alt="Декоративное изображение" className="idk_image" />
              <p className="text_main_huge">
                Добро пожаловать в салон школу диабета, где рождается ваша неповторимая красота и здоровье! Наши врачи – настоящие волшебники, способные подчеркнуть вашу природную привлекательность и создать образ, который будет вызывать восхищение. Они подберут для вас индивидуальную программу питания, соответствующее вашему характеру и образу жизни. Каждый визит к нам – это не просто процедура, а настоящий ритуал, возвращающий молодость, энергию, красоту.
              </p>
            </div>
          </div>
        </section>

        <section className="product">
          <div className="product_list">
            <a href="/service_page/service.html" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/parik.png" alt="Консултация диетолога" className="image_main" />
              </div>
              <h3 className="text_under_product">Консультация варча</h3>
            </a>
            <a href="/service_page/service.html" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/mani.png" alt="Маникюр" className="image_main" />
              </div>
              <h3 className="text_under_product">Онлайн-консультация варча</h3>
            </a>
            <a href="/service_page/service.html" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/pedi.png" alt="Педикюр" className="image_main" />
              </div>
              <h3 className="text_under_product">Подбо питания</h3>
            </a>
            <a href="/service_page/service.html" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/kosme.png" alt="Косметология" className="image_main" />
              </div>
              <h3 className="text_under_product">Сдать анализы</h3>
            </a>
            <a href="/service_page/service.html" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/estet.png" alt="Эстетист по телу" className="image_main" />
              </div>
              <h3 className="text_under_product">Расшифровать анализы</h3>
            </a>
            <a href="#" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/vizaz.png" alt="Визаж" className="image_main" />
              </div>
              <h3 className="text_under_product">Ведение с врачом</h3>
            </a>
          </div>
        </section>

        {}

        <section>
          <div className="partners">
            <div className="logo_p">
              <img src="/images/main_page_images/partner1.png" alt="Партнер 1" className="logos_partners" />
            </div>
            <div className="logo_p">
              <img src="/images/main_page_images/partner2.png" alt="Партнер 2" className="logos_partners" />
            </div>
            <div className="logo_p">
              <img src="/images/main_page_images/partner3.png" alt="Партнер 3" className="logos_partners" />
            </div>
            <div className="logo_p">
              <img src="/images/main_page_images/partnrer4.png" alt="Партнер 4" className="logos_partners" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;