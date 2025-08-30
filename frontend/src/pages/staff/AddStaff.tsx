import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/useAuth';
interface StaffFormData {
  name: string;
  phone: string;
  role: string;
  password: string;
  confirmPassword: string;
}

export function AddStaff() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.phone.trim()) return 'Phone is required';
    if (!formData.role) return 'Role is required';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    
    // Ethiopian phone validation
    const phoneRegex = /^(\+2519|\+2517|09|07)\d{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      return 'Please enter a valid Ethiopian phone number (09/07/+2519/+2517 + 8 digits)';
    }
    
    return null;
  };

  // Normalize phone number to 09/07 format
  const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\s/g, '');
    
    // If it starts with +2519, convert to 09
    if (cleaned.startsWith('+2519')) {
      return '09' + cleaned.substring(5);
    }
    
    // If it starts with +2517, convert to 07
    if (cleaned.startsWith('+2517')) {
      return '07' + cleaned.substring(5);
    }
    
    // If it already starts with 09 or 07, return as is
    if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
      return cleaned;
    }
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const normalizedPhone = normalizePhoneNumber(formData.phone);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

      const response = await fetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: normalizedPhone,
          role: formData.role,
          password: formData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create staff member');
      }

      toast({
        title: "Success",
        description: `${formData.name} has been added successfully as a ${formData.role}.`,
      });

      navigate(`/dashboard/${user?.role}/staff`);
    } catch (error) {
      console.error('Failed to create staff:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/${user?.role}/staff`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary-light dark:text-primary-dark" />
            Add New Staff Member
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mt-2">
            Create a new staff account for sellers, operators, or managers
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 0912345678, 0712345678, +251912345678"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/${user?.role}/staff`)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Staff Member
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 