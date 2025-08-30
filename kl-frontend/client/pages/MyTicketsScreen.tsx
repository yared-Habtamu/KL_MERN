import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ticket, Trophy, Calendar, Search } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { LotteryCard } from "../components/lottery/LotteryCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { formatCurrency, formatDate } from "../lib/mock-data";
import {
  tickets as ticketsApi,
  auth,
  lotteries as lotteriesApi,
} from "../lib/api";
type TicketType = any;
type Lottery = any;
type User = any;

interface TicketWithLottery extends TicketType {
  lottery: Lottery;
}

const MyTicketsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [userTickets, setUserTickets] = useState<TicketType[]>([]);
  const [lotteriesList, setLotteriesList] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Use refreshed data from sessionStorage when available (fast UX after purchase)
        const cachedTks = sessionStorage.getItem("kiya_my_tickets_refreshed");
        const cachedLots = sessionStorage.getItem("kiya_lotteries_refreshed");
        const [tks, lots] =
          cachedTks && cachedLots
            ? [JSON.parse(cachedTks), JSON.parse(cachedLots)]
            : await Promise.all([ticketsApi.myTickets(), lotteriesApi.list()]);
        if (!mounted) return;
        setUserTickets(Array.isArray(tks) ? tks : []);
        setLotteriesList(Array.isArray(lots) ? lots : []);
      } catch (e) {
        console.error("Failed to load tickets or lotteries", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Expose a manual refresh (used after purchases)
  const refreshTickets = async () => {
    setLoading(true);
    try {
      const [tks, lots] = await Promise.all([
        ticketsApi.myTickets(),
        lotteriesApi.list(),
      ]);
      setUserTickets(Array.isArray(tks) ? tks : []);
      setLotteriesList(Array.isArray(lots) ? lots : []);
    } catch (e) {
      console.error("Failed to refresh tickets or lotteries", e);
    } finally {
      setLoading(false);
    }
  };

  // Combine tickets with lottery information
  const ticketsWithLotteries: TicketWithLottery[] = userTickets
    .map((ticket) => {
      const lottery = lotteriesList.find((l) => l.id === ticket.lotteryId);
      return lottery ? { ...ticket, lottery } : null;
    })
    .filter(Boolean) as TicketWithLottery[];

  // Filter tickets based on tab and search
  const filteredTickets = ticketsWithLotteries.filter((ticket) => {
    const isActive =
      ticket.lottery.status === "active" ||
      ticket.lottery.status === "upcoming";
    const matchesTab = activeTab === "active" ? isActive : !isActive;
    const matchesSearch =
      ticket.lottery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.lottery.agentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate stats
  const totalTickets = userTickets.length;
  const activeTickets = ticketsWithLotteries.filter(
    (t) => t.lottery.status === "active" || t.lottery.status === "upcoming",
  ).length;
  const wonTickets = userTickets.filter((t) => t.status === "won").length;
  const totalSpent = userTickets.reduce(
    (sum, t) => sum + Math.abs(t.amount || 0),
    0,
  );
  const totalWinnings = userTickets
    .filter((t) => t.status === "won")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const handleLotteryClick = (lottery: Lottery) =>
    navigate(`/lottery/${lottery.id}`);

  const getTicketStatusColor = (ticket: TicketType) => {
    switch (ticket.status) {
      case "won":
        return "text-kiya-green";
      case "lost":
        return "text-kiya-red";
      case "active":
        return "text-kiya-teal";
      default:
        return "text-kiya-text-secondary";
    }
  };

  const getTicketStatusText = (ticket: TicketType) => {
    switch (ticket.status) {
      case "won":
        return `Won ${ticket.prizeRank === 1 ? "1st" : ticket.prizeRank === 2 ? "2nd" : "3rd"} Prize`;
      case "lost":
        return "Did not win";
      case "active":
        return "Waiting for draw";
      default:
        return "Unknown";
    }
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
          <h1 className="text-xl font-bold text-kiya-text">My Tickets</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Ticket size={16} className="text-kiya-teal" />
              <span className="text-sm text-kiya-text-secondary">
                Total Tickets
              </span>
            </div>
            <p className="text-2xl font-bold text-kiya-text">{totalTickets}</p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar size={16} className="text-kiya-warning" />
              <span className="text-sm text-kiya-text-secondary">Active</span>
            </div>
            <p className="text-2xl font-bold text-kiya-warning">
              {activeTickets}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy size={16} className="text-kiya-green" />
              <span className="text-sm text-kiya-text-secondary">Wins</span>
            </div>
            <p className="text-2xl font-bold text-kiya-green">{wonTickets}</p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy size={16} className="text-kiya-primary" />
              <span className="text-sm text-kiya-text-secondary">Winnings</span>
            </div>
            <p className="text-lg font-bold text-kiya-primary">
              {formatCurrency(totalWinnings)}
            </p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary"
          />
          <input
            type="text"
            placeholder="Search your tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-kiya-surface rounded-lg p-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "active"
                ? "bg-kiya-teal text-white"
                : "text-kiya-text-secondary hover:text-kiya-text"
            }`}
          >
            Active Lotteries (
            {
              ticketsWithLotteries.filter(
                (t) =>
                  t.lottery.status === "active" ||
                  t.lottery.status === "upcoming",
              ).length
            }
            )
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "past"
                ? "bg-kiya-teal text-white"
                : "text-kiya-text-secondary hover:text-kiya-text"
            }`}
          >
            Past Lotteries (
            {
              ticketsWithLotteries.filter(
                (t) => t.lottery.status === "completed",
              ).length
            }
            )
          </button>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="text-center py-8">Loading…</Card>
          ) : filteredTickets.length === 0 ? (
            <Card className="text-center py-8">
              <div className="w-16 h-16 bg-kiya-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket size={32} className="text-kiya-teal" />
              </div>
              <h3 className="text-lg font-semibold text-kiya-text mb-2">
                {activeTab === "active"
                  ? "No Active Tickets"
                  : "No Past Tickets"}
              </h3>
              <p className="text-kiya-text-secondary mb-4">
                {activeTab === "active"
                  ? "You don't have any tickets for active lotteries yet"
                  : "You don't have any tickets from past lotteries"}
              </p>
              {activeTab === "active" && (
                <Button variant="primary" onClick={() => navigate("/")}>
                  Browse Lotteries
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="space-y-4">
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-kiya-text mb-1">
                        {ticket.lottery.title}
                      </h3>
                      <p className="text-sm text-kiya-text-secondary">
                        by {ticket.lottery.agentName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${getTicketStatusColor(ticket)}`}
                      >
                        {getTicketStatusText(ticket)}
                      </div>
                      <div className="text-xs text-kiya-text-secondary">
                        {formatDate(ticket.purchaseDate)}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-kiya-text-secondary">Ticket #</span>
                      <p className="font-bold text-kiya-teal text-lg">
                        {ticket.ticketNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-kiya-text-secondary">
                        Price Paid
                      </span>
                      <p className="font-medium text-kiya-text">
                        {formatCurrency(ticket.lottery.ticketPrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-kiya-text-secondary">
                        Draw Date
                      </span>
                      <p className="font-medium text-kiya-text">
                        {formatDate(ticket.lottery.drawDate)}
                      </p>
                    </div>
                  </div>

                  {/* Prize Information */}
                  {ticket.status === "won" && ticket.prizeRank && (
                    <div className="bg-kiya-green/10 border border-kiya-green/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Trophy size={20} className="text-kiya-green" />
                        <div>
                          <p className="font-semibold text-kiya-green">
                            Congratulations! You won{" "}
                            {ticket.prizeRank === 1
                              ? "1st"
                              : ticket.prizeRank === 2
                                ? "2nd"
                                : "3rd"}{" "}
                            Prize
                          </p>
                          <p className="text-sm text-kiya-text-secondary">
                            Prize:{" "}
                            {
                              ticket.lottery.prizes.find(
                                (p) => p.rank === ticket.prizeRank,
                              )?.name
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLotteryClick(ticket.lottery)}
                    >
                      View Lottery
                    </Button>
                    {ticket.lottery.status === "active" && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          navigate(`/lottery/${ticket.lottery.id}`)
                        }
                      >
                        Buy More
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Summary Card */}
        {totalTickets > 0 && (
          <Card className="bg-gradient-to-r from-kiya-primary/5 to-kiya-teal/5 border-kiya-primary/20">
            <h3 className="font-semibold text-kiya-text mb-3">
              Your Lottery Journey
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-kiya-text-secondary">Total Spent:</span>
                <p className="font-bold text-kiya-text">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div>
                <span className="text-kiya-text-secondary">
                  Total Winnings:
                </span>
                <p className="font-bold text-kiya-green">
                  {formatCurrency(totalWinnings)}
                </p>
              </div>
              <div>
                <span className="text-kiya-text-secondary">Win Rate:</span>
                <p className="font-bold text-kiya-teal">
                  {totalTickets > 0
                    ? ((wonTickets / totalTickets) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div>
                <span className="text-kiya-text-secondary">Net Result:</span>
                <p
                  className={`font-bold ${totalWinnings >= totalSpent ? "text-kiya-green" : "text-kiya-red"}`}
                >
                  {totalWinnings >= totalSpent ? "+" : ""}
                  {formatCurrency(totalWinnings - totalSpent)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Get Started CTA */}
        {totalTickets === 0 && (
          <Card className="text-center py-8 border-kiya-teal/20 bg-kiya-teal/5">
            <div className="w-16 h-16 bg-kiya-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket size={32} className="text-kiya-teal" />
            </div>
            <h3 className="text-lg font-semibold text-kiya-text mb-2">
              Start Your Lottery Journey
            </h3>
            <p className="text-kiya-text-secondary mb-4">
              Purchase your first ticket and join the excitement!
            </p>
            <Button variant="primary" onClick={() => navigate("/")}>
              Browse Lotteries
            </Button>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default MyTicketsScreen;
