import React from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Ticket,
  Trophy,
  DollarSign,
} from "lucide-react";
import {
  Transaction,
  formatCurrency,
  formatDateTime,
} from "../../lib/mock-data";

interface TransactionListItemProps {
  transaction: any; // backend transaction shape may differ from mock-data
  showDate?: boolean;
}

export const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  showDate = true,
}) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="text-kiya-green" size={20} />;
      case "withdrawal":
        return <ArrowUpRight className="text-kiya-red" size={20} />;
      case "ticket_purchase":
        return <Ticket className="text-kiya-teal" size={20} />;
      case "prize_payout":
        return <Trophy className="text-yellow-400" size={20} />;
      case "commission":
        return <DollarSign className="text-kiya-primary" size={20} />;
      default:
        return <DollarSign className="text-kiya-text-secondary" size={20} />;
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "withdrawal":
        return "Withdrawal";
      case "ticket_purchase":
        return "Ticket Purchase";
      case "prize_payout":
        return "Prize Payout";
      case "commission":
        return "Commission";
      default:
        return "Transaction";
    }
  };

  const getAmountColor = (amount: number, type: string) => {
    // treat outgoing types as negative for coloring
    const outgoing = [
      "withdraw",
      "withdrawal",
      "purchase",
      "ticket_purchase",
      "commission",
    ];
    const val = outgoing.includes(type) ? -Math.abs(amount) : amount;
    return val >= 0 ? "text-kiya-green" : "text-kiya-red";
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-kiya-green/10 text-kiya-green border-kiya-green/20";
      case "pending":
        return "bg-kiya-warning/10 text-kiya-warning border-kiya-warning/20";
      case "failed":
        return "bg-kiya-red/10 text-kiya-red border-kiya-red/20";
      default:
        return "bg-gray-600/10 text-gray-400 border-gray-600/20";
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const outgoing = [
      "withdraw",
      "withdrawal",
      "purchase",
      "ticket_purchase",
      "commission",
    ];
    const val = outgoing.includes(type) ? -Math.abs(amount) : amount;
    const sign = val >= 0 ? "+" : "";
    return `${sign}${formatCurrency(Math.abs(val))}`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-kiya-surface rounded-lg border border-gray-700">
      {/* Transaction Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-kiya-dark rounded-full flex items-center justify-center">
        {getTransactionIcon(transaction.type)}
      </div>

      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-kiya-text truncate">
            {getTransactionTitle(transaction.type)}
          </h4>
          <div className="flex items-center space-x-2">
            <span
              className={`font-semibold ${getAmountColor(transaction.amount, transaction.type)}`}
            >
              {formatAmount(transaction.amount, transaction.type)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-kiya-text-secondary truncate pr-2">
            {transaction.description ||
              transaction.meta?.description ||
              transaction.meta?.note ||
              ""}
          </p>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyles(transaction.status)}`}
            >
              {(() => {
                const status =
                  transaction.status || transaction.meta?.status || "completed";
                return status.charAt(0).toUpperCase() + status.slice(1);
              })()}
            </span>
          </div>
        </div>

        {showDate && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-kiya-text-secondary">
              {formatDateTime(transaction.date || transaction.createdAt)}
            </span>
            {transaction.reference && (
              <span className="text-xs text-kiya-text-secondary font-mono">
                {transaction.reference}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
