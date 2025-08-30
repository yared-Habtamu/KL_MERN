import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Trophy,
  Share2,
  Info,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { TicketSelectorGrid } from "../components/lottery/TicketSelectorGrid";
import { PrizeListItem } from "../components/lottery/PrizeListItem";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Modal } from "../components/ui/Modal";
import {
  generateTicketAvailability,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../lib/mock-data";
import { lotteries } from "../lib/api";
import { useToast } from "../components/ui/ToastNotification";
type Lottery = any;
type User = any;

const LotteryDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addToast } = useToast();
  const [winners, setWinners] = useState<Array<any>>([]);
  const [registeringWinners, setRegisteringWinners] = useState(false);
  const [winnerInputs, setWinnerInputs] = useState<
    Array<{ name: string; phone: string }>
  >([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (!id) return;
        const [l, me] = await Promise.all([
          lotteries.get(id),
          (async () => {
            try {
              const m = await import("../lib/api");
              if (
                m &&
                (m as any).auth &&
                typeof (m as any).auth.whoami === "function"
              ) {
                return await (m as any).auth.whoami();
              }
            } catch (_) {
              // ignore dynamic import / whoami errors
            }
            return null;
          })(),
        ]);
        if (!mounted) return;
        setLottery(l || null);
        // initialize winner inputs to match available prizes
        setWinnerInputs((l?.prizes || []).map(() => ({ name: "", phone: "" })));
        setCurrentUser(me);
      } catch (e) {
        console.error("Failed to load lottery", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // load winners separately
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const ws = await lotteries.getWinners(id);
        if (Array.isArray(ws)) setWinners(ws);
      } catch (e) {
        // ignore 404/no-winners
      }
    })();
  }, [id]);

  const ticketAvailability = useMemo(() => {
    if (!lottery) return [];
    const total =
      lottery.totalTickets != null ? Number(lottery.totalTickets) : 0;
    const sold = lottery.soldTickets != null ? Number(lottery.soldTickets) : 0;
    return generateTicketAvailability(total, sold);
  }, [lottery]);

  // Keep a local copy for optimistic updates so UI updates immediately after purchase
  const [localAvailability, setLocalAvailability] = useState<boolean[]>([]);

  // Initialize local availability when the lottery (id) changes. Do not overwrite
  // on every ticketAvailability change so optimistic updates (after purchase)
  // are preserved.
  useEffect(() => {
    if (!lottery) {
      setLocalAvailability([]);
      return;
    }
    setLocalAvailability(ticketAvailability);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lottery?.id]);

  if (loading) {
    return (
      <PageLayout>
        <div className="page-container flex items-center justify-center min-h-96">
          <Card className="text-center">Loading…</Card>
        </div>
      </PageLayout>
    );
  }

  if (!lottery) {
    return (
      <PageLayout>
        <div className="page-container flex items-center justify-center min-h-96">
          <Card className="text-center">
            <h2 className="text-xl font-semibold text-kiya-text mb-2">
              Lottery Not Found
            </h2>
            <p className="text-kiya-text-secondary mb-4">
              The lottery you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const isCompleted = lottery.status === "completed";
  const allTicketsSold =
    lottery.soldTickets != null && lottery.totalTickets != null
      ? Number(lottery.soldTickets) >= Number(lottery.totalTickets)
      : false;
  const purchasableStates = ["active", "open"];
  const canPurchase =
    purchasableStates.includes(String(lottery.status)) && !allTicketsSold;
  const ticketPrice =
    lottery.ticketPrice != null ? Number(lottery.ticketPrice) : 0;
  const totalCost = selectedTickets.length * ticketPrice;
  const hasInsufficientBalance = totalCost > Number(currentUser?.balance || 0);

  const handlePurchase = () => {
    if (selectedTickets.length === 0 || hasInsufficientBalance) return;
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    // Call API to buy tickets
    (async () => {
      try {
        const resp: any = await lotteries.buy(id!, {
          selections: selectedTickets,
          quantity: selectedTickets.length || 1,
        });
        // resp should include created tickets and transaction
        setShowPurchaseModal(false);
        // Optimistically mark selected tickets as sold in local availability
        const updated = [...localAvailability];
        selectedTickets.forEach((num) => {
          if (num > 0 && num <= updated.length) updated[num - 1] = true;
        });
        setLocalAvailability(updated);
        // increment soldTickets count locally
        setLottery((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            soldTickets: (prev.soldTickets || 0) + selectedTickets.length,
          } as any;
        });

        // Use server-returned tickets to immediately show on My Tickets page
        const createdTickets = resp?.tickets || resp?.tickets || [];
        try {
          const normalized = Array.isArray(createdTickets)
            ? createdTickets.map((t: any) => ({
                id: String(t.id || t._id),
                lotteryId: String(t.lotteryId),
                purchaseDate: t.purchasedAt || t.purchaseDate || t.createdAt,
                amount: t.price || t.amount || 0,
                ticketNumber:
                  t.ticketNumber ||
                  (Array.isArray(t.selections) && t.selections.length === 1
                    ? t.selections[0]
                    : undefined),
              }))
            : [];
          sessionStorage.setItem(
            "kiya_my_tickets_refreshed",
            JSON.stringify(normalized),
          );
          setSelectedTickets([]);
          navigate("/my-tickets", { state: { newTickets: normalized } });
        } catch (e) {
          // fallback: navigate without state
          setSelectedTickets([]);
          navigate("/my-tickets");
        }
      } catch (err: any) {
        console.error(err);
        setShowPurchaseModal(false);
        // show toast if available (keep minimal here)
        alert(
          "Purchase failed: " +
            (err?.body?.error || err?.message || JSON.stringify(err)),
        );
      }
    })();
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
          <h1 className="text-xl font-bold text-kiya-text">Lottery Details</h1>
        </div>

        {/* Lottery Header Card */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-kiya-text mb-2">
                  {lottery.title}
                </h2>
                <p className="text-kiya-text-secondary">
                  Created by{" "}
                  <span className="text-kiya-teal font-medium">
                    {lottery.agentName}
                  </span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 rounded-lg bg-kiya-dark hover:bg-gray-700 transition-colors">
                  <Share2 size={20} className="text-kiya-text-secondary" />
                </button>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-2 rounded-lg bg-kiya-dark hover:bg-gray-700 transition-colors"
                >
                  <Info size={20} className="text-kiya-text-secondary" />
                </button>
              </div>
            </div>

            <p className="text-kiya-text-secondary leading-relaxed">
              {lottery.description}
            </p>

            {/* Status and Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-kiya-text-secondary">Progress</span>
                <span className="text-kiya-text font-medium">
                  {lottery.soldTickets}/{lottery.totalTickets} tickets sold
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-kiya-teal h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((lottery.soldTickets / lottery.totalTickets) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Users size={16} className="text-kiya-teal" />
              <span className="text-sm text-kiya-text-secondary">
                Ticket Price
              </span>
            </div>
            <p className="text-lg font-bold text-kiya-text">
              {formatCurrency(lottery.ticketPrice)}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy size={16} className="text-kiya-teal" />
              <span className="text-sm text-kiya-text-secondary">
                Total Prizes
              </span>
            </div>
            <p className="text-lg font-bold text-kiya-text">
              {(() => {
                const totalAmount = (lottery.prizes || []).reduce(
                  (sum: number, p: any) => sum + (Number(p.amount) || 0),
                  0,
                );
                if (totalAmount > 0) return formatCurrency(totalAmount);
                return (lottery.prizes || []).length;
              })()}
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar size={16} className="text-kiya-teal" />
              <span className="text-sm text-kiya-text-secondary">
                Tickets Left
              </span>
            </div>
            <p className="text-sm font-medium text-kiya-text">
              {lottery.totalTickets - lottery.soldTickets} remaining
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-2 mb-2">
              <Clock size={16} className="text-kiya-teal" />
              <span className="text-sm text-kiya-text-secondary">
                Draw Date
              </span>
            </div>
            <p className="text-sm font-medium text-kiya-text">
              {formatDate(lottery.drawDate)}
            </p>
          </Card>
        </div>

        {/* Prizes Section */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Prizes ({lottery.prizes.length})
          </h3>
          <div className="space-y-3">
            {lottery.prizes.map((prize) => (
              <PrizeListItem key={prize.id} prize={prize} />
            ))}
          </div>
        </Card>

        {/* Winners Section */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">Winners</h3>
          {winners.length === 0 ? (
            <p className="text-kiya-text-secondary">
              No winners registered yet.
            </p>
          ) : (
            <div className="space-y-2">
              {winners.map((w, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <div className="font-medium">{w.name}</div>
                    <div className="text-sm text-kiya-text-secondary">
                      {w.phone}
                    </div>
                  </div>
                  <div className="text-sm text-kiya-text-secondary">
                    {new Date(w.registeredAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Registration form for agent/admin if lottery is closed/drawn */}
          {(currentUser?.role === "agent" || currentUser?.role === "admin") &&
            (lottery.status === "closed" || lottery.status === "drawn") && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Register Winners</h4>
                <div className="space-y-2">
                  {(lottery.prizes || []).map((p: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <input
                        className="input"
                        placeholder={`Winner ${idx + 1} Name`}
                        value={winnerInputs[idx]?.name || ""}
                        onChange={(e) => {
                          const copy = [...winnerInputs];
                          copy[idx] = {
                            ...(copy[idx] || { name: "", phone: "" }),
                            name: e.target.value,
                          };
                          setWinnerInputs(copy);
                        }}
                      />
                      <input
                        className="input"
                        placeholder={`Winner ${idx + 1} Phone`}
                        value={winnerInputs[idx]?.phone || ""}
                        onChange={(e) => {
                          const copy = [...winnerInputs];
                          copy[idx] = {
                            ...(copy[idx] || { name: "", phone: "" }),
                            phone: e.target.value,
                          };
                          setWinnerInputs(copy);
                        }}
                      />
                    </div>
                  ))}

                  <div className="flex space-x-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setWinnerInputs(
                          (lottery.prizes || []).map(() => ({
                            name: "",
                            phone: "",
                          })),
                        );
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        setRegisteringWinners(true);
                        try {
                          const toSend = winnerInputs.filter(
                            (w) => w.name || w.phone,
                          );
                          const resp = await lotteries.registerWinners(
                            id!,
                            toSend as any,
                          );
                          setWinners(resp || []);
                          addToast({
                            type: "success",
                            title: "Winners Registered",
                            message: "Winners have been saved.",
                          });
                        } catch (err: any) {
                          console.error(err);
                          addToast({
                            type: "error",
                            title: "Registration Failed",
                            message:
                              err?.body?.error ||
                              err?.message ||
                              "Failed to register winners",
                          });
                        } finally {
                          setRegisteringWinners(false);
                        }
                      }}
                      loading={registeringWinners}
                    >
                      Save Winners
                    </Button>
                  </div>
                </div>
              </div>
            )}
        </Card>

        {/* Ticket Selection */}
        {canPurchase && (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-kiya-text">
                  Select Your Tickets
                </h3>
                <div className="text-right">
                  <p className="text-sm text-kiya-text-secondary">
                    Your Balance
                  </p>
                  <p className="font-semibold text-kiya-text">
                    {formatCurrency(currentUser?.balance || 0)}
                  </p>
                </div>
              </div>

              <TicketSelectorGrid
                totalTickets={lottery.totalTickets}
                soldTickets={
                  localAvailability.length
                    ? localAvailability
                    : ticketAvailability
                }
                selectedTickets={selectedTickets}
                onSelectionChange={setSelectedTickets}
                maxSelection={10}
              />

              {/* Purchase Summary */}
              {selectedTickets.length > 0 && (
                <div className="bg-kiya-dark rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-kiya-text-secondary">
                      Tickets Selected:
                    </span>
                    <span className="text-kiya-text font-medium">
                      {selectedTickets.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kiya-text-secondary">
                      Price per ticket:
                    </span>
                    <span className="text-kiya-text font-medium">
                      {formatCurrency(lottery.ticketPrice)}
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex justify-between">
                      <span className="text-kiya-text font-semibold">
                        Total Cost:
                      </span>
                      <span className="text-kiya-teal font-bold text-lg">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  </div>

                  {hasInsufficientBalance && (
                    <div className="bg-kiya-red/10 border border-kiya-red/20 rounded-lg p-3">
                      <p className="text-kiya-red text-sm">
                        Insufficient balance. You need{" "}
                        {formatCurrency(totalCost - currentUser.balance)} more.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          {canPurchase && (
            <Button
              variant="primary"
              size="full"
              onClick={handlePurchase}
              disabled={selectedTickets.length === 0 || hasInsufficientBalance}
            >
              {selectedTickets.length === 0
                ? "Select Tickets to Purchase"
                : hasInsufficientBalance
                  ? "Insufficient Balance"
                  : `Purchase ${selectedTickets.length} Ticket${selectedTickets.length !== 1 ? "s" : ""} - ${formatCurrency(totalCost)}`}
            </Button>
          )}

          {hasInsufficientBalance && selectedTickets.length > 0 && (
            <Button
              variant="outline"
              size="full"
              onClick={() => navigate("/wallet")}
            >
              Add Funds to Wallet
            </Button>
          )}

          {!canPurchase && (
            <div className="text-center">
              <p className="text-kiya-text-secondary mb-2">
                {isCompleted
                  ? "This lottery has ended"
                  : allTicketsSold
                    ? "All tickets have been sold - Draw coming soon!"
                    : "This lottery is not active"}
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Browse Other Lotteries
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="Confirm Purchase"
      >
        <div className="space-y-4">
          <p className="text-kiya-text">
            Are you sure you want to purchase {selectedTickets.length} ticket
            {selectedTickets.length !== 1 ? "s" : ""} for{" "}
            <strong>{lottery.title}</strong>?
          </p>

          <div className="bg-kiya-dark rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-kiya-text-secondary">Tickets:</span>
              <span className="text-kiya-text">
                {selectedTickets.sort((a, b) => a - b).join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kiya-text-secondary">Total Cost:</span>
              <span className="text-kiya-teal font-bold">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowPurchaseModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="full" onClick={confirmPurchase}>
              Confirm Purchase
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Lottery Information"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-kiya-text mb-2">How it works:</h4>
            <ul className="text-sm text-kiya-text-secondary space-y-1">
              <li>• Select your preferred ticket numbers</li>
              <li>• Purchase tickets before the end date</li>
              <li>• Winners are drawn on the specified draw date</li>
              <li>• Prizes are distributed automatically</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-kiya-text mb-2">
              Important Dates:
            </h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">Sale Ends:</span>
                <span className="text-kiya-text">
                  {formatDateTime(lottery.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">Draw Date:</span>
                <span className="text-kiya-text">
                  {formatDateTime(lottery.drawDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default LotteryDetailScreen;
