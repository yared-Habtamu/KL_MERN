import React from "react";
import { Moon, Sun, User, Globe } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/api";
interface UserSummary {
  fullName: string;
  role?: string;
  phone?: string;
}

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const me: any = await auth.whoami();
        setUser(me.user || me);
      } catch (e) {
        // not logged in or error
      }
    })();
  }, []);

  return (
    <header className="flex items-center justify-between p-4 bg-kiya-surface border-b border-gray-700 safe-area-top">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-kiya-primary to-kiya-primary-dark rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <h1 className="text-xl font-bold text-kiya-text">Kiya Lottery</h1>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-3">
        {/* Language Switcher */}
        <button className="p-2 rounded-lg bg-kiya-dark hover:bg-gray-700 transition-colors">
          <Globe size={20} className="text-kiya-text-secondary" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-kiya-dark hover:bg-gray-700 transition-colors"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun size={20} className="text-kiya-text-secondary" />
          ) : (
            <Moon size={20} className="text-kiya-text-secondary" />
          )}
        </button>

        {/* User Avatar */}
        <button
          className="flex items-center space-x-2 p-2 rounded-lg bg-kiya-dark hover:bg-gray-700 transition-colors"
          onClick={() => navigate("/profile")}
        >
          <div className="w-8 h-8 bg-kiya-teal rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-kiya-text text-sm font-medium hidden sm:block">
            {(() => {
              if (!user) return "Account";
              const name = (user.fullName as string) || "";
              if (name.trim()) return name.split(" ")[0];
              // fallback to phone or role or generic label
              return (
                (user.phone as string) || (user.role as string) || "Account"
              );
            })()}
          </span>
        </button>
      </div>
    </header>
  );
};