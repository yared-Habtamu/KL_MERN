import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { getAuthHeaderConfig } from '@/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

interface Ticket {
  _id: string;
  ticketNumber: number;
  lotteryId: { title: string; prizes?: { rank: number; title: string }[] };
  customer: { name: string; phone: string };
  status: string;
  winnerRank?: number;
}

export default function WinnersAnnouncements() {
  const [winnerTickets, setWinnerTickets] = useState<Ticket[]>([]);
  const [nonWinnerTickets, setNonWinnerTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/lotteries/operator/tickets/pending-winner-sms`, getAuthHeaderConfig());
        setWinnerTickets(res.data.winnerTickets);
        setNonWinnerTickets(res.data.nonWinnerTickets);
      } catch (err: any) {
        setError('Failed to load tickets.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleSendSms = (ticket: Ticket, type: 'winner' | 'nonwinner') => {
    let message = '';
    if (type === 'winner') {
      const prizeObj = ticket.lotteryId.prizes?.find(p => p.rank === ticket.winnerRank);
      const prizeTitle = prizeObj?.title || '';
      const rank = ticket.winnerRank ? `${ticket.winnerRank}ኛ` : '';
      const tiktokUrl = (ticket.lotteryId as any).tiktokStreamLink || '';
      const tiktokLine = tiktokUrl ? `\nዕጣ ሲወጣ ለማየት ${tiktokUrl}` : '';
      message = `ውድ ${ticket.customer.name}, እንኳን ደስ አሎት!\nበ ${ticket.lotteryId.title} ሎተሪ የ${rank} ዕጣ የ${prizeTitle} አሸናፊ ሆነዋል።\nየዕጣ ቁጥሮ: ${ticket.ticketNumber}\nለመቀበል በ +2519123456 ይደውሉ።\n${tiktokLine}\n\nእንኳን ደስ አሎት።`;
    } else {
      // List all winning tickets for this lottery
      const tiktokUrl = (ticket.lotteryId as any).tiktokStreamLink || '';
      const tiktokLine = tiktokUrl ? `\nዕጣ ሲወጣ ለማየት ${tiktokUrl}` : '';
      const winningNumbers = (ticket.lotteryId as any).winningTicketNumber || [];
      const prizes = ticket.lotteryId.prizes || [];
      const winningList = winningNumbers
        .map((num: number, idx: number) => {
          const prize = prizes[idx]?.title || '';
          return `${idx + 1}ኛ ዕጣ (${prize}): ${num}`;
        })
        .join('\n');
        message = `ውድ ${ticket.customer.name}, በ ${ticket.lotteryId.title} ሎተሪ ላይ አሸናፊ ዕጣ ቁጥሮች:\n${winningList}\n\n${tiktokLine}\nበሚቀጥለው መልካም ዕድል እንመኝሎታለን።\nእናመሰግናለን።`;
    }
    window.location.href = `sms:${ticket.customer.phone}?body=${encodeURIComponent(message)}`;
    setConfirmId(ticket._id);
  };

  const handleConfirm = async (id: string) => {
    setSending(true);
    setRemovingId(id);
    try {
      await axios.put(`${API_BASE_URL}/lotteries/operator/tickets/${id}/mark-winner-sms-sent`, {}, getAuthHeaderConfig());
      setTimeout(() => {
        setWinnerTickets(tks => tks.filter(t => t._id !== id));
        setNonWinnerTickets(tks => tks.filter(t => t._id !== id));
        setRemovingId(null);
      }, 500); // match fade duration
      setConfirmId(null);
    } catch (err) {
      alert('Failed to mark SMS as sent.');
      setRemovingId(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-8">Winners Announcements</h1>
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Winner Tickets</h2>
          {winnerTickets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No available tickets.</div>
          ) : (
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl shadow">
                <thead>
                  <tr className="text-left border-b border-zinc-200 dark:border-zinc-700">
                    <th className="p-3">Action</th>
                    <th className="p-3">Ticket #</th>
                    <th className="p-3">Lottery</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {winnerTickets.map(ticket => (
                    <tr
                      key={ticket._id}
                      className={`border-b border-zinc-100 dark:border-zinc-800 transition-opacity duration-500 ${removingId === ticket._id ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <td className="p-3">
                        <Button size="sm" onClick={() => handleSendSms(ticket, 'winner')}>
                          Send SMS
                        </Button>
                      </td>
                      <td className="p-3 font-mono">{ticket.ticketNumber}</td>
                      <td className="p-3">{ticket.lotteryId.title}</td>
                      <td className="p-3">{ticket.customer.name}</td>
                      <td className="p-3">{ticket.customer.phone}</td>
                      <td className="p-3">{ticket.lotteryId.prizes?.find(p => p.rank === ticket.winnerRank)?.title || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h2 className="text-xl font-semibold mb-4">Non-Winner Tickets</h2>
          {nonWinnerTickets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No available tickets.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl shadow">
                <thead>
                  <tr className="text-left border-b border-zinc-200 dark:border-zinc-700">
                    <th className="p-3">Action</th>
                    <th className="p-3">Ticket #</th>
                    <th className="p-3">Lottery</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {nonWinnerTickets.map(ticket => (
                    <tr
                      key={ticket._id}
                      className={`border-b border-zinc-100 dark:border-zinc-800 transition-opacity duration-500 ${removingId === ticket._id ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <td className="p-3">
                        <Button size="sm" onClick={() => handleSendSms(ticket, 'nonwinner')}>
                          Send SMS
                        </Button>
                      </td>
                      <td className="p-3 font-mono">{ticket.ticketNumber}</td>
                      <td className="p-3">{ticket.lotteryId.title}</td>
                      <td className="p-3">{ticket.customer.name}</td>
                      <td className="p-3">{ticket.customer.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Did you send the SMS?</h2>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => { setConfirmId(null); }} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={() => handleConfirm(confirmId)}>
                {sending ? "Marking..." : "Yes, Mark as Sent"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 