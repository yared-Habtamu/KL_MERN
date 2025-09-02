import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Calculator, Info } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { InputField } from "../components/ui/InputField";
import { Modal } from "../components/ui/Modal";
import { FileUpload } from "../components/ui/FileUpload";
import { useToast } from "../components/ui/ToastNotification";
import { formatCurrency, Prize } from "../lib/mock-data";
import { lotteries } from "../lib/api";
import { users as usersApi } from "../lib/api";

interface LotteryFormData {
  title: string;
  description: string;
  ticketPrice: string;
  totalTickets: string;
}

interface PrizeForm {
  rank: number;
  name: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
}

const CreateLotteryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<LotteryFormData>({
    title: "",
    description: "",
    ticketPrice: "",
    totalTickets: "",
  });

  const [prizes, setPrizes] = useState<PrizeForm[]>([
    { rank: 1, name: "", description: "", image: null, imagePreview: null },
    { rank: 2, name: "", description: "", image: null, imagePreview: null },
    { rank: 3, name: "", description: "", image: null, imagePreview: null },
  ]);

  const [prizeCount, setPrizeCount] = useState(3);

  // Calculate financial projections
  const ticketPrice = parseFloat(formData.ticketPrice) || 0;
  const totalTickets = parseInt(formData.totalTickets) || 0;
  const maxRevenue = ticketPrice * totalTickets;
  const commissionRate = 0.1; // 10% commission
  const commission = maxRevenue * commissionRate;
  const netRevenue = maxRevenue - commission;

  const handleInputChange = (field: keyof LotteryFormData, value: string) => {
    // sanitize totalTickets to integer string to avoid accidental decimals or negative values
    if (field === "totalTickets") {
      const n = Math.max(0, Math.floor(Number(value) || 0));
      setFormData((prev) => ({ ...prev, [field]: String(n) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrizeChange = (
    index: number,
    field: keyof PrizeForm,
    value: string | number | File | null,
  ) => {
    setPrizes((prev) =>
      prev.map((prize, i) =>
        i === index ? { ...prize, [field]: value } : prize,
      ),
    );
  };

  const handlePrizeImageChange = (index: number, file: File | null) => {
    setPrizes((prev) =>
      prev.map((prize, i) => {
        if (i === index) {
          let imagePreview = null;
          if (file && file.type.startsWith("image/")) {
            imagePreview = URL.createObjectURL(file);
          }
          return { ...prize, image: file, imagePreview };
        }
        return prize;
      }),
    );
  };

  const updatePrizeCount = (count: number) => {
    setPrizeCount(count);
    if (count > prizes.length) {
      // Add new prizes
      const newPrizes = [...prizes];
      for (let i = prizes.length; i < count; i++) {
        newPrizes.push({
          rank: i + 1,
          name: "",
          description: "",
          image: null,
          imagePreview: null,
        });
      }
      setPrizes(newPrizes);
    } else {
      // Remove excess prizes and cleanup image URLs
      const prizesToRemove = prizes.slice(count);
      prizesToRemove.forEach((prize) => {
        if (prize.imagePreview) {
          URL.revokeObjectURL(prize.imagePreview);
        }
      });
      setPrizes((prev) => prev.slice(0, count));
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title.trim()) errors.push("Title is required");
    if (!formData.description.trim()) errors.push("Description is required");
    if (!formData.ticketPrice || ticketPrice <= 0)
      errors.push("Valid ticket price is required");
    if (!formData.totalTickets || totalTickets <= 0)
      errors.push("Valid total tickets is required");
    // Removed schedule/date requirements: the system will mark lottery ended automatically

    // Prize validations
    const activePrizes = prizes.slice(0, prizeCount);
    activePrizes.forEach((prize, index) => {
      if (!prize.name.trim())
        errors.push(`Prize ${index + 1} name is required`);
    });

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
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

    setIsSubmitting(true);
    try {
      // ensure ticketCount is an integer
      const ticketCount = Math.max(
        0,
        Math.floor(Number(formData.totalTickets) || 0),
      );

      const prizeInputs = prizes.slice(0, prizeCount);
      // If any prize has a File, build multipart/form-data
      const hasFiles = prizeInputs.some((p) => p.image instanceof File);

      let resp: any = null;
      if (hasFiles) {
        const fd = new FormData();
        fd.append("title", formData.title);
        fd.append("description", formData.description);
        fd.append("ticketPrice", String(Number(formData.ticketPrice)));
        fd.append("ticketCount", String(ticketCount));
        // append prizes metadata and files
        prizeInputs.forEach((p, idx) => {
          fd.append(`prizes[${idx}][rank]`, String(p.rank));
          fd.append(`prizes[${idx}][name]`, p.name || "");
          fd.append(`prizes[${idx}][description]`, p.description || "");
          if (p.image instanceof File) {
            // send file under prizesFiles[] aligned by index
            fd.append("prizeFiles", p.image, p.image.name || `prize-${idx}`);
            // also include a pointer so server can correlate if needed
            fd.append(`prizes[${idx}][hasFile]`, "1");
          }
        });
        resp = await lotteries.create(fd);
      } else {
        const normalizedPrizes = prizeInputs.map((p) => ({
          id: String(p.rank),
          rank: p.rank,
          name: p.name,
          description: p.description,
        }));
        const payload = {
          title: formData.title,
          description: formData.description,
          ticketPrice: Number(formData.ticketPrice),
          ticketCount,
          prizes: normalizedPrizes,
        } as any;
        resp = await lotteries.create(payload);
      }
      addToast({
        type: "success",
        title: "Lottery Created",
        message: `"${resp.title}" created`,
      });
      navigate("/agent-dashboard");
    } catch (err: any) {
      const message =
        err?.body?.error ||
        err?.body?.message ||
        (err?.body
          ? JSON.stringify(err.body)
          : err.message || "Create lottery failed");
      addToast({ type: "error", title: "Create Lottery Failed", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard: only agents may access this page
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me: any = await usersApi.getProfile();
        const role = me?.user?.role || me?.role;
        if (!mounted) return;
        if (role !== "agent") {
          // redirect non-agents
          navigate("/");
        }
      } catch (e) {
        // not logged in or error, redirect
        if (mounted) navigate("/");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const today = new Date().toISOString().split("T")[0];

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
          <h1 className="text-xl font-bold text-kiya-text">
            Create New Lottery
          </h1>
        </div>

        {/* Basic Information */}
        <Card>
          <h2 className="text-lg font-semibold text-kiya-text mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <InputField
              label="Lottery Title"
              placeholder="e.g., Weekly Cash Prize Draw"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />

            <InputField
              label="Description"
              placeholder="Describe your lottery, prizes, and what makes it exciting..."
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>
        </Card>

        {/* Ticket Configuration */}
        <Card>
          <h2 className="text-lg font-semibold text-kiya-text mb-4">
            Ticket Configuration
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Ticket Price (ETB)"
              type="number"
              placeholder="0.00"
              value={formData.ticketPrice}
              onChange={(e) => handleInputChange("ticketPrice", e.target.value)}
            />

            <InputField
              label="Total Tickets"
              type="number"
              placeholder="100"
              value={formData.totalTickets}
              onChange={(e) =>
                handleInputChange("totalTickets", e.target.value)
              }
            />
          </div>
        </Card>

        {/* Prize Configuration */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-kiya-text">
              Prize Configuration
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-kiya-text-secondary">
                Number of prizes:
              </span>
              <div className="flex space-x-1">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => updatePrizeCount(count)}
                    className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                      prizeCount === count
                        ? "bg-kiya-teal text-white"
                        : "bg-kiya-surface text-kiya-text-secondary hover:bg-gray-700"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {prizes.slice(0, prizeCount).map((prize, index) => (
              <div
                key={index}
                className="bg-kiya-dark rounded-lg p-4 border border-gray-700"
              >
                <h3 className="font-medium text-kiya-text mb-3">
                  {index === 0
                    ? "🥇 1st Prize"
                    : index === 1
                      ? "🥈 2nd Prize"
                      : "🥉 3rd Prize"}
                </h3>

                <div className="space-y-4">
                  {/* Prize Name and Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Prize Name"
                      placeholder="e.g., iPhone 15 Pro"
                      value={prize.name}
                      onChange={(e) =>
                        handlePrizeChange(index, "name", e.target.value)
                      }
                    />
                    <InputField
                      label="Description"
                      placeholder="e.g., 256GB Space Black"
                      value={prize.description}
                      onChange={(e) =>
                        handlePrizeChange(index, "description", e.target.value)
                      }
                    />
                  </div>

                  {/* Prize Image Upload */}
                  <div>
                    <label className="block text-label font-medium text-kiya-text mb-2">
                      Prize Image (Optional)
                    </label>
                    <FileUpload
                      onFileSelect={(file) =>
                        handlePrizeImageChange(index, file)
                      }
                      accept="image/*"
                      maxSizeMB={2}
                    />
                    {prize.imagePreview && (
                      <div className="mt-3">
                        <img
                          src={prize.imagePreview}
                          alt={`${prize.name} preview`}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Schedule removed: end/draw dates handled automatically when tickets sold */}

        {/* Financial Summary */}
        <Card className="bg-gradient-to-r from-kiya-primary/5 to-kiya-teal/5 border-kiya-primary/20">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator size={20} className="text-kiya-teal" />
            <h2 className="text-lg font-semibold text-kiya-text">
              Financial Projection
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-kiya-text-secondary">
                Maximum Revenue
              </p>
              <p className="text-xl font-bold text-kiya-text">
                {formatCurrency(maxRevenue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-kiya-text-secondary">
                Platform Commission (10%)
              </p>
              <p className="text-lg font-semibold text-kiya-red">
                -{formatCurrency(commission)}
              </p>
            </div>
            <div className="col-span-2 pt-2 border-t border-gray-600">
              <p className="text-sm text-kiya-text-secondary">
                Your Earnings (if all tickets sold)
              </p>
              <p className="text-2xl font-bold text-kiya-green">
                {formatCurrency(netRevenue)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-kiya-dark rounded-lg">
            <div className="flex items-start space-x-2">
              <Info size={16} className="text-kiya-teal mt-0.5 flex-shrink-0" />
              <div className="text-sm text-kiya-text-secondary">
                <p>Commission is paid upfront when creating the lottery.</p>
                <p>
                  You'll need{" "}
                  <strong className="text-kiya-teal">
                    {formatCurrency(commission)}
                  </strong>{" "}
                  in your wallet to proceed.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <Button
            variant="outline"
            size="full"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title || !formData.description}
          >
            Preview Lottery
          </Button>

          <Button
            variant="primary"
            size="full"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={validateForm().length > 0}
          >
            Create Lottery & Pay Commission ({formatCurrency(commission)})
          </Button>

          <p className="text-xs text-kiya-text-secondary text-center">
            By creating this lottery, you agree to our terms and conditions.
            Commission is non-refundable once the lottery is created.
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Lottery Preview"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-kiya-text mb-2">
              {formData.title || "Untitled Lottery"}
            </h3>
            <p className="text-kiya-text-secondary">
              {formData.description || "No description provided"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-kiya-text-secondary">Ticket Price:</span>
              <p className="font-medium text-kiya-text">
                {formatCurrency(ticketPrice)}
              </p>
            </div>
            <div>
              <span className="text-kiya-text-secondary">Total Tickets:</span>
              <p className="font-medium text-kiya-text">{totalTickets}</p>
            </div>
            {/* Dates are auto-managed by the system when tickets sell out */}
          </div>

          <div>
            <h4 className="font-medium text-kiya-text mb-2">
              Prizes ({prizeCount})
            </h4>
            <div className="space-y-3">
              {prizes.slice(0, prizeCount).map((prize, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-kiya-text-secondary">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </span>
                    {prize.imagePreview && (
                      <img
                        src={prize.imagePreview}
                        alt={`${prize.name} preview`}
                        className="w-12 h-12 object-cover rounded border border-gray-600"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-kiya-text font-medium">
                      {prize.name || `Prize ${index + 1}`}
                    </div>
                    {prize.description && (
                      <div className="text-xs text-kiya-text-secondary">
                        {prize.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default CreateLotteryScreen;
