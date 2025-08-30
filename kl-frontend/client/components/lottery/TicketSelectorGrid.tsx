import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

interface TicketSelectorGridProps {
  totalTickets: number;
  soldTickets: boolean[]; // true = sold, false = available
  selectedTickets: number[];
  onSelectionChange: (selectedTickets: number[]) => void;
  maxSelection?: number;
  disabled?: boolean;
}

export const TicketSelectorGrid: React.FC<TicketSelectorGridProps> = ({
  totalTickets,
  soldTickets,
  selectedTickets,
  onSelectionChange,
  maxSelection = 10,
  disabled = false,
}) => {
  const [localSelection, setLocalSelection] = useState<Set<number>>(
    new Set(selectedTickets),
  );

  useEffect(() => {
    setLocalSelection(new Set(selectedTickets));
  }, [selectedTickets]);

  const handleTicketClick = (ticketNumber: number) => {
    if (disabled || soldTickets[ticketNumber - 1]) return;

    const newSelection = new Set(localSelection);

    if (newSelection.has(ticketNumber)) {
      newSelection.delete(ticketNumber);
    } else {
      if (newSelection.size >= maxSelection) {
        return; // Max selection reached
      }
      newSelection.add(ticketNumber);
    }

    setLocalSelection(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  const getTicketStatus = (ticketNumber: number) => {
    if (soldTickets[ticketNumber - 1]) return "sold";
    if (localSelection.has(ticketNumber)) return "selected";
    return "available";
  };

  const getTicketStyles = (status: string) => {
    const baseStyles =
      "w-full aspect-square flex items-center justify-center text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer";

    switch (status) {
      case "sold":
        return `${baseStyles} bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed`;
      case "selected":
        return `${baseStyles} bg-kiya-primary border-kiya-primary-dark text-white transform scale-105`;
      case "available":
        return `${baseStyles} bg-kiya-surface border-gray-600 text-kiya-text hover:border-kiya-teal hover:bg-kiya-teal/10 animate-press`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-kiya-surface border-2 border-gray-600 rounded"></div>
          <span className="text-kiya-text-secondary">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-kiya-primary border-2 border-kiya-primary-dark rounded"></div>
          <span className="text-kiya-text-secondary">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-700 border-2 border-gray-600 rounded"></div>
          <span className="text-kiya-text-secondary">Sold</span>
        </div>
      </div>

      {/* Selection Info */}
      <div className="text-center">
        <p className="text-kiya-text">
          Selected:{" "}
          <span className="font-semibold text-kiya-teal">
            {localSelection.size}
          </span>
          {maxSelection && (
            <span className="text-kiya-text-secondary">
              {" "}
              / {maxSelection} max
            </span>
          )}
        </p>
      </div>

      {/* Ticket Grid */}
      <div className="ticket-grid">
        {Array.from({ length: totalTickets }, (_, index) => {
          const ticketNumber = index + 1;
          const status = getTicketStatus(ticketNumber);

          return (
            <button
              key={ticketNumber}
              onClick={() => handleTicketClick(ticketNumber)}
              disabled={disabled || status === "sold"}
              className={cn(
                getTicketStyles(status),
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {ticketNumber}
            </button>
          );
        })}
      </div>

      {/* Selected Tickets Summary */}
      {localSelection.size > 0 && (
        <div className="bg-kiya-surface rounded-lg p-4 border border-gray-700">
          <h4 className="text-sm font-medium text-kiya-text mb-2">
            Selected Tickets ({localSelection.size})
          </h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(localSelection)
              .sort((a, b) => a - b)
              .map((ticket) => (
                <span
                  key={ticket}
                  className="px-2 py-1 bg-kiya-primary text-white text-xs rounded font-medium"
                >
                  #{ticket}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
