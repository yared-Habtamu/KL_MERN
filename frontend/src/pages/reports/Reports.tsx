import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, User, Building2, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'title', label: 'Title' },
];
const PIE_COLORS = ['#7c3aed', '#e5e7eb'];

export function Reports() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'company' | 'agent'>('company');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLottery, setSelectedLottery] = useState<any | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Only admin/manager can view
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <User className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Fetch lotteries on tab/filter change
  useEffect(() => {
    setLoading(true);
    setSelectedLottery(null);
    setSummary(null);
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');
    fetch(
      `${API_BASE_URL}/lotteries/filtered?type=${tab}&status=${status}&search=${encodeURIComponent(search)}&sort=${sort}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
      .then(res => res.json())
      .then(data => setLotteries(data))
      .catch(() => setLotteries([]))
      .finally(() => setLoading(false));
  }, [tab, search, status, sort]);

  // Fetch summary when a lottery is selected
  useEffect(() => {
    if (!selectedLottery) return;
    setSummaryLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');
    const url = tab === 'company'
      ? `${API_BASE_URL}/lotteries/${selectedLottery._id}/sales-summary`
      : `${API_BASE_URL}/lotteries/${selectedLottery._id}/agent-summary`;
    fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [selectedLottery, tab]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 justify-center">
          <BarChart2 className="h-6 w-6 text-primary-light dark:text-primary-dark" /> Reports
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">Payment collection & accounting overview</p>
      </div>
      {/* Controls */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center gap-4">
        <Tabs value={tab} onValueChange={v => setTab(v as 'company' | 'agent')}>
          <TabsList className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg overflow-hidden">
            <TabsTrigger value="company" className={tab === 'company' ? 'bg-purple-600 text-white font-bold' : 'text-purple-700 dark:text-purple-300'}>
              <Building2 className="h-4 w-4 mr-1" /> Company Lotteries
            </TabsTrigger>
            <TabsTrigger value="agent" className={tab === 'agent' ? 'bg-purple-600 text-white font-bold' : 'text-purple-700 dark:text-purple-300'}>
              <User className="h-4 w-4 mr-1" /> Agent Lotteries
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9" // add left padding for the icon
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>
      {/* Lotteries List */}
      <div className="space-y-6">
        {loading ? (
          <Card className="flex items-center justify-center min-h-[180px]"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></Card>
        ) : lotteries.length === 0 ? (
          <Card className="flex items-center justify-center min-h-[180px]"><span className="text-muted-foreground">No lotteries found.</span></Card>
        ) : (
          lotteries.map(lottery => (
            <Card key={lottery._id} className={selectedLottery?._id === lottery._id ? 'border-2 border-purple-600' : ''}>
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setSelectedLottery(lottery)}>
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    {lottery.title}
                    <Badge
                      variant={lottery.status === 'active' ? 'default' : 'secondary'}
                      className={lottery.status === 'active' ? 'bg-green-500 text-white' : ''}
                    >
                      {lottery.status}
                    </Badge>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">Ticket Price: <span className="font-semibold">{lottery.ticketPrice} birr</span></span>
                </div>
                <span className="text-xs text-muted-foreground">Created: {new Date(lottery.createdAt).toLocaleDateString()}</span>
              </CardHeader>
              {/* Summary Section */}
              {selectedLottery?._id === lottery._id && (
                <CardContent>
                  {summaryLoading ? (
                    <div className="flex items-center justify-center min-h-[120px]">
                      <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : summary ? (
                    tab === 'company' ? (
                      summary.type === 'active' ? (
                        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                          <ResponsiveContainer width={220} height={220}>
                            <PieChart>
                              <Pie dataKey="value" data={[
                                { name: 'Sold', value: summary.sold },
                                { name: 'Unsold', value: summary.unsold },
                              ]} cx="50%" cy="50%" outerRadius={80} label>
                                {[
                                  { name: 'Sold', value: summary.sold },
                                  { name: 'Unsold', value: summary.unsold },
                                ].map((_, idx) => (
                                  <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-2">
                            <div><span className="font-semibold">Sold:</span> {summary.sold}</div>
                            <div><span className="font-semibold">Unsold:</span> {summary.unsold}</div>
                            <div><span className="font-semibold">Total:</span> {summary.total}</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-2 font-semibold">Seller Summary</div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3">Seller Name</th>
                                  <th className="text-left py-2 px-3">Tickets Sold</th>
                                  <th className="text-left py-2 px-3">Collected Amount</th>
                                  <th className="text-left py-2 px-3">Commission Earned</th>
                                </tr>
                              </thead>
                              <tbody>
                                {summary.sellers.map((s: any) => (
                                  <tr key={s.sellerName} className="border-b">
                                    <td className="py-2 px-3">{s.sellerName}</td>
                                    <td className="py-2 px-3">{s.ticketsSold}</td>
                                    <td className="py-2 px-3">{s.collectedAmount} birr</td>
                                    <td className="py-2 px-3">{s.commissionEarned} birr</td>
                                  </tr>
                                ))}
                                <tr className="font-bold">
                                  <td className="py-2 px-3">Total</td>
                                  <td className="py-2 px-3">{summary.totalSold}</td>
                                  <td className="py-2 px-3">{summary.totalCollected} birr</td>
                                  <td className="py-2 px-3">-</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold mb-2">Agent: {summary.agentName}</div>
                        <div>Lottery: <span className="font-semibold">{summary.lotteryTitle}</span></div>
                        <div>Tickets Sold: <span className="font-semibold">{summary.ticketsSold}</span></div>
                        <div>Total Collected: <span className="font-semibold">{summary.totalCollected} birr</span></div>
                        <div>Commission Owed to Company: <span className="font-semibold">{summary.commissionOwed} birr</span></div>
                      </div>
                    )
                  ) : (
                    <div className="text-muted-foreground">No summary data available.</div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 