import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { getAuthHeaderConfig } from '@/services/authService';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { CLOUDINARY_CONFIG } from '@/config/cloudinary';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

interface Prize {
  _id?: string;
  rank: number;
  title: string;
  imageUrl?: string;
}

interface Lottery {
  _id: string;
  title: string;
  description: string;
  ticketCount: number;
  ticketPrice: number;
  commissionPerTicket: number;
  prizes: Prize[];
  status: string;
  soldTickets?: number;
}

export default function EditLottery() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrizeUploading, setIsPrizeUploading] = useState<number | null>(null);

  useEffect(() => {
    const fetchLottery = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/lotteries/${id}`, getAuthHeaderConfig());
        setLottery(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load lottery');
        toast({
          title: 'Error',
          description: 'Failed to load lottery details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLottery();
    }
  }, [id, toast]);

  const handleInputChange = (field: string, value: string | number) => {
    if (!lottery) return;
    
    setLottery(prev => {
      if (!prev) return prev;
      
      if (field === 'ticketCount') {
        const newCount = Number(value);
        const soldTickets = prev.soldTickets || 0;
        // Only allow increasing ticket count, and not below sold tickets
        if (newCount < soldTickets) {
          toast({
            title: 'Invalid Ticket Count',
            description: `Cannot set ticket count below ${soldTickets} (already sold tickets)`,
            variant: 'destructive',
          });
          return prev;
        }
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handlePrizeChange = (index: number, field: string, value: string | number) => {
    if (!lottery) return;
    
    setLottery(prev => {
      if (!prev) return prev;
      const newPrizes = [...prev.prizes];
      newPrizes[index] = { ...newPrizes[index], [field]: value };
      return { ...prev, prizes: newPrizes };
    });
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'lottery-images');

    try {
      // Add timeout to prevent silent failures
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        
        if (errorData.error?.message) {
          throw new Error(errorData.error.message);
        } else if (errorData.error?.http_code === 400) {
          throw new Error('Invalid file format or size');
        } else if (errorData.error?.http_code === 413) {
          throw new Error('File too large');
        } else {
          throw new Error(`Upload failed with status ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.secure_url) {
        throw new Error('Upload successful but no URL returned');
      }

      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      
      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try again.');
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      // Handle other errors
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handlePrizeImageUpload = async (index: number, file: File) => {
    setIsPrizeUploading(index);
    try {
      const url = await uploadToCloudinary(file);
      setLottery(prev => {
        if (!prev) return prev;
        const newPrizes = [...prev.prizes];
        newPrizes[index] = { ...newPrizes[index], imageUrl: url };
        return { ...prev, prizes: newPrizes };
      });
      toast({ title: 'Prize image uploaded', description: 'Image uploaded successfully!' });
    } catch (error) {
      toast({ title: 'Prize image upload failed', description: error instanceof Error ? error.message : 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsPrizeUploading(null);
    }
  };

  const addPrize = () => {
    if (!lottery) return;
    
    const currentPrizes = lottery.prizes.length;
    
    if (currentPrizes >= lottery.ticketCount) {
      toast({
        title: 'Maximum Prizes Reached',
        description: `Cannot add more prizes than ticket count (${lottery.ticketCount})`,
        variant: 'destructive',
      });
      return;
    }
    
    setLottery(prev => {
      if (!prev) return prev;
      const newPrize: Prize = {
        rank: currentPrizes + 1,
        title: '',
        imageUrl: ''
      };
      return { ...prev, prizes: [...prev.prizes, newPrize] };
    });
  };

  const removePrize = (index: number) => {
    if (!lottery) return;
    
    setLottery(prev => {
      if (!prev) return prev;
      const newPrizes = prev.prizes.filter((_, i) => i !== index);
      return { ...prev, prizes: newPrizes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lottery) return;

    // Validation
    if (!lottery.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (lottery.ticketPrice <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Ticket price must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (lottery.commissionPerTicket < 0) {
      toast({
        title: 'Validation Error',
        description: 'Commission per ticket cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    // Validate prizes
    const validPrizes = lottery.prizes.filter(prize => prize.title.trim());
    if (validPrizes.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one valid prize is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: lottery.title,
        description: lottery.description,
        ticketCount: lottery.ticketCount,
        ticketPrice: lottery.ticketPrice,
        commissionPerTicket: lottery.commissionPerTicket,
        prizes: validPrizes
      };

      await axios.put(`${API_BASE_URL}/lotteries/${id}`, updateData, getAuthHeaderConfig());
      
      toast({
        title: 'Success',
        description: 'Lottery updated successfully',
      });
      
      navigate(-1);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update lottery';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading lottery details...</p>
        </div>
      </div>
    );
  }

  if (error || !lottery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Lottery not found'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lotteries
          </Button>
        </div>
      </div>
    );
  }

  // Check if lottery can be edited
  if (lottery.status === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Cannot edit ended lotteries</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lotteries
          </Button>
        </div>
      </div>
    );
  }

  const soldTickets = lottery.soldTickets || 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lotteries
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Lottery</h1>
          <p className="text-muted-foreground">Update lottery details and prizes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={lottery.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter lottery title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={lottery.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter lottery description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ticket Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ticketCount">Ticket Count *</Label>
                <Input
                  id="ticketCount"
                  type="number"
                  value={lottery.ticketCount}
                  onChange={(e) => handleInputChange('ticketCount', Number(e.target.value))}
                  min={soldTickets}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum: {soldTickets} (already sold)
                </p>
              </div>
              
              <div>
                <Label htmlFor="ticketPrice">Ticket Price *</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  value={lottery.ticketPrice}
                  onChange={(e) => handleInputChange('ticketPrice', Number(e.target.value))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="commissionPerTicket">Commission per Ticket</Label>
                <Input
                  id="commissionPerTicket"
                  type="number"
                  value={lottery.commissionPerTicket}
                  onChange={(e) => handleInputChange('commissionPerTicket', Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prizes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prizes</CardTitle>
            <Button type="button" onClick={addPrize} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Prize
            </Button>
          </CardHeader>
          <CardContent>
            {lottery.prizes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No prizes added yet. Click "Add Prize" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {lottery.prizes.map((prize, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Prize {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removePrize(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`prize-title-${index}`}>Title *</Label>
                        <Input
                          id={`prize-title-${index}`}
                          value={prize.title}
                          onChange={(e) => handlePrizeChange(index, 'title', e.target.value)}
                          placeholder="Prize title"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2 flex flex-col items-start">
                        <Label>Prize Image (optional)</Label>
                        <label className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full cursor-pointer transition-colors inline-block min-w-[120px] max-w-[180px] w-auto text-center whitespace-nowrap">
                          Choose Image
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handlePrizeImageUpload(index, e.target.files[0]);
                              }
                            }}
                            disabled={isPrizeUploading !== null}
                          />
                        </label>
                        {isPrizeUploading === index && (
                          <span className="text-sm text-muted-foreground mt-2">Uploading...</span>
                        )}
                        {prize.imageUrl && (
                          <img src={prize.imageUrl} alt={`Prize ${index + 1}`} className="h-32 w-32 object-cover rounded mt-2 border" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              Maximum prizes allowed: {lottery.ticketCount} (based on ticket count)
            </p>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
} 