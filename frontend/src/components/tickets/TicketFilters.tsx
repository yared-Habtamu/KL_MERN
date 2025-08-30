import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface TicketFiltersProps {
  filters: {
    status: string;
    smsStatus: string;
    search: string;
  };
  onFiltersChange: (filters: TicketFiltersProps['filters']) => void;
}

export function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };
  const handleSmsStatusChange = (value: string) => {
    onFiltersChange({ ...filters, smsStatus: value });
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <CardTitle className="text-lg font-semibold">Ticket Filters</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-48">
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="winner">Winner</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={filters.smsStatus} onValueChange={handleSmsStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="SMS Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SMS Status</SelectItem>
                <SelectItem value="sent">SMS Sent</SelectItem>
                <SelectItem value="pending">SMS Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <Input
              placeholder="Search by customer, phone, or ticket #..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 