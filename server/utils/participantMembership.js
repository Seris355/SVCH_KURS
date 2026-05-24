const { Op } = require('sequelize');
const { MasterClass, Schedule, Payment, Location } = require('../models');

async function reconcileParticipantMcMembership(masterClassId, participantId) {
  const mc = await MasterClass.findByPk(masterClassId);
  if (!mc) return;

  const scheduleRows = await Schedule.findAll({
    where: { masterClassId },
    attributes: ['id'],
    raw: true,
  });
  const scheduleIds = scheduleRows.map((s) => s.id);

  const setIds = new Set(mc.participantIds || []);

  if (scheduleIds.length === 0) {
    setIds.delete(participantId);
    await mc.update({ participantIds: Array.from(setIds) });
    return;
  }

  const activeCount = await Payment.count({
    where: {
      participantId,
      scheduleId: { [Op.in]: scheduleIds },
      status: { [Op.in]: ['pending', 'paid'] },
    },
  });

  if (activeCount > 0) {
    setIds.add(participantId);
  } else {
    setIds.delete(participantId);
  }

  await mc.update({ participantIds: Array.from(setIds) });
}

async function findActiveEnrollmentPayment(participantId, masterClassId) {
  const scheduleRows = await Schedule.findAll({
    where: { masterClassId },
    attributes: ['id'],
    raw: true,
  });
  const scheduleIds = scheduleRows.map((s) => s.id);
  if (!scheduleIds.length) return null;

  return Payment.findOne({
    where: {
      participantId,
      scheduleId: { [Op.in]: scheduleIds },
      status: { [Op.in]: ['pending', 'paid'] },
    },
    include: [
      {
        model: Schedule,
        as: 'schedule',
        include: [
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'address'],
          },
        ],
      },
    ],
  });
}

module.exports = {
  reconcileParticipantMcMembership,
  findActiveEnrollmentPayment,
};
