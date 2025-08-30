import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';



import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/useAuth';

import { CLOUDINARY_CONFIG } from '@/config/cloudinary';
import {
  ArrowLeft,
  Save,

  X,

  DollarSign,
  Ticket,
  Users,



} from 'lucide-react';


interface PrizeForm {
  title: string;
  imageUrl: string;
}

interface CreateLotteryForm {
  title: string;
  description: string;
  ticketCount: number;
  ticketPrice: number;
  commissionPerTicket: number;
  numberOfWinners: number;
  prizes: PrizeForm[];
}

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;


export function CreateLottery() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<CreateLotteryForm>({
    title: '',
    description: '',
    ticketCount: 0,
    ticketPrice: 0,
    commissionPerTicket: 0,
    numberOfWinners: 1,
    prizes: [{ title: '', imageUrl: '' }],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPrizeUploading, setIsPrizeUploading] = useState<number | null>(null);
  // Remove numberOfWinnersInput and use only formData.numberOfWinners

  useEffect(() => {
    // setNumberOfWinnersInput(formData.numberOfWinners > 0 ? String(formData.numberOfWinners) : '');
  }, [formData.numberOfWinners]);

  const handleInputChange = (field: keyof CreateLotteryForm, value: string | number | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrizeChange = (index: number, field: keyof PrizeForm, value: string) => {
    setFormData(prev => {
      const prizes = [...prev.prizes];
      prizes[index][field] = value;
      return { ...prev, prizes };
    });
  };

  const handlePrizeImageUpload = async (index: number, file: File) => {
    setIsPrizeUploading(index);
    try {
      const url = await uploadToCloudinary(file);
      setFormData(prev => {
        const prizes = [...prev.prizes];
        prizes[index].imageUrl = url;
        return { ...prev, prizes };
      });
      toast({ title: 'Prize image uploaded', description: 'Image uploaded successfully!' });
    } catch (error) {
      toast({ title: 'Prize image upload failed', description: error instanceof Error ? error.message : 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsPrizeUploading(null);
    }
  };

  const handleAddPrize = () => {
    setFormData(prev => ({ ...prev, prizes: [...prev.prizes, { title: '', imageUrl: '' }] }));
  };

  const handleRemovePrize = (index: number) => {
    setFormData(prev => {
      const prizes = prev.prizes.filter((_, i) => i !== index);
      return { ...prev, prizes };
    });
  };

  const handleNumberOfWinnersChange = (value: number) => {
    if (value < 1) return;
    if (value > formData.ticketCount) return;
    setFormData(prev => {
      let prizes = prev.prizes;
      if (value > prizes.length) {
        prizes = [...prizes, ...Array(value - prizes.length).fill({ title: '', imageUrl: '' })];
      } else if (value < prizes.length) {
        prizes = prizes.slice(0, value);
      }
      return { ...prev, numberOfWinners: value, prizes };
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

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return "Title is required";
    }
    if (formData.title.length > TITLE_MAX_LENGTH) {
      return "Title is too long";
    }
    if (formData.description.length > DESCRIPTION_MAX_LENGTH) {
      return "Description is too long";
    }
    if (formData.ticketCount <= 0) {
      return "Total tickets must be greater than 0";
    }
    if (formData.ticketPrice <= 0) {
      return "Ticket price must be greater than 0";
    }
    if (formData.commissionPerTicket < 0) {
      return "Commission per ticket cannot be negative";
    }
    // Removed images validation
    if (formData.numberOfWinners <= 0) {
      return 'Number of winners must be at least 1';
    }
    if (formData.numberOfWinners > formData.ticketCount) {
      return 'Number of winners cannot exceed ticket count';
    }
    if (formData.prizes.length !== formData.numberOfWinners) {
      return 'Number of prizes must match number of winners';
    }
    for (let i = 0; i < formData.prizes.length; i++) {
      if (!formData.prizes[i].title.trim()) {
        return `Prize #${i + 1} title is required`;
      }
      // image is now optional
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate numberOfWinnersInput before submit
    // if (numberOfWinnersInput.trim() === '' || parseInt(numberOfWinnersInput) < 1) {
    //   toast({ title: 'Validation Error', description: 'Number of winners must be at least 1', variant: 'destructive' });
    //   return;
    // }

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

      const response = await fetch(`${API_BASE_URL}/lotteries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create lottery');
      }

      await response.json();

      toast({
        title: "Success",
        description: "Lottery created successfully!",
      });

      navigate(`/dashboard/${user?.role}/lotteries`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lottery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
          <h1 className="flex items-center justify-center sm:justify-start gap-2 text-2xl sm:text-3xl font-bold text-foreground">
            <Ticket className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Create New Lottery
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Set up a new lottery game with all the necessary details
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/dashboard/${user?.role}/lotteries`)}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lotteries
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title * ({formData.title.length}/{TITLE_MAX_LENGTH})
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter lottery title"
                  maxLength={TITLE_MAX_LENGTH}
                  required
                />
                {formData.title.length > TITLE_MAX_LENGTH * 0.8 && (
                  <p className="text-sm text-amber-600">
                    {TITLE_MAX_LENGTH - formData.title.length} characters remaining
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description ({formData.description.length}/{DESCRIPTION_MAX_LENGTH})
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter lottery description"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  rows={3}
                />
                {formData.description.length > DESCRIPTION_MAX_LENGTH * 0.8 && (
                  <p className="text-sm text-amber-600">
                    {DESCRIPTION_MAX_LENGTH - formData.description.length} characters remaining
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ticket Count *</Label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ticketCount"
                      type="number"
                      value={formData.ticketCount || ''}
                      onChange={(e) => handleInputChange('ticketCount', parseInt(e.target.value) || 0)}
                      onFocus={(e) => {
                        if (e.target.value === '0') {
                          e.target.value = '';
                        }
                      }}
                      placeholder="Enter total number of tickets"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ticket Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ticketPrice"
                      type="number"
                      value={formData.ticketPrice || ''}
                      onChange={(e) => handleInputChange('ticketPrice', parseInt(e.target.value) || 0)}
                      onFocus={(e) => {
                        if (e.target.value === '0') {
                          e.target.value = '';
                        }
                      }}
                      placeholder="Enter ticket price"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Commission per Ticket *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="commissionPerTicket"
                      type="number"
                      value={formData.commissionPerTicket || ''}
                      onChange={(e) => handleInputChange('commissionPerTicket', parseInt(e.target.value) || 0)}
                      onFocus={(e) => {
                        if (e.target.value === '0') {
                          e.target.value = '';
                        }
                      }}
                      placeholder="Enter commission amount"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Winners & Prizes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfWinners">Number of Winners *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleNumberOfWinnersChange(formData.numberOfWinners - 1)}
                    disabled={formData.numberOfWinners <= 1 || isPrizeUploading !== null}
                    aria-label="Decrease number of winners"
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold w-8 text-center select-none">{formData.numberOfWinners}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleNumberOfWinnersChange(formData.numberOfWinners + 1)}
                    disabled={formData.numberOfWinners >= (formData.ticketCount || 1) || isPrizeUploading !== null}
                    aria-label="Increase number of winners"
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Must be ≤ Ticket Count</p>
              </div>
              <div className="space-y-4">
                {formData.prizes.map((prize, idx) => (
                  <div key={idx} className="border rounded-lg p-4 relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Prize #{idx + 1}</span>
                      {formData.prizes.length > 1 && (
                        <Button type="button" size="sm" variant="destructive" className="ml-auto" onClick={() => handleRemovePrize(idx)} disabled={isPrizeUploading !== null}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 w-full">
                        <Label>Prize Title *</Label>
                        <Input
                          value={prize.title}
                          onChange={e => handlePrizeChange(idx, 'title', e.target.value)}
                          placeholder="Enter prize title"
                          required
                          className="w-full text-lg py-3"
                          disabled={isPrizeUploading !== null}
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
                                handlePrizeImageUpload(idx, e.target.files[0]);
                              }
                            }}
                            disabled={isPrizeUploading !== null}
                          />
                        </label>
                        {isPrizeUploading === idx && (
                          <span className="text-sm text-muted-foreground mt-2">Uploading...</span>
                        )}
                        {prize.imageUrl && (
                          <img src={prize.imageUrl} alt={`Prize ${idx + 1}`} className="h-32 w-32 object-cover rounded mt-2 border" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {formData.prizes.length < formData.numberOfWinners && (
                  <Button type="button" variant="outline" onClick={handleAddPrize} disabled={isPrizeUploading !== null}>
                    Add Prize
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/${user?.role}/lotteries`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isPrizeUploading !== null}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Lottery
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 