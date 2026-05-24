import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import { masterClassService } from '../../services/masterClassService';
import { getNearestUpcomingSchedule } from '../../utils/scheduleDates';
import './style.css';

const Index = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [loadingMc, setLoadingMc] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await masterClassService.getAll({
          page: 1,
          limit: 6,
          sortBy: 'name',
          sortOrder: 'ASC',
        });
        if (!cancelled) {
          setUpcoming(res.data || []);
        }
      } catch {
        if (!cancelled) setUpcoming([]);
      } finally {
        if (!cancelled) setLoadingMc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (mc) => {
    const schedule = getNearestUpcomingSchedule(mc.schedules);
    return schedule?.startDate
      ? new Date(schedule.startDate).toLocaleString('ru-RU')
      : '—';
  };

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
              <h1 className="hero-title">Школа здорового питания, диабета и инсулинорезистентности</h1>
            </div>
          </div>
        </section>

        <section className="reviews">
          <div className="container">
            <div className="reviews_items">
              <img src="/images/main_page_images/idk.svg" alt="Декоративное изображение" className="idk_image" />
              <p className="text_main_huge">
                Добро пожаловать! Мы помогаем выстроить здоровое питание, контролировать уровень сахара
                и улучшить самочувствие. Наши инструкторы — практикующие специалисты в области диетологии
                и эндокринологии. Запишитесь на мастер-класс или консультацию в удобное время.
              </p>
            </div>
          </div>
        </section>

        <section className="home-masterclass-preview">
          <div className="container">
            <h2 className="home-mc-heading">Ближайшие мастер-классы</h2>
            {loadingMc && <p className="home-mc-status">Загрузка…</p>}
            {!loadingMc && upcoming.length === 0 && (
              <p className="home-mc-status">Скоро здесь появятся объявления.</p>
            )}
            {!loadingMc && upcoming.length > 0 && (
              <div className="home-mc-grid">
                {upcoming.map((mc) => (
                  <Link key={mc.id} to={`/masterclass/${mc.id}`} className="home-mc-card">
                    {mc.photo && (
                      <div className="home-mc-photo">
                        <img src={mc.photo} alt="" />
                      </div>
                    )}
                    <h3 className="home-mc-title">{mc.name}</h3>
                    <p className="home-mc-meta">
                      {formatDate(mc)}
                      {mc.instructor?.fullName && ` · ${mc.instructor.fullName}`}
                    </p>
                    <p className="home-mc-price">{parseFloat(mc.price).toFixed(2)} Br</p>
                  </Link>
                ))}
              </div>
            )}
            <div className="home-mc-footer">
              <Link to="/masterclass" className="home-mc-catalog-link">
                Весь каталог мастер-классов
              </Link>
              <span className="home-mc-sep">·</span>
              <Link to="/our_team" className="home-mc-catalog-link">
                Команда инструкторов
              </Link>
            </div>
          </div>
        </section>

        <section className="product">
          <div className="product_list">
            <Link to="/masterclass" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/parik.png" alt="Консультация врача" className="image_main" />
              </div>
              <h3 className="text_under_product">Консультация врача</h3>
            </Link>
            <Link to="/masterclass" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/mani.png" alt="Онлайн-консультация" className="image_main" />
              </div>
              <h3 className="text_under_product">Онлайн-консультация</h3>
            </Link>
            <Link to="/masterclass" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/pedi.png" alt="Подбор питания" className="image_main" />
              </div>
              <h3 className="text_under_product">Подбор питания</h3>
            </Link>
            <Link to="/masterclass" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/kosme.png" alt="Мастер-классы" className="image_main" />
              </div>
              <h3 className="text_under_product">Мастер-классы</h3>
            </Link>
            <Link to="/masterclass" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/estet.png" alt="Расшифровка анализов" className="image_main" />
              </div>
              <h3 className="text_under_product">Расшифровка анализов</h3>
            </Link>
            <Link to="/participant/classes" className="product_card">
              <div className="product_card_img">
                <img src="/images/main_page_images/vizaz.png" alt="Ведение с врачом" className="image_main" />
              </div>
              <h3 className="text_under_product">Ведение с врачом</h3>
            </Link>
          </div>
        </section>

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
