import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Star, IndianRupee, Mountain, ArrowLeft,
  Users, CheckCircle2, Calendar, Download, Phone, Mail,
  Share2, Heart, ChevronRight, ArrowRight, ChevronLeft, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import EnquiryForm from "@/components/EnquiryForm";
import { getTravelPackagesAsync, TravelPackage } from "@/lib/packages";
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
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);

  useEffect(() => {
    getTravelPackagesAsync().then((packages) => {
      const foundPkg = packages.find(p => p.id === id);
      if (foundPkg) {
        setPkg(foundPkg);
      } else {
        navigate("/packages");
      }
    }).catch((error) => {
      console.error('Failed to load package:', error);
      navigate("/packages");
    });
  }, [id, navigate]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const highlightImgs = (pkg?.highlightImages || []).filter(Boolean);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight" && lightboxIndex < highlightImgs.length - 1) setLightboxIndex(lightboxIndex + 1);
      if (e.key === "ArrowLeft"  && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, highlightImgs.length]);

  if (!pkg) return null;

  const diff = pkg.difficulty ? difficultyMeta[pkg.difficulty] : null;
  const DiffIcon = diff?.icon;
  const isAvailable = pkg.status === "available";

  const handleDownloadPPT = async () => {
    if (!pkg.pptUrl) {
      toast.info("PPT not available for this package yet.");
      return;
    }

    const filename = pkg.pptFilename || (() => {
      const urlPath = pkg.pptUrl.split('?')[0];
      const segments = urlPath.split('/');
      const rawName = segments[segments.length - 1] || 'package-details';
      return decodeURIComponent(rawName);
    })();

    try {
      const response = await fetch(pkg.pptUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("Downloading...");
    } catch (error) {
      console.error("Download error:", error);
      // Fallback to direct link if blob fetch fails
      const a = document.createElement('a');
      a.href = pkg.pptUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloading...");
    }
  };

  const handleEnquiry = () => {
    setShowEnquiryForm(true);
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

      {/* Enquiry Form Modal */}
      <AnimatePresence>
        {showEnquiryForm && (
          <EnquiryForm
            packageTitle={pkg.title}
            packagePrice={pkg.price}
            packageData={pkg}
            onClose={() => setShowEnquiryForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-20 pb-12"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/packages")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-foreground text-sm font-medium mb-6 hover:bg-background/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Packages
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Image */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="rounded-3xl overflow-hidden border border-border shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                src={resolveImageUrl(pkg.image)}
                alt={pkg.title}
                className="w-full h-96 object-cover"
              />
            </motion.div>

            {/* Main Details */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="space-y-6"
            >
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
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      size="lg"
                      className="h-14 px-8 gap-2 rounded-2xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25 w-full"
                      onClick={handleEnquiry}
                    >
                      <Phone className="w-5 h-5" />
                      Send Enquiry
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
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

                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="hidden"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 gap-2 rounded-2xl border-border text-foreground w-full"
                    onClick={handleDownloadPPT}
                  >
                    <Download className="w-5 h-5" />
                    Download PPT
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 gap-2 rounded-2xl border-border text-foreground w-full"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

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
                  
                  {/* Route Selector */}
                  {pkg.routes && pkg.routes.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {pkg.routes.map((route, index) => (
                        <Button
                          key={route.id}
                          variant={activeRouteIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveRouteIndex(index)}
                          className="rounded-lg"
                        >
                          {route.name}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="bg-muted/30 rounded-xl p-6">
                    {/* Display selected route or default package route */}
                    {pkg.routes && pkg.routes.length > 0 && pkg.routes[activeRouteIndex] ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-muted-foreground">Total Distance</span>
                          <span className="font-semibold text-foreground">
                            ~{pkg.routes[activeRouteIndex].distance || pkg.routes[activeRouteIndex].locations.length * 200} km
                          </span>
                        </div>
                        <div className="space-y-2">
                          {pkg.routes[activeRouteIndex].locations.map((location, i) => (
                            <div key={location} className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                                {i + 1}
                              </div>
                              <span className="text-sm text-foreground">{location}</span>
                            </div>
                          ))}
                        </div>
                        {pkg.routes[activeRouteIndex].bestTime && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                              <strong>Best Time:</strong> {pkg.routes[activeRouteIndex].bestTime}
                            </div>
                          </div>
                        )}
                        {/* Route Highlights */}
                        {pkg.routes[activeRouteIndex].highlights && pkg.routes[activeRouteIndex].highlights.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="text-sm font-semibold text-foreground mb-2">Route Highlights</div>
                            <div className="space-y-1">
                              {pkg.routes[activeRouteIndex].highlights.map((highlight, i) => (
                                <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="font-bold text-primary">{i + 1}.</span>
                                  <span>{highlight}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-muted-foreground">Total Distance</span>
                          <span className="font-semibold text-foreground">
                            ~{pkg.distance || pkg.locations.length * 200} km
                          </span>
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="highlights" className="space-y-6">
              {highlightImgs.length > 0 ? (
                <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                  {highlightImgs.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="break-inside-avoid rounded-xl overflow-hidden cursor-zoom-in"
                      onClick={() => setLightboxIndex(i)}
                    >
                      <img
                        src={img}
                        alt={`Highlight ${i + 1}`}
                        className="w-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No highlight images added yet.</p>
              )}
            </TabsContent>

            {/* ── Lightbox ── */}
            <AnimatePresence>
              {lightboxIndex !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                  onClick={() => setLightboxIndex(null)}
                >
                  {/* Close */}
                  <button
                    className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all z-10"
                    onClick={() => setLightboxIndex(null)}
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Prev */}
                  {lightboxIndex > 0 && (
                    <button
                      className="absolute left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all z-10"
                      onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}

                  {/* Next */}
                  {lightboxIndex < highlightImgs.length - 1 && (
                    <button
                      className="absolute right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all z-10"
                      onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}

                  {/* Image */}
                  <motion.img
                    key={lightboxIndex}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.2 }}
                    src={highlightImgs[lightboxIndex]}
                    alt={`Highlight ${lightboxIndex + 1}`}
                    className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                    onClick={e => e.stopPropagation()}
                  />

                  {/* Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {highlightImgs.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                        className={`rounded-full transition-all ${
                          i === lightboxIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
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
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  className="h-14 px-8 gap-2 rounded-2xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25 w-full"
                  onClick={handleEnquiry}
                >
                  <Phone className="w-5 h-5" />
                  Send Enquiry
                </Button>
              </motion.div>
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

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="hidden"
            >
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 gap-2 rounded-2xl border-2 w-full"
                onClick={handleDownloadPPT}
              >
                <Download className="w-5 h-5" />
                Download Package Details
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}