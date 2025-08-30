import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Edit3,
  Save,
  X,
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { InputField } from "../components/ui/InputField";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/ToastNotification";
import {
  generateTicketAvailability,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../lib/mock-data";
import { lotteries as lotteriesApi } from "../lib/api";
type Lottery = any;

interface WinnerData {
  prizeRank: number;
  ticketNumber: string;
  winnerName: string;
  winnerPhone: string;
}

interface EditableFields {
  drawDate: string;
  drawPlace: string;
}

const LotteryManagementScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [winners, setWinners] = useState<WinnerData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editableFields, setEditableFields] = useState<EditableFields>({
    drawDate: "",
    drawPlace: "",
  });

  const [lottery, setLottery] = useState<Lottery | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const l = await lotteriesApi.get(id);
        if (!mounted) return;
        setLottery(l || null);
      } catch (e) {
        console.error("Failed to load lottery", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const ticketAvailability = useMemo(() => {
    if (!lottery) return [];
    return generateTicketAvailability(
      lottery.totalTickets,
      lottery.soldTickets,
    );
  }, [lottery]);

  // Initialize editable fields when lottery loads
  React.useEffect(() => {
    if (lottery) {
      setEditableFields({
        drawDate: lottery.drawDate.split("T")[0], // Extract date part
        drawPlace: "Addis Ababa, Ethiopia", // Default draw place
      });
    }
  }, [lottery]);

  const allTicketsSold = lottery
    ? lottery.soldTickets >= lottery.totalTickets
    : false;
  const canRegisterWinners = lottery?.status === "active" && allTicketsSold;

  if (!lottery) {
    return (
      <PageLayout>
        <div className="page-container flex items-center justify-center min-h-96">
          <Card className="text-center">
            <h2 className="text-xl font-semibold text-kiya-text mb-2">
              Lottery Not Found
            </h2>
            <p className="text-kiya-text-secondary mb-4">
              The lottery you're trying to manage doesn't exist.
            </p>
            <Button onClick={() => navigate("/agent-dashboard")}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const handleEditFields = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowEditModal(false);
      addToast({
        type: "success",
        title: "Lottery Updated",
        message: "Draw date and location have been updated successfully.",
      });
    }, 1000);
  };

  const handleRegisterWinners = () => {
    // Initialize winners array with lottery prizes
    const initialWinners = lottery.prizes.map((prize) => ({
      prizeRank: prize.rank,
      ticketNumber: "",
      winnerName: "",
      winnerPhone: "",
    }));
    setWinners(initialWinners);
    setShowWinnerModal(true);
  };

  const handleWinnerChange = (
    index: number,
    field: keyof WinnerData,
    value: string,
  ) => {
    setWinners((prev) =>
      prev.map((winner, i) =>
        i === index ? { ...winner, [field]: value } : winner,
      ),
    );
  };

  const handleSubmitWinners = () => {
    // Validate all winners have required fields
    const invalidWinners = winners.filter(
      (winner) =>
        !winner.ticketNumber || !winner.winnerName || !winner.winnerPhone,
    );

    if (invalidWinners.length > 0) {
      addToast({
        type: "error",
        title: "Invalid Winner Data",
        message: "Please fill in all required fields for each winner.",
      });
      return;
    }

    // Validate ticket numbers are within range and not duplicated
    const ticketNumbers = winners.map((w) => parseInt(w.ticketNumber));
    const invalidTickets = ticketNumbers.filter(
      (num) =>
        num < 1 || num > lottery.totalTickets || ticketAvailability[num - 1],
    );

    if (invalidTickets.length > 0) {
      addToast({
        type: "error",
        title: "Invalid Ticket Numbers",
        message: "Please enter valid, sold ticket numbers.",
      });
      return;
    }

    // Check for duplicate ticket numbers
    const duplicates = ticketNumbers.filter(
      (num, index) => ticketNumbers.indexOf(num) !== index,
    );
    if (duplicates.length > 0) {
      addToast({
        type: "error",
        title: "Duplicate Ticket Numbers",
        message: "Each winner must have a unique ticket number.",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowWinnerModal(false);
      addToast({
        type: "success",
        title: "Winners Registered",
        message: "All winners have been registered successfully!",
      });

      // Update lottery status to completed
      // In real app, this would be handled by API
    }, 2000);
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
          <h1 className="text-xl font-bold text-kiya-text">Manage Lottery</h1>
        </div>

        {/* Lottery Overview */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-kiya-text mb-2">
                  {lottery.title}
                </h2>
                <p className="text-kiya-text-secondary">
                  Created on {formatDate(lottery.createdAt)}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  lottery.status === "active"
                    ? "bg-kiya-green/10 text-kiya-green"
                    : lottery.status === "completed"
                      ? "bg-kiya-text-secondary/10 text-kiya-text-secondary"
                      : "bg-kiya-warning/10 text-kiya-warning"
                }`}
              >
                {lottery.status.toUpperCase()}
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-kiya-teal">
                  {lottery.soldTickets}/{lottery.totalTickets}
                </p>
                <p className="text-sm text-kiya-text-secondary">Tickets Sold</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-kiya-green">
                  {formatCurrency(lottery.revenue)}
                </p>
                <p className="text-sm text-kiya-text-secondary">Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-kiya-primary">
                  {lottery.prizes.length}
                </p>
                <p className="text-sm text-kiya-text-secondary">Prizes</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Draw Information */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-kiya-text">
              Draw Information
            </h3>
            <Button variant="outline" size="sm" onClick={handleEditFields}>
              <Edit3 size={16} className="mr-1" />
              Edit
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar size={16} className="text-kiya-teal" />
              <div>
                <p className="text-sm text-kiya-text-secondary">Draw Date</p>
                <p className="font-medium text-kiya-text">
                  {formatDateTime(lottery.drawDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin size={16} className="text-kiya-teal" />
              <div>
                <p className="text-sm text-kiya-text-secondary">
                  Draw Location
                </p>
                <p className="font-medium text-kiya-text">
                  {editableFields.drawPlace}
                </p>
              </div>
            </div>

            {allTicketsSold ? (
              <div className="flex items-center space-x-2 p-3 bg-kiya-green/10 border border-kiya-green/20 rounded-lg">
                <CheckCircle size={16} className="text-kiya-green" />
                <span className="text-kiya-green font-medium">
                  All tickets sold - Ready for draw!
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-kiya-warning/10 border border-kiya-warning/20 rounded-lg">
                <AlertCircle size={16} className="text-kiya-warning" />
                <span className="text-kiya-warning">
                  {lottery.totalTickets - lottery.soldTickets} tickets remaining
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Winners Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-kiya-text">
              Prize Winners
            </h3>
            {canRegisterWinners && (
              <Button variant="primary" onClick={handleRegisterWinners}>
                <Trophy size={16} className="mr-1" />
                Register Winners
              </Button>
            )}
          </div>

          {lottery.status === "completed" ? (
            <div className="space-y-3">
              {lottery.prizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="flex items-center space-x-4 p-3 bg-kiya-dark rounded-lg"
                >
                  <div className="w-8 h-8 bg-kiya-green/10 rounded-full flex items-center justify-center">
                    <Trophy size={16} className="text-kiya-green" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-kiya-text">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}{" "}
                      {prize.name}
                    </p>
                    <p className="text-sm text-kiya-text-secondary">
                      Winner: John Doe • Ticket #42 • +251911234567
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy
                size={48}
                className="text-kiya-text-secondary mx-auto mb-4"
              />
              <p className="text-kiya-text-secondary">
                {canRegisterWinners
                  ? "Ready to register winners for this lottery"
                  : "Winners will be displayed here after the draw"}
              </p>
            </div>
          )}
        </Card>

        {/* Sales Analytics */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Sales Analytics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-kiya-dark rounded-lg">
              <BarChart3 size={24} className="text-kiya-teal mx-auto mb-2" />
              <p className="text-lg font-bold text-kiya-text">
                {((lottery.soldTickets / lottery.totalTickets) * 100).toFixed(
                  1,
                )}
                %
              </p>
              <p className="text-sm text-kiya-text-secondary">
                Completion Rate
              </p>
            </div>
            <div className="text-center p-4 bg-kiya-dark rounded-lg">
              <Users size={24} className="text-kiya-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-kiya-text">
                ~{Math.ceil(lottery.soldTickets / 2)}
              </p>
              <p className="text-sm text-kiya-text-secondary">
                Estimated Buyers
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Lottery Information"
      >
        <div className="space-y-4">
          <InputField
            label="Draw Date"
            type="datetime-local"
            value={editableFields.drawDate}
            onChange={(e) =>
              setEditableFields((prev) => ({
                ...prev,
                drawDate: e.target.value,
              }))
            }
          />

          <InputField
            label="Draw Location"
            placeholder="e.g., Addis Ababa, Ethiopia"
            value={editableFields.drawPlace}
            onChange={(e) =>
              setEditableFields((prev) => ({
                ...prev,
                drawPlace: e.target.value,
              }))
            }
          />

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="full"
              onClick={handleSaveEdit}
              loading={isSubmitting}
            >
              <Save size={16} className="mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Winner Registration Modal */}
      <Modal
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        title="Register Winners"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-kiya-text-secondary">
            Enter the winning ticket numbers and winner information for each
            prize.
          </p>

          {winners.map((winner, index) => (
            <Card key={index} className="bg-kiya-dark">
              <h4 className="font-medium text-kiya-text mb-3">
                {index === 0
                  ? "🥇 1st Prize"
                  : index === 1
                    ? "🥈 2nd Prize"
                    : "🥉 3rd Prize"}
                : {lottery.prizes[index]?.name}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InputField
                  label="Winning Ticket Number"
                  type="number"
                  min="1"
                  max={lottery.totalTickets}
                  placeholder="e.g., 42"
                  value={winner.ticketNumber}
                  onChange={(e) =>
                    handleWinnerChange(index, "ticketNumber", e.target.value)
                  }
                />

                <InputField
                  label="Winner Full Name"
                  placeholder="e.g., John Doe"
                  value={winner.winnerName}
                  onChange={(e) =>
                    handleWinnerChange(index, "winnerName", e.target.value)
                  }
                />

                <InputField
                  label="Winner Phone"
                  placeholder="e.g., +251911234567"
                  value={winner.winnerPhone}
                  onChange={(e) =>
                    handleWinnerChange(index, "winnerPhone", e.target.value)
                  }
                />
              </div>
            </Card>
          ))}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowWinnerModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="full"
              onClick={handleSubmitWinners}
              loading={isSubmitting}
            >
              <Trophy size={16} className="mr-1" />
              Register All Winners
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default LotteryManagementScreen;
