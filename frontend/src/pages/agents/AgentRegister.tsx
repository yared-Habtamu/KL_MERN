import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';
import { agentsService } from '@/services/agents/agentsService';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function AgentRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    commissionRate: ''
  });
  const [loading, setLoading] = useState(false);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return <div className="p-8 text-center text-lg">Unauthorized</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await agentsService.createAgent({
        name: form.name,
        phone: form.phone,
        password: form.password,
        commissionRate: Number(form.commissionRate),
      });
      toast({ title: 'Success', description: 'Agent registered successfully.' });
      navigate(`/dashboard/${user.role}/agents`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to register agent.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[80vh]">
      <button
        className="flex items-center gap-2 mb-6 text-base font-semibold text-primary border border-transparent rounded-lg px-3 py-2 transition-colors hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        onClick={() => navigate(-1)}
        type="button"
      >
        <ArrowLeft className="h-6 w-6" />
        Back
      </button>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register New Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Phone</label>
              <Input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <Input name="password" type="password" value={form.password} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Commission Rate (%)</label>
              <Input name="commissionRate" type="number" min={0} max={100} value={form.commissionRate} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <Input value="agent" disabled />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register Agent'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 