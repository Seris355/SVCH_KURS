export function isSessionPast(startDate) {
  if (!startDate) return false;
  return new Date(startDate) <= new Date();
}

export function getNearestUpcomingSchedule(schedules) {
  if (!Array.isArray(schedules) || schedules.length === 0) return null;

  const now = new Date();
  const upcoming = schedules
    .filter((schedule) => schedule?.startDate && new Date(schedule.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return upcoming[0] || null;
}

export function filterBookableSchedules(schedules, options = {}) {
  const { excludeScheduleId, now = new Date() } = options;

  return (schedules || []).filter((schedule) => {
    if (excludeScheduleId != null && Number(schedule.id) === Number(excludeScheduleId)) {
      return false;
    }
    if (!schedule?.startDate || new Date(schedule.startDate) <= now) return false;
    if (schedule.capacityLeft != null && schedule.capacityLeft <= 0) return false;
    if (schedule.canEnroll === false) return false;
    return true;
  });
}
