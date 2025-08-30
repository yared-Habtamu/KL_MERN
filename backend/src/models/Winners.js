const mongoose = require('mongoose');

const WinnerSchema = new mongoose.Schema(
  {
    lotteryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lottery',
      required: true,
      unique: true,
    },
    winners: [
      {
        name: String,
        phone: String,
        registeredAt: Date,
        winnerRank: Number,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Winner', WinnerSchema, 'Winners');