import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { users as usersApi, setToken } from "../lib/api";
import {
  Users,
  TrendingUp,
  Ticket,
  BarChart3,
  DollarSign,
  Shield,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../components/ui/ToastNotification";

interface RoleOption {
  id: "client" | "agent";
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}

const roleOptions: RoleOption[] = [
  {
    id: "client",
    title: "Join as a Player",
    subtitle: "Play and Win Prizes",
    description: "Participate in exciting lotteries and win amazing prizes",
    features: [
      "Browse and join lotteries",
      "Purchase tickets easily",
      "Track your tickets and wins",
      "Secure payment options",
      "Win notification alerts",
      "Prize claim assistance",
    ],
    icon: <Ticket size={48} />,
    color: "text-kiya-teal",
    bgGradient: "from-kiya-teal/10 to-kiya-teal/5",
  },
  {
    id: "agent",
    title: "Become an Agent",
    subtitle: "Create and Earn",
    description: "Create your own lotteries and earn commissions",
    features: [
      "Create custom lotteries",
      "Set your own ticket prices",
      "Earn 90% of ticket sales",
      "Advanced analytics dashboard",
      "Manual ticket sales tools",
      "Customer management system",
    ],
    icon: <BarChart3 size={48} />,
    color: "text-kiya-primary",
    bgGradient: "from-kiya-primary/10 to-kiya-primary/5",
  },
];

const RoleSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"client" | "agent" | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleConfirm = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);

    try {
      // Update user role on backend (backend expects 'player' or 'agent')
      const rolePayload = selectedRole === "client" ? "player" : "agent";
      const resp: any = await usersApi.updateProfile({ role: rolePayload });
      if (resp?.token) setToken(resp.token);
      addToast({
        type: "success",
        title: "Welcome to Kiya Lottery!",
        message: `You've successfully joined as a ${rolePayload}`,
      });
      navigate("/");
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Role Update Failed",
        message: err?.body?.error || err?.message || "Failed to set role",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout showHeader={false} showBottomNav={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-kiya-primary to-kiya-primary-dark rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <h1 className="text-3xl font-bold text-kiya-text mb-2">
              Choose Your Role
            </h1>
            <p className="text-kiya-text-secondary max-w-lg mx-auto">
              How would you like to experience Kiya Lottery? Choose the option
              that best fits your goals.
            </p>
          </div>

          {/* Role Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {roleOptions.map((role) => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedRole === role.id
                    ? `ring-2 ring-offset-2 ring-offset-kiya-dark ${
                        role.id === "client"
                          ? "ring-kiya-teal border-kiya-teal"
                          : "ring-kiya-primary border-kiya-primary"
                      } bg-gradient-to-br ${role.bgGradient}`
                    : "hover:border-gray-500 hover:scale-105"
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="text-center mb-6">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br ${role.bgGradient}`}
                  >
                    <div className={role.color}>{role.icon}</div>
                  </div>
                  <h2 className="text-xl font-bold text-kiya-text mb-1">
                    {role.title}
                  </h2>
                  <p className={`font-medium ${role.color}`}>{role.subtitle}</p>
                  <p className="text-kiya-text-secondary text-sm mt-2">
                    {role.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-kiya-text text-sm">
                    What you get:
                  </h3>
                  <ul className="space-y-2">
                    {role.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                            role.id === "client"
                              ? "bg-kiya-teal"
                              : "bg-kiya-primary"
                          }`}
                        />
                        <span className="text-kiya-text-secondary">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Selection Indicator */}
                <div className="flex justify-center mt-6">
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedRole === role.id
                        ? `${role.id === "client" ? "border-kiya-teal bg-kiya-teal" : "border-kiya-primary bg-kiya-primary"}`
                        : "border-gray-400"
                    }`}
                  >
                    {selectedRole === role.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Agent Benefits Highlight */}
          <Card className="bg-gradient-to-r from-kiya-green/5 to-kiya-primary/5 border-kiya-green/20">
            <div className="flex items-center space-x-3 mb-3">
              <DollarSign size={24} className="text-kiya-green" />
              <h3 className="font-semibold text-kiya-text">
                Agent Earning Potential
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-kiya-green">90%</p>
                <p className="text-xs text-kiya-text-secondary">
                  Revenue Share
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-kiya-teal">5,000+</p>
                <p className="text-xs text-kiya-text-secondary">
                  ETB/Month Potential
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-kiya-primary">24/7</p>
                <p className="text-xs text-kiya-text-secondary">Support</p>
              </div>
            </div>
          </Card>

          {/* Security Notice */}
          <Card className="bg-kiya-dark border-gray-600">
            <div className="flex items-start space-x-3">
              <Shield size={20} className="text-kiya-teal mt-1" />
              <div className="text-sm">
                <h4 className="font-medium text-kiya-text mb-1">
                  Security & Trust
                </h4>
                <p className="text-kiya-text-secondary">
                  All transactions are encrypted and secure. Your role can be
                  changed later in your profile settings. We're committed to
                  providing a safe and fair lottery experience for everyone.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="full"
              onClick={handleRoleConfirm}
              loading={isSubmitting}
              disabled={!selectedRole}
            >
              {selectedRole
                ? `Continue as ${selectedRole === "client" ? "Player" : "Agent"}`
                : "Select a role to continue"}
            </Button>

            <div className="text-center">
              <button
                onClick={() => navigate("/login")}
                className="text-kiya-text-secondary hover:text-kiya-text text-sm"
              >
                ← Back to login
              </button>
            </div>
          </div>

          {/* Role Comparison */}
          <div className="text-center">
            <details className="text-left">
              <summary className="text-kiya-teal cursor-pointer text-sm hover:text-kiya-teal-light">
                Compare roles in detail
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-kiya-text mb-2">
                      Player Benefits:
                    </h4>
                    <ul className="space-y-1 text-kiya-text-secondary">
                      <li>• No upfront costs or fees</li>
                      <li>• Simple ticket purchasing</li>
                      <li>• Instant win notifications</li>
                      <li>• Multiple payment options</li>
                      <li>• Customer support</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-kiya-text mb-2">
                      Agent Benefits:
                    </h4>
                    <ul className="space-y-1 text-kiya-text-secondary">
                      <li>• High commission rates (90%)</li>
                      <li>• Full lottery customization</li>
                      <li>• Real-time analytics</li>
                      <li>• Marketing support</li>
                      <li>• Priority customer service</li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default RoleSelectionScreen;
