import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Lottery from "../src/models/lottery";
import User from "../src/models/user";
import Winner from "../src/models/winner";

describe("winner registration", () => {
  let mongod: MongoMemoryServer;
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
  afterEach(async () => {
    await Lottery.deleteMany({});
    await User.deleteMany({});
    await Winner.deleteMany({});
  });

  it("registers winners with ranks based on prizes", async () => {
    const u = await User.create({
      name: "Bob",
      phone: "0922",
      role: "agent",
      passwordHash: "x",
      balance: 0,
    });
    const l = await Lottery.create({
      title: "L",
      ticketCount: 10,
      ticketPrice: 1,
      type: "company",
      createdBy: u._id,
    });
    l.prizes = [
      { rank: 1, title: "First" },
      { rank: 2, title: "Second" },
    ];
    await l.save();

    const winnersPayload = [
      { name: "W1", phone: "010" },
      { name: "W2", phone: "011" },
    ];
    // emulate controller logic: limit by prizes length and attach ranks
    const max = Array.isArray(l.prizes) ? l.prizes.length : 0;
    const prizes = Array.isArray(l.prizes) ? l.prizes : [];
    const toRegister = winnersPayload
      .slice(0, max)
      .map((w: any, idx: number) => ({
        name: w.name,
        phone: w.phone,
        registeredAt: new Date(),
        winnerRank: (prizes[idx] && prizes[idx].rank) || idx + 1,
      }));

    const created = await Winner.create({
      lotteryId: l._id,
      winners: toRegister,
      createdBy: u._id,
    });
    expect(created.winners.length).toBe(2);
    expect(created.winners[0].winnerRank).toBe(1);
    expect(created.winners[1].winnerRank).toBe(2);
  });
});
