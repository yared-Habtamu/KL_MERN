import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Building,
  User,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Ticket as LucideTicket,
} from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/hooks/use-toast';
import { lotteryService } from '@/services/lotteries/lotteryService';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { LotteryDetail } from '@/services/lotteries/lotteryService';

export function LotteryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lottery, setLottery] = useState<LotteryDetail | null>(null);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [sellModal, setSellModal] = useState<{ open: boolean; ticketNumber: number | null; loading: boolean; error: string | null }>({ open: false, ticketNumber: null, loading: false, error: null });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    const fetchLotteryDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await lotteryService.getLotteryById(id);
        setLottery(data);
      } catch (error) {
        console.error('Failed to fetch lottery detail:', error);
        toast({
          title: "Error",
          description: "Failed to load lottery details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLotteryDetail();
  }, [id, toast]);

  // Fetch sold tickets (initial and polling)
  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;
    const fetchSold = async () => {
      if (!id) return;
      try {
        const numbers = await lotteryService.getSoldTickets(id);
        if (isMounted) setSoldNumbers(numbers);
      } catch (e) {
        if (isMounted) setSoldNumbers([]);
      }
    };
    fetchSold();
    // Poll every 4–5 seconds (randomize to avoid thundering herd)
    interval = setInterval(fetchSold, 4000 + Math.floor(Math.random() * 1000));
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const handleEdit = () => {
    navigate(`/dashboard/${user?.role}/lotteries/${id}/edit`);
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-500" />
    );
  };

  const getTypeIcon = (type: string) => {
    return type === 'company' ? (
      <Building className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  // Helper: phone validation
  function validatePhone(phone: string) {
    const p = phone.trim();
    return (
      /^09\d{8}$/.test(p) ||
      /^07\d{8}$/.test(p) ||
      /^\+2519\d{8}$/.test(p) ||
      /^\+2517\d{8}$/.test(p)
    );
  }

  // Handle sell button click
  const handleSellClick = (ticketNumber: number) => {
    setSellModal({ open: true, ticketNumber, loading: false, error: null });
    setCustomerName('');
    setCustomerPhone('');
  };

  // Optimistically update soldNumbers when selling a ticket
  const handleSellSubmit = async () => {
    if (!customerName.trim() || !validatePhone(customerPhone)) {
      setSellModal((prev) => ({ ...prev, error: 'Enter valid name and phone.' }));
      return;
    }
    setSellModal((prev) => ({ ...prev, loading: true, error: null }));
    try {
      if (!id || !sellModal.ticketNumber) return;
      // Optimistically update UI
      setSoldNumbers((prev) => prev.includes(sellModal.ticketNumber!) ? prev : [...prev, sellModal.ticketNumber!]);
      await lotteryService.sellTicket(id, sellModal.ticketNumber, customerName.trim(), customerPhone.trim());
      setSellModal({ open: false, ticketNumber: null, loading: false, error: null });
      toast({ title: 'Success', description: 'Ticket sold successfully!' });
      // No need to reload the page; polling will keep it up to date
    } catch (e: any) {
      setSellModal((prev) => ({ ...prev, loading: false, error: e.message || 'Failed to sell ticket.' }));
    }
  };


  // Get all valid prize images, safely handle null lottery
  const prizeImages = useMemo(() => {
    if (!lottery || !Array.isArray((lottery as any).prizes)) return [];
    return (lottery as any).prizes.map((p: any) => p.imageUrl).filter((url: string | undefined) => !!url);
  }, [lottery]);

  // Image carousel functions
  const hasMultipleImages = prizeImages.length > 1;

  const nextImage = () => {
    if (prizeImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % prizeImages.length);
  };

  const prevImage = () => {
    if (prizeImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + prizeImages.length) % prizeImages.length);
  };

  // Get current image to display
  const getCurrentImage = () => {
    if (prizeImages.length > 0) {
      return prizeImages[currentImageIndex];
    }
    return null;
  };

  // Ticket grid/table rendering
  const renderTicketTable = () => {
    if (!lottery) return null;
    const total = (lottery as any).ticketCount || 0;
    if (total === 0) {
      return <div className="text-center text-muted-foreground mt-8">No tickets to display for this lottery.</div>;
    }
    const perRow = 10;
    const rows = [];
    for (let i = 1; i <= total; i += perRow) {
      const row = [];
      for (let j = i; j < i + perRow && j <= total; j++) {
        const sold = soldNumbers.includes(j);
        row.push(
          <td key={j} className={`text-center py-2 px-1 ${sold ? 'bg-green-400 text-white shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]' : 'bg-yellow-100 text-yellow-900'} border`}>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-sm">{j}</span>
              <span className="text-xs">{lottery.ticketPrice || 0} ETB</span>
              {!sold && (
                <Button size="sm" className="mt-1 bg-yellow-300 hover:bg-yellow-400 text-yellow-900" onClick={e => { e.stopPropagation(); handleSellClick(j); }}>Sell</Button>
              )}
            </div>
          </td>
        );
      }
      rows.push(<tr key={i}>{row}</tr>);
    }
    return (
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg mt-8">
        <table className="min-w-full border-collapse">
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!lottery) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-muted-foreground">Lottery not found</h2>
        <p className="text-muted-foreground mt-2">The lottery you're looking for doesn't exist.</p>
        <Button 
          onClick={() => navigate(`/dashboard/${user?.role}/lotteries`)}
          className="mt-4"
        >
          Back to Lotteries
        </Button>
      </div>
    );
  }

  const currentImage = getCurrentImage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/${user?.role}/lotteries`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lottery.title}</h1>
            <p className="text-muted-foreground">Lottery Details</p>
          </div>
        </div>
        {user?.role === 'admin' && lottery.status === 'active' && (
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lottery
          </Button>
        )}
      </div>

      {/* Lottery Image Carousel - Full Width */}
      {currentImage ? (
        <Card>
          <CardContent className="p-0 relative">
            <img
              src={currentImage}
              alt={`${lottery.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-80 object-cover rounded-lg"
            />
            
            {/* Navigation buttons */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {prizeImages.map((_: string, index: number) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-80">
            <div className="flex flex-col items-center gap-2">
              <img src="/placeholder.png" alt="No image" className="w-24 h-24 opacity-60" />
              <span className="text-muted-foreground text-sm">No images available for this lottery</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(lottery.status)}
                    <Badge
                      variant={lottery.status === 'active' ? 'default' : 'secondary'}
                      className={
                        lottery.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }
                    >
                      {lottery.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(lottery.type)}
                    <Badge
                      variant={lottery.type === 'company' ? 'default' : 'secondary'}
                      className={
                        lottery.type === 'company'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                      }
                    >
                      {lottery.type}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Creator</p>
                <p className="mt-1">{lottery.creator}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{lottery.description}</p>
              </div>
              {/* Created At row */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="mt-1 text-sm">{format(new Date(lottery.createdAt), 'PPP')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Statistics */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col items-center justify-center gap-3 p-3 bg-muted rounded-lg">
                  <LucideTicket className="h-5 w-5 text-blue-500" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Tickets Sold</p>
                    <p className="text-lg font-bold">{(lottery.ticketsSold || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 p-3 bg-muted rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Ticket Price</p>
                    <p className="text-lg font-bold">${(lottery.ticketPrice || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg w-full justify-center">
                <DollarSign className="h-5 w-5 text-purple-500" />
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-bold">
                    ${((lottery.ticketsSold || 0) * (lottery.ticketPrice || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Table/Grid - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTicketTable()}
        </CardContent>
      </Card>

      {/* Sell Modal */}
      <Dialog open={sellModal.open} onOpenChange={open => setSellModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Ticket #{sellModal.ticketNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} disabled={sellModal.loading} />
            </div>
            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} disabled={sellModal.loading} placeholder="09... or 07... or +2519... or +2517..." />
            </div>
            {sellModal.error && <div className="text-red-600 text-sm">{sellModal.error}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleSellSubmit} disabled={sellModal.loading} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900">
              {sellModal.loading ? 'Selling...' : 'Sell Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 