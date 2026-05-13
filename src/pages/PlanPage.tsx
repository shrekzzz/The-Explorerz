import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripForm from "@/components/TripForm";
import TripSummary from "@/components/TripSummary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TripFormData } from "@/types/trip";
import { generateMockTrip } from "@/lib/tripGenerator";
import { getTravelPackagesAsync, TravelPackage } from "@/lib/packages";
import { Plane, MapPin, Sparkles, Calendar, IndianRupee, CheckCircle2, Package as PackageIcon, Edit2, X } from "lucide-react";

const loadingSteps = [
  { icon: MapPin,       label: "Analyzing destination",      color: "text-sky-400" },
  { icon: Calendar,     label: "Building day-by-day plan",   color: "text-violet-400" },
  { icon: IndianRupee,  label: "Calculating budget",         color: "text-emerald-400" },
  { icon: Sparkles,     label: "Adding special experiences", color: "text-amber-400" },
  { icon: CheckCircle2, label: "Finalizing your itinerary",  color: "text-primary" },
];

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      {[
        { cx: "10%",  cy: "20%", color: "rgba(56,189,248,0.12)",  size: 600, dur: 18 },
        { cx: "80%",  cy: "15%", color: "rgba(129,140,248,0.10)", size: 500, dur: 22 },
        { cx: "60%",  cy: "70%", color: "rgba(240,171,252,0.08)", size: 550, dur: 20 },
        { cx: "20%",  cy: "75%", color: "rgba(52,211,153,0.08)",  size: 400, dur: 25 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ left: orb.cx, top: orb.cy, width: orb.size, height: orb.size, background: orb.color, translateX: "-50%", translateY: "-50%" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: "easeInOut", delay: i * 3 }}
        />
      ))}
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [-20, 20, -20], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4 }}
        />
      ))}
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />
    </div>
  );
}

function LoadingScreen({ destination }: { destination: string }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s < loadingSteps.length - 1 ? s + 1 : s));
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-6"
    >
      {/* Spinning globe */}
      <div className="relative w-28 h-28 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
          className="absolute inset-2 rounded-full border-4 border-violet-400/20 border-t-violet-400"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
          className="absolute inset-4 rounded-full border-4 border-emerald-400/20 border-t-emerald-400"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Plane className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-2xl font-bold text-foreground mb-1 text-center"
      >
        Crafting your perfect trip
      </motion.h2>
      <p className="text-muted-foreground text-sm mb-8 text-center">
        Planning your adventure to{" "}
        <span className="text-primary font-semibold">{destination}</span>
      </p>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-3">
        {loadingSteps.map((s, i) => {
          const Icon = s.icon;
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: i <= activeStep ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                active
                  ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
                  : done
                  ? "border-border/50 bg-card/50"
                  : "border-border/20 bg-transparent"
              }`}
            >
              <div className={`shrink-0 ${done ? "text-emerald-400" : active ? s.color : "text-muted-foreground/40"}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-sm font-medium ${active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                {s.label}
              </span>
              {active && (
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="ml-auto flex gap-0.5"
                >
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: d * 0.15 }}
                      className="w-0.5 h-3 bg-primary rounded-full"
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function PlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [formData, setFormData] = useState<TripFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showPackageInfo, setShowPackageInfo] = useState(true);

  useEffect(() => {
    const packageId = searchParams.get("packageId");
    if (packageId) {
      getTravelPackagesAsync().then((packages) => {
        const pkg = packages.find(p => p.id === packageId);
        if (pkg) {
          setSelectedPackage(pkg);
        }
      }).catch((error) => {
        console.error('Failed to load package:', error);
      });
    }
  }, [searchParams]);

  const initialData: Partial<TripFormData> = {
    destination: searchParams.get("dest") || "",
    days: Number(searchParams.get("days")) || 3,
    budget: Number(searchParams.get("budget")) || 1000,
    interests: searchParams.get("interests")?.split(",").filter(Boolean) || [],
  };

  const handleFormSubmit = (data: TripFormData) => {
    setFormData(data);
    setShowSummary(true);
  };

  const handleEdit = () => {
    setShowSummary(false);
  };

  const handleSend = async (updatedData: TripFormData) => {
    // Generate trip and navigate to results page
    setLoading(true);
    
    // Simulate trip generation
    setTimeout(() => {
      const trip = generateMockTrip(updatedData);
      sessionStorage.setItem("current_trip", JSON.stringify(trip));
      setLoading(false);
      navigate("/results");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <AnimatedBackground />

      <section className="relative pt-24 pb-16 px-4 min-h-screen flex items-center justify-center">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-20 left-4 sm:left-8 z-20 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm hover:text-foreground hover:border-primary/50 transition-all"
        >
          ← Back
        </motion.button>

        <div className="relative w-full max-w-lg">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden"
              >
                <LoadingScreen destination={destination} />
              </motion.div>
            ) : showSummary && formData ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden p-8"
              >
                <TripSummary
                  data={formData}
                  onEdit={handleEdit}
                  onSend={handleSend}
                />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden"
              >
                {/* Package Info Banner */}
                {selectedPackage && showPackageInfo && (
                  <div className="relative px-6 py-4 bg-gradient-to-r from-primary/10 via-accent/5 to-violet-500/10 border-b border-border/50">
                    <button
                      onClick={() => setShowPackageInfo(false)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
                        <PackageIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm font-bold text-foreground mb-0.5">{selectedPackage.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{selectedPackage.subtitle}</p>
                        
                        {/* Route Selector */}
                        {selectedPackage.routes && selectedPackage.routes.length > 1 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-foreground">Select Route:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedPackage.routes.map((route, idx) => (
                                <button
                                  key={route.id}
                                  onClick={() => setSelectedRouteIndex(idx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    selectedRouteIndex === idx
                                      ? "bg-primary/15 border-primary/40 text-primary"
                                      : "bg-background/60 border-border/60 text-muted-foreground hover:border-primary/30"
                                  }`}
                                >
                                  {route.name}
                                </button>
                              ))}
                            </div>
                            {selectedPackage.routes[selectedRouteIndex] && (
                              <div className="mt-2 p-2 rounded-lg bg-background/40 border border-border/40">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground">Route:</span>{" "}
                                  {selectedPackage.routes[selectedRouteIndex].locations.join(" → ")}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedPackage.duration}</span>
                          <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {selectedPackage.price.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="relative px-8 pt-8 pb-6 border-b border-border/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/30">
                      <Plane className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="font-display text-2xl font-bold text-foreground">
                        {selectedPackage ? "Customize Your Package" : "Plan Your Trip"}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {selectedPackage ? "Edit details as per your preferences" : "Create your itinerary instantly"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="px-8 py-8">
                  <TripForm onSubmit={handleFormSubmit} initialData={initialData} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative glow behind card */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 rounded-3xl blur-2xl -z-10" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
