import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Phone, Lock, Check } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../components/ui/ToastNotification";
import { auth, setToken } from "../lib/api";

interface RegisterFormData {
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  cityAddress?: string;
  kebeleAddress?: string;
}

const RegisterScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    cityAddress: "",
    kebeleAddress: "01",
  });

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.fullName.trim()) {
      errors.push("Full name is required");
    } else if (formData.fullName.trim().length < 2) {
      errors.push("Full name must be at least 2 characters");
    }

    if (!formData.phone.trim()) {
      errors.push("Phone number is required");
    } else {
      const phoneRegex = /^\+?251[0-9]{9}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        errors.push("Please enter a valid Ethiopian phone number");
      }
    }

    if (!formData.password.trim()) {
      errors.push("Password is required");
    } else if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }

    if (!formData.confirmPassword.trim()) {
      errors.push("Please confirm your password");
    } else if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return errors;
  };

  const handleRegister = async () => {
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
      const normalizePhone = (p: string) => {
        let s = String(p || "")
          .replace(/\s|-/g, "")
          .trim();
        s = s.replace(/[^+\d]/g, "");
        if (s.startsWith("+")) {
          return s;
        }
        if (s.startsWith("251")) return "+" + s;
        if (s.startsWith("0")) return "+251" + s.slice(1);
        if (s.startsWith("9")) return "+251" + s;
        return s;
      };

      const normalized = normalizePhone(formData.phone);
      const ethiopianStrict = /^\+2519\d{8}$/;
      if (!ethiopianStrict.test(normalized)) {
        addToast({
          type: "error",
          title: "Invalid Phone",
          message: "Phone must be in the format +2519XXXXXXXX",
        });
        setIsSubmitting(false);
        return;
      }

      const resp = await auth.register({
        phone: normalized,
        password: formData.password,
        name: formData.fullName,
        cityAddress: formData.cityAddress,
        kebeleAddress: formData.kebeleAddress,
      });
      setToken(resp.token);
      addToast({
        type: "success",
        title: "Registration Successful",
        message: "Welcome!",
      });
      navigate("/role-selection");
    } catch (err: any) {
      const message =
        err?.body?.error ||
        err?.body?.message ||
        (err?.body
          ? JSON.stringify(err.body)
          : err.message || "Registration failed");
      addToast({ type: "error", title: "Registration Failed", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  const errors = validateForm();

  return (
    <PageLayout showHeader={false} showBottomNav={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-kiya-primary to-kiya-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <h1 className="text-2xl font-bold text-kiya-text">
              Create Account
            </h1>
            <p className="text-kiya-text-secondary">
              Join Kiya Lottery and start winning!
            </p>
          </div>

          {/* Registration Form */}
          <Card>
            <div className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <User
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary z-10"
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                  className="input-base pl-10"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <Phone
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary z-10"
                />
                <input
                  type="tel"
                  placeholder="+251911234567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input-base pl-10"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary z-10"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                  className="input-base pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary z-10"
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                  className={`input-base pl-10 pr-10 ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "border-kiya-red focus:border-kiya-red"
                      : formData.confirmPassword &&
                          formData.password === formData.confirmPassword
                        ? "border-kiya-green focus:border-kiya-green"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-kiya-text-secondary"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <Check
                      size={16}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-kiya-green"
                    />
                  )}
              </div>

              {/* City Address */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="City (e.g., Bulehora)"
                  value={formData.cityAddress}
                  onChange={(e) =>
                    handleInputChange("cityAddress", e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                  className="input-base"
                />
              </div>

              {/* Kebele Address */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Kebele (e.g., 01)"
                  value={formData.kebeleAddress}
                  onChange={(e) =>
                    handleInputChange("kebeleAddress", e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                  className="input-base"
                />
              </div>

              <Button
                variant="primary"
                size="full"
                onClick={handleRegister}
                loading={isSubmitting}
                disabled={errors.length > 0}
              >
                Create Account
              </Button>
            </div>
          </Card>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-kiya-text-secondary">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-kiya-teal hover:text-kiya-teal-light font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Language Selector */}
          <div className="text-center">
            <div className="inline-flex bg-kiya-surface rounded-lg p-1">
              <button className="px-3 py-2 rounded-lg bg-kiya-teal text-white text-sm font-medium">
                English
              </button>
              <button className="px-3 py-2 rounded-lg text-kiya-text-secondary text-sm">
                አማርኛ
              </button>
              <button className="px-3 py-2 rounded-lg text-kiya-text-secondary text-sm">
                Afaan Oromo
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-kiya-text-secondary">
            <p>By creating an account, you agree to our</p>
            <p>
              <button className="text-kiya-teal hover:underline">
                Terms of Service
              </button>
              {" and "}
              <button className="text-kiya-teal hover:underline">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default RegisterScreen;
