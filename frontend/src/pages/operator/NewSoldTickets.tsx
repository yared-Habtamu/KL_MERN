import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { getAuthHeaderConfig } from '@/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

interface Ticket {
  _id: string;
  ticketNumber: number;
  lotteryId: { title: string; prizes?: Array<{ title: string }> };
  customer: { name: string; phone: string };
  soldAt: string;
}

export default function NewSoldTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
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
        const res = await axios.get(`${API_BASE_URL}/lotteries/operator/tickets/pending-sms`, getAuthHeaderConfig());
        setTickets(res.data.tickets);
      } catch (err: any) {
        setError('Failed to load tickets.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleSendSms = (ticket: Ticket) => {
    // New Amharic SMS template
    console.log(ticket.lotteryId.prizes)
    const prizes = ticket.lotteryId.prizes || [];
    const winningList = prizes
        .map((prize, idx) => {
          return `${idx + 1}ኛ ዕጣ: ${prize.title}`;
        })
        .join('\n');
    const message = `ውድ ደንበኛችን ${ticket.customer.name}, የ${ticket.lotteryId.title} ሎተሪ ስለቆረጡ እናመሰግናለን፡፡\n\nየዕጣ ቁጥሮ: ${ticket.ticketNumber}\n\nደንብና ግዴታዎች ተፈጻሚነት አላቸው፡፡\nለተጨማሪ መረጃ +2519123456 ላይ ይደውሉ፡፡\nየቆረጡት ሎተሪ አሸናፊ ዕጣ ሲወጣ አሸናፊ ዕጣ ቁጥሮች ይደርሶቷል።\nሽልማቶች፡\n${winningList} \n\nመልካም እድል!\nእናመሰግናለን።`;
    console.log(message);
    window.location.href = `sms:${ticket.customer.phone}?body=${encodeURIComponent(message)}`;
    setConfirmId(ticket._id);
  };

  const handleConfirm = async (id: string) => {
    setSending(true);
    setRemovingId(id);
    try {
      await axios.put(`${API_BASE_URL}/lotteries/operator/tickets/${id}/mark-sms-sent`, {}, getAuthHeaderConfig());
      setTimeout(() => {
        setTickets(tickets => tickets.filter(t => t._id !== id));
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
      <h1 className="text-2xl font-bold text-center mb-8">New Sold Tickets</h1>
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No available tickets.</div>
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
                <th className="p-3">Sold Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr
                  key={ticket._id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 transition-opacity duration-500 ${removingId === ticket._id ? 'opacity-0' : 'opacity-100'}`}
                >
                  <td className="p-3">
                    <Button size="sm" onClick={() => handleSendSms(ticket)}>
                      Send SMS
                    </Button>
                  </td>
                  <td className="p-3 font-mono">{ticket.ticketNumber}</td>
                  <td className="p-3">{ticket.lotteryId.title}</td>
                  <td className="p-3">{ticket.customer.name}</td>
                  <td className="p-3">{ticket.customer.phone}</td>
                  <td className="p-3">{new Date(ticket.soldAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Did you send the SMS?</h2>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setConfirmId(null)} disabled={sending}>
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