import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, Share2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import BudgetBreakdownCard from "@/components/BudgetBreakdown";
import HotelRecommendations from "@/components/HotelRecommendations";
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
        <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-16 z-30">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/plan")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground truncate">
                  {trip.destination}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {trip.days} days · ₹{trip.budget.toLocaleString("en-IN")} · {trip.interests.slice(0, 3).join(", ")}{trip.interests.length > 3 ? " +more" : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-1 flex-1 sm:flex-none">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Regenerate</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1 flex-1 sm:flex-none">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Share</span>
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saved} className="gap-1 flex-1 sm:flex-none bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90">
                <Bookmark className="w-3.5 h-3.5" />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
          <ItineraryTimeline itinerary={trip.itinerary} onActivityClick={setSelectedActivity} />
          <BudgetBreakdownCard breakdown={trip.budgetBreakdown} totalBudget={trip.budget} />
          <HotelRecommendations hotels={trip.hotels} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
