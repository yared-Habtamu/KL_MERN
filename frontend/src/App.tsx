import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider, useAuth } from '@/auth/useAuth';
import PrivateRoute from '@/auth/PrivateRoute';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/auth/Login';
import { AdminLayout } from '@/layout/AdminLayout';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { Lotteries } from '@/pages/lotteries/Lotteries';
import { CreateLottery } from '@/pages/lotteries/CreateLottery';
import EditLottery from '@/pages/lotteries/EditLottery';
import { Agents } from '@/pages/agents/Agents';
import { Tickets } from '@/pages/tickets/Tickets';
import { Winners } from '@/pages/winners/Winners';
import { Staff } from '@/pages/staff/Staff';
import { AddStaff } from '@/pages/staff/AddStaff';
import Profile from '@/pages/Profile';
import { Reports } from '@/pages/reports/Reports';
import { LotteryDetail } from '@/pages/lotteries/LotteryDetail';
import OperatorDashboard from '@/pages/operator/OperatorDashboard';
import NewSoldTickets from '@/pages/operator/NewSoldTickets';
import WinnersAnnouncements from '@/pages/operator/WinnersAnnouncements';
import './App.css';
import AgentRegister from '@/pages/agents/AgentRegister';
import SellerDashboard from '@/pages/seller/SellerDashboard';

function DashboardRoutes() {
  const { role } = useParams<{ role: 'admin' | 'manager' | 'seller' | 'operator' }>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Only allow users to access their own dashboard route
  if (!user || user.role !== role) {
    return <Navigate to={`/dashboard/${user?.role || 'login'}`} replace />;
  }

  // Helper: get sidebar config for role
  type NavItem = { id: string; route: string };
  const sidebarConfig: Record<string, NavItem[]> = {
    admin: [
      { id: 'dashboard', route: '/dashboard/admin' },
      { id: 'lotteries', route: '/dashboard/admin/lotteries' },
      { id: 'agents', route: '/dashboard/admin/agents' },
      { id: 'staff', route: '/dashboard/admin/staff' },
      { id: 'tickets', route: '/dashboard/admin/tickets' },
      { id: 'winners', route: '/dashboard/admin/winners' },
      { id: 'reports', route: '/dashboard/admin/reports' },
    ],
    manager: [
      { id: 'dashboard', route: '/dashboard/manager' },
      { id: 'lotteries', route: '/dashboard/manager/lotteries' },
      { id: 'agents', route: '/dashboard/manager/agents' },
      { id: 'staff', route: '/dashboard/manager/staff' },
      { id: 'tickets', route: '/dashboard/manager/tickets' },
      { id: 'winners', route: '/dashboard/manager/winners' },
      { id: 'reports', route: '/dashboard/manager/reports' },
    ],
    seller: [
      { id: 'dashboard', route: '/dashboard/seller' },
      { id: 'lotteries', route: '/dashboard/seller/lotteries' },
      { id: 'tickets', route: '/dashboard/seller/tickets' },
      { id: 'winners', route: '/dashboard/seller/winners' },
    ],
    operator: [
      { id: 'dashboard', route: '/dashboard/operator' },
      { id: 'sold-tickets', route: '/dashboard/operator/sold-tickets' },
      { id: 'winners-announcements', route: '/dashboard/operator/winners-announcements' },
      { id: 'tickets', route: '/dashboard/operator/tickets' },
      { id: 'lotteries', route: '/dashboard/operator/lotteries' },
      { id: 'winners', route: '/dashboard/operator/winners' },
    ],
  };
  const navItems: NavItem[] = sidebarConfig[role || 'admin'] || [];
  // Determine active item from URL
  const activeItem = (() => {
    const path = location.pathname;
    const found = navItems.find((item: NavItem) => {
      if (item.id === 'dashboard') return path === item.route;
      return path === item.route || path.startsWith(item.route + '/');
    });
    return found ? found.id : 'dashboard';
  })();
  // Handler to navigate to sidebar item
  const onItemSelect = (itemId: string) => {
    const item = navItems.find((i: NavItem) => i.id === itemId);
    if (item) navigate(item.route);
  };

  if (role === 'manager') {
    return (
      <AdminLayout activeItem={activeItem} onItemSelect={onItemSelect}>
        <Routes>
          <Route path="" element={<Dashboard />} />
          <Route path="lotteries" element={<Lotteries />} />
          <Route path="agents" element={<Agents />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="winners" element={<Winners />} />
          <Route path="staff" element={<Staff />} />
          <Route path="reports" element={<Reports />} />
          <Route path="lotteries/create" element={<CreateLottery />} />
          <Route path="lotteries/:id" element={<LotteryDetail />} />
          <Route path="lotteries/:id/edit" element={<EditLottery />} />
          <Route path="agents/register" element={<AgentRegister />} />
          <Route path="staff/add" element={<AddStaff />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="reports" element={<Reports />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (role === 'seller') {
    return (
      <AdminLayout activeItem={activeItem} onItemSelect={onItemSelect}>
        <Routes>
          <Route path="" element={<SellerDashboard />} />
          <Route path="lotteries" element={<Lotteries/>} />
          <Route path="lotteries/:id" element={<LotteryDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="winners" element={<Winners />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (role === 'operator') {
    return (
      <AdminLayout activeItem={activeItem} onItemSelect={onItemSelect}>
        <Routes>
          <Route path="" element={<OperatorDashboard />} />
          <Route path="sold-tickets" element={<NewSoldTickets />} />
          <Route path="winners-announcements" element={<WinnersAnnouncements />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="lotteries" element={<Lotteries />} />
          <Route path="lotteries/:id" element={<LotteryDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="winners" element={<Winners />} />
        </Routes>
      </AdminLayout>
    );
  }

  // Default: admin
  return (
    <AdminLayout activeItem={activeItem} onItemSelect={onItemSelect}>
      <Routes>
        <Route path="" element={<Dashboard />} />
        <Route path="lotteries" element={<Lotteries />} />
        <Route path="lotteries/create" element={<CreateLottery />} />
        <Route path="lotteries/:id" element={<LotteryDetail />} />
        <Route path="lotteries/:id/edit" element={<EditLottery />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agents/register" element={<AgentRegister />} />
        <Route path="staff" element={<Staff />} />
        <Route path="staff/add" element={<AddStaff />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="winners" element={<Winners />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
    </AdminLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kiya-lottery-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard/:role/*"
              element={
                <PrivateRoute>
                  <DashboardRoutes />
                </PrivateRoute>
              }
            />
            {/* Redirect /dashboard to the user's dashboard role */}
            <Route
              path="/dashboard"
              element={<RedirectToUserDashboard />}
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RedirectToUserDashboard() {
  const { user } = useAuth();
  if (user && user.role) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default App;