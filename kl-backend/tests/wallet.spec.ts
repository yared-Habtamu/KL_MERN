import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../src/models/user";
import Transaction from "../src/models/transaction";
import { applyTransaction } from "../src/services/wallet";

describe("wallet.applyTransaction", () => {
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
    await User.deleteMany({});
    await Transaction.deleteMany({});
  });

  it("creates a completed purchase and decrements balance atomically", async () => {
    const user = await User.create({
      name: "Alice",
      phone: "0911",
      role: "client",
      passwordHash: "x",
      balance: 100,
    });
    const res = await applyTransaction({
      userId: String(user._id),
      type: "purchase",
      amount: 30,
    });
    expect(res.balance).toBe(70);
    const tx = await Transaction.findById(res.transaction._id);
    expect(tx).not.toBeNull();
    expect(tx?.type).toBe("purchase");
  });
});
