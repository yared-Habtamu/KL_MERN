import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { LotteryCard } from "../components/lottery/LotteryCard";
import { Button } from "../components/ui/button";
import { InputField } from "../components/ui/InputField";
import { Card } from "../components/ui/card";
import { formatCurrency } from "../lib/mock-data";
import { lotteries, auth } from "../lib/api"; // Adjust import path as necessary

type Lottery = any;
type User = any;

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [lotteryList, setLotteryList] = useState<Lottery[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter lotteries based on search and status
  const filteredLotteries = useMemo(() => {
    return lotteryList.filter((lottery) => {
      const matchesSearch =
        lottery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lottery.agentName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || lottery.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [lotteryList, searchQuery, statusFilter]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [lots, me] = await Promise.all([
          lotteries.list(),
          auth.whoami().catch(() => null),
        ]);
        if (!mounted) return;
        setLotteryList(Array.isArray(lots) ? lots : []);
        setCurrentUser(me);
      } catch (e) {
        console.error("Failed to load lotteries", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLotteryClick = (lottery: Lottery) =>
    navigate(`/lottery/${lottery.id}`);

  const getStatusCount = (status: string) => {
    if (status === "all") return lotteryList.length;
    return lotteryList.filter((lottery) => lottery.status === status).length;
  };

  return (
    <PageLayout>
      <div className="page-container space-y-6">
        {/* Welcome Section */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-kiya-text mb-2">
            Welcome
            {currentUser
              ? `, ${String(currentUser.fullName || "").split(" ")[0]}`
              : "!"}
          </h1>
          <p className="text-kiya-text-secondary">
            Discover amazing lotteries and win exciting prizes
          </p>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-kiya-primary to-kiya-primary-dark">
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">Your Balance</p>
            <p className="text-2xl font-bold text-white mb-3">
              {formatCurrency(Number(currentUser?.balance || 0))}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate("/wallet")}
              >
                Add Funds
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate("/my-tickets")}
              >
                My Tickets
              </Button>
            </div>
          </div>
        </Card>

        {/* Agent Dashboard Access */}
        {currentUser?.role === "agent" && (
          <Card className="border-kiya-teal/20 bg-kiya-teal/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-kiya-text mb-1">
                  Agent Dashboard
                </h3>
                <p className="text-sm text-kiya-text-secondary">
                  Manage your lotteries and view earnings
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/agent-dashboard")}
              >
                <Plus size={16} className="mr-1" />
                Dashboard
              </Button>
            </div>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary"
            />
            <input
              type="text"
              placeholder="Search lotteries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter size={20} className="text-kiya-text-secondary" />
            </button>
          </div>

          {/* Filter Tabs */}
          {showFilters && (
            <Card padding="sm">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "upcoming", label: "Upcoming" },
                  { key: "completed", label: "Completed" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      statusFilter === filter.key
                        ? "bg-kiya-teal text-white"
                        : "bg-kiya-dark text-kiya-text-secondary hover:bg-gray-700"
                    }`}
                  >
                    {filter.label} ({getStatusCount(filter.key)})
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-kiya-teal">
              {lotteryList.filter((l) => l.status === "active").length}
            </p>
            <p className="text-xs text-kiya-text-secondary">Active</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-kiya-warning">
              {lotteryList.filter((l) => l.status === "upcoming").length}
            </p>
            <p className="text-xs text-kiya-text-secondary">Upcoming</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-kiya-text-secondary">
              {lotteryList.filter((l) => l.status === "completed").length}
            </p>
            <p className="text-xs text-kiya-text-secondary">Completed</p>
          </Card>
        </div>

        {/* Lottery Listings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-kiya-text">
              Available Lotteries
            </h2>
            {filteredLotteries.length > 0 && (
              <span className="text-sm text-kiya-text-secondary">
                {filteredLotteries.length} result
                {filteredLotteries.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {filteredLotteries.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-kiya-text-secondary mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "No lotteries match your filters"
                  : "No lotteries available at the moment"}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <Card className="text-center py-8">Loading lotteries…</Card>
              ) : (
                filteredLotteries.map((lottery, idx) => (
                  <LotteryCard
                    key={lottery?.id || lottery?._id || idx}
                    lottery={lottery}
                    onViewDetails={() => handleLotteryClick(lottery)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Call to Action for Agents */}
        {currentUser?.role === "client" && (
          <Card className="text-center py-6 border-kiya-primary/20 bg-kiya-primary/5">
            <h3 className="text-lg font-semibold text-kiya-text mb-2">
              Want to create your own lottery?
            </h3>
            <p className="text-kiya-text-secondary mb-4">
              Become an agent and start earning commissions
            </p>
            <Button variant="primary" onClick={() => navigate("/become-agent")}>
              Become an Agent
            </Button>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default HomeScreen;
