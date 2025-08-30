import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/useAuth';
import axios from 'axios';
import { getAuthHeaderConfig } from '@/services/authService';
import { ArrowLeft, Save, User, Ticket } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

interface CommissionReport {
  lotteryId: string;
  title: string;
  date: string;
  ticketsSold: number;
  commissionEarned: number;
}

interface ProfileData {
  _id: string;
  name: string;
  phone: string;
  role: string;
  email?: string;
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [commissionReport, setCommissionReport] = useState<CommissionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Determine which user ID to use
  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/staff/${targetUserId}`, getAuthHeaderConfig());
        setProfileData(response.data);
        setEditForm({
          name: response.data.name || '',
          phone: response.data.phone || ''
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchCommissionReport = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/staff/${targetUserId}/commission-report`, getAuthHeaderConfig());
        setCommissionReport(response.data.data || []);
      } catch (err: any) {
        console.error('Failed to load commission report:', err);
        // Don't show error toast for commission report as it's optional
      }
    };

    if (targetUserId) {
      fetchProfileData();
      fetchCommissionReport();
    }
  }, [targetUserId, toast]);

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profileData) return;

    // Validation
    if (!editForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editForm.phone.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Phone number is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/staff/${targetUserId}`, {
        name: editForm.name,
        phone: editForm.phone
      }, getAuthHeaderConfig());
      
      setProfileData(prev => prev ? {
        ...prev,
        name: editForm.name,
        phone: editForm.phone
      } : null);
      
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: profileData?.name || '',
      phone: profileData?.phone || ''
    });
    setIsEditing(false);
  };

  const handlePasswordSave = async () => {
    // Validation
    if (!passwordForm.oldPassword.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Current password is required',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      toast({
        title: 'Validation Error',
        description: 'New password is required',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'New password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/staff/${targetUserId}/password`, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }, getAuthHeaderConfig());
      
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update password';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordForm({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTotals = () => {
    return commissionReport.reduce((acc, item) => ({
      ticketsSold: acc.ticketsSold + item.ticketsSold,
      commissionEarned: acc.commissionEarned + item.commissionEarned
    }), { ticketsSold: 0, commissionEarned: 0 });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Profile Information Card Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full max-w-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full max-w-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full max-w-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full max-w-xl" />
            </div>
            <div className="pt-4">
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Commission Report Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header Skeleton */}
              <div className="grid grid-cols-6 gap-4 pb-2 border-b">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
              {/* Table Rows Skeleton */}
              {[...Array(3)].map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-6 gap-4 py-3 border-b">
                  {[...Array(6)].map((_, colIndex) => (
                    <Skeleton key={colIndex} className="h-4 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const canEdit = !userId || user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            {userId ? `Viewing ${profileData.name}'s profile` : 'Your profile information'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-xl">
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full"
                />
              ) : (
                <p className="text-sm text-muted-foreground py-2 px-3 bg-muted rounded-md">{profileData.name}</p>
              )}
            </div>
            
            <div className="max-w-xl">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              ) : (
                <p className="text-sm text-muted-foreground py-2 px-3 bg-muted rounded-md">{profileData.phone}</p>
              )}
            </div>

            <div className="max-w-xl">
              <Label>Role</Label>
              <p className="text-sm text-muted-foreground py-2 px-3 bg-muted rounded-md capitalize">{profileData.role}</p>
            </div>

            {profileData.email && (
              <div className="max-w-xl">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground py-2 px-3 bg-muted rounded-md">{profileData.email}</p>
              </div>
            )}

            {canEdit && (
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={saving} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                    Edit Profile
                  </Button>
                )}
              </div>
            )}

            {/* Password Change Section */}
            {canEdit && (
              <div className="pt-6 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  {!showPasswordForm && (
                    <Button variant="outline" onClick={() => setShowPasswordForm(true)} className="w-full sm:w-auto">
                      Change Password
                    </Button>
                  )}
                </div>
                
                {showPasswordForm && (
                  <div className="space-y-6 p-6 border rounded-lg bg-muted/30">
                    <div className="max-w-xl">
                      <Label htmlFor="oldPassword">Current Password *</Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                        placeholder="Enter current password"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="max-w-xl">
                      <Label htmlFor="newPassword">New Password *</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="max-w-xl">
                      <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={handlePasswordSave} disabled={saving} className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Updating...' : 'Update Password'}
                      </Button>
                      <Button variant="outline" onClick={handlePasswordCancel} disabled={saving} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission Report Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Sales & Commission Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissionReport.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Lottery Name</th>
                    <th className="text-left py-3 px-4">Tickets Sold</th>
                    <th className="text-left py-3 px-4">Commission Per Ticket</th>
                    <th className="text-left py-3 px-4">Total Commission</th>
                    <th className="text-left py-3 px-4">Last Sold Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionReport.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{item.title}</td>
                      <td className="py-3 px-4">{item.ticketsSold.toLocaleString()}</td>
                      <td className="py-3 px-4">${(item.commissionEarned / item.ticketsSold).toFixed(2)}</td>
                      <td className="py-3 px-4 text-green-600 font-medium">
                        ${item.commissionEarned.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(item.date)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="border-t-2 bg-muted/30 font-semibold">
                    <td className="py-3 px-4">Total</td>
                    <td className="py-3 px-4">{totals.ticketsSold.toLocaleString()}</td>
                    <td className="py-3 px-4">-</td>
                    <td className="py-3 px-4 text-green-600">
                      ${totals.commissionEarned.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sales data available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Commission data will appear here once you start selling tickets.
              </p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
} 