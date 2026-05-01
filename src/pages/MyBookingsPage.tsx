import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Booking {
  id: string;
  status: string;
  totalAmount: number;
  travelers: number;
  travelDate: string;
  createdAt: string;
  package: {
    id: string;
    title: string;
    destination: string;
    images: string[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  CONFIRMED: 'bg-green-500/10 text-green-600 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
  COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  REFUNDED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Link to="/packages" className="text-primary hover:underline text-sm">
            Browse Packages →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="text-5xl">📦</div>
              <h2 className="text-xl font-semibold">No bookings yet</h2>
              <p className="text-muted-foreground text-center">
                Explore our packages and book your next adventure!
              </p>
              <Link
                to="/packages"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition"
              >
                Browse Packages
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-6 p-6">
                  {/* Package thumbnail */}
                  <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {booking.package.images?.[0] ? (
                      <img
                        src={booking.package.images[0]}
                        alt={booking.package.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🏔️</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/packages/${booking.package.id}`} className="font-semibold text-lg hover:text-primary transition truncate">
                        {booking.package.title}
                      </Link>
                      <Badge variant="outline" className={STATUS_COLORS[booking.status] || ''}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.package.destination}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{booking.travelers} traveler{booking.travelers > 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>Travel: {new Date(booking.travelDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">₹{Number(booking.totalAmount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
