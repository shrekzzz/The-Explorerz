import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Calendar, MapPin, BookmarkCheck,
  LogOut, Edit2, Check, X, Eye, Trash2, Plane,
  IndianRupee, AlertTriangle, Share2, ShieldCheck,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getSavedTrips, deleteTrip, shareTripUrl } from "@/lib/storage";
import { TripPlan } from "@/types/trip";
import { toast } from "sonner";

type Tab = "profile" | "trips";

const gradients = [
  "from-sky-500 via-cyan-400 to-blue-600",
  "from-violet-500 via-purple-400 to-indigo-600",
  "from-emerald-500 via-teal-400 to-green-600",
  "from-amber-500 via-orange-400 to-yellow-600",
  "from-rose-500 via-pink-400 to-red-600",
];

export default function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });

  // Trips state
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" });
  }, [user]);

  useEffect(() => {
    if (tab === "trips") {
      getSavedTrips().then(setTrips).catch(() => setTrips([]));
    }
  }, [tab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      toast.success("Profile updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
    setConfirmDelete(null);
    toast.success("Trip deleted");
  };

  const handleShare = (trip: TripPlan) => {
    navigator.clipboard.writeText(shareTripUrl(trip));
    toast.success("Link copied!");
  };

  const handleView = (trip: TripPlan) => {
    sessionStorage.setItem("current_trip", JSON.stringify(trip));
    onClose();
    navigate("/results");
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/");
    toast.success("Logged out");
  };

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-primary/10 via-violet-500/5 to-primary/5 border-b border-border p-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left text-lg font-bold">My Profile</SheetTitle>
          </SheetHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/25 shrink-0">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={initials} className="w-full h-full rounded-2xl object-cover" />
                : initials
              }
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-lg leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs capitalize">{user.role.toLowerCase()}</Badge>
                {user.isEmailVerified && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 bg-muted/60 rounded-xl p-1">
            {([
              { id: "profile", label: "Profile", icon: User },
              { id: "trips",   label: "Saved Trips", icon: BookmarkCheck },
            ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* Profile Tab */}
            {tab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="p-6 space-y-5">

                {/* Member since */}
                {user.createdAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </div>
                )}

                {editing ? (
                  /* Edit form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">First Name</Label>
                        <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Last Name</Label>
                        <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="h-9" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" className="h-9" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                        {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Check className="w-3.5 h-3.5" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" }); }} className="flex-1 gap-2">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View details */
                  <div className="space-y-3">
                    {[
                      { icon: User,  label: "Full Name", value: `${user.firstName} ${user.lastName}` },
                      { icon: Mail,  label: "Email",     value: user.email },
                      { icon: Phone, label: "Phone",     value: user.phone || "Not set" },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium text-foreground truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="w-full gap-2 mt-2">
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Trips Tab */}
            {tab === "trips" && (
              <motion.div key="trips" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-4 space-y-3">
                {trips.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Plane className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">No saved trips yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Plan your first adventure!</p>
                    <Link to="/plan" onClick={onClose}>
                      <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-violet-500">
                        <Plane className="w-3.5 h-3.5" /> Plan a Trip
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground px-1">{trips.length} trip{trips.length !== 1 ? "s" : ""} saved</p>
                    {trips.map((trip, i) => (
                      <div key={trip.id} className={`rounded-2xl overflow-hidden border border-border/60 bg-card`}>
                        {/* Gradient strip */}
                        <div className={`h-2 bg-gradient-to-r ${gradients[i % gradients.length]}`} />
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{trip.destination}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />{trip.days}d
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <IndianRupee className="w-3 h-3" />₹{trip.budget.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(trip.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>

                          <AnimatePresence mode="wait">
                            {confirmDelete === trip.id ? (
                              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                                <span className="text-xs text-destructive flex-1">Delete this trip?</span>
                                <button onClick={() => handleDelete(trip.id)} className="text-xs font-bold text-destructive hover:underline">Yes</button>
                                <span className="text-destructive/40">·</span>
                                <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted-foreground hover:text-foreground">No</button>
                              </motion.div>
                            ) : (
                              <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1.5">
                                <Button size="sm" onClick={() => handleView(trip)} className="flex-1 h-7 text-xs gap-1 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90">
                                  <Eye className="w-3 h-3" /> View
                                </Button>
                                <button onClick={() => handleShare(trip)} className="w-7 h-7 rounded-lg border border-border/60 bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                  <Share2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => setConfirmDelete(trip.id)} className="w-7 h-7 rounded-lg border border-border/60 bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                    <Link to="/saved" onClick={onClose} className="block">
                      <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
                        <BookmarkCheck className="w-3.5 h-3.5" /> View All Trips
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border p-4">
          <Button variant="ghost" onClick={handleLogout} className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
