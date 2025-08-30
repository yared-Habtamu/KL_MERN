import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';

import { Trash2 } from 'lucide-react';
import { Users, UserPlus, Shield, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { canDelete, useAuth } from '@/auth/useAuth';
import { DeleteConfirmationModal } from '@/components/staff/DeleteConfirmationModal';

export function Staff() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sellers, setSellers] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<{ id: string; name: string; role: string } | null>(null);


  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const sellerRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/staff?role=seller`, { headers });
        const operatorRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/staff?role=operator`, { headers });
        const managerRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/staff?role=manager`, { headers });
        if (!sellerRes.ok || !operatorRes.ok || !managerRes.ok) throw new Error('Failed to fetch staff');
        setSellers(await sellerRes.json());
        setOperators(await operatorRes.json());
        setManagers(await managerRes.json());
      } catch (e: any) {
        setError(e.message || 'Failed to fetch staff');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const handleDeleteClick = (staff: any, role: string) => {
    setStaffToDelete({
      id: staff._id || staff.id,
      name: staff.name,
      role: role
    });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/staff/${staffToDelete.id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) throw new Error('Failed to delete staff');
      
      // Remove from local state
      if (staffToDelete.role === 'seller') {
        setSellers(prev => prev.filter(s => (s._id || s.id) !== staffToDelete.id));
      } else if (staffToDelete.role === 'operator') {
        setOperators(prev => prev.filter(o => (o._id || o.id) !== staffToDelete.id));
      } else if (staffToDelete.role === 'manager') {
        setManagers(prev => prev.filter(m => (m._id || m.id) !== staffToDelete.id));
      }
      
      setDeleteModalOpen(false);
      setStaffToDelete(null);
    } catch (e: any) {
      setError(e.message || 'Failed to delete staff');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setStaffToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header Skeleton */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Sellers Section Skeleton */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Phone</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-right py-3 px-4">Joined</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-3 px-4 text-center"><Skeleton className="h-8 w-8 mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Operators Section Skeleton */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-28" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Phone</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-right py-3 px-4">Joined</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-3 px-4 text-center"><Skeleton className="h-8 w-8 mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Managers Section Skeleton */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Phone</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-right py-3 px-4">Joined</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-3 px-4 text-center"><Skeleton className="h-8 w-8 mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Helper function to format date to YY-MM-DD
  const formatDate = (dateString: string) => {
    console.log("Raw dateString:", dateString);

    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-CA'); // This gives YYYY-MM-DD format
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-light dark:text-primary-dark" /> Staff Management
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">Manage all sellers, operators, and managers in the system</p>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
          onClick={() => navigate(`/dashboard/${user?.role}/staff/add`)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>
      
      {/* Managers Section */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" /> Managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-right py-3 px-4">Joined</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr 
                    key={manager._id || manager.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/${user?.role}/profile/${manager._id || manager.id}`)}
                  >
                    <td className="py-3 px-4 font-medium">{manager.name}</td>
                    <td className="py-3 px-4">{manager.phone}</td>
                    <td className="py-3 px-4">{manager.role}</td>
                    <td className="py-3 px-4 text-right">{formatDate(manager.createdAt)}</td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {canDelete(user) && (
                        <Button
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteClick(manager, 'manager')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Sellers Section */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" /> Sellers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-right py-3 px-4">Joined</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr 
                    key={seller._id || seller.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/${user?.role}/profile/${seller._id || seller.id}`)}
                  >
                    <td className="py-3 px-4 font-medium">{seller.name}</td>
                    <td className="py-3 px-4">{seller.phone}</td>
                    <td className="py-3 px-4">{seller.role}</td>
                    <td className="py-3 px-4 text-right">{formatDate(seller.createdAt)}</td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {canDelete(user) && (
                        <Button
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteClick(seller, 'seller')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Operators Section */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" /> Operators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-right py-3 px-4">Joined</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((operator) => (
                  <tr 
                    key={operator._id || operator.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/${user?.role}/profile/${operator._id || operator.id}`)}
                  >
                    <td className="py-3 px-4 font-medium">{operator.name}</td>
                    <td className="py-3 px-4">{operator.phone}</td>
                    <td className="py-3 px-4">{operator.role}</td>
                    <td className="py-3 px-4 text-right">{formatDate(operator.createdAt)}</td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {canDelete(user) && (
                        <Button
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteClick(operator, 'operator')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {canDelete(user) && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          itemName= "staff member"
        />
      )}
    </div>
  );
} 