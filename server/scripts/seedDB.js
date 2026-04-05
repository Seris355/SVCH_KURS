const bcrypt = require('bcrypt');
const { sequelize, Instructor, Participant, MasterClass, ParticipantPassword } = require('../models');

const instructorsData = [
  { fullName: 'Иванов Иван Иванович', specialization: 'Диетолог' },
  { fullName: 'Петрова Мария Сергеевна', specialization: 'Нутрициолог' },
  { fullName: 'Сидоров Петр Александрович', specialization: 'Эндокринолог' },
  { fullName: 'Козлова Анна Владимировна', specialization: 'Гастроэнтеролог' },
  { fullName: 'Смирнов Дмитрий Николаевич', specialization: 'Диетолог' },
  { fullName: 'Волкова Елена Игоревна', specialization: 'Нутрициолог' },
  { fullName: 'Новиков Алексей Викторович', specialization: 'Эндокринолог' },
  { fullName: 'Федорова Ольга Петровна', specialization: 'Гастроэнтеролог' },
  { fullName: 'Морозов Сергей Дмитриевич', specialization: 'Диетолог' },
  { fullName: 'Павлова Татьяна Алексеевна', specialization: 'Нутрициолог' },
];

const participantsData = [
  { fullName: 'Алексеев Алексей Алексеевич', email: 'alexeev@mail.ru', phone: '+375 (29) 111-11-11' },
  { fullName: 'Борисов Борис Борисович', email: 'borisov@mail.ru', phone: '+375 (29) 222-22-22' },
  { fullName: 'Васильев Василий Васильевич', email: 'vasiliev@mail.ru', phone: '+375 (29) 333-33-33' },
  { fullName: 'Григорьев Григорий Григорьевич', email: 'grigoriev@mail.ru', phone: '+375 (29) 444-44-44' },
  { fullName: 'Дмитриев Дмитрий Дмитриевич', email: 'dmitriev@mail.ru', phone: '+375 (29) 555-55-55' },
  { fullName: 'Егоров Егор Егорович', email: 'egorov@mail.ru', phone: '+375 (29) 666-66-66' },
  { fullName: 'Жуков Жук Жукович', email: 'zhukov@mail.ru', phone: '+375 (29) 777-77-77' },
  { fullName: 'Зайцев Заяц Зайцевич', email: 'zaitsev@mail.ru', phone: '+375 (29) 888-88-88' },
  { fullName: 'Иванова Ирина Ивановна', email: 'ivanova@mail.ru', phone: '+375 (29) 999-99-99' },
  { fullName: 'Кузнецов Кузьма Кузьмич', email: 'kuznetsov@mail.ru', phone: '+375 (29) 000-00-00' },
  { fullName: 'Лебедев Лебедь Лебедевич', email: 'lebedev@mail.ru', phone: '+375 (29) 101-01-01' },
  { fullName: 'Михайлов Михаил Михайлович', email: 'mikhailov@mail.ru', phone: '+375 (29) 202-02-02' },
  { fullName: 'Николаев Николай Николаевич', email: 'nikolaev@mail.ru', phone: '+375 (29) 303-03-03' },
  { fullName: 'Орлов Орел Орлович', email: 'orlov@mail.ru', phone: '+375 (29) 404-04-04' },
  { fullName: 'Петров Петр Петрович', email: 'petrov@mail.ru', phone: '+375 (29) 505-05-05' },
  { fullName: 'Романов Роман Романович', email: 'romanov@mail.ru', phone: '+375 (29) 606-06-06' },
  { fullName: 'Соколов Сокол Соколович', email: 'sokolov@mail.ru', phone: '+375 (29) 707-07-07' },
  { fullName: 'Титов Тит Титович', email: 'titov@mail.ru', phone: '+375 (29) 808-08-08' },
  { fullName: 'Уткин Утка Уткинович', email: 'utkin@mail.ru', phone: '+375 (29) 909-09-09' },
  { fullName: 'Федоров Федор Федорович', email: 'fedorov@mail.ru', phone: '+375 (29) 110-10-10' },
];

const masterClassesData = [
  {
    name: 'Мастер-класс по здоровому питанию 1',
    description: 'Подробный мастер-класс о правильном питании, здоровом образе жизни и составлении сбалансированного рациона.',
    price: 2500.00,
    photo: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    instructorId: 1,
    participantIds: [1, 2, 3]
  },
  {
    name: 'Мастер-класс по здоровому питанию 2',
    description: 'Основы нутрициологии и составление сбалансированного рациона для всей семьи.',
    price: 3000.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 2,
    participantIds: [4, 5]
  },
  {
    name: 'Мастер-класс по здоровому питанию 3',
    description: 'Практические советы по правильному питанию и здоровому образу жизни.',
    price: 2800.00,
    photo: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
    instructorId: 3,
    participantIds: [6, 7, 8, 9]
  },
  {
    name: 'Мастер-класс по здоровому питанию 4',
    description: 'Изучение основ здорового питания и профилактики заболеваний.',
    price: 3500.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 4,
    participantIds: [10, 11]
  },
  {
    name: 'Мастер-класс по здоровому питанию 5',
    description: 'Комплексный подход к здоровому питанию и образу жизни.',
    price: 3200.00,
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    instructorId: 5,
    participantIds: [12, 13, 14]
  },
  {
    name: 'Мастер-класс по здоровому питанию 6',
    description: 'Современные методики здорового питания и детокс-программы.',
    price: 2900.00,
    photo: 'https://images.unsplash.com/photo-1505968409348-bd000797c92e?w=800',
    instructorId: 6,
    participantIds: [15, 16]
  },
  {
    name: 'Мастер-класс по здоровому питанию 7',
    description: 'Питание для спортсменов и активного образа жизни.',
    price: 3300.00,
    photo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    instructorId: 7,
    participantIds: [17, 18, 19]
  },
  {
    name: 'Мастер-класс по здоровому питанию 8',
    description: 'Диетотерапия и лечебное питание при различных заболеваниях.',
    price: 3600.00,
    photo: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800',
    instructorId: 8,
    participantIds: [20]
  },
  {
    name: 'Мастер-класс по здоровому питанию 9',
    description: 'Вегетарианское и веганское питание для здоровья.',
    price: 2700.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 9,
    participantIds: [1, 3, 5, 7]
  },
  {
    name: 'Мастер-класс по здоровому питанию 10',
    description: 'Питание для беременных и кормящих мам.',
    price: 3100.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 10,
    participantIds: [2, 4, 6, 8, 10]
  },
  {
    name: 'Мастер-класс по здоровому питанию 11',
    description: 'Основы правильного питания для детей.',
    price: 2800.00,
    photo: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    instructorId: 1,
    participantIds: [1, 3, 5]
  },
  {
    name: 'Мастер-класс по здоровому питанию 12',
    description: 'Антиоксиданты в питании и их роль в здоровье.',
    price: 3300.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 2,
    participantIds: [7, 9]
  },
  {
    name: 'Мастер-класс по здоровому питанию 13',
    description: 'Питание при сахарном диабете.',
    price: 3500.00,
    photo: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
    instructorId: 3,
    participantIds: [11, 12, 13]
  },
  {
    name: 'Мастер-класс по здоровому питанию 14',
    description: 'Витамины и минералы в рационе питания.',
    price: 2900.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 4,
    participantIds: [14, 15]
  },
  {
    name: 'Мастер-класс по здоровому питанию 15',
    description: 'Детокс-программы и очищение организма.',
    price: 3200.00,
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    instructorId: 5,
    participantIds: [16, 17, 18]
  },
  {
    name: 'Мастер-класс по здоровому питанию 16',
    description: 'Питание для активного долголетия.',
    price: 3600.00,
    photo: 'https://images.unsplash.com/photo-1505968409348-bd000797c92e?w=800',
    instructorId: 6,
    participantIds: [19, 20]
  },
  {
    name: 'Мастер-класс по здоровому питанию 17',
    description: 'Спортивное питание и восстановление.',
    price: 3400.00,
    photo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    instructorId: 7,
    participantIds: [1, 2, 3, 4]
  },
  {
    name: 'Мастер-класс по здоровому питанию 18',
    description: 'Питание при аллергии и пищевой непереносимости.',
    price: 3100.00,
    photo: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800',
    instructorId: 8,
    participantIds: [5, 6, 7]
  },
  {
    name: 'Мастер-класс по здоровому питанию 19',
    description: 'Сезонное питание и местные продукты.',
    price: 2700.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 9,
    participantIds: [8, 9, 10]
  },
  {
    name: 'Мастер-класс по здоровому питанию 20',
    description: 'Функциональное питание и суперфуды.',
    price: 3800.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 10,
    participantIds: [11, 12, 13, 14, 15]
  }
];

async function seedDatabase() {
  try {
    console.log('Начало заполнения базы данных тестовыми данными...\n');

    // Сброс базы данных
    console.log('Сброс базы данных...');
    await sequelize.sync({ force: true });
    console.log('✓ База данных сброшена\n');

    
    console.log('Создание инструкторов...');
    const instructors = await Instructor.bulkCreate(instructorsData);
    console.log(`✓ Создано ${instructors.length} инструкторов\n`);

    
    console.log('Создание участников...');
    const participants = await Participant.bulkCreate(participantsData);
    console.log(`✓ Создано ${participants.length} участников\n`);

    console.log('Создание паролей для участников...');
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const passwordsData = participants.map(p => ({
      participantId: p.id,
      passwordHash: passwordHash,
    }));
    await ParticipantPassword.bulkCreate(passwordsData);
    console.log(`✓ Создано ${passwordsData.length} паролей (пароль: ${defaultPassword})\n`);

    
    console.log('Создание мастер-классов...');
    const masterClasses = await MasterClass.bulkCreate(masterClassesData);
    console.log(`Создано ${masterClasses.length} мастер-классов\n`);

    const totalRecords = instructors.length + participants.length + masterClasses.length;
    console.log(`База данных успешно заполнена!`);
    console.log(`Всего записей: ${totalRecords}`);
    console.log(`Инструкторов: ${instructors.length}`);
    console.log(`Участников: ${participants.length}`);
    console.log(`Мастер-классов: ${masterClasses.length}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
}

seedDatabase();

