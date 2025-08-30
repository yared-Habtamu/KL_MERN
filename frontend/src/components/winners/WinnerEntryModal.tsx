import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lottery {
  _id: string;
  title: string;
  prizes: Array<{
    rank: number;
    title: string;
    imageUrl: string;
  }>;
  winningTicketNumber?: number[];
  tiktokStreamLink?: string;
}

interface WinnerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lottery?: Lottery | null;
  editMode?: boolean;
}

export function WinnerEntryModal({ isOpen, onClose, onSuccess, lottery, editMode = false }: WinnerEntryModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(lottery || null);
  const [tiktokLink, setTiktokLink] = useState(lottery?.tiktokStreamLink || '');
  const [ticketNumbers, setTicketNumbers] = useState<{ [key: number]: string }>({});
  const [errors, setErrors] = useState<{ [key: number]: string }>({});

  // Fetch ended lotteries without winners (only if not locked to a lottery)
  useEffect(() => {
    if (isOpen && !lottery) {
      fetchEndedLotteries();
    }
  }, [isOpen, lottery]);

  // If lottery prop changes, update selectedLottery
  useEffect(() => {
    if (lottery) {
      setSelectedLottery(lottery);
      setTiktokLink(lottery.tiktokStreamLink || '');
    }
  }, [lottery]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

  const fetchEndedLotteries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/lotteries/ended-without-winners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLotteries(data);
      }
    } catch (error) {
      console.error('Failed to fetch lotteries:', error);
    }
  };

  const handleLotteryChange = (lotteryId: string) => {
    const lotteryObj = lotteries.find(l => l._id === lotteryId);
    setSelectedLottery(lotteryObj || null);
    setTicketNumbers({});
    setErrors({});
    setTiktokLink(lotteryObj?.tiktokStreamLink || '');
  };

  const handleTicketNumberChange = (rank: number, value: string) => {
    setTicketNumbers(prev => ({
      ...prev,
      [rank]: value
    }));
    if (errors[rank]) {
      setErrors(prev => ({
        ...prev,
        [rank]: ''
      }));
    }
  };

  const validateTicketNumbers = (): boolean => {
    const newErrors: { [key: number]: string } = {};
    const usedNumbers = new Set<string>();

    if (!selectedLottery) return false;

    for (const prize of selectedLottery.prizes) {
      const ticketNumber = ticketNumbers[prize.rank];
      if (!ticketNumber) {
        newErrors[prize.rank] = `${prize.title} ticket number is required`;
        continue;
      }
      if (usedNumbers.has(ticketNumber)) {
        newErrors[prize.rank] = 'This ticket number is already used for another prize';
        continue;
      }
      usedNumbers.add(ticketNumber);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!selectedLottery) return;

    if (!validateTicketNumbers()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors above",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editMode
        ? `${API_BASE_URL}/lotteries/${selectedLottery._id}/update-winners`
        : `${API_BASE_URL}/lotteries/${selectedLottery._id}/enter-winners`;
      const method = editMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tiktokStreamLink: tiktokLink,
          winningTickets: Object.entries(ticketNumbers).map(([rank, ticketNumber]) => ({
            rank: parseInt(rank),
            ticketNumber: parseInt(ticketNumber)
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enter winners');
      }

      toast({
        title: "Success",
        description: `Winners have been ${editMode ? 'updated' : 'entered'} for "${selectedLottery.title}"`,
      });

      setSelectedLottery(null);
      setTiktokLink('');
      setTicketNumbers({});
      setErrors({});
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to enter winners:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enter winners. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedLottery(null);
      setTiktokLink('');
      setTicketNumbers({});
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            {editMode ? 'Edit Winners for Lottery' : 'Enter Winners for Completed Lottery'}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Update the TikTok link and winning ticket numbers for this lottery.'
              : 'Select a completed lottery and enter the winning ticket numbers for each prize.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lottery Selection */}
          {!lottery && (
            <div className="space-y-2">
              <Label htmlFor="lottery">Select Lottery *</Label>
              <Select onValueChange={handleLotteryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a completed lottery" />
                </SelectTrigger>
                <SelectContent>
                  {lotteries.map((lottery) => (
                    <SelectItem key={lottery._id} value={lottery._id}>
                      {lottery.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lotteries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No completed lotteries without winners found.
                </p>
              )}
            </div>
          )}

          {selectedLottery && (
            <>
              {/* TikTok Link */}
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok Live Stream Link</Label>
                <Input
                  id="tiktok"
                  type="url"
                  placeholder="https://tiktok.com/live/..."
                  value={tiktokLink}
                  onChange={(e) => setTiktokLink(e.target.value)}
                />
              </div>

              {/* Prize Ticket Numbers */}
              <div className="space-y-4">
                <Label>Winning Ticket Numbers</Label>
                {selectedLottery.prizes
                  .sort((a, b) => a.rank - b.rank)
                  .map((prize) => (
                    <div key={prize.rank} className="space-y-2">
                      <Label htmlFor={`ticket-${prize.rank}`}>
                        {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : prize.rank === 3 ? '🥉' : `${prize.rank}th`} {prize.title} Ticket Number *
                      </Label>
                      <Input
                        id={`ticket-${prize.rank}`}
                        type="number"
                        placeholder="Enter ticket number"
                        value={ticketNumbers[prize.rank] || ''}
                        onChange={(e) => handleTicketNumberChange(prize.rank, e.target.value)}
                        className={errors[prize.rank] ? 'border-red-500' : ''}
                      />
                      {errors[prize.rank] && (
                        <p className="text-sm text-red-600">{errors[prize.rank]}</p>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !selectedLottery ||
              (!lottery && lotteries.length === 0)
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editMode ? 'Updating...' : 'Entering Winners...'}
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                {editMode ? 'Update Winners' : 'Enter Winners'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 