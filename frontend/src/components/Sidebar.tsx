import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  Users,
  ClipboardList,
  Trophy,
  ChevronLeft,
  ChevronRight,
  X,
  MailCheck,
  Megaphone,
  Building,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';

interface SidebarProps {
  activeItem: string;
  onItemSelect: (item: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

// Sidebar config for roles
const sidebarConfig: Record<string, Array<{ id: string; label: string; icon: any }>> = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lotteries', label: 'Lotteries', icon: Ticket },
    { id: 'agents', label: 'Agents', icon: Building },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: ClipboardList },
    { id: 'winners', label: 'Winners', icon: Trophy },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ],
  manager: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lotteries', label: 'Lotteries', icon: Ticket },
    { id: 'agents', label: 'Agents', icon: Building },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: ClipboardList },
    { id: 'winners', label: 'Winners', icon: Trophy },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ],
  seller: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lotteries', label: 'Available Lotteries', icon: Ticket },
    { id: 'tickets', label: 'Tickets', icon: ClipboardList },
    { id: 'winners', label: 'Winners', icon: Trophy },
  ],
  operator: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sold-tickets', label: 'New Sold Tickets', icon: MailCheck },
    { id: 'winners-announcements', label: 'Winners Announcements', icon: Megaphone },
    { id: 'tickets', label: 'Tickets', icon: ClipboardList },
    { id: 'lotteries', label: 'Lotteries', icon: Ticket },
    { id: 'winners', label: 'Winners', icon: Trophy },
  ],
};

export function Sidebar({ 
  activeItem,
  onItemSelect,
  isCollapsed, 
  onToggleCollapse,
  isMobileOpen,
  onMobileToggle 
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get navigation items for the current role
  const navigationItems = sidebarConfig[user?.role || 'admin'] || [];

  const handleItemClick = (itemId: string) => {
    onItemSelect(itemId);
    if (isMobile) {
      onMobileToggle();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={onMobileToggle}
        />
      )}

      {/* Fixed Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border transition-all duration-300 ease-in-out overflow-y-auto',
          // Z-index management
          isMobile ? 'z-50' : 'z-30',
          // Mobile behavior
          isMobile 
            ? isMobileOpen 
              ? 'translate-x-0 w-64' 
              : '-translate-x-full w-64'
            // Desktop behavior
            : isCollapsed 
              ? 'w-16' 
              : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
          {(!isCollapsed || isMobile) && (
            <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400 truncate">
              Kiya Lottery
            </h1>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 flex-shrink-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileToggle}
              className="h-8 w-8 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  'w-full justify-start gap-3 h-11 transition-all duration-200',
                  isActive && 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
                  isCollapsed && !isMobile && 'px-2 justify-center'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0', 
                  isActive && 'text-purple-600 dark:text-purple-400'
                )} />
                {(!isCollapsed || isMobile) && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}