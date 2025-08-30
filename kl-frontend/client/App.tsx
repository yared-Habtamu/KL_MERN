import "./global.css";

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastContainer, useToast } from "./components/ui/ToastNotification";
import HomeScreen from "./pages/HomeScreen";
import LotteryDetailScreen from "./pages/LotteryDetailScreen";
import WalletScreen from "./pages/WalletScreen";
import DepositScreen from "./pages/DepositScreen";
import MyTicketsScreen from "./pages/MyTicketsScreen";
import ProfileScreen from "./pages/ProfileScreen";
import AgentDashboardScreen from "./pages/AgentDashboardScreen";
import CreateLotteryScreen from "./pages/CreateLotteryScreen";
import SellTicketScreen from "./pages/SellTicketScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";
import RoleSelectionScreen from "./pages/RoleSelectionScreen";
import BecomeAgentScreen from "./pages/BecomeAgentScreen";
import LotteryManagementScreen from "./pages/LotteryManagementScreen";
import NotFound from "./pages/NotFound";
import { PlaceholderPage } from "./components/PlaceholderPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Routes>
        {/* Main Screens */}
        <Route path="/" element={<HomeScreen />} />
        <Route path="/lottery/:id" element={<LotteryDetailScreen />} />

        {/* Wallet Screens */}
        <Route path="/wallet" element={<WalletScreen />} />
        <Route path="/deposit" element={<DepositScreen />} />

        {/* Client Screens */}
        <Route path="/my-tickets" element={<MyTicketsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />

        {/* Agent Screens */}
        <Route path="/agent-dashboard" element={<AgentDashboardScreen />} />
        <Route path="/create-lottery" element={<CreateLotteryScreen />} />
        <Route path="/sell-ticket" element={<SellTicketScreen />} />

        {/* Authentication Screens */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/role-selection" element={<RoleSelectionScreen />} />

        {/* Additional routes */}
        <Route
          path="/lottery-management/:id"
          element={<LotteryManagementScreen />}
        />
        <Route
          path="/lottery-settings/:id"
          element={
            <PlaceholderPage
              title="Lottery Settings"
              description="Configure your lottery settings and preferences."
              suggestedAction="This screen will include lottery modification options and advanced settings."
            />
          }
        />
        <Route path="/become-agent" element={<BecomeAgentScreen />} />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
