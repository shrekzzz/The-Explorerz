import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, Share2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import BudgetBreakdownCard from "@/components/BudgetBreakdown";
import HotelRecommendations from "@/components/HotelRecommendations";
import TripMap from "@/components/TripMap";
import { TripPlan, Activity } from "@/types/trip";
import { saveTrip, shareTripUrl } from "@/lib/storage";
import { toast } from "sonner";

export default function ResultsPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("current_trip");
    if (raw) {
      setTrip(JSON.parse(raw));
    } else {
      navigate("/plan");
    }
  }, [navigate]);

  if (!trip) return null;

  const handleSave = () => {
    saveTrip(trip);
    setSaved(true);
    toast.success("Trip saved! Find it in your Saved Trips.");
  };

  const handleShare = async () => {
    const url = shareTripUrl(trip);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.info(url);
    }
  };

  const handleRegenerate = () => {
    navigate(`/plan?dest=${encodeURIComponent(trip.destination)}&days=${trip.days}&budget=${trip.budget}&interests=${trip.interests.join(",")}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/plan")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {trip.destination}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {trip.days} days · ${trip.budget} budget · {trip.interests.join(", ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saved}
                className="gap-1"
              >
                <Bookmark className="w-3.5 h-3.5" />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* Split View */}
        <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 140px)" }}>
          {/* Left: Itinerary */}
          <div className="lg:w-[45%] overflow-y-auto p-6 space-y-6">
            <ItineraryTimeline
              itinerary={trip.itinerary}
              onActivityClick={setSelectedActivity}
            />
            <BudgetBreakdownCard
              breakdown={trip.budgetBreakdown}
              totalBudget={trip.budget}
            />
            <HotelRecommendations hotels={trip.hotels} />
          </div>

          {/* Right: Map */}
          <div className="lg:w-[55%] h-[400px] lg:h-full border-t lg:border-t-0 lg:border-l border-border">
            <TripMap trip={trip} selectedActivity={selectedActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
