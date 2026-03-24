import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, MapPin, Calendar, IndianRupee, Plane, Sparkles,
  Share2, Eye, Clock, TrendingUp, BookmarkCheck,
  ArrowUpDown, Check, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TripPlan } from "@/types/trip";
import { getSavedTrips, deleteTrip, shareTripUrl } from "@/lib/storage";
import { toast } from "sonner";

// ── Destination gradient themes ────────────────────────────────────────────────
const gradients = [
  { bg: "from-sky-500 via-cyan-400 to-blue-600",     emoji: "🏖️" },
  { bg: "from-violet-500 via-purple-400 to-indigo-600", emoji: "🏔️" },
  { bg: "from-emerald-500 via-teal-400 to-green-600", emoji: "🌴" },
  { bg: "from-amber-500 via-orange-400 to-yellow-600", emoji: "🏛️" },
  { bg: "from-rose-500 via-pink-400 to-red-600",     emoji: "🌆" },
  { bg: "from-cyan-500 via-sky-400 to-blue-500",     emoji: "🗼" },
];

const interestEmoji: Record<string, string> = {
  food: "🍜", adventure: "⛰️", temples: "🛕", culture: "🎭",
  nightlife: "🎵", nature: "🌿", shopping: "🛍️", relaxation: "🧘",
};

const sortOptions = [
  { value: "newest",  label: "Newest first" },
  { value: "oldest",  label: "Oldest first" },
  { value: "budget",  label: "Highest budget" },
  { value: "days",    label: "Longest trip" },
];

// ── Animated background ────────────────────────────────────────────────────────
function AnimatedBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { l: "8%",  t: "15%", c: "rgba(56,189,248,0.09)",  s: 500 },
        { l: "80%", t: "10%", c: "rgba(129,140,248,0.08)", s: 420 },
        { l: "55%", t: "65%", c: "rgba(240,171,252,0.07)", s: 380 },
        { l: "20%", t: "72%", c: "rgba(52,211,153,0.07)",  s: 340 },
      ].map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ left: o.l, top: o.t, width: o.s, height: o.s, background: o.c, translateX: "-50%", translateY: "-50%" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 14 + i * 4, repeat: Infinity, ease: "easeInOut", delay: i * 2.5 }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)", backgroundSize: "60px 60px" }}
      />
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center">
          <motion.div
            animate={{ y: [-6, 6, -6], rotate: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
        {/* Orbit dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full bg-primary/40"
            style={{ top: "50%", left: "50%", transformOrigin: "0 0" }}
            animate={{ rotate: [i * 120, i * 120 + 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
            initial={{ x: 52, y: -4 }}
          />
        ))}
      </div>

      <h2 className="font-display text-2xl font-bold text-foreground mb-2">No saved trips yet</h2>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
        Plan your first trip and save it here. Your adventures are waiting!
      </p>
      <div className="flex gap-3">
        <Link to="/plan">
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25">
            <Sparkles className="w-4 h-4" /> Plan a Trip
          </Button>
        </Link>
        <Link to="/packages">
          <Button variant="outline" className="gap-2 rounded-xl border-border/60 hover:border-primary/40">
            Browse Packages
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Trip Card ──────────────────────────────────────────────────────────────────
function TripCard({
  trip, index, onDelete, onView,
}: {
  trip: TripPlan; index: number;
  onDelete: (id: string) => void;
  onView: (trip: TripPlan) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const theme = gradients[index % gradients.length];
  const totalBudget = trip.budget;
  const spent = trip.budgetBreakdown?.total ?? 0;
  const spentPct = Math.min(100, Math.round((spent / totalBudget) * 100));
  const date = new Date(trip.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const handleShare = () => {
    const url = shareTripUrl(trip);
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -10 }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.06 }}
      whileHover={{ y: -5 }}
      className="group relative bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
    >
      {/* Gradient header */}
      <div className={`relative h-36 bg-gradient-to-br ${theme.bg} overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />

        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex items-start justify-between">
            <span className="text-3xl">{theme.emoji}</span>
            <span className="text-xs font-medium text-white/80 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              {date}
            </span>
          </div>
          <div>
            <h3 className="font-display text-xl font-extrabold text-white leading-tight drop-shadow">
              {trip.destination}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-white/80 text-xs">
                <Calendar className="w-3 h-3" /> {trip.days} {trip.days === 1 ? "day" : "days"}
              </span>
              <span className="flex items-center gap-1 text-white/80 text-xs">
                <IndianRupee className="w-3 h-3" /> {trip.budget.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Budget bar */}
        {spent > 0 && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Budget used</span>
              <span className={spentPct > 90 ? "text-rose-400" : "text-emerald-400"}>{spentPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spentPct}%` }}
                transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
                className={`h-full rounded-full ${spentPct > 90 ? "bg-rose-400" : spentPct > 70 ? "bg-amber-400" : "bg-emerald-400"}`}
              />
            </div>
          </div>
        )}

        {/* Interests */}
        {trip.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trip.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20"
              >
                {interestEmoji[interest] ?? "✨"} {interest}
              </span>
            ))}
            {trip.interests.length > 4 && (
              <span className="text-[11px] text-muted-foreground px-2 py-0.5">+{trip.interests.length - 4}</span>
            )}
          </div>
        )}

        {/* Itinerary preview */}
        {trip.itinerary?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="line-clamp-1">
              {trip.itinerary.slice(0, 2).map((d) => d.title).join(" · ")}
              {trip.itinerary.length > 2 ? ` · +${trip.itinerary.length - 2} more` : ""}
            </span>
          </div>
        )}

        {/* Actions */}
        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30"
            >
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-xs text-destructive flex-1">Delete this trip?</span>
              <button
                onClick={() => onDelete(trip.id)}
                className="text-xs font-bold text-destructive hover:underline"
              >
                Yes
              </button>
              <span className="text-destructive/40">·</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
              <Link to="/results" className="flex-1" onClick={() => onView(trip)}>
                <Button size="sm" className="w-full gap-1.5 rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-md shadow-primary/20 text-xs">
                  <Eye className="w-3.5 h-3.5" /> View Plan
                </Button>
              </Link>
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-xl border border-border/60 bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                title="Copy share link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-9 h-9 rounded-xl border border-border/60 bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
                title="Delete trip"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SavedTripsPage() {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [sort, setSort] = useState("newest");
  const [showSort, setShowSort] = useState(false);

  useEffect(() => { setTrips(getSavedTrips()); }, []);

  const handleDelete = (id: string) => {
    deleteTrip(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    toast.success("Trip deleted");
  };

  const handleView = (trip: TripPlan) => {
    sessionStorage.setItem("current_trip", JSON.stringify(trip));
  };

  const sorted = [...trips].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "budget") return b.budget - a.budget;
    if (sort === "days")   return b.days - a.days;
    return 0;
  });

  const totalDays    = trips.reduce((s, t) => s + t.days, 0);
  const totalBudget  = trips.reduce((s, t) => s + t.budget, 0);
  const avgDays      = trips.length ? Math.round(totalDays / trips.length) : 0;

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <AnimatedBg />

      <div className="relative pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-5"
            >
              <BookmarkCheck className="w-4 h-4" /> Saved Trips
            </motion.div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground mb-3">
              Your Travel{" "}
              <span className="relative">
                <span className="text-primary">Collection</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary to-violet-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                />
              </span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              All your AI-generated itineraries in one place.
            </p>
          </motion.div>

          {trips.length > 0 && (
            <>
              {/* ── Stats bar ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
              >
                {[
                  { icon: BookmarkCheck, label: "Saved Trips",   value: trips.length,                          color: "text-primary",    bg: "bg-primary/10 border-primary/20" },
                  { icon: Calendar,      label: "Total Days",    value: totalDays,                             color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                  { icon: TrendingUp,    label: "Avg Duration",  value: `${avgDays}d`,                         color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
                  { icon: IndianRupee,   label: "Total Budget",  value: `₹${(totalBudget/1000).toFixed(0)}k`, color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${s.bg} backdrop-blur-sm`}>
                      <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div>
                        <div className={`font-display text-lg font-extrabold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* ── Toolbar ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between mb-6"
              >
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-semibold">{trips.length}</span> trip{trips.length !== 1 ? "s" : ""} saved
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowSort(!showSort)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card/60 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all backdrop-blur-sm"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortOptions.find((s) => s.value === sort)?.label}
                  </button>
                  <AnimatePresence>
                    {showSort && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-44 bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-xl z-20 overflow-hidden"
                      >
                        {sortOptions.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => { setSort(o.value); setShowSort(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {o.label}
                            {sort === o.value && <Check className="w-3.5 h-3.5 text-primary" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}

          {/* ── Grid / Empty ── */}
          {trips.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {sorted.map((trip, i) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    index={i}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Plan more CTA ── */}
          {trips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-6 rounded-3xl bg-gradient-to-br from-primary/10 via-violet-500/5 to-primary/10 border border-primary/20 backdrop-blur-sm">
                <div className="text-left">
                  <p className="font-display font-bold text-foreground">Ready for another adventure?</p>
                  <p className="text-sm text-muted-foreground">Let AI plan your next perfect trip.</p>
                </div>
                <Link to="/plan">
                  <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25 whitespace-nowrap">
                    <Sparkles className="w-4 h-4" /> Plan New Trip
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
