import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  MapPin, Clock, Star, IndianRupee, Mountain, ChevronRight,
  Users, CheckCircle2, Search, Sparkles, Flame, Shield,
  Calendar, ArrowRight, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { packageCategories, TravelPackage, getTravelPackages } from "@/lib/packages";

// ── Category icons map ─────────────────────────────────────────────────────────
const catMeta: Record<string, { emoji: string; gradient: string; glow: string }> = {
  all:         { emoji: "🗺️",  gradient: "from-sky-500 to-cyan-400",      glow: "shadow-sky-500/30" },
  pilgrimage:  { emoji: "🛕",  gradient: "from-amber-500 to-orange-400",  glow: "shadow-amber-500/30" },
  trek:        { emoji: "🏔️",  gradient: "from-emerald-500 to-teal-400",  glow: "shadow-emerald-500/30" },
  heritage:    { emoji: "🏰",  gradient: "from-violet-500 to-purple-400", glow: "shadow-violet-500/30" },
  nature:      { emoji: "🌿",  gradient: "from-green-500 to-lime-400",    glow: "shadow-green-500/30" },
  adventure:   { emoji: "⚡",  gradient: "from-rose-500 to-pink-400",     glow: "shadow-rose-500/30" },
};

const difficultyMeta: Record<string, { color: string; icon: React.ElementType }> = {
  Easy:      { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: Shield },
  Moderate:  { color: "bg-sky-500/15 text-sky-400 border-sky-500/30",            icon: Zap },
  Difficult: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30",      icon: Flame },
  Extreme:   { color: "bg-rose-500/15 text-rose-400 border-rose-500/30",         icon: Flame },
};

// ── Animated background ────────────────────────────────────────────────────────
function AnimatedBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { l: "5%",  t: "10%", c: "rgba(56,189,248,0.10)",  s: 500 },
        { l: "75%", t: "5%",  c: "rgba(129,140,248,0.08)", s: 450 },
        { l: "50%", t: "60%", c: "rgba(240,171,252,0.07)", s: 400 },
        { l: "15%", t: "70%", c: "rgba(52,211,153,0.07)",  s: 350 },
      ].map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ left: o.l, top: o.t, width: o.s, height: o.s, background: o.c, translateX: "-50%", translateY: "-50%" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 14 + i * 4, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)", backgroundSize: "60px 60px" }}
      />
    </div>
  );
}

// ── Package Card ───────────────────────────────────────────────────────────────
function PackageCard({ pkg, index, onClick }: { pkg: TravelPackage; index: number; onClick: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const diff = pkg.difficulty ? difficultyMeta[pkg.difficulty] : null;
  const DiffIcon = diff?.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: (index % 6) * 0.07 }}
      whileHover={{ y: -6 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-400">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={pkg.image}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white border border-white/10`}>
              {catMeta[pkg.category]?.emoji} {pkg.category}
            </span>
            {diff && DiffIcon && (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur-sm ${diff.color}`}>
                <DiffIcon className="w-3 h-3" /> {pkg.difficulty}
              </span>
            )}
          </div>

          {/* Rating pill */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-white text-xs font-bold">{pkg.rating}</span>
          </div>

          {/* Bottom title */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-lg text-white leading-tight">{pkg.title}</h3>
            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{pkg.subtitle}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Route */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="line-clamp-1">{pkg.locations.slice(0, 3).join(" → ")}{pkg.locations.length > 3 ? " ..." : ""}</span>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {pkg.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {pkg.reviews}+
              </span>
            </div>
            <div className="flex items-center gap-0.5 font-display font-extrabold text-foreground text-base">
              <IndianRupee className="w-4 h-4" />
              {pkg.price.toLocaleString("en-IN")}
            </div>
          </div>

          {/* CTA */}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border/60 bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function DetailModal({ pkg, onClose }: { pkg: TravelPackage; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "highlights" | "included">("overview");
  const diff = pkg.difficulty ? difficultyMeta[pkg.difficulty] : null;

  return (
    <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/60 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
      {/* Hero image */}
      <div className="relative h-64 overflow-hidden">
        <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">{pkg.title}</h2>
              <p className="text-white/70 text-sm mt-1">{pkg.subtitle}</p>
            </div>
            {diff && (
              <span className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border backdrop-blur-sm ${diff.color}`}>
                {pkg.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-px bg-border/40 border-b border-border/40">
        {[
          { icon: Clock,        label: "Duration",  value: pkg.duration },
          { icon: IndianRupee,  label: "From",      value: `₹${pkg.price.toLocaleString("en-IN")}` },
          { icon: Star,         label: "Rating",    value: `${pkg.rating} ★` },
          { icon: Users,        label: "Reviews",   value: `${pkg.reviews}+` },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card/80 flex flex-col items-center py-4 gap-1">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <span className="font-display font-bold text-sm text-foreground">{s.value}</span>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        {(["overview", "highlights", "included"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-all relative ${
              tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Route */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Route</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {pkg.locations.map((loc, i) => (
                    <span key={loc} className="flex items-center gap-1.5">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/20">{loc}</span>
                      {i < pkg.locations.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    </span>
                  ))}
                </div>
              </div>
              {/* Best time */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Best time to visit</p>
                  <p className="font-semibold text-foreground text-sm">{pkg.bestTime}</p>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "highlights" && (
            <motion.div key="highlights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {pkg.highlights.map((h, i) => (
                <motion.div
                  key={h}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{h}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === "included" && (
            <motion.div key="included" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2">
              {pkg.included.map((item, i) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-6 flex items-center gap-3">
        <Button className="flex-1 h-12 gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25 text-base font-semibold">
          Book Now <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" className="h-12 px-5 rounded-xl border-border/60 hover:border-primary/40">
          Save
        </Button>
      </div>
    </DialogContent>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPkg, setSelectedPkg] = useState<TravelPackage | null>(null);
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { setPackages(getTravelPackages()); }, []);

  const filtered = packages.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.locations.some((l) => l.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <AnimatedBg />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-10 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6"
            >
              <Sparkles className="w-4 h-4 animate-pulse" /> Curated India Packages
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight">
              Explore India's{" "}
              <span className="relative">
                <span className="text-primary">Sacred & Scenic</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary to-violet-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                />
              </span>{" "}
              Wonders
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
              From the holy Char Dham Yatra to thrilling Himalayan treks — handpicked packages for every kind of traveler.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destinations or packages..."
                className="w-full pl-12 pr-4 h-13 py-3.5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-8 py-4 px-6 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-sm w-fit mx-auto"
          >
            {[
              { value: `${packages.length}`, label: "Packages" },
              { value: "5", label: "Categories" },
              { value: "50+", label: "Destinations" },
              { value: "4.7★", label: "Avg Rating" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-xl font-extrabold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Category filters ── */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {packageCategories.map((cat, i) => {
              const meta = catMeta[cat.value];
              const active = activeCategory === cat.value;
              return (
                <motion.button
                  key={cat.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all duration-200 ${
                    active
                      ? `bg-gradient-to-r ${meta.gradient} text-white border-transparent shadow-lg ${meta.glow}`
                      : "bg-card/60 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 backdrop-blur-sm"
                  }`}
                >
                  <span>{meta.emoji}</span> {cat.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="px-4 pb-24">
        <div className="container mx-auto max-w-6xl">
          {/* Result count */}
          <motion.p
            key={`${activeCategory}-${search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mb-6"
          >
            Showing <span className="text-foreground font-semibold">{filtered.length}</span> package{filtered.length !== 1 ? "s" : ""}
            {search && <> for "<span className="text-primary">{search}</span>"</>}
          </motion.p>

          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key={`${activeCategory}-${search}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map((pkg, i) => (
                  <PackageCard key={pkg.id} pkg={pkg} index={i} onClick={() => setSelectedPkg(pkg)} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24"
              >
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">No packages found</h3>
                <p className="text-muted-foreground text-sm">Try a different search or category.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setActiveCategory("all"); }}>
                  Clear filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Detail Modal ── */}
      <Dialog open={!!selectedPkg} onOpenChange={() => setSelectedPkg(null)}>
        {selectedPkg && <DetailModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />}
      </Dialog>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 px-4 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-foreground">
              DeshYatra <span className="text-primary">Co.</span>
            </span>
          </div>
          <p>Curated travel experiences across India</p>
          <p>© 2025 DeshYatra Co.</p>
        </div>
      </footer>
    </div>
  );
}
