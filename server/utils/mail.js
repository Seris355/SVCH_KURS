const nodemailer = require('nodemailer');

let transporterCache;

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && String(process.env.SMTP_HOST).trim());
}

function getTransporter() {
  if (!smtpConfigured()) {
    return null;
  }
  if (!transporterCache) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporterCache = nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER ?
          {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
          }
        : undefined,
    });
  }
  return transporterCache;
}

async function sendSessionReminderEmail({
  to,
  participantName,
  masterClassName,
  startDate,
  locationLine,
}) {
  const transport = getTransporter();
  if (!transport) {
    return { ok: false, reason: 'smtp_not_configured' };
  }
  const from =
    process.env.MAIL_FROM?.trim() || process.env.SMTP_USER || 'noreply@localhost';

  const whenRu = new Date(startDate).toLocaleString('ru-RU', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const subject = `Напоминание: занятие «${masterClassName}»`;

  const text = [
    `Здравствуйте, ${participantName || 'участник'}!`,
    '',
    `Напоминаем: занятие «${masterClassName}» начнётся ${whenRu}.`,
    ...(locationLine ? [`Место: ${locationLine}.`] : []),
    '',
    'Ждём вас!',
  ].join('\n');

  await transport.sendMail({ from, to, subject, text });

  return { ok: true };
}

module.exports = {
  smtpConfigured,
  getTransporter,
  sendSessionReminderEmail,
};
