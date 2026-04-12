const bcrypt = require('bcrypt');
const {
  sequelize,
  Instructor,
  Participant,
  MasterClass,
  MasterClassParticipant,
  ParticipantPassword,
  Review,
  Category,
  Location,
  Schedule,
  Payment,
  MasterClassCategory,
} = require('../models');

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
    participantIds: [1, 2, 3],
    categoryIds: [1],
  },
  {
    name: 'Мастер-класс по здоровому питанию 2',
    description: 'Основы нутрициологии и составление сбалансированного рациона для всей семьи.',
    price: 3000.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 2,
    participantIds: [4, 5],
    categoryIds: [2],
  },
  {
    name: 'Мастер-класс по здоровому питанию 3',
    description: 'Практические советы по правильному питанию и здоровому образу жизни.',
    price: 2800.00,
    photo: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
    instructorId: 3,
    participantIds: [6, 7, 8, 9],
    categoryIds: [3],
  },
  {
    name: 'Мастер-класс по здоровому питанию 4',
    description: 'Изучение основ здорового питания и профилактики заболеваний.',
    price: 3500.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 4,
    participantIds: [10, 11],
    categoryIds: [4],
  },
  {
    name: 'Мастер-класс по здоровому питанию 5',
    description: 'Комплексный подход к здоровому питанию и образу жизни.',
    price: 3200.00,
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    instructorId: 5,
    participantIds: [12, 13, 14],
    categoryIds: [1, 2],
  },
  {
    name: 'Мастер-класс по здоровому питанию 6',
    description: 'Современные методики здорового питания и детокс-программы.',
    price: 2900.00,
    photo: 'https://images.unsplash.com/photo-1505968409348-bd000797c92e?w=800',
    instructorId: 6,
    participantIds: [15, 16],
    categoryIds: [5],
  },
  {
    name: 'Мастер-класс по здоровому питанию 7',
    description: 'Питание для спортсменов и активного образа жизни.',
    price: 3300.00,
    photo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    instructorId: 7,
    participantIds: [17, 18, 19],
    categoryIds: [6],
  },
  {
    name: 'Мастер-класс по здоровому питанию 8',
    description: 'Диетотерапия и лечебное питание при различных заболеваниях.',
    price: 3600.00,
    photo: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800',
    instructorId: 8,
    participantIds: [20],
    categoryIds: [4],
  },
  {
    name: 'Мастер-класс по здоровому питанию 9',
    description: 'Вегетарианское и веганское питание для здоровья.',
    price: 2700.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 9,
    participantIds: [1, 3, 5, 7],
    categoryIds: [7],
  },
  {
    name: 'Мастер-класс по здоровому питанию 10',
    description: 'Питание для беременных и кормящих мам.',
    price: 3100.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 10,
    participantIds: [2, 4, 6, 8, 10],
    categoryIds: [2, 4],
  },
  {
    name: 'Мастер-класс по здоровому питанию 11',
    description: 'Основы правильного питания для детей.',
    price: 2800.00,
    photo: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    instructorId: 1,
    participantIds: [1, 3, 5],
    categoryIds: [1],
  },
  {
    name: 'Мастер-класс по здоровому питанию 12',
    description: 'Антиоксиданты в питании и их роль в здоровье.',
    price: 3300.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 2,
    participantIds: [7, 9],
    categoryIds: [2],
  },
  {
    name: 'Мастер-класс по здоровому питанию 13',
    description: 'Питание при сахарном диабете.',
    price: 3500.00,
    photo: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
    instructorId: 3,
    participantIds: [11, 12, 13],
    categoryIds: [3, 4],
  },
  {
    name: 'Мастер-класс по здоровому питанию 14',
    description: 'Витамины и минералы в рационе питания.',
    price: 2900.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 4,
    participantIds: [14, 15],
    categoryIds: [2],
  },
  {
    name: 'Мастер-класс по здоровому питанию 15',
    description: 'Детокс-программы и очищение организма.',
    price: 3200.00,
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    instructorId: 5,
    participantIds: [16, 17, 18],
    categoryIds: [5],
  },
  {
    name: 'Мастер-класс по здоровому питанию 16',
    description: 'Питание для активного долголетия.',
    price: 3600.00,
    photo: 'https://images.unsplash.com/photo-1505968409348-bd000797c92e?w=800',
    instructorId: 6,
    participantIds: [19, 20],
    categoryIds: [1, 3],
  },
  {
    name: 'Мастер-класс по здоровому питанию 17',
    description: 'Спортивное питание и восстановление.',
    price: 3400.00,
    photo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    instructorId: 7,
    participantIds: [1, 2, 3, 4],
    categoryIds: [6],
  },
  {
    name: 'Мастер-класс по здоровому питанию 18',
    description: 'Питание при аллергии и пищевой непереносимости.',
    price: 3100.00,
    photo: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800',
    instructorId: 8,
    participantIds: [5, 6, 7],
    categoryIds: [4],
  },
  {
    name: 'Мастер-класс по здоровому питанию 19',
    description: 'Сезонное питание и местные продукты.',
    price: 2700.00,
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    instructorId: 9,
    participantIds: [8, 9, 10],
    categoryIds: [7],
  },
  {
    name: 'Мастер-класс по здоровому питанию 20',
    description: 'Функциональное питание и суперфуды.',
    price: 3800.00,
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    instructorId: 10,
    participantIds: [11, 12, 13, 14, 15],
    categoryIds: [2, 7],
  },
];

const reviewsData = [
  { participantId: 1, masterClassId: 1, rating: 5, comment: 'Отличный мастер-класс, очень познавательно!' },
  { participantId: 2, masterClassId: 1, rating: 4, comment: 'Хороший материал, но хотелось бы больше практики.' },
  { participantId: 3, masterClassId: 1, rating: 5, comment: 'Превзошло все ожидания!' },
  { participantId: 4, masterClassId: 2, rating: 4, comment: 'Полезная информация, рекомендую.' },
  { participantId: 5, masterClassId: 2, rating: 3, comment: 'Неплохо, но ожидал большего.' },
  { participantId: 6, masterClassId: 3, rating: 5, comment: 'Очень понравилось, спасибо!' },
  { participantId: 7, masterClassId: 3, rating: 4, comment: 'Хороший преподаватель, понятное изложение.' },
  { participantId: 8, masterClassId: 3, rating: 5, comment: 'Узнал много нового о правильном питании.' },
  { participantId: 9, masterClassId: 3, rating: 4, comment: 'Интересно и практично.' },
  { participantId: 10, masterClassId: 4, rating: 5, comment: 'Лучший мастер-класс из всех, что посещал!' },
  { participantId: 11, masterClassId: 4, rating: 4, comment: 'Много полезной информации.' },
  { participantId: 12, masterClassId: 5, rating: 3, comment: 'Средне, ничего нового не узнал.' },
  { participantId: 13, masterClassId: 5, rating: 5, comment: 'Замечательный мастер-класс!' },
  { participantId: 14, masterClassId: 5, rating: 4, comment: 'Хорошо структурированная программа.' },
  { participantId: 15, masterClassId: 6, rating: 5, comment: 'Детокс-программы — это именно то, что нужно.' },
  { participantId: 16, masterClassId: 6, rating: 4, comment: 'Узнал много о правильном очищении организма.' },
  { participantId: 17, masterClassId: 7, rating: 5, comment: 'Идеально для спортсменов!' },
  { participantId: 18, masterClassId: 7, rating: 4, comment: 'Практичные советы по питанию.' },
  { participantId: 19, masterClassId: 7, rating: 5, comment: 'Очень помогло в тренировках.' },
  { participantId: 20, masterClassId: 8, rating: 4, comment: 'Полезно для людей с хроническими заболеваниями.' },
  { participantId: 1, masterClassId: 9, rating: 5, comment: 'Вегетарианство — это просто и вкусно!' },
  { participantId: 3, masterClassId: 9, rating: 4, comment: 'Много рецептов и идей.' },
  { participantId: 5, masterClassId: 9, rating: 5, comment: 'Лучший мастер-класс по веганству.' },
  { participantId: 7, masterClassId: 9, rating: 3, comment: 'Интересно, но хотелось больше деталей.' },
  { participantId: 2, masterClassId: 10, rating: 4, comment: 'Полезно для будущих мам.' },
  { participantId: 4, masterClassId: 10, rating: 5, comment: 'Очень важная информация!' },
  { participantId: 6, masterClassId: 10, rating: 4, comment: 'Хорошо раскрыта тема питания при беременности.' },
  { participantId: 8, masterClassId: 10, rating: 5, comment: 'Профессиональный подход.' },
  { participantId: 10, masterClassId: 10, rating: 4, comment: 'Узнала много нового.' },
  { participantId: 11, masterClassId: 13, rating: 5, comment: 'Наконец понял, как питаться при диабете.' },
  { participantId: 12, masterClassId: 13, rating: 4, comment: 'Очень полезно для диабетиков.' },
  { participantId: 13, masterClassId: 13, rating: 5, comment: 'Отличный специалист!' },
];

const categoriesData = [
  { name: 'Диетология', description: 'Мастер-классы по основам диетологии и составлению рационов' },
  { name: 'Нутрициология', description: 'Питание с точки зрения науки о нутриентах и биохимии' },
  { name: 'Эндокринология', description: 'Питание при гормональных нарушениях и заболеваниях щитовидной железы' },
  { name: 'Гастроэнтерология', description: 'Лечебное питание при заболеваниях желудочно-кишечного тракта' },
  { name: 'Детокс и очищение', description: 'Программы очищения организма и детокс-питание' },
  { name: 'Спортивное питание', description: 'Питание для спортсменов, набор массы и восстановление' },
  { name: 'Растительное питание', description: 'Вегетарианство, веганство и растительные диеты' },
];

const locationsData = [
  { name: 'Центр здоровья "Витамин"', address: 'г. Минск, ул. Ленина, 12', capacity: 20 },
  { name: 'Оздоровительный клуб "Баланс"', address: 'г. Минск, пр. Независимости, 45', capacity: 15 },
  { name: 'Медицинский центр "Здоровье"', address: 'г. Минск, ул. Притыцкого, 8', capacity: 25 },
  { name: 'Фитнес-студия "Форма"', address: 'г. Минск, ул. Сурганова, 3', capacity: 30 },
  { name: 'Конференц-зал "Меридиан"', address: 'г. Минск, пр. Победителей, 100', capacity: 50 },
];

// Расписание: по 2 сеанса на первые 10 мастер-классов
const schedulesData = [
  { masterClassId: 1,  locationId: 1, startDate: '2026-05-05 10:00:00', endDate: '2026-05-05 13:00:00', maxParticipants: 15 },
  { masterClassId: 1,  locationId: 2, startDate: '2026-05-19 14:00:00', endDate: '2026-05-19 17:00:00', maxParticipants: 15 },
  { masterClassId: 2,  locationId: 3, startDate: '2026-05-07 10:00:00', endDate: '2026-05-07 12:00:00', maxParticipants: 20 },
  { masterClassId: 2,  locationId: 4, startDate: '2026-05-21 15:00:00', endDate: '2026-05-21 17:00:00', maxParticipants: 20 },
  { masterClassId: 3,  locationId: 1, startDate: '2026-05-10 10:00:00', endDate: '2026-05-10 13:00:00', maxParticipants: 15 },
  { masterClassId: 3,  locationId: 5, startDate: '2026-05-24 10:00:00', endDate: '2026-05-24 13:00:00', maxParticipants: 30 },
  { masterClassId: 4,  locationId: 2, startDate: '2026-05-12 11:00:00', endDate: '2026-05-12 14:00:00', maxParticipants: 15 },
  { masterClassId: 4,  locationId: 3, startDate: '2026-05-26 11:00:00', endDate: '2026-05-26 14:00:00', maxParticipants: 20 },
  { masterClassId: 5,  locationId: 4, startDate: '2026-06-02 10:00:00', endDate: '2026-06-02 12:00:00', maxParticipants: 25 },
  { masterClassId: 5,  locationId: 1, startDate: '2026-06-16 14:00:00', endDate: '2026-06-16 16:00:00', maxParticipants: 15 },
  { masterClassId: 6,  locationId: 5, startDate: '2026-06-04 10:00:00', endDate: '2026-06-04 13:00:00', maxParticipants: 30 },
  { masterClassId: 6,  locationId: 2, startDate: '2026-06-18 15:00:00', endDate: '2026-06-18 18:00:00', maxParticipants: 15 },
  { masterClassId: 7,  locationId: 4, startDate: '2026-06-06 10:00:00', endDate: '2026-06-06 12:00:00', maxParticipants: 25 },
  { masterClassId: 7,  locationId: 3, startDate: '2026-06-20 14:00:00', endDate: '2026-06-20 16:00:00', maxParticipants: 20 },
  { masterClassId: 8,  locationId: 1, startDate: '2026-06-09 11:00:00', endDate: '2026-06-09 14:00:00', maxParticipants: 15 },
  { masterClassId: 8,  locationId: 5, startDate: '2026-06-23 11:00:00', endDate: '2026-06-23 14:00:00', maxParticipants: 30 },
  { masterClassId: 9,  locationId: 2, startDate: '2026-07-01 10:00:00', endDate: '2026-07-01 12:00:00', maxParticipants: 15 },
  { masterClassId: 9,  locationId: 4, startDate: '2026-07-15 14:00:00', endDate: '2026-07-15 16:00:00', maxParticipants: 25 },
  { masterClassId: 10, locationId: 3, startDate: '2026-07-03 10:00:00', endDate: '2026-07-03 13:00:00', maxParticipants: 20 },
  { masterClassId: 10, locationId: 1, startDate: '2026-07-17 15:00:00', endDate: '2026-07-17 18:00:00', maxParticipants: 15 },
];

// Оплаты участников за сеансы (scheduleId соответствует индексу в schedulesData + 1)
const paymentsData = [
  { participantId: 1,  scheduleId: 1,  amount: 2500.00, status: 'paid',      paidAt: '2026-04-28 10:00:00' },
  { participantId: 2,  scheduleId: 1,  amount: 2500.00, status: 'paid',      paidAt: '2026-04-29 11:00:00' },
  { participantId: 3,  scheduleId: 2,  amount: 2500.00, status: 'paid',      paidAt: '2026-05-01 09:00:00' },
  { participantId: 4,  scheduleId: 3,  amount: 3000.00, status: 'paid',      paidAt: '2026-04-30 14:00:00' },
  { participantId: 5,  scheduleId: 4,  amount: 3000.00, status: 'pending',   paidAt: null },
  { participantId: 6,  scheduleId: 5,  amount: 2800.00, status: 'paid',      paidAt: '2026-05-02 10:00:00' },
  { participantId: 7,  scheduleId: 5,  amount: 2800.00, status: 'paid',      paidAt: '2026-05-03 11:00:00' },
  { participantId: 8,  scheduleId: 6,  amount: 2800.00, status: 'paid',      paidAt: '2026-05-04 09:00:00' },
  { participantId: 9,  scheduleId: 6,  amount: 2800.00, status: 'cancelled', paidAt: null },
  { participantId: 10, scheduleId: 7,  amount: 3500.00, status: 'paid',      paidAt: '2026-05-05 10:00:00' },
  { participantId: 11, scheduleId: 7,  amount: 3500.00, status: 'paid',      paidAt: '2026-05-06 12:00:00' },
  { participantId: 12, scheduleId: 9,  amount: 3200.00, status: 'paid',      paidAt: '2026-05-20 10:00:00' },
  { participantId: 13, scheduleId: 9,  amount: 3200.00, status: 'paid',      paidAt: '2026-05-21 11:00:00' },
  { participantId: 14, scheduleId: 10, amount: 3200.00, status: 'pending',   paidAt: null },
  { participantId: 15, scheduleId: 11, amount: 2900.00, status: 'paid',      paidAt: '2026-05-25 09:00:00' },
  { participantId: 16, scheduleId: 12, amount: 2900.00, status: 'paid',      paidAt: '2026-06-01 14:00:00' },
  { participantId: 17, scheduleId: 13, amount: 3300.00, status: 'paid',      paidAt: '2026-05-28 10:00:00' },
  { participantId: 18, scheduleId: 13, amount: 3300.00, status: 'paid',      paidAt: '2026-05-29 11:00:00' },
  { participantId: 19, scheduleId: 14, amount: 3300.00, status: 'pending',   paidAt: null },
  { participantId: 20, scheduleId: 15, amount: 3600.00, status: 'paid',      paidAt: '2026-06-02 10:00:00' },
];

async function seedDatabase() {
  try {
    console.log('Начало заполнения базы данных тестовыми данными...\n');

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
      passwordHash,
    }));
    await ParticipantPassword.bulkCreate(passwordsData);
    console.log(`✓ Создано ${passwordsData.length} паролей (пароль: ${defaultPassword})\n`);

    console.log('Создание категорий...');
    const categories = await Category.bulkCreate(categoriesData);
    console.log(`✓ Создано ${categories.length} категорий\n`);

    console.log('Создание мест проведения...');
    const locations = await Location.bulkCreate(locationsData);
    console.log(`✓ Создано ${locations.length} мест проведения\n`);

    console.log('Создание мастер-классов...');
    const mcDataClean = masterClassesData.map(({ participantIds, categoryIds, ...rest }) => rest);
    const masterClasses = await MasterClass.bulkCreate(mcDataClean);
    console.log(`✓ Создано ${masterClasses.length} мастер-классов\n`);

    console.log('Привязка участников к мастер-классам...');
    const participantLinks = [];
    masterClassesData.forEach((mc, index) => {
      mc.participantIds.forEach(participantId => {
        participantLinks.push({ masterClassId: masterClasses[index].id, participantId });
      });
    });
    await MasterClassParticipant.bulkCreate(participantLinks);
    console.log(`✓ Создано ${participantLinks.length} записей участия\n`);

    console.log('Привязка категорий к мастер-классам...');
    const categoryLinks = [];
    masterClassesData.forEach((mc, index) => {
      mc.categoryIds.forEach(categoryId => {
        categoryLinks.push({ masterClassId: masterClasses[index].id, categoryId });
      });
    });
    await MasterClassCategory.bulkCreate(categoryLinks);
    console.log(`✓ Создано ${categoryLinks.length} связей мастер-класс — категория\n`);

    console.log('Создание расписания...');
    const schedules = await Schedule.bulkCreate(schedulesData);
    console.log(`✓ Создано ${schedules.length} сеансов расписания\n`);

    console.log('Создание оплат...');
    const payments = await Payment.bulkCreate(paymentsData);
    console.log(`✓ Создано ${payments.length} записей об оплате\n`);

    console.log('Создание отзывов...');
    const reviews = await Review.bulkCreate(reviewsData);
    console.log(`✓ Создано ${reviews.length} отзывов\n`);

    console.log('База данных успешно заполнена!');
    console.log(`Инструкторов:         ${instructors.length}`);
    console.log(`Участников:           ${participants.length}`);
    console.log(`Категорий:            ${categories.length}`);
    console.log(`Мест проведения:      ${locations.length}`);
    console.log(`Мастер-классов:       ${masterClasses.length}`);
    console.log(`Записей участия:      ${participantLinks.length}`);
    console.log(`Связей с категориями: ${categoryLinks.length}`);
    console.log(`Сеансов расписания:   ${schedules.length}`);
    console.log(`Оплат:                ${payments.length}`);
    console.log(`Отзывов:              ${reviews.length}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
}

seedDatabase();
