import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  Eye,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { LotteryCard } from "../components/lottery/LotteryCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { formatCurrency, formatDate } from "../lib/mock-data";
import { lotteries as lotteriesApi } from "../lib/api";
type Lottery = any;

const AgentDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [agentLotteries, setAgentLotteries] = useState<Lottery[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await lotteriesApi.list();
        if (!mounted) return;
        setAgentLotteries(
          Array.isArray(all) ? all.filter((l: any) => l.agentId === "2") : [],
        );
      } catch (e) {
        console.error("Failed to load agent lotteries", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredLotteries = agentLotteries.filter((lottery) => {
    if (statusFilter === "all") return true;
    return lottery.status === statusFilter;
  });

  // Calculate agent stats
  const totalRevenue = agentLotteries.reduce(
    (sum, lottery) => sum + lottery.revenue,
    0,
  );
  const totalCommission = agentLotteries.reduce(
    (sum, lottery) => sum + lottery.commission,
    0,
  );
  const activeLotteries = agentLotteries.filter(
    (l) => l.status === "active",
  ).length;
  const totalTicketsSold = agentLotteries.reduce(
    (sum, lottery) => sum + lottery.soldTickets,
    0,
  );
  const completedLotteries = agentLotteries.filter(
    (l) => l.status === "completed",
  ).length;

  // Commission rate 
  const commissionRate = 0.1;

  const handleLotteryClick = (lottery: Lottery) => {
    navigate(`/lottery-management/${lottery.id}`);
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return agentLotteries.length;
    return agentLotteries.filter((lottery) => lottery.status === status).length;
  };

  return (
    <PageLayout>
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-kiya-text mb-2">
            Agent Dashboard
          </h1>
          <p className="text-kiya-text-secondary">
            Manage your lotteries and track your earnings
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="full"
            onClick={() => navigate("/create-lottery")}
          >
            <Plus size={20} className="mr-2" />
            Create Lottery
          </Button>
          <Button
            variant="secondary"
            size="full"
            onClick={() => navigate("/sell-ticket")}
          >
            <ShoppingCart size={20} className="mr-2" />
            Sell Tickets
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            padding="sm"
            className="bg-gradient-to-br from-kiya-teal/10 to-kiya-teal/5 border-kiya-teal/20"
          >
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign size={16} className="text-kiya-teal" />
              <span className="text-sm text-kiya-text-secondary">
                Total Revenue
              </span>
            </div>
            <p className="text-xl font-bold text-kiya-teal">
              {formatCurrency(totalRevenue)}
            </p>
          </Card>

          <Card
            padding="sm"
            className="bg-gradient-to-br from-kiya-green/10 to-kiya-green/5 border-kiya-green/20"
          >
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-kiya-green" />
              <span className="text-sm text-kiya-text-secondary">
                Commission Earned
              </span>
            </div>
            <p className="text-xl font-bold text-kiya-green">
              {formatCurrency(totalCommission)}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 size={16} className="text-kiya-primary" />
              <span className="text-sm text-kiya-text-secondary">
                Active Lotteries
              </span>
            </div>
            <p className="text-xl font-bold text-kiya-primary">
              {activeLotteries}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Users size={16} className="text-kiya-warning" />
              <span className="text-sm text-kiya-text-secondary">
                Tickets Sold
              </span>
            </div>
            <p className="text-xl font-bold text-kiya-warning">
              {totalTicketsSold}
            </p>
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            This Month's Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-kiya-text-secondary">Revenue Target</span>
              <span className="text-kiya-text font-medium">
                {formatCurrency(5000)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-kiya-teal h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((totalRevenue / 5000) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-kiya-text-secondary">
                {((totalRevenue / 5000) * 100).toFixed(1)}% completed
              </span>
              <span className="text-kiya-text">
                {formatCurrency(5000 - totalRevenue)} remaining
              </span>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-kiya-dark rounded-lg">
              <div className="w-8 h-8 bg-kiya-green/10 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-kiya-green" />
              </div>
              <div className="flex-1">
                <p className="text-kiya-text font-medium">
                  Lottery "Tech Gadgets Mega Draw" sold 5 tickets
                </p>
                <p className="text-xs text-kiya-text-secondary">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-kiya-dark rounded-lg">
              <div className="w-8 h-8 bg-kiya-teal/10 rounded-full flex items-center justify-center">
                <DollarSign size={16} className="text-kiya-teal" />
              </div>
              <div className="flex-1">
                <p className="text-kiya-text font-medium">
                  Commission payment of {formatCurrency(125)} received
                </p>
                <p className="text-xs text-kiya-text-secondary">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-kiya-dark rounded-lg">
              <div className="w-8 h-8 bg-kiya-primary/10 rounded-full flex items-center justify-center">
                <Trophy size={16} className="text-kiya-primary" />
              </div>
              <div className="flex-1">
                <p className="text-kiya-text font-medium">
                  Winners announced for "Cash Prize Weekly"
                </p>
                <p className="text-xs text-kiya-text-secondary">2 days ago</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Lottery Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-kiya-text">
              My Lotteries
            </h2>
            <span className="text-sm text-kiya-text-secondary">
              {filteredLotteries.length} lottery
              {filteredLotteries.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Filter Tabs */}
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
                    : "bg-kiya-surface text-kiya-text-secondary hover:bg-gray-700"
                }`}
              >
                {filter.label} ({getStatusCount(filter.key)})
              </button>
            ))}
          </div>

          {/* Lotteries List */}
          {filteredLotteries.length === 0 ? (
            <Card className="text-center py-8">
              <div className="w-16 h-16 bg-kiya-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} className="text-kiya-primary" />
              </div>
              <h3 className="text-lg font-semibold text-kiya-text mb-2">
                {statusFilter === "all"
                  ? "No Lotteries Yet"
                  : `No ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Lotteries`}
              </h3>
              <p className="text-kiya-text-secondary mb-4">
                {statusFilter === "all"
                  ? "Create your first lottery to start earning commissions"
                  : `You don't have any ${statusFilter} lotteries at the moment`}
              </p>
              {statusFilter === "all" && (
                <Button
                  variant="primary"
                  onClick={() => navigate("/create-lottery")}
                >
                  Create Your First Lottery
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLotteries.map((lottery) => (
                <div key={lottery.id} className="space-y-3">
                  <LotteryCard
                    lottery={lottery}
                    onViewDetails={() => handleLotteryClick(lottery)}
                    showActions={false}
                  />

                  {/* Agent Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/lottery-management/${lottery.id}`)
                      }
                    >
                      <Eye size={16} className="mr-1" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/sell-ticket?lottery=${lottery.id}`)
                      }
                      disabled={lottery.status !== "active"}
                    >
                      <ShoppingCart size={16} className="mr-1" />
                      Sell
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/lottery-settings/${lottery.id}`)
                      }
                    >
                      <Settings size={16} className="mr-1" />
                      Settings
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm bg-kiya-dark rounded-lg p-3">
                    <div className="text-center">
                      <p className="text-kiya-text-secondary">Revenue</p>
                      <p className="font-semibold text-kiya-teal">
                        {formatCurrency(lottery.revenue)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-kiya-text-secondary">Commission</p>
                      <p className="font-semibold text-kiya-green">
                        {formatCurrency(lottery.commission)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-kiya-text-secondary">Progress</p>
                      <p className="font-semibold text-kiya-text">
                        {(
                          (lottery.soldTickets / lottery.totalTickets) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Tips */}
        <Card className="bg-gradient-to-r from-kiya-primary/5 to-kiya-teal/5 border-kiya-primary/20">
          <h3 className="font-semibold text-kiya-text mb-3">💡 Agent Tips</h3>
          <div className="space-y-2 text-sm text-kiya-text-secondary">
            <p>
              • Create attractive lottery titles and descriptions to increase
              sales
            </p>
            <p>• Offer varied prize amounts to appeal to different audiences</p>
            <p>• Use social media to promote your lotteries</p>
            <p>• Set reasonable ticket prices for your target market</p>
            <p>• Engage with your customers to build trust and loyalty</p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AgentDashboardScreen;
