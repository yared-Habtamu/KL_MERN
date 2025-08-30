import React from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Prize } from "../../lib/mock-data";

interface PrizeListItemProps {
  prize: Prize;
  showRank?: boolean;
  size?: "sm" | "md" | "lg";
}
export const PrizeListItem: React.FC<PrizeListItemProps> = ({
  prize,
  showRank = true,
  size = "md",
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400" />;
      case 2:
        return <Medal className="text-gray-300" />;
      case 3:
        return <Award className="text-orange-400" />;
      default:
        return <Trophy className="text-kiya-teal" />;
    }
  };

  const getRankText = (rank: number) => {
    switch (rank) {
      case 1:
        return "1st Prize";
      case 2:
        return "2nd Prize";
      case 3:
        return "3rd Prize";
      default:
        return `${rank}th Prize`;
    }
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-kiya-surface rounded-lg border border-gray-700">
      {/* Rank Icon */}
      <div className="flex-shrink-0">
        {React.cloneElement(getRankIcon(prize.rank), {
          size: iconSize[size],
        })}
      </div>

      {/* Prize Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {showRank && (
            <span
              className={`font-medium text-kiya-text-secondary ${textSizes[size]}`}
            >
              {getRankText(prize.rank)}
            </span>
          )}
        </div>
        <h4
          className={`font-semibold text-kiya-text ${textSizes[size]} truncate`}
        >
          {prize.name}
        </h4>
        {prize.description && (
          <p
            className={`text-kiya-text-secondary ${size === "sm" ? "text-xs" : "text-sm"} truncate`}
          >
            {prize.description}
          </p>
        )}
      </div>

      {/* Prize Image (if available) */}
      {prize.image && (
        <div className="flex-shrink-0">
          <img
            src={prize.image}
            alt={prize.name}
            className={`rounded object-cover ${
              size === "sm"
                ? "w-10 h-10"
                : size === "md"
                  ? "w-12 h-12"
                  : "w-16 h-16"
            }`}
          />
        </div>
      )}
    </div>
  );
};