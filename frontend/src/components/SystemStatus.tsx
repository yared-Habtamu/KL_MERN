import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { systemStatusService, SystemStatus } from '@/services/systemStatusService';

export function SystemStatusCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        const data = await systemStatusService.getStatus();
        setSystemStatus(data);
      } catch (error) {
        console.error('Failed to fetch system status:', error);
        toast({
          title: "Error",
          description: "Failed to load system status. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'warning':
        return 'System Warnings Detected';
      case 'critical':
        return 'Critical Issues Detected';
      default:
        return 'Status Unknown';
    }
  };

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!systemStatus) {
    return null;
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {getStatusIcon(systemStatus.status)}
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <span className="text-sm font-medium">Overall Status</span>
          <div className="flex items-center gap-2">
            <Badge 
              variant={systemStatus.status === 'healthy' ? 'default' : 'destructive'}
              className={systemStatus.status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            >
              {systemStatus.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Warning Count */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <span className="text-sm font-medium">Active Warnings</span>
          <span className={`text-sm font-semibold ${getStatusColor(systemStatus.status)}`}>
            {systemStatus.warningCount} warning{systemStatus.warningCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Status Description */}
        <div className="p-3 rounded-lg bg-muted/30">
          <span className="text-sm font-medium">Status</span>
          <p className={`text-sm font-semibold mt-1 ${getStatusColor(systemStatus.status)}`}>
            {getStatusText(systemStatus.status)}
          </p>
        </div>

        {/* Latest Warning (if any) */}
        {systemStatus.latestWarning && (
          <div className="p-3 rounded-lg bg-muted/30">
            <span className="text-sm font-medium">Latest Warning</span>
            <p className="text-sm text-muted-foreground mt-1">
              {systemStatus.latestWarning.action}: {systemStatus.latestWarning.details}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(systemStatus.latestWarning.createdAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 