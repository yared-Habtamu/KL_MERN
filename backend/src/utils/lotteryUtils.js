// Utility functions for lottery logic
import Lottery from '../models/Lottery.js';

export async function checkLotteryStatus(lotteryId, expectedStatus) {
  const lottery = await Lottery.findById(lotteryId);
  if (!lottery) throw new Error('Lottery not found');
  if (lottery.status !== expectedStatus) throw new Error(`Lottery status must be '${expectedStatus}'`);
  return lottery;
}

export async function incrementTicketsSold(lottery) {
  lottery.ticketsSold += 1;
  await lottery.save();
  return lottery;
}

export async function endLotteryIfSoldOut(lottery) {
  if (lottery.ticketsSold >= lottery.ticketCount) {
    lottery.status = 'ended';
    lottery.endedAt = new Date();
    await lottery.save();
    return true;
  }
  return false;
} 