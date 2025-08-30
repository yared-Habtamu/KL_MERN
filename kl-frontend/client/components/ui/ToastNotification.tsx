import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: "bg-kiya-green/10 border-kiya-green text-kiya-green",
  error: "bg-kiya-red/10 border-kiya-red text-kiya-red",
  info: "bg-kiya-teal/10 border-kiya-teal text-kiya-teal",
  warning: "bg-kiya-warning/10 border-kiya-warning text-kiya-warning",
};

export const ToastNotification: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onRemove,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = toastIcons[type];

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <div
      className={cn(
        "transform transition-all duration-300 ease-out",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      <div
        className={cn(
          "flex items-start p-4 rounded-lg border shadow-lg max-w-sm",
          "bg-kiya-surface border-gray-700",
          toastStyles[type],
        )}
      >
        <Icon size={20} className="flex-shrink-0 mt-0.5" />

        <div className="ml-3 flex-1">
          <p className="font-medium text-kiya-text">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-kiya-text-secondary">{message}</p>
          )}
        </div>

        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 rounded-lg p-1 hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-kiya-text-secondary" />
        </button>
      </div>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      type: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }>
  >([]);

  const addToast = (toast: Omit<(typeof toasts)[0], "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
  };
};
