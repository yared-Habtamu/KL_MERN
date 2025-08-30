import Ticket from '../models/Ticket.js';
import Lottery from '../models/Lottery.js';
import Customer from '../models/Customer.js';

// Get all winners
export const getAllWinners = async (req, res) => {
  try {
    const winners = await Ticket.find({ status: 'winner' })
      .populate('lotteryId', 'title prizes')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    const formattedWinners = winners.map(ticket => {
      // Find the prize title for this winner's rank
      let prizeTitle = '';
      if (ticket.lotteryId?.prizes && Array.isArray(ticket.lotteryId.prizes)) {
        const prizeObj = ticket.lotteryId.prizes.find(p => p.rank === ticket.winnerRank);
        prizeTitle = prizeObj ? prizeObj.title : '';
      }
      return {
        id: ticket._id,
        name: ticket.customer?.name || 'Unknown',
        lottery: ticket.lotteryId?.title || 'Unknown Lottery',
        lotteryId: ticket.lotteryId?._id,
        ticketId: ticket.uniqueTicketCode,
        ticketNumber: ticket.ticketNumber,
        winningNumbers: [ticket.ticketNumber], // For now, just the ticket number
        prizeAmount: prizeTitle, // Use the actual prize title
        prizeLevel: getPrizeLevel(ticket.winnerRank),
        status: 'claimed', // This should be enhanced with actual claim status
        winDate: ticket.createdAt.toISOString().split('T')[0],
        claimDate: ticket.paymentConfirmedAt?.toISOString().split('T')[0] || null
      };
    });

    res.json(formattedWinners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to get prize level name
const getPrizeLevel = (rank) => {
  switch (rank) {
    case 1:
      return '1st Prize';
    case 2:
      return '2nd Prize';
    case 3:
      return '3rd Prize';
    default:
      return `${rank}th Prize`;
  }
}; 