import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PackageDetail {
  id: string;
  title: string;
  destination: string;
  price: number;
  duration: number;
  images: string[];
}

interface BookingData {
  id: string;
  status: string;
  totalAmount: number;
}

export default function BookingPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [travelers, setTravelers] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book a package');
      navigate('/packages');
      return;
    }
    if (packageId) {
      fetchPackage();
    }
  }, [packageId, isAuthenticated]);

  async function fetchPackage() {
    try {
      const { data } = await api.get(`/packages/${packageId}`);
      setPkg(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/packages');
    } finally {
      setLoading(false);
    }
  }

  async function handleBooking() {
    if (!pkg) return;
    setBooking(true);

    try {
      // Step 1: Create booking
      const { data: bookingRes } = await api.post('/bookings', {
        packageId: pkg.id,
        travelers,
        travelDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      const bookingData: BookingData = bookingRes.data;

      // Step 2: Create Razorpay order
      const { data: paymentRes } = await api.post('/payments/initiate', {
        bookingId: bookingData.id,
        amount: bookingData.totalAmount,
      });

      const { orderId, amount, currency, keyId } = paymentRes.data;

      // Step 3: Open Razorpay checkout
      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency,
        name: 'DeshYatra',
        description: `Booking: ${pkg.title}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: bookingData.id,
            });
            toast.success('Payment successful! Booking confirmed.');
            navigate('/bookings');
          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: { color: '#6366f1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!pkg) return null;

  const totalPrice = pkg.price * travelers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Complete Your Booking</h1>

        <Card>
          <CardHeader>
            <CardTitle>{pkg.title}</CardTitle>
            <CardDescription>{pkg.destination} · {pkg.duration} days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price per person</span>
              <span className="font-semibold">₹{pkg.price.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="travelers" className="text-muted-foreground">Travelers</label>
              <select
                id="travelers"
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                className="rounded-md border bg-background px-3 py-1.5"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <hr />

            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₹{totalPrice.toLocaleString()}</span>
            </div>

            <Button
              onClick={handleBooking}
              disabled={booking}
              className="w-full"
              size="lg"
            >
              {booking ? 'Processing...' : `Pay ₹${totalPrice.toLocaleString()}`}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Powered by Razorpay · Secure payment
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
