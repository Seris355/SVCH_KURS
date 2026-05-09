import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { instructorService } from '../../services/instructorService';
import '../MasterClassPublicPage/MasterClassPublicPage.css';

const InstructorPublicPage = () => {
  const { id } = useParams();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await instructorService.getById(id);
      setInstructor(res.data);
    } catch {
      setError('Инструктор не найден');
      setInstructor(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <Header />
        <main className="mc-public-page"><div className="loading">Загрузка...</div></main>
        <Footer />
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div>
        <Header />
        <main className="mc-public-page">
          <p>{error}</p>
          <Link to="/our_team">← К команде</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="mc-public-page">
        <nav className="mc-public-breadcrumbs">
          <Link to="/our_team">Команда</Link>
          <span> / </span>
          <span>{instructor.fullName}</span>
        </nav>
        <h1>{instructor.fullName}</h1>
        <p className="instructor-public-spec">{instructor.specialization}</p>
        <Link to="/masterclass">Смотреть мастер-классы →</Link>
      </main>
      <Footer />
    </div>
  );
};

export default InstructorPublicPage;
