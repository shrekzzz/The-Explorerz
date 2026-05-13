import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Calendar, BookmarkCheck,
  LogOut, Edit2, Check, X, Eye, Trash2, Plane,
  IndianRupee, AlertTriangle, Share2, ShieldCheck,
  MapPin, Sparkles, Clock, Package, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getSavedTrips, deleteTrip, shareTripUrl } from "@/lib/storage";
import { api } from "@/lib/api";
import { TripPlan } from "@/types/trip";
import { toast } from "sonner";

type Tab = "profile" | "trips" | "bookings";

interface Booking {
  id: string;
  status: string;
  travelers: number;
  travelDate: string;
  totalAmount: number;
  package: { title: string; category: string; duration: string };
}

const tripThemes = [
  { from: "from-sky-400",     to: "to-blue-600",    via: "via-cyan-500",    emoji: "🏖️", glow: "shadow-sky-500/30" },
  { from: "from-violet-400",  to: "to-indigo-600",  via: "via-purple-500",  emoji: "🏔️", glow: "shadow-violet-500/30" },
  { from: "from-emerald-400", to: "to-teal-600",    via: "via-green-500",   emoji: "🌴", glow: "shadow-emerald-500/30" },
  { from: "from-amber-400",   to: "to-orange-600",  via: "via-yellow-500",  emoji: "🏛️", glow: "shadow-amber-500/30" },
  { from: "from-rose-400",    to: "to-pink-600",    via: "via-red-500",     emoji: "🌆", glow: "shadow-rose-500/30" },
  { from: "from-cyan-400",    to: "to-blue-500",    via: "via-sky-500",     emoji: "🗺️", glow: "shadow-cyan-500/30" },
];

export default function ProfilePage({ hideNav = false }: { hideNav?: boolean }) {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" });
  }, [user]);

  useEffect(() => {
    getSavedTrips().then(setTrips);
  }, []);

  useEffect(() => {
    if (tab === "bookings" && bookings.length === 0) {
      setBookingsLoading(true);
      api.get("/bookings?limit=50")
        .then(({ data }) => setBookings(data.data ?? []))
        .catch(() => {})
        .finally(() => setBookingsLoading(false));
    }
  }, [tab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
    setConfirmDelete(null);
    toast.success("Trip deleted");
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: "CANCELLED" });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b));
      toast.success("Booking cancelled");
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  const handleView = (trip: TripPlan) => {
    sessionStorage.setItem("current_trip", JSON.stringify(trip));
    navigate("/results");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("See you soon! 👋");
  };

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const totalDays = trips.reduce((s, t) => s + t.days, 0);
  const totalBudget = trips.reduce((s, t) => s + t.budget, 0);

  const stats = [
    { label: "Trips Saved",   value: trips.length,                              icon: BookmarkCheck, color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
    { label: "Days Planned",  value: totalDays,                                 icon: Clock,         color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20" },
    { label: "Total Budget",  value: `₹${(totalBudget/1000).toFixed(0)}k`,      icon: IndianRupee,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Destinations",  value: new Set(trips.map(t => t.destination)).size, icon: MapPin,      color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {!hideNav && <Navbar />}

      {/* ── Hero ── */}
      <div className={`relative overflow-hidden ${hideNav ? '' : 'pt-16'} border-b border-border/60`}>

        <div className="container mx-auto max-w-4xl px-4 pt-10 pb-10">

          {/* Top row: greeting + logout */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground tracking-wide">Active session</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl text-xs">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </motion.div>

          {/* Main hero content */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">

            {/* Avatar */}
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 18 }}
              className="relative shrink-0">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-[28px] border-2 border-dashed border-primary/30" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-[36px] border border-violet-500/20" />
              <div className="relative w-20 sm:w-24 md:w-28 h-20 sm:h-24 md:h-28 rounded-3xl bg-gradient-to-br from-primary via-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-black shadow-xl shadow-primary/20 border border-border">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={initials} className="w-full h-full rounded-3xl object-cover" />
                  : initials
                }
              </div>
              {user.isEmailVerified && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 border-2 border-background">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>

            {/* Name block */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
              className="text-center sm:text-left flex-1 min-w-0">

              {/* Role + date pill row */}
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {({ USER: "User", ADMIN: "Admin", SUPERADMIN: "Super Admin", STAFF: "Staff" } as Record<string, string>)[user.role] ?? user.role ?? "User"}
                </span>
                {user.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {user.createdAt && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 border border-border/60 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-2">
                <span className="text-foreground">{user.firstName} </span>
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                    {user.lastName}
                  </span>
                  <motion.span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                    initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.7, duration: 0.6 }} />
                </span>
              </h1>

              <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1.5 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {user.email}
              </p>

              {/* Tagline */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="mt-4 text-sm text-muted-foreground/80 italic max-w-sm">
                {trips.length === 0
                  ? "Your journey starts with a single step. Plan your first trip! ✈️"
                  : trips.length === 1
                  ? "One adventure down, a world left to explore. 🌍"
                  : `${trips.length} adventures planned and counting. The world is your playground. 🌏`
                }
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {user.role?.toLowerCase() === "user" && <div className="container mx-auto max-w-4xl px-4 py-6 mb-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg, border }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.07 }}
              className={`${bg} border ${border} backdrop-blur-xl rounded-2xl p-4 flex items-center gap-3 shadow-lg`}>
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>}

      {/* ── Tabs + Content ── */}
      <div className="container mx-auto max-w-4xl px-4 pb-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-1 mb-6 shadow-sm">
            {([
              { id: "profile",  label: "Profile",     icon: User },
              { id: "trips",    label: "Saved Trips", icon: BookmarkCheck },
              { id: "bookings", label: "My Bookings", icon: Package },
            ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === id && (
                  <motion.div layoutId="tab-pill" className="absolute inset-0 bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 rounded-xl" />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
                {id === "trips" && trips.length > 0 && (
                  <span className="relative z-10 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {trips.length}
                  </span>
                )}
                {id === "bookings" && bookings.length > 0 && (
                  <span className="relative z-10 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Profile Tab ── */}
            {tab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-3xl overflow-hidden shadow-xl shadow-primary/5">

                  {/* Card header */}
                  <div className="px-6 pt-6 pb-4 border-b border-border/60 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-foreground text-lg">Personal Information</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Manage your profile details</p>
                    </div>
                    {!editing && (
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}
                        className="gap-2 rounded-xl border-primary/30 hover:border-primary/60 hover:bg-primary/5">
                        <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit Profile
                      </Button>
                    )}
                  </div>

                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      {editing ? (
                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</Label>
                              <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                                className="h-11 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</Label>
                              <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                                className="h-11 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                              placeholder="+91 9876543210"
                              className="h-11 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30" />
                          </div>
                          <div className="flex gap-3 pt-1">
                            <Button onClick={handleSave} disabled={saving}
                              className="flex-1 h-11 rounded-xl gap-2 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25">
                              {saving
                                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                : <Check className="w-4 h-4" />}
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => { setEditing(false); setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" }); }}
                              className="flex-1 h-11 rounded-xl gap-2">
                              <X className="w-4 h-4" /> Cancel
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                          {[
                            { icon: User,     label: "Full Name",     value: `${user.firstName} ${user.lastName}`,  color: "text-violet-400",  bg: "bg-violet-500/10" },
                            { icon: Mail,     label: "Email Address", value: user.email,                            color: "text-sky-400",     bg: "bg-sky-500/10" },
                            { icon: Phone,    label: "Phone Number",  value: user.phone || "Not set",               color: "text-emerald-400", bg: "bg-emerald-500/10" },
                          ].map(({ icon: Icon, label, value, color, bg }, i) => (
                            <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                              className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all">
                              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                                <p className="font-semibold text-foreground truncate mt-0.5">{value}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Trips Tab ── */}
            {tab === "trips" && (
              <motion.div key="trips" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                {trips.length === 0 ? (
                  <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-3xl p-16 text-center shadow-xl">
                    <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                      <Plane className="w-9 h-9 text-primary" />
                    </motion.div>
                    <h3 className="font-bold text-foreground text-xl mb-2">No adventures yet</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Plan your first trip and it'll show up here. The world is waiting!</p>
                    <Link to="/plan">
                      <Button className="gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25">
                        <Sparkles className="w-4 h-4" /> Plan My First Trip
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {trips.map((trip, i) => {
                      const theme = tripThemes[i % tripThemes.length];
                      const date = new Date(trip.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                      return (
                        <motion.div key={trip.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                          className={`group relative bg-card/80 backdrop-blur-sm border border-border/60 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl hover:${theme.glow} hover:border-primary/30 transition-all duration-300`}>

                          {/* Gradient header */}
                          <div className={`relative h-28 bg-gradient-to-br ${theme.from} ${theme.via} ${theme.to} overflow-hidden`}>
                            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10" />
                            <div className="absolute inset-0 flex flex-col justify-between p-4">
                              <div className="flex items-start justify-between">
                                <span className="text-3xl drop-shadow">{theme.emoji}</span>
                                <span className="text-[11px] text-white/80 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">{date}</span>
                              </div>
                              <div>
                                <h3 className="font-black text-white text-xl leading-tight drop-shadow">{trip.destination}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="flex items-center gap-1 text-white/80 text-xs"><Clock className="w-3 h-3" />{trip.days} days</span>
                                  <span className="flex items-center gap-1 text-white/80 text-xs"><IndianRupee className="w-3 h-3" />₹{trip.budget.toLocaleString("en-IN")}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-4">
                            {trip.itinerary?.length > 0 && (
                              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 line-clamp-1">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                {trip.itinerary.slice(0, 3).map(d => d.title).join(" · ")}
                                {trip.itinerary.length > 3 && ` +${trip.itinerary.length - 3}`}
                              </p>
                            )}

                            <AnimatePresence mode="wait">
                              {confirmDelete === trip.id ? (
                                <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                  className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                                  <span className="text-xs text-destructive flex-1 font-medium">Delete this trip?</span>
                                  <button onClick={() => handleDelete(trip.id)} className="text-xs font-bold text-destructive hover:underline px-1">Yes</button>
                                  <span className="text-destructive/30">|</span>
                                  <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted-foreground hover:text-foreground px-1">No</button>
                                </motion.div>
                              ) : (
                                <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                                  <Button size="sm" onClick={() => handleView(trip)}
                                    className="flex-1 h-9 rounded-xl gap-1.5 text-xs bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-md shadow-primary/20">
                                    <Eye className="w-3.5 h-3.5" /> View Plan
                                  </Button>
                                  <button onClick={() => { navigator.clipboard.writeText(shareTripUrl(trip)); toast.success("Link copied!"); }}
                                    className="w-9 h-9 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setConfirmDelete(trip.id)}
                                    className="w-9 h-9 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Plan more CTA card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: trips.length * 0.06 }}>
                      <Link to="/plan" className="block h-full">
                        <div className="h-full min-h-[200px] rounded-3xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer p-6 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                            <Sparkles className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">Plan Another Trip</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Let AI craft your next adventure</p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
            {/* ── Bookings Tab ── */}
            {tab === "bookings" && (
              <motion.div key="bookings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-3xl p-16 text-center shadow-xl">
                    <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                      <Package className="w-9 h-9 text-amber-500" />
                    </motion.div>
                    <h3 className="font-bold text-foreground text-xl mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Browse our packages and book your next adventure!</p>
                    <Link to="/packages">
                      <Button className="gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25">
                        <Sparkles className="w-4 h-4" /> Browse Packages
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking, i) => {
                      const statusStyle: Record<string, string> = {
                        PENDING:   "bg-amber-500/10 text-amber-600 border-amber-500/20",
                        CONFIRMED: "bg-green-500/10 text-green-600 border-green-500/20",
                        CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
                        COMPLETED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                      };
                      return (
                        <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className="font-bold text-foreground truncate">{booking.package.title}</p>
                              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusStyle[booking.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(booking.travelDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />{booking.travelers} traveler{booking.travelers > 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IndianRupee className="w-3 h-3" />&#8377;{Number(booking.totalAmount).toLocaleString("en-IN")}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {booking.package.category.toLowerCase()} &middot; {booking.package.duration}
                              </span>
                            </div>
                          </div>
                          {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking.id)}
                              className="gap-1.5 text-xs rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/60 shrink-0">
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
