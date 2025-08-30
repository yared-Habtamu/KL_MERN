import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { RecentActivity } from '@/components/RecentActivity';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  activeItem: string;
  onItemSelect: (item: string) => void;
}

export function AdminLayout({ children, activeItem, onItemSelect }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close mobile sidebars when switching to desktop
      if (!mobile) {
        setIsMobileSidebarOpen(false);
        setIsActivityOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleActivityToggle = () => {
    setIsActivityOpen(!isActivityOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <Topbar 
        onMobileSidebarToggle={handleMobileSidebarToggle}
        onSidebarToggle={handleSidebarToggle}
      />

      {/* Fixed Left Sidebar */}
      <Sidebar
        activeItem={activeItem}
        onItemSelect={onItemSelect}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={handleMobileSidebarToggle}
      />

      {/* Fixed Right Sidebar - Desktop */}
      <div className="hidden md:block">
        <RecentActivity 
          isMobileOpen={false}
          onMobileToggle={() => {}}
        />
      </div>

      {/* Mobile Activity Sidebar */}
      <RecentActivity 
        isMobileOpen={isActivityOpen}
        onMobileToggle={handleActivityToggle}
      />

      {/* Main Content Area with Fixed Margins */}
      <main className={cn(
        'pt-16 transition-all duration-300 ease-in-out',
        // Mobile: full width (sidebars are overlays)
        'md:pl-0 md:pr-0',
        // Desktop: account for fixed sidebars
        !isMobile && (isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'),
        !isMobile && 'md:pr-80'
      )}>
        <div className="min-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container-responsive py-6">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Activity Toggle Button */}
      <Button
        variant="default"
        size="icon"
        onClick={handleActivityToggle}
        className={cn(
          "fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg md:hidden z-50",
          "bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800",
          "transition-all duration-200 hover:scale-110"
        )}
      >
        <Activity className="h-5 w-5 text-white" />
      </Button>
    </div>
  );
}