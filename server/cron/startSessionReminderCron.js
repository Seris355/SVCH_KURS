const cron = require('node-cron');
const { runSessionReminderJob } = require('../jobs/sessionReminderJob');
const { smtpConfigured } = require('../utils/mail');

function startSessionReminderCron() {
  const enabled = process.env.ENABLE_SESSION_REMINDERS === 'true';
  const pattern = (
    process.env.REMINDER_CRON_EXPRESSION || '*/10 * * * *'
  ).trim();

  if (!enabled) {
    console.log(
      'Session reminders: cron disabled — set ENABLE_SESSION_REMINDERS=true to enable.'
    );
    return;
  }

  if (!smtpConfigured()) {
    console.warn(
      'Session reminders: ENABLE_SESSION_REMINDERS is true but SMTP_HOST is missing — emails will not be sent.'
    );
  }

  cron.schedule(pattern, async () => {
    try {
      const r = await runSessionReminderJob();
      if (r.sent > 0) {
        console.log(`Session reminders: sent ${r.sent} messages.`);
      }
    } catch (e) {
      console.error('Session reminder cron failed:', e);
    }
  });

  console.log(`Session reminders cron scheduled: "${pattern}".`);
}

module.exports = { startSessionReminderCron };
