const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** За сколько дней до сеанса показывается напоминалка (см. reminderController). */
const REMINDER_DAYS_AHEAD = 3;

/** Минимум дней до начала сеанса, чтобы отменить или перенести запись. */
const MIN_DAYS_BEFORE_MODIFY = 7;

function getDaysUntilSession(startDate) {
  const start = new Date(startDate);
  const diffMs = start.getTime() - Date.now();
  return diffMs / MS_PER_DAY;
}

function getEnrollmentModifyStatus(startDate) {
  if (!startDate) {
    return {
      canModify: false,
      daysUntilSession: null,
      modifyBlockedReason: 'Сеанс не найден',
    };
  }

  const daysUntil = getDaysUntilSession(startDate);

  if (daysUntil <= 0) {
    return {
      canModify: false,
      daysUntilSession: 0,
      modifyBlockedReason: 'Сеанс уже начался или прошёл',
    };
  }

  if (daysUntil < MIN_DAYS_BEFORE_MODIFY) {
    return {
      canModify: false,
      daysUntilSession: Math.ceil(daysUntil),
      modifyBlockedReason: `Отмена и смена даты доступны не позднее чем за ${MIN_DAYS_BEFORE_MODIFY} дней до начала сеанса`,
    };
  }

  return {
    canModify: true,
    daysUntilSession: Math.ceil(daysUntil),
    modifyBlockedReason: null,
  };
}

function assertCanModifyEnrollment(startDate) {
  const status = getEnrollmentModifyStatus(startDate);
  if (!status.canModify) {
    const error = new Error(status.modifyBlockedReason);
    error.statusCode = 400;
    throw error;
  }
  return status;
}

module.exports = {
  REMINDER_DAYS_AHEAD,
  MIN_DAYS_BEFORE_MODIFY,
  getDaysUntilSession,
  getEnrollmentModifyStatus,
  assertCanModifyEnrollment,
};
