const { Op } = require('sequelize');
const {
  Payment,
  Schedule,
  MasterClass,
  Participant,
  Location,
  ScheduleReminderLog,
} = require('../models');
const { sendSessionReminderEmail } = require('../utils/mail');

const DEFAULT_KIND = 'session_upcoming';

function parseLeadHours() {
  const raw = parseFloat(process.env.REMINDER_LEAD_HOURS || '24');
  if (Number.isNaN(raw) || raw < 1 || raw > 168) return 24;
  return raw;
}

function parseToleranceMinutes() {
  const raw = parseInt(process.env.REMINDER_TOLERANCE_MINUTES || '45', 10);
  if (Number.isNaN(raw) || raw < 10 || raw > 180) return 45;
  return raw;
}

function hoursUntil(dateValue) {
  const ms = new Date(dateValue).getTime() - Date.now();
  return ms / (60 * 60 * 1000);
}

async function runSessionReminderJob() {
  const summary = {
    scanned: 0,
    candidates: 0,
    sent: 0,
    skippedNoEmail: 0,
    skippedAlreadySent: 0,
    skippedWrongWindow: 0,
    skippedSmtp: 0,
    errors: [],
  };

  const lead = parseLeadHours();
  const tolMin = parseToleranceMinutes();
  const halfWindow = tolMin / 60;

  const payments = await Payment.findAll({
    where: { status: { [Op.in]: ['pending', 'paid'] } },
    include: [
      {
        model: Participant,
        as: 'participant',
        required: true,
        attributes: ['id', 'fullName', 'email'],
      },
      {
        model: Schedule,
        as: 'schedule',
        required: true,
        attributes: ['id', 'startDate', 'endDate'],
        include: [
          {
            model: MasterClass,
            as: 'masterClass',
            required: true,
            attributes: ['id', 'name'],
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'address'],
            required: false,
          },
        ],
      },
    ],
  });

  summary.scanned = payments.length;

  for (const payment of payments) {
    const participant = payment.participant;
    const schedule = payment.schedule;
    if (!participant || !schedule) continue;

    const start = schedule.startDate;
    if (new Date(start) <= new Date()) {
      continue;
    }

    const h = hoursUntil(start);
    if (Math.abs(h - lead) > halfWindow) {
      summary.skippedWrongWindow += 1;
      continue;
    }

    summary.candidates += 1;

    const email = participant.email && String(participant.email).trim();
    if (!email) {
      summary.skippedNoEmail += 1;
      continue;
    }

    const existing = await ScheduleReminderLog.findOne({
      where: {
        participantId: participant.id,
        scheduleId: schedule.id,
        kind: DEFAULT_KIND,
      },
    });
    if (existing) {
      summary.skippedAlreadySent += 1;
      continue;
    }

    const locationBits = [];
    if (schedule.location?.name) locationBits.push(schedule.location.name);
    if (schedule.location?.address) locationBits.push(schedule.location.address);
    const locationLine = locationBits.length ? locationBits.join(', ') : '';

    try {
      const result = await sendSessionReminderEmail({
        to: email,
        participantName: participant.fullName,
        masterClassName: schedule.masterClass?.name || 'Мастер-класс',
        startDate: start,
        locationLine,
      });

      if (!result.ok) {
        summary.skippedSmtp += 1;
        continue;
      }

      await ScheduleReminderLog.create({
        participantId: participant.id,
        scheduleId: schedule.id,
        kind: DEFAULT_KIND,
      });
      summary.sent += 1;
    } catch (err) {
      summary.errors.push({
        participantId: participant.id,
        scheduleId: schedule.id,
        message: err.message || String(err),
      });
    }
  }

  return summary;
}

module.exports = { runSessionReminderJob, DEFAULT_KIND };
