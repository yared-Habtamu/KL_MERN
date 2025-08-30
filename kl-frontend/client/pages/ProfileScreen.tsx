import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Globe,
  Shield,
  Bell,
  Moon,
  Sun,
  TrendingUp,
  LogOut,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { InputField } from "../components/ui/InputField";
import { Modal } from "../components/ui/Modal";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/ui/ToastNotification";
import { formatCurrency } from "../lib/mock-data";
import { auth, users as usersApi, wallet as walletApi } from "../lib/api";
import { useEffect } from "react";
type UserType = any;

interface EditableField {
  field: "fullName" | "phone";
  value: string;
}

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState({
    lottery: true,
    wins: true,
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "am", name: "Amharic", nativeName: "አማርኛ" },
    { code: "or", name: "Oromo", nativeName: "Afaan Oromo" },
  ];

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await usersApi.getProfile();
        // normalize to frontend shape
        if (!mounted) return;
        setCurrentUser(
          me
            ? {
                id: me.id || me._id,
                fullName: me.name || "",
                phone: me.phone,
                role: me.role === "player" ? "client" : me.role,
                balance: me.balance || 0,
              }
            : null,
        );
      } catch (e) {
        console.error("failed to load profile", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleEditField = (field: "fullName" | "phone") => {
    setEditingField({
      field,
      value:
        field === "fullName"
          ? currentUser?.fullName || ""
          : currentUser?.phone || "",
    });
  };

  const handleSaveField = () => {
    if (!editingField) return;

    (async () => {
      try {
        const payload: any = {};
        if (editingField.field === "fullName")
          payload.name = editingField.value;
        if (editingField.field === "phone") payload.phone = editingField.value;
        const updated = await usersApi.updateProfile(payload);
        setCurrentUser((prev) => ({
          ...(prev || {}),
          fullName: updated.name,
          phone: updated.phone,
        }));
        addToast({
          type: "success",
          title: "Profile Updated",
          message: `${editingField.field === "fullName" ? "Name" : "Phone"} updated successfully`,
        });
        setEditingField(null);
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Update Failed",
          message:
            err?.body?.error || err?.message || "Failed to update profile",
        });
      }
    })();
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    addToast({
      type: "info",
      title: "Settings Updated",
      message: `${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${notifications[key] ? "disabled" : "enabled"}`,
    });
  };

  const handleChangePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      addToast({
        type: "error",
        title: "Password Mismatch",
        message: "New passwords do not match",
      });
      return;
    }

    if (passwordData.new.length < 6) {
      addToast({
        type: "error",
        title: "Invalid Password",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    (async () => {
      try {
        await auth.changePassword({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        });
        addToast({
          type: "success",
          title: "Password Changed",
          message: "Your password has been updated successfully",
        });
        setShowChangePasswordModal(false);
        setPasswordData({ current: "", new: "", confirm: "" });
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Change Password Failed",
          message:
            err?.body?.error || err?.message || "Failed to change password",
        });
      }
    })();
  };

  const handleRoleChange = () => {
    // Here you would call an API to change the user role
    addToast({
      type: "success",
      title: "Role Change Request",
      message: "Your request to become an agent is being processed",
    });
    setShowRoleChangeModal(false);
  };

  const handleLogout = () => {
    // Here you would call an API to logout
    addToast({
      type: "info",
      title: "Logged Out",
      message: "You have been logged out successfully",
    });
    navigate("/login");
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
          <h1 className="text-xl font-bold text-kiya-text">
            Profile & Settings
          </h1>
        </div>

        {/* Profile Header */}
        <Card>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-kiya-primary to-kiya-primary-dark rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-kiya-text">
                {currentUser?.fullName || "-"}
              </h2>
              <p className="text-kiya-text-secondary">
                {currentUser?.role === "client" ? "Player" : "Agent"} •{" "}
                {currentUser?.phone}
              </p>
              <p className="text-sm text-kiya-teal font-medium">
                Balance: {formatCurrency(Number(currentUser?.balance || 0))}
              </p>
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Account Information
          </h3>
          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm text-kiya-text-secondary">
                  Full Name
                </label>
                {editingField?.field === "fullName" ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      value={editingField.value}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          value: e.target.value,
                        })
                      }
                      className="input-base flex-1"
                    />
                    <button
                      onClick={handleSaveField}
                      className="p-2 rounded-lg bg-kiya-green hover:bg-green-600 transition-colors"
                    >
                      <Check size={16} className="text-white" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 rounded-lg bg-kiya-red hover:bg-red-600 transition-colors"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <p className="text-kiya-text font-medium">
                    {currentUser?.fullName || "-"}
                  </p>
                )}
              </div>
              {editingField?.field !== "fullName" && (
                <button
                  onClick={() => handleEditField("fullName")}
                  className="p-2 rounded-lg bg-kiya-surface hover:bg-gray-700 transition-colors"
                >
                  <Edit3 size={16} className="text-kiya-text-secondary" />
                </button>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm text-kiya-text-secondary">
                  Phone Number
                </label>
                {editingField?.field === "phone" ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="tel"
                      value={editingField.value}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          value: e.target.value,
                        })
                      }
                      className="input-base flex-1"
                    />
                    <button
                      onClick={handleSaveField}
                      className="p-2 rounded-lg bg-kiya-green hover:bg-green-600 transition-colors"
                    >
                      <Check size={16} className="text-white" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 rounded-lg bg-kiya-red hover:bg-red-600 transition-colors"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <p className="text-kiya-text font-medium">
                    {currentUser?.phone || "-"}
                  </p>
                )}
              </div>
              {editingField?.field !== "phone" && (
                <button
                  onClick={() => handleEditField("phone")}
                  className="p-2 rounded-lg bg-kiya-surface hover:bg-gray-700 transition-colors"
                >
                  <Edit3 size={16} className="text-kiya-text-secondary" />
                </button>
              )}
            </div>

            {/* Role */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-kiya-text-secondary">Role</label>
                <p className="text-kiya-text font-medium capitalize">
                  {currentUser?.role || "-"}
                  {currentUser?.role === "client" && (
                    <span className="text-kiya-teal text-sm ml-2">
                      (Upgrade to Agent available)
                    </span>
                  )}
                </p>
              </div>
              {currentUser?.role === "client" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/become-agent")}
                >
                  <TrendingUp size={16} className="mr-1" />
                  Apply for Agent
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Preferences
          </h3>
          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe size={20} className="text-kiya-teal" />
                <div>
                  <p className="text-kiya-text font-medium">Language</p>
                  <p className="text-sm text-kiya-text-secondary">
                    Choose your preferred language
                  </p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-kiya-surface border border-gray-600 rounded-lg px-3 py-2 text-kiya-text"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === "dark" ? (
                  <Moon size={20} className="text-kiya-teal" />
                ) : (
                  <Sun size={20} className="text-kiya-teal" />
                )}
                <div>
                  <p className="text-kiya-text font-medium">Appearance</p>
                  <p className="text-sm text-kiya-text-secondary">
                    {theme === "dark" ? "Dark mode" : "Light mode"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-kiya-surface hover:bg-gray-700 transition-colors"
              >
                {theme === "dark" ? (
                  <Sun size={20} className="text-kiya-text-secondary" />
                ) : (
                  <Moon size={20} className="text-kiya-text-secondary" />
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              {
                key: "lottery",
                label: "New Lotteries",
                description: "Get notified about new lottery announcements",
              },
              {
                key: "wins",
                label: "Win Alerts",
                description: "Instant notifications when you win prizes",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell size={20} className="text-kiya-teal" />
                  <div>
                    <p className="text-kiya-text font-medium">{item.label}</p>
                    <p className="text-sm text-kiya-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleNotificationToggle(
                      item.key as keyof typeof notifications,
                    )
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    notifications[item.key as keyof typeof notifications]
                      ? "bg-kiya-teal"
                      : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      notifications[item.key as keyof typeof notifications]
                        ? "translate-x-6"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Security
          </h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowChangePasswordModal(true)}
            >
              <Shield size={20} className="mr-2" />
              Change Password
            </Button>
          </div>
        </Card>

        {/* Account Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-kiya-text mb-4">
            Account Actions
          </h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => navigate("/wallet")}
            >
              View Wallet
            </Button>
            <Button
              variant="outline"
              size="full"
              onClick={() => navigate("/my-tickets")}
            >
              View My Tickets
            </Button>
            <Button
              variant="danger"
              size="full"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </Button>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <InputField
            label="Current Password"
            type="password"
            value={passwordData.current}
            onChange={(e) =>
              setPasswordData({ ...passwordData, current: e.target.value })
            }
          />

          <InputField
            label="New Password"
            type="password"
            value={passwordData.new}
            onChange={(e) =>
              setPasswordData({ ...passwordData, new: e.target.value })
            }
            helperText="Must be at least 8 characters"
          />

          <InputField
            label="Confirm New Password"
            type="password"
            value={passwordData.confirm}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirm: e.target.value })
            }
          />

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowChangePasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="full"
              onClick={handleChangePassword}
              disabled={
                !passwordData.current ||
                !passwordData.new ||
                !passwordData.confirm
              }
            >
              Change Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleChangeModal}
        onClose={() => setShowRoleChangeModal(false)}
        title="Become an Agent"
      >
        <div className="space-y-4">
          <p className="text-kiya-text">
            Are you sure you want to upgrade to an Agent account? As an agent,
            you'll be able to:
          </p>

          <ul className="space-y-2 text-sm text-kiya-text-secondary">
            <li>• Create and manage your own lotteries</li>
            <li>• Earn 90% commission on ticket sales</li>
            <li>• Access advanced analytics and tools</li>
            <li>• Manually sell tickets to customers</li>
          </ul>

          <div className="bg-kiya-warning/10 border border-kiya-warning/20 rounded-lg p-3">
            <p className="text-kiya-warning text-sm">
              ⚠️ This change is permanent and cannot be undone. Your account
              will be reviewed before activation.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowRoleChangeModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="full" onClick={handleRoleChange}>
              Confirm Upgrade
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
      >
        <div className="space-y-4">
          <p className="text-kiya-text">
            Are you sure you want to logout? You'll need to sign in again to
            access your account.
          </p>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="full" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default ProfileScreen;
