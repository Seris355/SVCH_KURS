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

const SPECIALIZATIONS = [
  'Диетолог',
  'Нутрициолог',
  'Эндокринолог',
  'Гастроэнтеролог',
  'Диетолог спортивный',
];

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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function buildInstructors(count) {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      fullName: `Инструктор ${n} Тестов`,
      specialization: SPECIALIZATIONS[i % SPECIALIZATIONS.length],
    };
  });
}

function buildParticipants(count) {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      fullName: `Участник ${n} Тестов`,
      email: `participant${n}@test.local`,
      phone: `+375 (29) ${pad2(n)}${pad2((n * 3) % 100)}-${pad2(n)}${pad2(n)}-${pad2(n)}`,
    };
  });
}

function buildCategories(count) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Категория питания ${i + 1}`,
    description: `Описание категории ${i + 1} для мастер-классов по здоровому питанию.`,
  }));
}

function buildLocations(count) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Площадка «Здоровье-${i + 1}»`,
    address: `г. Минск, ул. Примерная, ${i + 1}`,
    capacity: 15 + (i % 20),
  }));
}

function buildMasterClassesMeta(count, participantCount, categoryCount) {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const participantIds = [
      ((i % participantCount) + 1),
      (((i + 3) % participantCount) + 1),
    ].filter((v, idx, arr) => arr.indexOf(v) === idx);

    const categoryIds = [
      ((i % categoryCount) + 1),
      (((i + 2) % categoryCount) + 1),
    ].filter((v, idx, arr) => arr.indexOf(v) === idx);

    return {
      name: `Мастер-класс по здоровому питанию ${n}`,
      description:
        `Практический мастер-класс №${n}: основы сбалансированного рациона, полезные привычки и разбор типовых ошибок в питании.`,
      price: 2500 + (i % 12) * 100,
      photo: PHOTOS[i % PHOTOS.length],
      instructorId: (i % MIN_ROWS) + 1,
      participantIds,
      categoryIds,
    };
  });
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildSchedules(count, masterClassCount, locationCount) {
  const base = new Date(2026, 4, 5, 10, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const startDate = addDays(base, i * 2);
    startDate.setHours(10 + (i % 6), 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 2);

    return {
      masterClassId: (i % masterClassCount) + 1,
      locationId: (i % locationCount) + 1,
      startDate,
      endDate,
      maxParticipants: 12 + (i % 10),
    };
  });
}

function buildPayments(count, scheduleCount, participantCount) {
  const statuses = ['paid', 'pending', 'cancelled'];
  const used = new Set();
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    let participantId = (i % participantCount) + 1;
    let scheduleId = (i % scheduleCount) + 1;
    let key = `${participantId}:${scheduleId}`;
    let guard = 0;

    while (used.has(key) && guard < scheduleCount * participantCount) {
      scheduleId = (scheduleId % scheduleCount) + 1;
      participantId = ((participantId + 1) % participantCount) + 1;
      key = `${participantId}:${scheduleId}`;
      guard += 1;
    }
    used.add(key);

    const status = statuses[i % statuses.length];
    const paidAt =
      status === 'paid'
        ? addDays(new Date(2026, 3, 1, 12, 0, 0), i % 28)
        : null;

    rows.push({
      participantId,
      scheduleId,
      amount: 2500 + (i % 15) * 100,
      status,
      paidAt,
      invoiceCode: `SEED-PAY-${pad2(i + 1)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    });
  }

  return rows;
}

function buildReviews(count, participantCount, masterClassCount) {
  const rows = [];
  const used = new Set();

  for (let i = 0; i < count; i += 1) {
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
      comment: `Отзыв №${i + 1}: полезный мастер-класс, рекомендую.`,
    });
  }

  return rows;
}

function buildFavorites(count, participantCount, masterClassCount) {
  const rows = [];
  const used = new Set();

  for (let i = 0; i < count; i += 1) {
    let participantId = (i % participantCount) + 1;
    let masterClassId = ((i * 2) % masterClassCount) + 1;
    let key = `${participantId}:${masterClassId}`;
    let guard = 0;

    while (used.has(key) && guard < participantCount * masterClassCount) {
      masterClassId = (masterClassId % masterClassCount) + 1;
      participantId = ((participantId + 1) % participantCount) + 1;
      key = `${participantId}:${masterClassId}`;
      guard += 1;
    }
    used.add(key);

    rows.push({ participantId, masterClassId });
  }

  return rows;
}

function buildRefreshTokens(count, participantCount) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  return Array.from({ length: count }, (_, i) => ({
    participantId: (i % participantCount) + 1,
    token: `seed-refresh-${i + 1}-${crypto.randomBytes(16).toString('hex')}`,
    expiresAt: expires,
  }));
}

function buildContactRequests(count, participantCount) {
  return Array.from({ length: count }, (_, i) => ({
    participantId: i % 2 === 0 ? (i % participantCount) + 1 : null,
    name: `Гость ${i + 1}`,
    email: `guest${i + 1}@test.local`,
    message: `Обращение №${i + 1}: вопрос о записи на мастер-класс.`,
    isRead: i % 3 === 0,
  }));
}

function buildContactThreads(count) {
  const base = new Date(2026, 4, 1, 10, 0, 0);
  return Array.from({ length: count }, (_, i) => ({
    participantId: i + 1,
    lastMessageAt: addDays(base, i % 28),
  }));
}

function buildContactMessages(count, threadCount) {
  const roles = ['participant', 'admin'];
  return Array.from({ length: count }, (_, i) => ({
    threadId: (i % threadCount) + 1,
    senderRole: roles[i % roles.length],
    message: `Сообщение чата №${i + 1}: текст переписки с администратором.`,
    readByAdmin: i % 2 === 0,
    readByParticipant: i % 3 === 0,
  }));
}

function buildTests(count) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Тест по питанию ${i + 1}`,
    description: `Проверка знаний по теме «Здоровое питание», блок ${i + 1}.`,
    isPublished: i % 2 === 0,
  }));
}

function buildQuestions(count, testCount) {
  return Array.from({ length: count }, (_, i) => ({
    testId: (i % testCount) + 1,
    text: `Вопрос ${i + 1}: что важно для сбалансированного рациона?`,
    orderIndex: i % 5,
  }));
}

function buildAnswers(count, questionCount) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const questionId = (i % questionCount) + 1;
    rows.push({
      questionId,
      text: `Вариант ${(i % 4) + 1} для вопроса ${questionId}`,
      isCorrect: i % 4 === 0,
      orderIndex: i % 4,
    });
  }
  return rows;
}

function buildTestResults(count, participantCount, testCount) {
  const rows = [];
  const used = new Set();

  for (let i = 0; i < count; i += 1) {
    let participantId = (i % participantCount) + 1;
    let testId = (i % testCount) + 1;
    let key = `${participantId}:${testId}`;
    let guard = 0;

    while (used.has(key) && guard < participantCount * testCount) {
      testId = (testId % testCount) + 1;
      participantId = ((participantId + 1) % participantCount) + 1;
      key = `${participantId}:${testId}`;
      guard += 1;
    }
    used.add(key);

    const questionCount = 10;
    const correctCount = 4 + (i % 6);
    rows.push({
      participantId,
      testId,
      correctCount,
      questionCount,
      scorePercent: Math.round((correctCount / questionCount) * 100),
      completedAt: addDays(new Date(2026, 4, 1, 14, 0, 0), i % 28),
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

    const instructors = await Instructor.bulkCreate(buildInstructors(MIN_ROWS));
    const participants = await Participant.bulkCreate(buildParticipants(MIN_ROWS));
    const categories = await Category.bulkCreate(buildCategories(MIN_ROWS));
    const locations = await Location.bulkCreate(buildLocations(MIN_ROWS));

    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const passwords = await ParticipantPassword.bulkCreate(
      participants.map((p) => ({ participantId: p.id, passwordHash }))
    );

    const masterClassesMeta = buildMasterClassesMeta(
      MIN_ROWS,
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

    while (participantLinks.length < MIN_ROWS) {
      const i = participantLinks.length;
      participantLinks.push({
        masterClassId: masterClasses[i % masterClasses.length].id,
        participantId: participants[i % participants.length].id,
      });
    }
    while (categoryLinks.length < MIN_ROWS) {
      const i = categoryLinks.length;
      categoryLinks.push({
        masterClassId: masterClasses[i % masterClasses.length].id,
        categoryId: categories[i % categories.length].id,
      });
    }

    const mcp = await MasterClassParticipant.bulkCreate(participantLinks);
    const mcc = await MasterClassCategory.bulkCreate(categoryLinks);

    const schedules = await Schedule.bulkCreate(
      buildSchedules(MIN_ROWS + 5, masterClasses.length, locations.length)
    );
    const payments = await Payment.bulkCreate(
      buildPayments(MIN_ROWS, schedules.length, participants.length)
    );
    const reviews = await Review.bulkCreate(
      buildReviews(MIN_ROWS, participants.length, masterClasses.length)
    );
    const favorites = await Favorite.bulkCreate(
      buildFavorites(MIN_ROWS, participants.length, masterClasses.length)
    );
    const refreshTokens = await RefreshToken.bulkCreate(
      buildRefreshTokens(MIN_ROWS, participants.length)
    );
    const contactRequests = await ContactRequest.bulkCreate(
      buildContactRequests(MIN_ROWS, participants.length)
    );
    const contactThreads = await ContactThread.bulkCreate(
      buildContactThreads(MIN_ROWS)
    );
    const contactMessages = await ContactMessage.bulkCreate(
      buildContactMessages(MIN_ROWS + 5, contactThreads.length)
    );
    const tests = await Test.bulkCreate(buildTests(MIN_ROWS));
    const questions = await Question.bulkCreate(
      buildQuestions(MIN_ROWS, tests.length)
    );
    const answers = await Answer.bulkCreate(
      buildAnswers(MIN_ROWS * 2, questions.length)
    );
    const testResults = await TestResult.bulkCreate(
      buildTestResults(MIN_ROWS, participants.length, tests.length)
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

    console.log(`\nПароль всех участников: ${defaultPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
}

seedDatabase();
