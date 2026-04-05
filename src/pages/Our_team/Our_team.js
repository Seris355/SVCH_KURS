import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import './our_team_styles.css';

const Masters = () => {
  const [masters, setMasters] = useState([]);

  useEffect(() => {
    const teamData = [
      { id: 1, name: 'Мария Иванова', role: 'Визажист' },
      { id: 2, name: 'Анна Петрова', role: 'Парикмахер' },
      { id: 3, name: 'Елена Сидорова', role: 'Мастер маникюра' },
      { id: 4, name: 'Ольга Смирнова', role: 'Мастер педикюра' },
      { id: 5, name: 'Татьяна Козлова', role: 'Мастер эстетики' },
      { id: 6, name: 'Наталья Волкова', role: 'Косметолог' }
    ];
    setMasters(teamData);
  }, []);

  return (
    <div className="masters-container">
      <Header />
      <main>
        <section className="section_main">
          <h1 className="h2_text">Наши мастера</h1>
          <div className="masters">
            {masters.map((master) => (
              <div key={master.id} className="master_container">
                <div className="img">
                  <img
                    src={`/images/images_for_our_team/master${master.id}.png`}
                    alt={master.name}
                    className="image_master"
                  />
                </div>
                <h2 className="text_under_master">{master.name}</h2>
                <p className="text">{master.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Masters;