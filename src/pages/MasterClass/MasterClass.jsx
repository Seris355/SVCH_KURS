import React, { useState } from 'react';
import Modal from '../../components/Modal/Modal.jsx';
import '../Index/style.css';
import '../../components/Header/header_and_footer_styles.css';
import './MasterClass.css';
import Header from '../../components/Header/Header.js';
import Footer from '../../components/Footer/Footer.js';

const MasterClass = () => {
  const [masterClasses, setMasterClasses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const handleAdd = () => {
    const newItem = {
      id: Date.now(),
      name: 'Новый мастер-класс',
      description: 'Введите описание',
      participants: 0,
      doctors: 0,
    };
    setMasterClasses([...masterClasses, newItem]);
    setModalOpen(true);
    setCurrentItem(newItem);
    setIsEdit(true);
  };

  const handleDelete = (id) => {
    setMasterClasses(masterClasses.filter(item => item.id !== id));
    setSelected(selected.filter(s => s !== id));
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEdit(true);
    setModalOpen(true);
  };

  const handleView = (item) => {
    setCurrentItem(item);
    setIsEdit(false);
    setModalOpen(true);
  };

  const handleSave = (updatedItem) => {
    setMasterClasses(masterClasses.map(item => item.id === updatedItem.id ? updatedItem : item));
    setModalOpen(false);
  };

  const toggleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const handleDeleteSelected = () => {
    setMasterClasses(masterClasses.filter(item => !selected.includes(item.id)));
    setSelected([]);
  };

  return (
    <div> 
      <Header />   
      <main className="page-container">
        <section className="H1_sec">
          <div className="H1_scroll">
            <h1>Мастер-классы</h1>
            <p className="text_main_huge">Изучите наши программы и присоединяйтесь!</p>
          </div>
        </section>
        <div className="product">
          <div className="actions">
            <button className="action-btn" onClick={handleAdd}>Добавить мастер-класс</button>
            <button className="action-btn" onClick={handleDeleteSelected} disabled={!selected.length}>
              Удалить выбранные
            </button>
          </div>
          <ul className="product_list">
            {masterClasses.map(item => (
              <li
                key={item.id}
                className={`product_card_m ${selected.includes(item.id) ? 'highlighted' : ''}`}
                onClick={() => handleView(item)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  onClick={e => e.stopPropagation()}
                />
                <h2 className="text_under_product">{item.name}</h2>
                <p>Описание: {item.description} </p>
                <p>Участники: {item.participants}</p>
                <p>Врачи: {item.doctors}</p>
                <div className="card-actions">
                  <button className="button_card_style" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>Редактировать</button>
                  <button className="button_card_style" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Удалить</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {modalOpen && (
          <Modal
            item={currentItem}
            isEdit={isEdit}
            onSave={handleSave}
            onClose={() => setModalOpen(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MasterClass;