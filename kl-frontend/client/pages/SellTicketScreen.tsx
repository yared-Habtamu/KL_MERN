import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Ticket,
  ShoppingCart,
  Check,
  Clock,
  UserPlus,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { TicketSelectorGrid } from "../components/lottery/TicketSelectorGrid";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { InputField } from "../components/ui/InputField";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/ToastNotification";
import { generateTicketAvailability, formatCurrency } from "../lib/mock-data";
import { lotteries as lotteriesApi, users as usersApi } from "../lib/api";
type Lottery = any;

interface CustomerInfo {
  fullName: string;
  phone: string;
}

const SellTicketScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "mobile" | "bank"
  >("cash");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [salesHistory, setSalesHistory] = useState<
    Array<{
      id: string;
      customerName: string;
      phone: string;
      ticketCount: number;
      amount: number;
      timestamp: string;
    }>
  >([]);

  // Mock recent customers for quick selection
  const recentCustomers = [
    { name: "Abebe Kebede", phone: "+251911234567" },
    { name: "Sara Ahmed", phone: "+251922345678" },
    { name: "Daniel Tesfaye", phone: "+251933456789" },
  ];

  const [agentLotteries, setAgentLotteries] = useState<Lottery[]>([]);

  // refresh user's tickets and lotteries so other pages reflect the sale
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const api = await import("../lib/api");
        const [refTickets, refreshedLots] = await Promise.all([
          api.tickets.myTickets(),
          api.lotteries.list(),
        ]);
        if (!mounted) return;
        sessionStorage.setItem(
          "kiya_my_tickets_refreshed",
          JSON.stringify(refTickets),
        );
        sessionStorage.setItem(
          "kiya_lotteries_refreshed",
          JSON.stringify(refreshedLots),
        );
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [all, me] = await Promise.all([
          lotteriesApi.list(),
          usersApi.getProfile().catch(() => null),
        ]);
        if (!mounted) return;
        const myId = me?.id || me?._id || me?.user?.id;
        const openStates = ["active", "open"];
        setAgentLotteries(
          Array.isArray(all)
            ? all.filter(
                (l: any) =>
                  String(l.agentId) === String(myId) &&
                  openStates.includes(String(l.status)),
              )
            : [],
        );
      } catch (e) {
        console.error("Failed to load agent lotteries", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Guard: only agents may access this page
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me: any = await usersApi.getProfile();
        const role = me?.user?.role || me?.role;
        if (!mounted) return;
        if (role !== "agent") {
          navigate("/");
        }
      } catch (e) {
        if (mounted) navigate("/");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const ticketAvailability = selectedLottery
    ? generateTicketAvailability(
        selectedLottery.totalTickets,
        selectedLottery.soldTickets,
      )
    : [];

  const totalCost =
    selectedTickets.length * (selectedLottery?.ticketPrice || 0);

  // Pre-select lottery from URL params if provided
  useEffect(() => {
    const lotteryId = searchParams.get("lottery");
    if (lotteryId) {
      const lottery = agentLotteries.find((l) => l.id === lotteryId);
      if (lottery) {
        setSelectedLottery(lottery);
      }
    }
  }, [searchParams, agentLotteries]);

  const handleLotterySelect = (lottery: Lottery) => {
    setSelectedLottery(lottery);
    setSelectedTickets([]); // Reset selected tickets when changing lottery
  };

  const handleCustomerInfoChange = (
    field: keyof CustomerInfo,
    value: string,
  ) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickCustomerSelect = (customer: {
    name: string;
    phone: string;
  }) => {
    setCustomerInfo({
      fullName: customer.name,
      phone: customer.phone,
    });
  };

  const validateSale = () => {
    const errors: string[] = [];

    if (!selectedLottery) errors.push("Please select a lottery");
    if (selectedTickets.length === 0)
      errors.push("Please select at least one ticket");
    if (!customerInfo.fullName.trim()) errors.push("Customer name is required");
    if (!customerInfo.phone.trim()) errors.push("Customer phone is required");

    // Phone validation (basic)
    const phoneRegex = /^\+?251[0-9]{9}$/;
    if (
      customerInfo.phone &&
      !phoneRegex.test(customerInfo.phone.replace(/\s/g, ""))
    ) {
      errors.push("Please enter a valid Ethiopian phone number");
    }

    return errors;
  };

  const handleSellTickets = async () => {
    const errors = validateSale();
    if (errors.length > 0) {
      errors.forEach((error) => {
        addToast({
          type: "error",
          title: "Validation Error",
          message: error,
        });
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSale = async () => {
    if (!selectedLottery) return;
    setIsProcessing(true);
    setShowConfirmModal(false);
    try {
      const resp: any = await lotteriesApi.sell(selectedLottery.id, {
        selections: selectedTickets,
        quantity: selectedTickets.length,
      });
      // resp should include tickets and transaction
      const newSale = {
        id: resp?.transaction?._id || Math.random().toString(36).substr(2, 9),
        customerName: customerInfo.fullName,
        phone: customerInfo.phone,
        ticketCount: selectedTickets.length,
        amount: totalCost,
        timestamp: new Date().toISOString(),
      };
      setSalesHistory((prev) => [newSale, ...prev.slice(0, 9)]);

      addToast({
        type: "success",
        title: "Tickets Sold Successfully",
        message: `${selectedTickets.length} ticket(s) sold to ${customerInfo.fullName}`,
      });

      // Update local lottery soldTickets and availability so UI reflects change
      setSelectedLottery((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          soldTickets: (prev.soldTickets || 0) + selectedTickets.length,
        } as any;
      });
      // normalize created tickets and store for MyTickets
      const createdTickets = resp?.tickets || [];
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
      } catch (e) {
        // ignore
      }
      // reset form
      setSelectedTickets([]);
      setCustomerInfo({ fullName: "", phone: "" });
    } catch (err: any) {
      console.error("Sell tickets failed", err);
      addToast({
        type: "error",
        title: "Sale Failed",
        message: err?.body?.error || err?.message || "Failed to sell tickets",
      });
    } finally {
      setIsProcessing(false);
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
          <h1 className="text-xl font-bold text-kiya-text">Sell Tickets</h1>
        </div>

        {/* Instructions */}
        <Card className="bg-kiya-teal/5 border-kiya-teal/20">
          <div className="flex items-start space-x-3">
            <ShoppingCart size={20} className="text-kiya-teal mt-1" />
            <div>
              <h3 className="font-medium text-kiya-text mb-1">
                Manual Ticket Sales
              </h3>
              <p className="text-sm text-kiya-text-secondary">
                Use this feature to sell tickets directly to customers in
                person. Select the lottery, choose available tickets, and enter
                customer details.
              </p>
            </div>
          </div>
        </Card>

        {/* Lottery Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-kiya-text mb-4">
            Select Lottery
          </h2>

          {agentLotteries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-kiya-text-secondary mb-4">
                You don't have any active lotteries to sell tickets for.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate("/create-lottery")}
              >
                Create New Lottery
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {agentLotteries.map((lottery) => (
                <div
                  key={lottery.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedLottery?.id === lottery.id
                      ? "border-kiya-teal bg-kiya-teal/5"
                      : "border-gray-600 hover:border-kiya-teal/50"
                  }`}
                  onClick={() => handleLotterySelect(lottery)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-kiya-text">
                        {lottery.title}
                      </h3>
                      <p className="text-sm text-kiya-text-secondary">
                        Price:{" "}
                        {formatCurrency(Number(lottery.ticketPrice || 0))} •
                        Available:{" "}
                        {Number(lottery.totalTickets || 0) -
                          Number(lottery.soldTickets || 0)}{" "}
                        tickets
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedLottery?.id === lottery.id
                          ? "border-kiya-teal bg-kiya-teal"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedLottery?.id === lottery.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-kiya-teal h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (Number(lottery.soldTickets || 0) /
                            Math.max(Number(lottery.totalTickets || 0), 1)) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Customer Information */}
        {selectedLottery && (
          <Card>
            <h2 className="text-lg font-semibold text-kiya-text mb-4">
              Customer Information
            </h2>

            {/* Quick Customer Selection */}
            {recentCustomers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-kiya-text-secondary mb-2">
                  Quick select recent customer:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentCustomers.map((customer, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickCustomerSelect(customer)}
                      className="px-3 py-2 bg-kiya-surface hover:bg-gray-700 rounded-lg text-sm text-kiya-text transition-colors border border-gray-600"
                    >
                      <UserPlus size={14} className="inline mr-1" />
                      {customer.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <InputField
                label="Customer Full Name"
                placeholder="e.g., Abebe Kebede"
                value={customerInfo.fullName}
                onChange={(e) =>
                  handleCustomerInfoChange("fullName", e.target.value)
                }
              />

              <InputField
                label="Customer Phone Number"
                placeholder="e.g., +251911234567"
                value={customerInfo.phone}
                onChange={(e) =>
                  handleCustomerInfoChange("phone", e.target.value)
                }
                helperText="Used for ticket confirmation and notifications"
              />
            </div>
          </Card>
        )}

        {/* Ticket Selection */}
        {selectedLottery && customerInfo.fullName && customerInfo.phone && (
          <Card>
            <h2 className="text-lg font-semibold text-kiya-text mb-4">
              Select Tickets
            </h2>

            <TicketSelectorGrid
              totalTickets={selectedLottery.totalTickets}
              soldTickets={ticketAvailability}
              selectedTickets={selectedTickets}
              onSelectionChange={setSelectedTickets}
              maxSelection={10}
            />
          </Card>
        )}

        {/* Payment Method */}
        {selectedTickets.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-kiya-text mb-4">
              Payment Method
            </h2>
            <div className="space-y-3">
              {[
                { id: "cash", label: "Cash Payment", icon: "💵" },
                { id: "mobile", label: "Mobile Money", icon: "📱" },
                { id: "bank", label: "Bank Transfer", icon: "🏦" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors flex items-center space-x-3 ${
                    paymentMethod === method.id
                      ? "border-kiya-teal bg-kiya-teal/10"
                      : "border-gray-600 hover:border-kiya-teal/50"
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <p className="font-medium text-kiya-text">{method.label}</p>
                    <p className="text-sm text-kiya-text-secondary">
                      {method.id === "cash" &&
                        "Accept cash payment from customer"}
                      {method.id === "mobile" &&
                        "Customer pays via mobile money"}
                      {method.id === "bank" &&
                        "Customer transfers to your account"}
                    </p>
                  </div>
                  {paymentMethod === method.id && (
                    <Check size={20} className="text-kiya-teal ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Sale Summary */}
        {selectedTickets.length > 0 && (
          <Card className="bg-kiya-dark">
            <h3 className="font-semibold text-kiya-text mb-3">Sale Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">Customer:</span>
                <span className="text-kiya-text">{customerInfo.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">Phone:</span>
                <span className="text-kiya-text">{customerInfo.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">Lottery:</span>
                <span className="text-kiya-text">{selectedLottery?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">
                  Tickets ({selectedTickets.length}):
                </span>
                <span className="text-kiya-text">
                  {selectedTickets.sort((a, b) => a - b).join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">
                  Price per ticket:
                </span>
                <span className="text-kiya-text">
                  {formatCurrency(selectedLottery?.ticketPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kiya-text-secondary">
                  Payment method:
                </span>
                <span className="text-kiya-text capitalize">
                  {paymentMethod}
                </span>
              </div>
              <div className="border-t border-gray-600 pt-2">
                <div className="flex justify-between">
                  <span className="text-kiya-text font-semibold">
                    Total Amount:
                  </span>
                  <span className="text-kiya-teal font-bold text-xl">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Button */}
        {selectedTickets.length > 0 && (
          <Button
            variant="primary"
            size="full"
            onClick={handleSellTickets}
            loading={isProcessing}
            disabled={validateSale().length > 0}
          >
            Complete Sale - {formatCurrency(totalCost)}
          </Button>
        )}

        {/* Sales History */}
        {salesHistory.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-kiya-text mb-4">
              Recent Sales
            </h2>
            <div className="space-y-3">
              {salesHistory.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-kiya-dark rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-kiya-green/10 rounded-full flex items-center justify-center">
                      <Ticket size={16} className="text-kiya-green" />
                    </div>
                    <div>
                      <p className="font-medium text-kiya-text">
                        {sale.customerName}
                      </p>
                      <p className="text-sm text-kiya-text-secondary">
                        {sale.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-kiya-green">
                      {formatCurrency(sale.amount)}
                    </p>
                    <p className="text-xs text-kiya-text-secondary">
                      {sale.ticketCount} ticket
                      {sale.ticketCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-kiya-text-secondary">
                      <Clock size={12} className="inline mr-1" />
                      {new Date(sale.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Ticket Sale"
      >
        <div className="space-y-4">
          <p className="text-kiya-text">
            Are you sure you want to sell these tickets to{" "}
            <strong>{customerInfo.fullName}</strong>?
          </p>

          <div className="bg-kiya-dark rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-kiya-text-secondary">Tickets:</span>
              <span className="text-kiya-text">{selectedTickets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kiya-text-secondary">Numbers:</span>
              <span className="text-kiya-text">
                {selectedTickets.sort((a, b) => a - b).join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kiya-text-secondary">Total Amount:</span>
              <span className="text-kiya-teal font-bold">
                {formatCurrency(totalCost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kiya-text-secondary">Payment:</span>
              <span className="text-kiya-text capitalize">{paymentMethod}</span>
            </div>
          </div>

          <div className="bg-kiya-warning/10 border border-kiya-warning/20 rounded-lg p-3">
            <p className="text-kiya-warning text-sm">
              ⚠️ This action cannot be undone. Make sure you have received
              payment before confirming.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="full"
              onClick={confirmSale}
              loading={isProcessing}
            >
              Confirm Sale
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default SellTicketScreen;
