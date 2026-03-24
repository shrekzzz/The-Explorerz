import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Star, IndianRupee, Mountain, ArrowLeft,
  Users, CheckCircle2, Calendar, Download, Phone, Mail,
  Share2, Heart, ChevronRight, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { getTravelPackages, TravelPackage } from "@/lib/packages";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";

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
  Easy:      { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: Mountain },
  Moderate:  { color: "bg-sky-500/15 text-sky-400 border-sky-500/30",            icon: Mountain },
  Difficult: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30",      icon: Mountain },
  Extreme:   { color: "bg-rose-500/15 text-rose-400 border-rose-500/30",         icon: Mountain },
};

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<TravelPackage | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const packages = getTravelPackages();
    const foundPkg = packages.find(p => p.id === id);
    if (foundPkg) {
      setPkg(foundPkg);
    } else {
      navigate("/packages");
    }
  }, [id, navigate]);

  if (!pkg) return null;

  const diff = pkg.difficulty ? difficultyMeta[pkg.difficulty] : null;
  const DiffIcon = diff?.icon;
  const isAvailable = pkg.status === "available";

  const handleDownloadPPT = () => {
    // Mock PPT download - in real app, this would download actual PPT
    toast.success("PPT download will be available soon!");
  };

  const handleEnquiry = () => {
    toast.success("Enquiry form will open soon!");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.info(url);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <button
            onClick={() => navigate("/packages")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-foreground text-sm font-medium mb-6 hover:bg-background/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Packages
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Image */}
            <div className="rounded-3xl overflow-hidden border border-border shadow-lg">
              <img
                src={resolveImageUrl(pkg.image)}
                alt={pkg.title}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Main Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-primary/20 text-primary border border-primary/40">
                  {catMeta[pkg.category]?.emoji} {pkg.category}
                </span>
                {diff && DiffIcon && (
                  <span className={`flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-lg border ${diff.color}`}>
                    <DiffIcon className="w-4 h-4" /> {pkg.difficulty}
                  </span>
                )}
              </div>

              <h1 className="font-display text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
                {pkg.title}
              </h1>
              <p className="text-muted-foreground text-lg">{pkg.subtitle}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4 border border-border bg-background/70 backdrop-blur-sm">
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="font-bold text-foreground">{pkg.duration}</div>
                </div>
                <div className="rounded-xl p-4 border border-border bg-background/70 backdrop-blur-sm">
                  <div className="text-xs text-muted-foreground">Starting from</div>
                  <div className="font-bold text-foreground">₹{pkg.price.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-xl p-4 border border-border bg-background/70 backdrop-blur-sm">
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <div className="font-bold text-foreground">{pkg.rating} ★</div>
                </div>
                <div className="rounded-xl p-4 border border-border bg-background/70 backdrop-blur-sm">
                  <div className="text-xs text-muted-foreground">Reviews</div>
                  <div className="font-bold text-foreground">{pkg.reviews}+</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAvailable ? (
                  <Button
                    size="lg"
                    className="h-14 px-8 gap-2 rounded-2xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25"
                    onClick={handleEnquiry}
                  >
                    <Phone className="w-5 h-5" />
                    Send Enquiry
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 px-8 gap-2 rounded-2xl bg-white/10 border border-border text-foreground"
                    disabled
                  >
                    Coming Soon
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 gap-2 rounded-2xl border-border text-foreground"
                  onClick={handleDownloadPPT}
                >
                  <Download className="w-5 h-5" />
                  Download PPT
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 gap-2 rounded-2xl border-border text-foreground"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Information */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="highlights">Highlights</TabsTrigger>
              <TabsTrigger value="included">What's Included</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-4">About This Package</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {pkg.subtitle}. This carefully curated journey offers an unforgettable experience
                    through some of India's most sacred and scenic destinations.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">Best Time to Visit</div>
                        <div className="text-sm text-muted-foreground">{pkg.bestTime}</div>
                      </div>
                    </div>

                    {pkg.difficulty && (
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                        <Mountain className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-semibold text-foreground">Difficulty Level</div>
                          <div className="text-sm text-muted-foreground">{pkg.difficulty}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-4">Route Overview</h3>
                  <div className="bg-muted/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">Total Distance</span>
                      <span className="font-semibold text-foreground">~{pkg.locations.length * 200} km</span>
                    </div>
                    <div className="space-y-2">
                      {pkg.locations.map((location, i) => (
                        <div key={location} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                            {i + 1}
                          </div>
                          <span className="text-sm text-foreground">{location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="highlights" className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {pkg.highlights.map((highlight, i) => (
                  <motion.div
                    key={highlight}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">{highlight}</span>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="included" className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {pkg.included.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 via-accent/5 to-purple-500/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Ready to embark on this journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contact us today to book your {pkg.title} package and create unforgettable memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAvailable ? (
              <Button
                size="lg"
                className="h-14 px-8 gap-2 rounded-2xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25"
                onClick={handleEnquiry}
              >
                <Phone className="w-5 h-5" />
                Send Enquiry
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 gap-2 rounded-2xl"
                disabled
              >
                Coming Soon
              </Button>
            )}

            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 gap-2 rounded-2xl border-2"
              onClick={handleDownloadPPT}
            >
              <Download className="w-5 h-5" />
              Download Package Details
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}