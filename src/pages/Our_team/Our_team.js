import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';
import { instructorService } from '../../services/instructorService';
import './our_team_styles.css';

const OurTeam = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await instructorService.getAll({
        limit: 100,
        sortBy: 'fullName',
        sortOrder: 'ASC',
      });
      setInstructors(res.data || []);
    } catch {
      setError('Не удалось загрузить список инструкторов');
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const photoSrc = (id) => `/images/images_for_our_team/master${((id - 1) % 6) + 1}.png`;

  return (
    <div className="masters-container">
      <Header />
      <main>
        <section className="section_main">
          <h1 className="h2_text">Команда инструкторов</h1>
          {error && <p className="our-team-error">{error}</p>}
          {loading && <p className="our-team-loading">Загрузка...</p>}
          {!loading && (
            <div className="masters">
              {instructors.map((ins) => (
                <div key={ins.id} className="master_container">
                  <Link to={`/instructors/${ins.id}`} className="master-card-link">
                    <div className="img">
                      <img
                        src={photoSrc(ins.id)}
                        alt={ins.fullName}
                        className="image_master"
                      />
                    </div>
                    <h2 className="text_under_master">{ins.fullName}</h2>
                    <p className="text">{ins.specialization}</p>
                    <span className="master-card-more">Профиль →</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OurTeam;
