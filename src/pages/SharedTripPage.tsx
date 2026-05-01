import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Activity {
  time: string;
  title: string;
  description: string;
  locationName: string;
  category: string;
  cost: number;
}

interface ItineraryDay {
  dayNumber: number;
  title: string;
  activities: Activity[];
}

interface Hotel {
  name: string;
  rating: number;
  pricePerNight: number;
}

interface SharedTrip {
  destination: string;
  days: number;
  budget: number;
  interests: string[];
  budgetBreakdown: Record<string, number>;
  itinerary: ItineraryDay[];
  hotels: Hotel[];
  user: { firstName: string; lastName: string };
}

export default function SharedTripPage() {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchSharedTrip();
  }, [token]);

  async function fetchSharedTrip() {
    try {
      const { data } = await api.get(`/trips/shared/${token}`);
      setTrip(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
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

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center py-12 space-y-4">
            <div className="text-5xl">🔗</div>
            <h2 className="text-xl font-semibold">Trip Not Found</h2>
            <p className="text-muted-foreground text-center">
              {error || 'This shared trip link may have expired or been removed.'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Go Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Badge variant="outline" className="bg-primary/5 text-primary">
            Shared Trip
          </Badge>
          <h1 className="text-4xl font-bold">{trip.destination}</h1>
          <p className="text-muted-foreground">
            {trip.days} days · Budget: ₹{trip.budget.toLocaleString()} ·
            Shared by {trip.user.firstName} {trip.user.lastName}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {trip.interests.map((interest) => (
              <Badge key={interest} variant="secondary">{interest}</Badge>
            ))}
          </div>
        </div>

        {/* Budget Breakdown */}
        {trip.budgetBreakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(trip.budgetBreakdown).map(([key, value]) => (
                  <div key={key} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground capitalize">{key}</p>
                    <p className="font-bold text-lg">₹{Number(value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Itinerary */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Itinerary</h2>
          {trip.itinerary.map((day) => (
            <Card key={day.dayNumber}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Day {day.dayNumber}: {day.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {day.activities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap font-mono">
                        {activity.time}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        {activity.locationName && (
                          <p className="text-xs text-muted-foreground mt-1">📍 {activity.locationName}</p>
                        )}
                      </div>
                      {activity.cost > 0 && (
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          ₹{activity.cost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hotels */}
        {trip.hotels.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Recommended Hotels</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {trip.hotels.map((hotel, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-2">
                    <h3 className="font-semibold text-lg">{hotel.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{'⭐'.repeat(Math.round(hotel.rating))}</span>
                      <span>{hotel.rating}/5</span>
                    </div>
                    <p className="font-bold text-primary">₹{hotel.pricePerNight.toLocaleString()}/night</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div>
              <h3 className="font-bold text-lg">Want to plan your own trip?</h3>
              <p className="text-sm text-muted-foreground">Create a personalized itinerary in minutes</p>
            </div>
            <Link
              to="/plan"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition whitespace-nowrap"
            >
              Plan My Trip
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
