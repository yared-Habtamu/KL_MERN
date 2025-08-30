import { Settings, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/auth/useAuth';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMobileSidebarToggle: () => void;
  onSidebarToggle: () => void;
}

export function Topbar({ onMobileSidebarToggle, onSidebarToggle }: TopbarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Capitalize role for display
  const roleLabel = user?.role ? `Dashboard ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` : 'Dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileSidebarToggle}
            className="md:hidden h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="hidden md:flex h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden sm:block">
            <h2 className="text-xl font-semibold text-foreground">{roleLabel}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 md:space-x-3 px-2 md:px-3 h-9">
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarImage src="/api/placeholder/32/32" alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user?.name || ''}</p>
                  <p className="text-xs text-muted-foreground">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/dashboard/${user?.role}/profile`)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}