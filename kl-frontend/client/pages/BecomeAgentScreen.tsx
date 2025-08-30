import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Award } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { InputField } from "../components/ui/InputField";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/ToastNotification";
import { agentApplications } from "../lib/api";

interface ApplicationData {
  fullName: string;
  phone: string;
  address: string;
}

const BecomeAgentScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    fullName: "",
    phone: "",
    address: "",
  });

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setApplicationData((prev) => ({ ...prev, [field]: value }));
  };

  const validateApplication = () => {
    const errors: string[] = [];
    if (!applicationData.fullName.trim()) errors.push("Full name is required");
    if (!applicationData.phone.trim()) errors.push("Phone number is required");
    if (!applicationData.address.trim()) errors.push("Address is required");
    const phoneRegex = /^\+?251[0-9]{9}$/;
    if (
      applicationData.phone &&
      !phoneRegex.test(applicationData.phone.replace(/\s/g, ""))
    ) {
      errors.push("Please enter a valid Ethiopian phone number");
    }
    return errors;
  };

  const handleSubmitApplication = async () => {
    const errors = validateApplication();
    if (errors.length > 0) {
      errors.forEach((error) =>
        addToast({ type: "error", title: "Validation Error", message: error }),
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await agentApplications.submit(applicationData);
      setIsSubmitting(false);
      setShowApplicationModal(false);
      addToast({
        type: "success",
        title: "Agent Application submitted",
        message: "Agent Application submitted we will contact you soon",
      });
      setApplicationData({ fullName: "", phone: "", address: "" });
    } catch (err: any) {
      console.error("Agent application submit failed", err);
      setIsSubmitting(false);
      addToast({
        type: "error",
        title: "Submission Failed",
        message:
          err?.body?.error || err?.message || "Failed to submit application",
      });
    }
  };

  return (
    <PageLayout>
      <div className="page-container space-y-8">
        <div className="flex items-center space-x-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-kiya-surface hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} className="text-kiya-text" />
          </button>
          <h1 className="text-xl font-bold text-kiya-text">Become an Agent</h1>
        </div>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-kiya-primary to-kiya-primary-dark rounded-2xl flex items-center justify-center mx-auto">
            <Award size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-kiya-text">
            Start Your Agent Journey
          </h1>
          <p className="text-kiya-text-secondary max-w-2xl mx-auto text-lg">
            Join thousands of successful agents earning substantial income by
            creating and managing lotteries on Kiya Lottery platform.
          </p>
        </div>

        <div className="space-y-4 pb-8">
          <Button
            variant="primary"
            size="full"
            onClick={() => setShowApplicationModal(true)}
            className="text-lg py-4"
          >
            <Zap size={20} className="mr-2" /> Apply to Become an Agent
          </Button>
          <div className="text-center">
            <p className="text-sm text-kiya-text-secondary">
              Questions? Contact our agent support team at{" "}
              <span className="text-kiya-teal">+251-911-000-000</span>
            </p>
          </div>
        </div>

        <Modal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          title="Agent Application"
          size="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <p className="text-kiya-text-secondary">
              Fill out this application to start your journey as a Kiya Lottery
              agent.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Full Name *"
                placeholder="Your full name"
                value={applicationData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
              <InputField
                label="Phone Number *"
                placeholder="+251911234567"
                value={applicationData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <InputField
              label="Address *"
              placeholder="Your full address"
              value={applicationData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
            <div className="bg-kiya-warning/10 border border-kiya-warning/20 rounded-lg p-3">
              <p className="text-sm text-kiya-text-secondary">
                <strong>Important:</strong> Agent status requires manual
                approval. We will contact you for an interview and agreement
                signing before activating your account. This process typically
                takes 3-5 business days.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="full"
                onClick={() => setShowApplicationModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="full"
                onClick={handleSubmitApplication}
                loading={isSubmitting}
                disabled={validateApplication().length > 0}
              >
                Submit Application
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default BecomeAgentScreen;
