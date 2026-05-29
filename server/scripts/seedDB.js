const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {
  sequelize,
  Instructor,
  Participant,
  MasterClass,
  MasterClassParticipant,
  ParticipantPassword,
  RefreshToken,
  Review,
  Category,
  Location,
  Schedule,
  Payment,
  MasterClassCategory,
  Favorite,
  ContactRequest,
  ContactThread,
  ContactMessage,
  Test,
  Question,
  Answer,
  TestResult,
} = require('../models');

const MIN_ROWS = 25;
const QUESTIONS_PER_TEST = 5;
const ANSWERS_PER_QUESTION = 4;
const SESSION_OFFSET_DAYS = [6, 14, 21];
const SESSION_HOURS = [10, 14, 18];

const PHOTOS = [
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
  'https://images.unsplash.com/photo-1505968409348-bd000797c92e?w=800',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
  'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800',
];

const INSTRUCTORS = [
  { fullName: 'Иванов Иван Иванович', specialization: 'Диетолог' },
  { fullName: 'Петрова Мария Сергеевна', specialization: 'Нутрициолог' },
  { fullName: 'Сидоров Пётр Александрович', specialization: 'Эндокринолог' },
  { fullName: 'Козлова Анна Владимировна', specialization: 'Гастроэнтеролог' },
  { fullName: 'Смирнов Дмитрий Николаевич', specialization: 'Диетолог' },
  { fullName: 'Волкова Елена Игоревна', specialization: 'Нутрициолог' },
  { fullName: 'Новиков Алексей Викторович', specialization: 'Эндокринолог' },
  { fullName: 'Фёдорова Ольга Петровна', specialization: 'Гастроэнтеролог' },
  { fullName: 'Морозов Сергей Дмитриевич', specialization: 'Диетолог' },
  { fullName: 'Павлова Татьяна Алексеевна', specialization: 'Нутрициолог' },
  { fullName: 'Ковалёв Андрей Станиславович', specialization: 'Спортивный диетолог' },
  { fullName: 'Лебедева Светлана Юрьевна', specialization: 'Нутрициолог' },
  { fullName: 'Орлов Максим Валерьевич', specialization: 'Эндокринолог' },
  { fullName: 'Захарова Наталья Олеговна', specialization: 'Диетолог' },
  { fullName: 'Белый Константин Игоревич', specialization: 'Гастроэнтеролог' },
  { fullName: 'Громова Виктория Павловна', specialization: 'Нутрициолог' },
  { fullName: 'Ермаков Роман Владимирович', specialization: 'Диетолог' },
  { fullName: 'Соколова Дарья Андреевна', specialization: 'Эндокринолог' },
  { fullName: 'Кузнецов Артём Сергеевич', specialization: 'Спортивный диетолог' },
  { fullName: 'Романова Алина Дмитриевна', specialization: 'Нутрициолог' },
  { fullName: 'Виноградов Илья Николаевич', specialization: 'Диетолог' },
  { fullName: 'Кравцова Юлия Викторовна', specialization: 'Гастроэнтеролог' },
  { fullName: 'Баранов Олег Александрович', specialization: 'Эндокринолог' },
  { fullName: 'Мельникова Екатерина Романовна', specialization: 'Нутрициолог' },
  { fullName: 'Тарасов Владислав Олегович', specialization: 'Диетолог' },
];

const PARTICIPANTS = [
  { fullName: 'Алексеев Алексей Алексеевич', email: 'alexeev@mail.ru', phone: '+375 (29) 111-11-11' },
  { fullName: 'Борисова Елена Борисовна', email: 'borisova@mail.ru', phone: '+375 (29) 222-22-22' },
  { fullName: 'Васильев Василий Васильевич', email: 'vasiliev@mail.ru', phone: '+375 (33) 333-33-33' },
  { fullName: 'Григорьева Мария Григорьевна', email: 'grigorieva@mail.ru', phone: '+375 (44) 444-44-44' },
  { fullName: 'Дмитриев Дмитрий Дмитриевич', email: 'dmitriev@mail.ru', phone: '+375 (25) 555-55-55' },
  { fullName: 'Егорова Анна Егоровна', email: 'egorova@mail.ru', phone: '+375 (29) 666-66-66' },
  { fullName: 'Жуков Игорь Жукович', email: 'zhukov@mail.ru', phone: '+375 (33) 777-77-77' },
  { fullName: 'Зайцева Ольга Зайцева', email: 'zaitseva@mail.ru', phone: '+375 (44) 888-88-88' },
  { fullName: 'Иванова Ирина Ивановна', email: 'ivanova@mail.ru', phone: '+375 (29) 999-99-99' },
  { fullName: 'Кузнецов Николай Кузнецов', email: 'kuznetsov@mail.ru', phone: '+375 (25) 101-01-01' },
  { fullName: 'Лебедев Павел Лебедев', email: 'lebedev@mail.ru', phone: '+375 (29) 202-02-02' },
  { fullName: 'Михайлова София Михайлова', email: 'mikhailova@mail.ru', phone: '+375 (33) 303-03-03' },
  { fullName: 'Николаев Артём Николаев', email: 'nikolaev@mail.ru', phone: '+375 (44) 404-04-04' },
  { fullName: 'Орлова Виктория Орлова', email: 'orlova@mail.ru', phone: '+375 (29) 505-05-05' },
  { fullName: 'Петров Петр Петрович', email: 'petrov@mail.ru', phone: '+375 (25) 606-06-06' },
  { fullName: 'Романова Алёна Романова', email: 'romanova@mail.ru', phone: '+375 (29) 707-07-07' },
  { fullName: 'Соколов Максим Соколов', email: 'sokolov@mail.ru', phone: '+375 (33) 808-08-08' },
  { fullName: 'Титова Надежда Титова', email: 'titova@mail.ru', phone: '+375 (44) 909-09-09' },
  { fullName: 'Уткина Полина Уткина', email: 'utkina@mail.ru', phone: '+375 (29) 110-10-10' },
  { fullName: 'Фёдоров Сергей Фёдоров', email: 'fedorov@mail.ru', phone: '+375 (25) 121-21-21' },
  { fullName: 'Харитонов Денис Харитонов', email: 'haritonov@mail.ru', phone: '+375 (29) 131-31-31' },
  { fullName: 'Цветкова Людмила Цветкова', email: 'cvetkova@mail.ru', phone: '+375 (33) 141-41-41' },
  { fullName: 'Чернов Андрей Чернов', email: 'chernov@mail.ru', phone: '+375 (44) 151-51-51' },
  { fullName: 'Шевченко Кристина Шевченко', email: 'shevchenko@mail.ru', phone: '+375 (29) 161-61-61' },
  { fullName: 'Яковлев Руслан Яковлев', email: 'yakovlev@mail.ru', phone: '+375 (25) 171-71-71' },
];

const CATEGORIES = [
  { name: 'Диетология', description: 'Основы составления сбалансированного рациона' },
  { name: 'Нутрициология', description: 'Нутриенты, витамины и микроэлементы в питании' },
  { name: 'Эндокринология', description: 'Питание при гормональных нарушениях' },
  { name: 'Гастроэнтерология', description: 'Лечебное питание при заболеваниях ЖКТ' },
  { name: 'Детокс и очищение', description: 'Безопасные программы очищения организма' },
  { name: 'Спортивное питание', description: 'Рацион для тренировок и восстановления' },
  { name: 'Растительное питание', description: 'Вегетарианские и веганские подходы' },
  { name: 'Питание детей', description: 'Рацион для детей и подростков' },
  { name: 'Питание при диабете', description: 'Контроль углеводов и гликемический индекс' },
  { name: 'Снижение веса', description: 'Дефицит калорий без вреда для здоровья' },
  { name: 'Набор массы', description: 'Питание при увеличении мышечной массы' },
  { name: 'Пищевая аллергия', description: 'Исключение аллергенов и замена продуктов' },
  { name: 'Беременность и лактация', description: 'Питание для будущих и кормящих мам' },
  { name: 'Питание пожилых', description: 'Рацион для активного долголетия' },
  { name: 'Кулинария ЗОЖ', description: 'Простые рецепты полезных блюд' },
  { name: 'Интервальное голодание', description: 'Режимы питания и безопасность' },
  { name: 'Микробиом кишечника', description: 'Пробиотики, клетчатка и ферментированные продукты' },
  { name: 'Гидратация', description: 'Водный баланс и напитки в рационе' },
  { name: 'Питание при стрессе', description: 'Продукты, поддерживающие нервную систему' },
  { name: 'Сезонное питание', description: 'Выбор продуктов по сезону' },
  { name: 'Функциональное питание', description: 'Суперфуды и их реальная польза' },
  { name: 'Питание на работе', description: 'Перекусы и обеды в офисе' },
  { name: 'Семейный рацион', description: 'Планирование меню на неделю' },
  { name: 'Чтение этикеток', description: 'Как понимать состав продуктов' },
  { name: 'Антиоксиданты', description: 'Защита клеток через питание' },
];

const LOCATIONS = [
  { name: 'Центр «Витамин»', address: 'г. Минск, пр. Независимости, 95', capacity: 20 },
  { name: 'Клуб «Баланс»', address: 'г. Минск, ул. Ленина, 12', capacity: 15 },
  { name: 'Медцентр «Здоровье+»', address: 'г. Минск, ул. Притыцкого, 8', capacity: 25 },
  { name: 'Студия «Форма»', address: 'г. Минск, ул. Сурганова, 3', capacity: 30 },
  { name: 'Зал «Меридиан»', address: 'г. Минск, пр. Победителей, 100', capacity: 50 },
  { name: 'Студия «Нутри»', address: 'г. Минск, ул. Кальварийская, 17', capacity: 18 },
  { name: 'Центр «Эко-жизнь»', address: 'г. Минск, ул. Якуба Коласа, 28', capacity: 22 },
  { name: 'Кабинет «ДиетаПро»', address: 'г. Минск, ул. Немига, 40', capacity: 12 },
  { name: 'Зал «Гармония»', address: 'г. Минск, ул. Куйбышева, 44', capacity: 16 },
  { name: 'Пространство «Польза»', address: 'г. Минск, ул. Богдановича, 15', capacity: 14 },
  { name: 'Центр «Актив»', address: 'г. Минск, пр. Дзержинского, 119', capacity: 24 },
  { name: 'Студия «Лайт»', address: 'г. Минск, ул. Гикало, 5', capacity: 10 },
  { name: 'Зал «Омега»', address: 'г. Минск, ул. Тимирязева, 72', capacity: 28 },
  { name: 'Клуб «Энергия»', address: 'г. Минск, ул. Казинца, 11', capacity: 20 },
  { name: 'Центр «Правильно»', address: 'г. Минск, ул. Фрунзе, 2', capacity: 18 },
  { name: 'Студия «Клетчатка»', address: 'г. Минск, ул. Рокоссовского, 84', capacity: 16 },
  { name: 'Зал «Метаболизм»', address: 'г. Минск, ул. Воронянского, 7', capacity: 22 },
  { name: 'Кабинет «Нутриент»', address: 'г. Минск, ул. Сухаревская, 27', capacity: 8 },
  { name: 'Центр «Сила еды»', address: 'г. Минск, пр. Машерова, 23', capacity: 26 },
  { name: 'Студия «Белок»', address: 'г. Минск, ул. Каховская, 17', capacity: 12 },
  { name: 'Зал «Гликемия»', address: 'г. Минск, ул. Мстиславца, 9', capacity: 20 },
  { name: 'Клуб «Рацион»', address: 'г. Минск, ул. Шафарнянская, 11', capacity: 15 },
  { name: 'Центр «ЖКТ-комфорт»', address: 'г. Минск, ул. Беды, 22', capacity: 14 },
  { name: 'Студия «Детокс-мягкий»', address: 'г. Минск, ул. Одоевского, 115', capacity: 18 },
  { name: 'Зал «Семейный стол»', address: 'г. Минск, ул. Уручская, 21', capacity: 30 },
];

const MASTER_CLASS_TITLES = [
  'Основы сбалансированного питания',
  'Составление меню на неделю',
  'Питание при сахарном диабете 2 типа',
  'Детокс без экстремальных диет',
  'Спортивное питание для начинающих',
  'Вегетарианский рацион без дефицитов',
  'Питание для беременных',
  'Здоровые перекусы в офисе',
  'Чтение состава на упаковке',
  'Питание при гастрите',
  'Снижение веса без срывов',
  'Набор мышечной массы',
  'Питание детей 7–12 лет',
  'Интервальное голодание: мифы и факты',
  'Клетчатка в повседневном рационе',
  'Пробиотики и ферментированные продукты',
  'Питание при гипотиреозе',
  'Антиоксиданты в тарелке',
  'Вода и напитки: что действительно важно',
  'Питание при пищевой аллергии',
  'Сезонные овощи и фрукты',
  'Планирование бюджетного ЗОЖ-меню',
  'Питание при высоком холестерине',
  'Рацион для пожилых родственников',
  'Суперфуды: что стоит добавить в рацион',
];

const REVIEW_COMMENTS = [
  'Очень понятно объяснили материал, много практики.',
  'Полезные рекомендации, уже применяю дома.',
  'Хороший мастер-класс, но хотелось бы больше рецептов.',
  'Отличная подача, рекомендую знакомым.',
  'Много нового про состав продуктов.',
  'Удобный формат и ответы на все вопросы.',
  'Понравился разбор типичных ошибок в питании.',
  'После занятия составил меню на две недели.',
  'Темп комфортный, без воды.',
  'Инструктор внимательный и компетентный.',
];

const TEST_QUESTION_BANK = [
  'Сколько приёмов пищи в день чаще всего рекомендуют диетологи?',
  'Что важнее при выборе продукта в магазине?',
  'Какой напиток лучше выбрать для ежедневного питья?',
  'Что такое дефицит калорий?',
  'Какой источник белка подходит для вегетарианцев?',
  'Зачем нужна клетчатка в рационе?',
  'Что означает гликемический индекс?',
  'Какой перекус уместен между основными приёмами пищи?',
  'Что стоит ограничить при гастрите в стадии обострения?',
  'Как безопасно снизить вес?',
];

const TEST_ANSWER_OPTIONS = [
  ['1–2', '3–5', '6–8', 'Только 1'],
  ['Цена', 'Состав и срок годности', 'Упаковка', 'Реклама'],
  ['Сладкая газировка', 'Вода', 'Энергетик', 'Сок с сахаром'],
  ['Потребление меньше калорий, чем тратится', 'Полный отказ от углеводов', 'Только жидкая диета', 'Питание раз в сутки'],
  ['Тофу и бобовые', 'Только сало', 'Майонез', 'Сахар'],
  ['Поддержка работы кишечника', 'Замена белка', 'Источник сахара', 'Не нужна'],
  ['Влияние продукта на сахар крови', 'Калорийность этикетки', 'Цвет упаковки', 'Вес блюда'],
  ['Орехи или йогурт без сахара', 'Торт', 'Фастфуд', 'Чипсы'],
  ['Острое и жирное', 'Овощной суп', 'Кефир', 'Рис'],
  ['Постепенное снижение калорий и активность', 'Голодание неделю', 'Только соки', 'Исключить воду'],
];

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sessionStart(dayOffset, hour) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = addDays(today, dayOffset);
  start.setHours(hour, 0, 0, 0);
  return start;
}

function buildMasterClassesMeta(instructorCount, participantCount, categoryCount) {
  return MASTER_CLASS_TITLES.map((title, i) => {
    const instructorId = (i % instructorCount) + 1;
    const participantIds = [
      (i % participantCount) + 1,
      ((i + 5) % participantCount) + 1,
      ((i + 11) % participantCount) + 1,
    ].filter((id, idx, arr) => arr.indexOf(id) === idx);

    const categoryIds = [
      (i % categoryCount) + 1,
      ((i + 3) % categoryCount) + 1,
    ].filter((id, idx, arr) => arr.indexOf(id) === idx);

    return {
      name: title,
      description: `Практический мастер-класс «${title}»: разбор рациона, типичных ошибок и рекомендаций для повседневной жизни.`,
      price: 2400 + (i % 14) * 100,
      photo: PHOTOS[i % PHOTOS.length],
      instructorId,
      participantIds,
      categoryIds,
    };
  });
}

function buildSchedulesForAllMasterClasses(masterClassCount, locationCount) {
  const rows = [];
  for (let mcId = 1; mcId <= masterClassCount; mcId += 1) {
    SESSION_OFFSET_DAYS.forEach((dayOffset, idx) => {
      const startDate = sessionStart(dayOffset, SESSION_HOURS[idx]);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 3);
      rows.push({
        masterClassId: mcId,
        locationId: ((mcId + idx) % locationCount) + 1,
        startDate,
        endDate,
        maxParticipants: 12 + (mcId % 8),
      });
    });
  }
  return rows;
}

function buildPayments(schedules, participants, masterClasses) {
  const priceByMcId = new Map(masterClasses.map((mc) => [mc.id, parseFloat(mc.price)]));
  const statuses = ['paid', 'paid', 'pending', 'cancelled'];
  const used = new Set();
  const rows = [];

  schedules.forEach((schedule, index) => {
    if (rows.length >= MIN_ROWS && index % 2 !== 0) return;

    const participant = participants[index % participants.length];
    const key = `${participant.id}:${schedule.id}`;
    if (used.has(key)) return;
    used.add(key);

    const status = statuses[index % statuses.length];
    const amount = priceByMcId.get(schedule.masterClassId) || 2500;

    rows.push({
      participantId: participant.id,
      scheduleId: schedule.id,
      amount,
      status,
      paidAt: status === 'paid' ? addDays(new Date(), -3 - (index % 10)) : null,
      invoiceCode: `INV-${String(index + 1).padStart(5, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    });
  });

  let guard = 0;
  while (rows.length < MIN_ROWS && guard < schedules.length * 2) {
    const schedule = schedules[guard % schedules.length];
    const participant = participants[(guard + 7) % participants.length];
    const key = `${participant.id}:${schedule.id}`;
    if (!used.has(key)) {
      used.add(key);
      rows.push({
        participantId: participant.id,
        scheduleId: schedule.id,
        amount: priceByMcId.get(schedule.masterClassId) || 2500,
        status: 'paid',
        paidAt: addDays(new Date(), -5),
        invoiceCode: `INV-EXTRA-${guard}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      });
    }
    guard += 1;
  }

  return rows;
}

function buildReviews(participantCount, masterClassCount) {
  const rows = [];
  const used = new Set();

  for (let i = 0; i < MIN_ROWS; i += 1) {
    let participantId = (i % participantCount) + 1;
    let masterClassId = (i % masterClassCount) + 1;
    let key = `${participantId}:${masterClassId}`;
    let guard = 0;

    while (used.has(key) && guard < participantCount * masterClassCount) {
      masterClassId = (masterClassId % masterClassCount) + 1;
      participantId = ((participantId + 2) % participantCount) + 1;
      key = `${participantId}:${masterClassId}`;
      guard += 1;
    }
    used.add(key);

    rows.push({
      participantId,
      masterClassId,
      rating: (i % 5) + 1,
      comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
    });
  }

  return rows;
}

function buildFavorites(participantCount, masterClassCount) {
  const rows = [];
  const used = new Set();

  for (let i = 0; i < MIN_ROWS; i += 1) {
    let participantId = (i % participantCount) + 1;
    let masterClassId = ((i * 2) % masterClassCount) + 1;
    const key = `${participantId}:${masterClassId}`;
    if (used.has(key)) continue;
    used.add(key);
    rows.push({ participantId, masterClassId });
  }

  return rows;
}

function buildRefreshTokens(participantCount) {
  const expires = addDays(new Date(), 30);
  return Array.from({ length: MIN_ROWS }, (_, i) => ({
    participantId: (i % participantCount) + 1,
    token: `refresh-${i + 1}-${crypto.randomBytes(12).toString('hex')}`,
    expiresAt: expires,
  }));
}

function buildContactRequests(participantCount) {
  const guestNames = [
    'Анна Коваль', 'Сергей Литвин', 'Марина Савицкая', 'Игорь Панов', 'Ольга Рудак',
  ];
  return Array.from({ length: MIN_ROWS }, (_, i) => ({
    participantId: i % 3 === 0 ? (i % participantCount) + 1 : null,
    name: i % 3 === 0 ? PARTICIPANTS[i % participantCount].fullName : guestNames[i % guestNames.length],
    email: i % 3 === 0 ? PARTICIPANTS[i % participantCount].email : `guest${i + 1}@example.by`,
    message: `Здравствуйте! Хочу уточнить расписание мастер-класса и условия записи (${i + 1}).`,
    isRead: i % 4 === 0,
  }));
}

function buildContactThreads(participantCount) {
  return Array.from({ length: MIN_ROWS }, (_, i) => ({
    participantId: i + 1,
    lastMessageAt: addDays(new Date(), -(i % 14)),
  }));
}

function buildContactMessages(threadCount) {
  const samples = [
    'Добрый день! Подскажите, есть ли свободные места на ближайший сеанс?',
    'Спасибо, запись подтверждена.',
    'Можно ли перенести оплату на другой день?',
    'Получил счёт, оплачу сегодня вечером.',
    'Есть ли материалы после мастер-класса?',
  ];
  const roles = ['participant', 'admin'];
  return Array.from({ length: MIN_ROWS + 5 }, (_, i) => ({
    threadId: (i % threadCount) + 1,
    senderRole: roles[i % roles.length],
    message: samples[i % samples.length],
    readByAdmin: i % 2 === 0,
    readByParticipant: i % 3 !== 0,
  }));
}

function buildTests(count) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Тест: ${MASTER_CLASS_TITLES[i % MASTER_CLASS_TITLES.length]}`,
    description: `Проверка базовых знаний по теме «${MASTER_CLASS_TITLES[i % MASTER_CLASS_TITLES.length]}».`,
    isPublished: i % 3 !== 2,
  }));
}

function buildQuestionsAndAnswers(tests) {
  const questions = [];
  const answers = [];

  tests.forEach((test) => {
    for (let q = 0; q < QUESTIONS_PER_TEST; q += 1) {
      const bankIndex = (test.id + q) % TEST_QUESTION_BANK.length;
      questions.push({
        testId: test.id,
        text: TEST_QUESTION_BANK[bankIndex],
        orderIndex: q,
      });
    }
  });

  questions.forEach((question, qIndex) => {
    const bankIndex = qIndex % TEST_ANSWER_OPTIONS.length;
    const options = TEST_ANSWER_OPTIONS[bankIndex];
    options.forEach((text, aIndex) => {
      answers.push({
        questionId: question.id,
        text,
        isCorrect: aIndex === 0,
        orderIndex: aIndex,
      });
    });
  });

  return { questions, answers };
}

function buildTestResults(participants, tests) {
  const rows = [];
  const used = new Set();

  for (let i = 0; i < MIN_ROWS; i += 1) {
    const participant = participants[i % participants.length];
    const test = tests[i % tests.length];
    const key = `${participant.id}:${test.id}`;
    if (used.has(key)) continue;
    used.add(key);

    const correctCount = 2 + (i % 4);
    rows.push({
      participantId: participant.id,
      testId: test.id,
      correctCount,
      questionCount: QUESTIONS_PER_TEST,
      scorePercent: Math.round((correctCount / QUESTIONS_PER_TEST) * 100),
      completedAt: addDays(new Date(), -(i % 20)),
    });
  }

  return rows;
}

function assertMin(label, count) {
  if (count < MIN_ROWS) {
    throw new Error(`${label}: ${count} записей (нужно минимум ${MIN_ROWS})`);
  }
}

async function seedDatabase() {
  try {
    console.log(`Заполнение БД (минимум ${MIN_ROWS} записей в каждой таблице)...\n`);

    await sequelize.sync({ force: true });
    console.log('База данных пересоздана.\n');

    const instructors = await Instructor.bulkCreate(INSTRUCTORS);
    const participants = await Participant.bulkCreate(PARTICIPANTS);
    const categories = await Category.bulkCreate(CATEGORIES);
    const locations = await Location.bulkCreate(LOCATIONS);

    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const passwords = await ParticipantPassword.bulkCreate(
      participants.map((p) => ({ participantId: p.id, passwordHash }))
    );

    const masterClassesMeta = buildMasterClassesMeta(
      instructors.length,
      participants.length,
      categories.length
    );
    const masterClasses = await MasterClass.bulkCreate(
      masterClassesMeta.map(({ participantIds, categoryIds, ...rest }) => rest)
    );

    const participantLinks = [];
    const categoryLinks = [];
    masterClassesMeta.forEach((mc, index) => {
      mc.participantIds.forEach((participantId) => {
        participantLinks.push({
          masterClassId: masterClasses[index].id,
          participantId,
        });
      });
      mc.categoryIds.forEach((categoryId) => {
        categoryLinks.push({
          masterClassId: masterClasses[index].id,
          categoryId,
        });
      });
    });

    const mcp = await MasterClassParticipant.bulkCreate(participantLinks);
    const mcc = await MasterClassCategory.bulkCreate(categoryLinks);

    const schedules = await Schedule.bulkCreate(
      buildSchedulesForAllMasterClasses(masterClasses.length, locations.length)
    );

    const payments = await Payment.bulkCreate(
      buildPayments(schedules, participants, masterClasses)
    );
    const reviews = await Review.bulkCreate(
      buildReviews(participants.length, masterClasses.length)
    );
    const favorites = await Favorite.bulkCreate(
      buildFavorites(participants.length, masterClasses.length)
    );
    const refreshTokens = await RefreshToken.bulkCreate(
      buildRefreshTokens(participants.length)
    );
    const contactRequests = await ContactRequest.bulkCreate(
      buildContactRequests(participants.length)
    );
    const contactThreads = await ContactThread.bulkCreate(
      buildContactThreads(participants.length)
    );
    const contactMessages = await ContactMessage.bulkCreate(
      buildContactMessages(contactThreads.length)
    );

    const tests = await Test.bulkCreate(buildTests(MIN_ROWS));
    const questionRows = [];
    tests.forEach((test) => {
      for (let q = 0; q < QUESTIONS_PER_TEST; q += 1) {
        const bankIndex = (test.id + q) % TEST_QUESTION_BANK.length;
        questionRows.push({
          testId: test.id,
          text: TEST_QUESTION_BANK[bankIndex],
          orderIndex: q,
        });
      }
    });
    const questions = await Question.bulkCreate(questionRows);

    const answerRows = [];
    questions.forEach((question, qIndex) => {
      const options = TEST_ANSWER_OPTIONS[qIndex % TEST_ANSWER_OPTIONS.length];
      options.forEach((text, aIndex) => {
        answerRows.push({
          questionId: question.id,
          text,
          isCorrect: aIndex === 0,
          orderIndex: aIndex,
        });
      });
    });
    const answers = await Answer.bulkCreate(answerRows);

    const testResults = await TestResult.bulkCreate(
      buildTestResults(participants, tests)
    );

    const counts = {
      instructors: instructors.length,
      participants: participants.length,
      participant_passwords: passwords.length,
      masterclasses: masterClasses.length,
      master_class_participants: mcp.length,
      categories: categories.length,
      master_class_categories: mcc.length,
      locations: locations.length,
      schedules: schedules.length,
      payments: payments.length,
      reviews: reviews.length,
      favorites: favorites.length,
      refresh_tokens: refreshTokens.length,
      contact_requests: contactRequests.length,
      contact_threads: contactThreads.length,
      contact_messages: contactMessages.length,
      tests: tests.length,
      questions: questions.length,
      answers: answers.length,
      test_results: testResults.length,
    };

    console.log('Готово. Записей по таблицам:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count}`);
      assertMin(table, count);
    });

    console.log(`\nСеансов на каждый мастер-класс: ${SESSION_OFFSET_DAYS.length} (через 6, 14 и 21 день от сегодня)`);
    console.log(`Вопросов в каждом тесте: ${QUESTIONS_PER_TEST}`);
    console.log(`Пароль всех участников: ${defaultPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
}

seedDatabase();
