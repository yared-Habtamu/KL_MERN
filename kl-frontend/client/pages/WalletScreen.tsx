import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Minus,
  Download,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { TransactionListItem } from "../components/wallet/TransactionListItem";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Modal } from "../components/ui/Modal";
import { InputField } from "../components/ui/InputField";
import {
  formatCurrency,
  Transaction,
  getUserTransactions,
  mockCurrentUser,
} from "../lib/mock-data";
import { wallet } from "../lib/api";
import { useToast } from "../components/ui/ToastNotification";

const WalletScreen: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const w: any = await wallet.get();
        setBalance(Number(w.balance ?? 0));
        const txs: any = await wallet.transactions();
        setTransactions(Array.isArray(txs) ? txs : []);
      } catch (err: any) {
        console.error("Failed to load wallet", err);
        // fallback to demo/mock data so UI shows values during local development
        try {
          setBalance(Number(mockCurrentUser.balance || 0));
          setTransactions(getUserTransactions(mockCurrentUser.id));
        } catch (_) {}
      }
    })();
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true;
    return transaction.type === filter;
  });

  // Calculate stats
  const totalDeposits = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce(
      (sum, t) => sum + Number((t as any).amount ?? (t as any).price ?? 0),
      0,
    );

  const totalWithdrawals = transactions
    // backend uses type 'withdraw'
    .filter(
      (t) =>
        ((t as any).type === "withdraw" || t.type === "withdrawal") &&
        t.status === "completed",
    )
    .reduce((sum, t) => {
      const v = Number((t as any).amount ?? (t as any).price ?? 0);
      return sum + Math.abs(isNaN(v) ? 0 : v);
    }, 0);

  const totalSpent = transactions
    // backend uses type 'purchase' or 'ticket_purchase'
    .filter(
      (t) =>
        ((t as any).type === "purchase" || t.type === "ticket_purchase") &&
        t.status === "completed",
    )
    .reduce((sum, t) => {
      const v = Number((t as any).amount ?? (t as any).price ?? 0);
      return sum + Math.abs(isNaN(v) ? 0 : v);
    }, 0);

  const totalWinnings = transactions
    // backend uses type 'refund' for payouts in some flows; also accept 'prize_payout'
    .filter(
      (t) =>
        ((t as any).type === "refund" || t.type === "prize_payout") &&
        t.status === "completed",
    )
    .reduce((sum, t) => {
      const v = Number((t as any).amount ?? (t as any).price ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > balance) return;

    if (!accountHolderName.trim()) {
      addToast({
        type: "error",
        title: "Account Holder Name Required",
        message: "Please enter the full name of the account holder",
      });
      return;
    }

    if (withdrawMethod === "bank" && !bankAccountNumber.trim()) {
      addToast({
        type: "error",
        title: "Bank Account Number Required",
        message: "Please enter your bank account number",
      });
      return;
    }

    if (withdrawMethod === "telebirr" && !bankAccountNumber.trim()) {
      addToast({
        type: "error",
        title: "Telebirr Number Required",
        message: "Please enter your Telebirr phone number",
      });
      return;
    }

    try {
      await wallet.withdraw({
        amount,
        method: withdrawMethod,
        accountNumber: bankAccountNumber,
        accountName: accountHolderName,
      });

      // refresh balance and transactions
      const w: any = await wallet.get();
      setBalance(w.balance || 0);
      const txs: any = await wallet.transactions();
      setTransactions(txs || []);

      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setBankAccountNumber("");
      setAccountHolderName("");

      addToast({
        type: "success",
        title: "Withdrawal Requested",
        message: `Your withdrawal request of ${formatCurrency(amount)} has been submitted and will be processed shortly.`,
      });
    } catch (err: any) {
      console.error("Withdraw failed", err);
      const message =
        err?.body?.message || err?.body || "Failed to request withdrawal";
      addToast({ type: "error", title: "Withdrawal Failed", message });
    }
  };

  const getFilterCount = (filterType: string) => {
    if (filterType === "all") return transactions.length;
    return transactions.filter((t) => t.type === filterType).length;
  };

  return (
    <PageLayout>
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-kiya-surface hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} className="text-kiya-text" />
          </button>
          <h1 className="text-xl font-bold text-kiya-text">My Wallet</h1>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-kiya-primary to-kiya-primary-dark">
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white mb-4">
              {formatCurrency(balance)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate("/deposit")}
              >
                <Plus size={16} className="mr-2" />
                Deposit
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setShowWithdrawModal(true)}
                disabled={balance <= 0}
              >
                <Minus size={16} className="mr-2" />
                Withdraw
              </Button>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-kiya-green" />
              <span className="text-sm text-kiya-text-secondary">Deposits</span>
            </div>
            <p className="text-lg font-bold text-kiya-green">
              {formatCurrency(totalDeposits)}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown size={16} className="text-kiya-red" />
              <span className="text-sm text-kiya-text-secondary">
                Withdrawals
              </span>
            </div>
            <p className="text-lg font-bold text-kiya-red">
              {formatCurrency(totalWithdrawals)}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Download size={16} className="text-kiya-warning" />
              <span className="text-sm text-kiya-text-secondary">Spent</span>
            </div>
            <p className="text-lg font-bold text-kiya-warning">
              {formatCurrency(totalSpent)}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-kiya-teal" />
              <span className="text-sm text-kiya-text-secondary">Winnings</span>
            </div>
            <p className="text-lg font-bold text-kiya-teal">
              {formatCurrency(totalWinnings)}
            </p>
          </Card>
        </div>

        {/* Transaction Filters */}
        <Card padding="sm">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { key: "all", label: "All" },
              { key: "deposit", label: "Deposits" },
              { key: "withdraw", label: "Withdrawals" },
              { key: "purchase", label: "Purchases" },
              { key: "refund", label: "Winnings" },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === filterOption.key
                    ? "bg-kiya-teal text-white"
                    : "bg-kiya-dark text-kiya-text-secondary hover:bg-gray-700"
                }`}
              >
                {filterOption.label} ({getFilterCount(filterOption.key)})
              </button>
            ))}
          </div>
        </Card>

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-kiya-text">
              Transaction History
            </h2>
            {filteredTransactions.length > 0 && (
              <span className="text-sm text-kiya-text-secondary">
                {filteredTransactions.length} transaction
                {filteredTransactions.length !== 1 ? "s" : ""}
              </span>
            )}

            {filteredTransactions.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-kiya-text-secondary mb-4">
                  {filter === "all"
                    ? "No transactions yet"
                    : `No ${filter.replace("_", " ")} transactions`}
                </p>
                {filter !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    Show All Transactions
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction, idx) => (
                  <TransactionListItem
                    key={
                      (transaction as any)._id || (transaction as any).id || idx
                    }
                    transaction={transaction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {transactions.length === 0 && (
            <Card className="text-center py-6 border-kiya-teal/20 bg-kiya-teal/5">
              <h3 className="text-lg font-semibold text-kiya-text mb-2">
                Get Started with Your Wallet
              </h3>
              <p className="text-kiya-text-secondary mb-4">
                Add funds to start participating in lotteries
              </p>
              <Button variant="primary" onClick={() => navigate("/deposit")}>
                Make Your First Deposit
              </Button>
            </Card>
          )}
        </div>

        {/* Withdraw Modal */}
        <Modal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          title="Withdraw Funds"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="bg-kiya-dark rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">
                  Available Balance:
                </span>
                <span className="text-kiya-text font-bold">
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>

            <InputField
              label="Withdrawal Amount"
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              helperText={`Maximum: ${formatCurrency(balance)}`}
            />

            <div className="space-y-2">
              <label className="block text-label font-medium text-kiya-text">
                Withdrawal Method
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: "bank",
                    label: "Bank Transfer",
                    desc: "Transfer to your bank account",
                  },
                  {
                    value: "telebirr",
                    label: "Telebirr",
                    desc: "Transfer to your Telebirr account",
                  },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setWithdrawMethod(method.value)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      withdrawMethod === method.value
                        ? "border-kiya-teal bg-kiya-teal/10 text-kiya-teal"
                        : "border-gray-600 bg-kiya-surface text-kiya-text hover:border-kiya-teal"
                    }`}
                  >
                    <div className="font-medium">{method.label}</div>
                    <div className="text-sm text-kiya-text-secondary">
                      {method.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label="Account Holder Full Name *"
              placeholder="Enter the full name on the account"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              helperText="Must match exactly with your bank account or Telebirr account name"
            />

            <InputField
              label={
                withdrawMethod === "bank"
                  ? "Bank Account Number *"
                  : "Telebirr Phone Number *"
              }
              placeholder={
                withdrawMethod === "bank"
                  ? "Enter your bank account number"
                  : "Enter your Telebirr number (e.g., 0911234567)"
              }
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              helperText={
                withdrawMethod === "bank"
                  ? "Your bank account number"
                  : "Your registered Telebirr phone number"
              }
            />

            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="full"
                onClick={() => setShowWithdrawModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="full"
                onClick={handleWithdraw}
                disabled={
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) > balance ||
                  !accountHolderName.trim() ||
                  !bankAccountNumber.trim()
                }
              >
                Withdraw{" "}
                {withdrawAmount && formatCurrency(parseFloat(withdrawAmount))}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default WalletScreen;
