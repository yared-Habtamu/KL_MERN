import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WinnerEntryModal } from '@/components/winners/WinnerEntryModal';
import {
  Trophy,





  Gift,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Winner {
  id: string;
  name: string;
  lottery: string;
  lotteryId: string;
  ticketId: string;
  ticketNumber: number;
  winningNumbers: number[];
  prizeAmount: string;
  prizeLevel: string;
  status: string;
  winDate: string;
  claimDate: string | null;
}

interface PendingLottery {
  _id: string;
  title: string;
  prizes: Array<{ rank: number; title: string; imageUrl: string }>;
  tiktokStreamLink?: string;
}


export function Winners() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [pendingLotteries, setPendingLotteries] = useState<PendingLottery[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [winnerEntryModalOpen, setWinnerEntryModalOpen] = useState(false);
  const [selectedPendingLottery, setSelectedPendingLottery] = useState<PendingLottery | null>(null);
  const [editMode, setEditMode] = useState(false);

  const canEnterWinners = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchPendingLotteries();
    fetchWinners();
  }, []);

  const fetchPendingLotteries = async () => {
    try {
      setLoadingPending(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');
      const response = await fetch(`${API_BASE_URL}/lotteries/ended-without-winners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingLotteries(data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load pending lotteries', variant: 'destructive' });
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchWinners = async () => {
    try {
      setLoadingWinners(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');
      const response = await fetch(`${API_BASE_URL}/winners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWinners(data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load winners data', variant: 'destructive' });
    } finally {
      setLoadingWinners(false);
    }
  };

  const handlePendingRowClick = (lottery: PendingLottery) => {
    if (canEnterWinners) {
      setSelectedPendingLottery(lottery);
      setWinnerEntryModalOpen(true);
    }
  };

  const handleWinnerEntrySuccess = () => {
    setWinnerEntryModalOpen(false);
    setSelectedPendingLottery(null);
    fetchPendingLotteries();
    fetchWinners();
  };

  const handleEditClick = (lotteryGroup: any) => {
    setSelectedPendingLottery({
      _id: lotteryGroup.lotteryId,
      title: lotteryGroup.lottery,
      prizes: lotteryGroup.winners.map((w: Winner) => ({
        rank: typeof w.prizeLevel === 'number' ? w.prizeLevel : parseInt(w.prizeLevel, 10),
        title: w.prizeAmount,
        imageUrl: ''
      })),
      tiktokStreamLink: ''
    });
    setEditMode(true);
    setWinnerEntryModalOpen(true);
  };

  // Group winners by lottery
  const groupedWinners = winners.reduce((acc, winner) => {
    if (!acc[winner.lotteryId]) {
      acc[winner.lotteryId] = {
        lottery: winner.lottery,
        lotteryId: winner.lotteryId,
        winners: [],
        winDate: winner.winDate,
      };
    }
    acc[winner.lotteryId].winners.push(winner);
    return acc;
  }, {} as Record<string, { lottery: string; lotteryId: string; winners: Winner[]; winDate: string }>);
  const groupedWinnersArr = Object.values(groupedWinners);

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="space-y-2 flex flex-col items-center justify-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 justify-center">
          <Trophy className="inline-block text-yellow-500 h-7 w-7" />
          Winners
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg text-center">Manage lottery winners and prize claims</p>
      </div>

      {/* Pending Lotteries Table */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Pending Lotteries (Awaiting Winner Entry)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Lottery</th>
                  <th className="text-left py-3 px-4">Prizes</th>
                  <th className="text-left py-3 px-4">TikTok Link</th>
                </tr>
              </thead>
              <tbody>
                {loadingPending ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                      <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    </tr>
                  ))
                ) : pendingLotteries.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No pending lotteries</td></tr>
                ) : (
                  pendingLotteries.map(lottery => (
                    <tr
                      key={lottery._id}
                      className={canEnterWinners ? 'border-b hover:bg-muted/50 cursor-pointer' : 'border-b'}
                      onClick={() => handlePendingRowClick(lottery)}
                    >
                      <td className="py-3 px-4 font-medium">{lottery.title}</td>
                      <td className="py-3 px-4">
                        <ul className="list-disc ml-4">
                          {lottery.prizes?.map(prize => (
                            <li key={prize.rank}>{prize.title}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-4">{lottery.tiktokStreamLink || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Winners Table - Grouped by Lottery */}
      <div className="space-y-8">
        {loadingWinners ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="animate-pulse h-6 w-40 bg-gray-200 rounded mb-2" />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-2">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left py-3 px-4 rounded-tl-lg">Winner</th>
                        <th className="text-left py-3 px-4">Ticket #</th>
                        <th className="text-left py-3 px-4">Prize</th>
                        <th className="text-left py-3 px-4">Level</th>
                        <th className="text-left py-3 px-4 rounded-tr-lg">Win Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 2 }).map((_, j) => (
                        <tr key={j} className="animate-pulse bg-muted/30">
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                          <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        ) : groupedWinnersArr.length === 0 ? (
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="py-4 text-center text-muted-foreground">No winners yet</div>
            </CardContent>
          </Card>
        ) : (
          groupedWinnersArr.map((lotteryGroup) => (
            <Card key={lotteryGroup.lotteryId} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <Gift className="h-5 w-5 text-yellow-500" />
                  {lotteryGroup.lottery}
                </CardTitle>
                {canEnterWinners && (
                  <Button size="icon" variant="ghost" onClick={() => handleEditClick(lotteryGroup)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-2">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left py-3 px-4 rounded-tl-lg">Winner</th>
                        <th className="text-left py-3 px-4">Ticket #</th>
                        <th className="text-left py-3 px-4">Prize</th>
                        <th className="text-left py-3 px-4">Level</th>
                        <th className="text-left py-3 px-4 rounded-tr-lg">Win Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotteryGroup.winners.map((winner) => (
                        <tr key={winner.id} className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                          <td className="py-2 px-4 text-foreground/90">{winner.name}</td>
                          <td className="py-2 px-4 font-mono text-xs">{winner.ticketNumber}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline" className="text-base px-3 py-1 border-purple-400 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-600">
                              {winner.prizeAmount || <span className="italic text-gray-400">No prize</span>}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">{winner.prizeLevel}</td>
                          <td className="py-2 px-4">{winner.winDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Winner Entry Modal */}
      {canEnterWinners && selectedPendingLottery && (
        <WinnerEntryModal
          isOpen={winnerEntryModalOpen}
          onClose={() => { setWinnerEntryModalOpen(false); setSelectedPendingLottery(null); setEditMode(false); }}
          onSuccess={handleWinnerEntrySuccess}
          lottery={selectedPendingLottery}
          editMode={editMode}
        />
      )}
    </div>
  );
}