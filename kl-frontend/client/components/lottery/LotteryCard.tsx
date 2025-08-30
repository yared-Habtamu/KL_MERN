import React from "react";
import { Calendar, Clock, Trophy, Users } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Lottery, formatCurrency, formatDate } from "../../lib/mock-data";

interface LotteryCardProps {
  lottery: Lottery;
  onViewDetails?: () => void;
  showActions?: boolean;
  variant?: "default" | "compact";
}

export const LotteryCard: React.FC<LotteryCardProps> = ({
  lottery,
  onViewDetails,
  showActions = true,
  variant = "default",
}) => {
  const soldTickets =
    lottery?.soldTickets != null ? Number(lottery.soldTickets) : null;
  const totalTickets =
    lottery?.totalTickets != null ? Number(lottery.totalTickets) : null;
  const progress =
    soldTickets != null && totalTickets != null && totalTickets > 0
      ? (soldTickets / totalTickets) * 100
      : null;
  const allTicketsSold =
    totalTickets != null ? (soldTickets ?? 0) >= totalTickets : false;
  const isCompleted =
    String(lottery?.status || "").toLowerCase() === "completed";

  const statusColors = {
    active: "text-kiya-green",
    upcoming: "text-kiya-warning",
    completed: "text-kiya-text-secondary",
    cancelled: "text-kiya-red",
  };

  if (variant === "compact") {
    return (
      <Card className="w-full" hover onClick={onViewDetails}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-kiya-text truncate">
              {lottery.title}
            </h3>
            <p className="text-sm text-kiya-text-secondary">
              {lottery.agentName} • {formatCurrency(lottery.ticketPrice)}
            </p>
          </div>
          <div className="text-right ml-4">
            <div
              className={`text-sm font-medium ${statusColors[lottery.status]}`}
            >
              {lottery.status.toUpperCase()}
            </div>
            <div className="text-xs text-kiya-text-secondary">
              {lottery.soldTickets}/{lottery.totalTickets} sold
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full" hover={!!onViewDetails}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-kiya-text mb-1">
              {lottery.title}
            </h3>
            <p className="text-sm text-kiya-text-secondary">
              by {lottery.agentName}
            </p>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lottery.status]} bg-current/10`}
          >
            {lottery.status.toUpperCase()}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-kiya-text-secondary line-clamp-2">
          {lottery.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Trophy size={16} className="text-kiya-teal" />
            <div>
              <p className="text-xs text-kiya-text-secondary">Prizes</p>
              <p className="text-sm font-medium text-kiya-text">
                {Array.isArray(lottery?.prizes) ? lottery.prizes.length : "-"}{" "}
                prizes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users size={16} className="text-kiya-teal" />
            <div>
              <p className="text-xs text-kiya-text-secondary">Price</p>
              <p className="text-sm font-medium text-kiya-text">
                {lottery?.ticketPrice != null
                  ? formatCurrency(Number(lottery.ticketPrice))
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-kiya-text-secondary">Tickets Sold</span>
            <span className="text-kiya-text">
              {soldTickets != null ? soldTickets : "-"}/
              {totalTickets != null ? totalTickets : "-"}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-kiya-teal h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress ?? 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-kiya-text-secondary mt-1">
            {progress != null ? `${progress.toFixed(1)}% sold` : "-"}
          </p>
        </div>

        {/* Draw Information */}
        <div className="text-center text-sm">
          <div className="flex items-center justify-center space-x-1">
            <Clock size={14} className="text-kiya-teal" />
            <span className="text-kiya-text-secondary">
              {allTicketsSold
                ? lottery?.drawDate
                  ? `Draw scheduled: ${formatDate(lottery.drawDate)}`
                  : "Draw scheduled"
                : totalTickets != null
                  ? `Draw when all ${totalTickets} tickets sold`
                  : lottery?.drawDate
                    ? `Draw scheduled: ${formatDate(lottery.drawDate)}`
                    : "Draw scheduled"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            {(["active", "open"].includes(String(lottery.status)) as boolean) &&
              !allTicketsSold && (
                <Button variant="primary" size="full" onClick={onViewDetails}>
                  Buy Tickets
                </Button>
              )}
            {(isCompleted || allTicketsSold) && (
              <Button variant="outline" size="full" onClick={onViewDetails}>
                View Results
              </Button>
            )}
            {lottery.status === "upcoming" && (
              <Button variant="outline" size="full" onClick={onViewDetails}>
                View Details
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
