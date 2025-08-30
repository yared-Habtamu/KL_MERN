import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { InputField } from "../components/ui/InputField";
import { useToast } from "../components/ui/ToastNotification";
import { auth, setToken } from "../lib/api";

interface LoginFormData {
  phone: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    phone: "",
    password: "",
  });

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.phone.trim()) {
      errors.push("Phone number is required");
    } else {
      // Basic Ethiopian phone validation
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

    return errors;
  };

  const handleLogin = async () => {
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

      const resp = await auth.login({
        phone: normalized,
        password: formData.password,
      });
      setToken(resp.token);
      addToast({
        type: "success",
        title: "Login Successful",
        message: "Welcome back!",
      });
      navigate("/");
    } catch (err: any) {
      const message =
        err?.body?.error ||
        err?.body?.message ||
        (err?.body ? JSON.stringify(err.body) : err.message || "Login failed");
      addToast({ type: "error", title: "Login Failed", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <PageLayout showHeader={false} showBottomNav={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-kiya-primary to-kiya-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <h1 className="text-2xl font-bold text-kiya-text">Welcome Back</h1>
            <p className="text-kiya-text-secondary">
              Sign in to your Kiya Lottery account
            </p>
          </div>

          {/* Login Form */}
          <Card>
            <div className="space-y-4">
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

              <Button
                variant="primary"
                size="full"
                onClick={handleLogin}
                loading={isSubmitting}
                disabled={!formData.phone || !formData.password}
              >
                Sign In
              </Button>
            </div>
          </Card>

          {/* Forgot Password */}
          <div className="text-center">
            <button className="text-kiya-teal hover:text-kiya-teal-light text-sm">
              Forgot your password?
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-kiya-text-secondary">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-kiya-teal hover:text-kiya-teal-light font-medium"
              >
                Sign up
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
            <p>By signing in, you agree to our</p>
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

export default LoginScreen;
