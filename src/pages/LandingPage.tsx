import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plane, MapPin, Sparkles, DollarSign, Calendar, ArrowRight, Star, Mountain, Hotel, TrainFront, TreePine, Waves, Building2, CloudSun } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getTravelPackages } from "@/lib/packages";
import Navbar from "@/components/Navbar";

const floatingIcons = [
  { Icon: Plane, x: "8%", y: "15%", size: 48, delay: 0, duration: 6, rotate: -15, color: "text-primary drop-shadow-lg", glow: "shadow-primary/50" },
  { Icon: Mountain, x: "85%", y: "20%", size: 56, delay: 0.5, duration: 7, rotate: 10, color: "text-emerald-500 drop-shadow-lg", glow: "shadow-emerald-500/50" },
  { Icon: TrainFront, x: "75%", y: "70%", size: 44, delay: 1, duration: 5.5, rotate: -8, color: "text-amber-500 drop-shadow-lg", glow: "shadow-amber-500/50" },
  { Icon: Hotel, x: "12%", y: "65%", size: 40, delay: 1.5, duration: 6.5, rotate: 12, color: "text-violet-500 drop-shadow-lg", glow: "shadow-violet-500/50" },
  { Icon: TreePine, x: "90%", y: "45%", size: 36, delay: 0.8, duration: 5, rotate: -5, color: "text-green-500 drop-shadow-lg", glow: "shadow-green-500/50" },
  { Icon: Waves, x: "5%", y: "40%", size: 42, delay: 2, duration: 7.5, rotate: 8, color: "text-cyan-500 drop-shadow-lg", glow: "shadow-cyan-500/50" },
  { Icon: Building2, x: "50%", y: "75%", size: 38, delay: 1.2, duration: 6, rotate: -10, color: "text-rose-500 drop-shadow-lg", glow: "shadow-rose-500/50" },
  { Icon: CloudSun, x: "60%", y: "10%", size: 50, delay: 0.3, duration: 8, rotate: 5, color: "text-orange-400 drop-shadow-lg", glow: "shadow-orange-400/50" },
  { Icon: MapPin, x: "30%", y: "80%", size: 34, delay: 1.8, duration: 5.5, rotate: -12, color: "text-red-500 drop-shadow-lg", glow: "shadow-red-500/50" },
  { Icon: Plane, x: "40%", y: "5%", size: 30, delay: 2.5, duration: 6, rotate: 20, color: "text-sky-500 drop-shadow-lg", glow: "shadow-sky-500/50" },
];

const features = [
  { icon: Sparkles, title: "Custom Plans", desc: "Get a complete day-by-day itinerary crafted for you in seconds.", gradient: "from-primary via-accent to-blue-500", bgGradient: "from-primary/10 via-accent/5 to-blue-500/10" },
  { icon: MapPin, title: "Interactive Maps", desc: "See all your destinations, routes, and hotels on a live map.", gradient: "from-emerald-500 via-teal-400 to-cyan-500", bgGradient: "from-emerald-500/10 via-teal-400/5 to-cyan-500/10" },
  { icon: DollarSign, title: "Budget Tracking", desc: "Stay on budget with automatic cost estimation and breakdown.", gradient: "from-amber-500 via-orange-400 to-yellow-500", bgGradient: "from-amber-500/10 via-orange-400/5 to-yellow-500/10" },
  { icon: Calendar, title: "Day-by-Day View", desc: "Organized timeline with activities, times, and locations.", gradient: "from-violet-500 via-purple-400 to-pink-500", bgGradient: "from-violet-500/10 via-purple-400/5 to-pink-500/10" },
];

const stats = [
  { value: "10K+", label: "Trips Planned" },
  { value: "500+", label: "Destinations" },
  { value: "4.9★", label: "User Rating" },
  { value: "50+", label: "Packages" },
];

export default function LandingPage() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    setPackages(getTravelPackages());
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <Navbar />

      {/* Hero with 3D Scene */}
      <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 lg:pb-32 px-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-purple-500/10" style={{backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            

            <h1 className="font-display text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
              <br />
              Explore the world,{" "}<br />
              <span className="relative">
                <span className="bg-gradient-to-r from-primary to-violet-500  bg-clip-text text-transparent animate-pulse">
                  Plan less. Travel more!
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-primary to-violet-500  rounded-full shadow-lg"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
            </h1>

            <p className="text-white text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
             Tell us your dream destination and we’ll craft a personalized itinerary with hotels, routes, estimated costs, and hidden gems just for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/plan">
                <Button size="lg" className="h-14 px-8 text-lg gap-2 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  <Plane className="w-5 h-5" />
                  Start Planning
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/packages">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2 rounded-2xl border-2">
                  <Mountain className="w-5 h-5" />
                  Browse Packages
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating 3D Icons Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {floatingIcons.map((item, i) => {
            const IconComp = item.Icon;
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: item.x, top: item.y }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -20, 0, 15, 0],
                  rotate: [item.rotate, item.rotate + 10, item.rotate - 5, item.rotate],
                }}
                transition={{
                  opacity: { delay: item.delay, duration: 0.6 },
                  scale: { delay: item.delay, duration: 0.6 },
                  y: { delay: item.delay, duration: item.duration, repeat: Infinity, ease: "easeInOut" },
                  rotate: { delay: item.delay, duration: item.duration * 1.2, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <div className="relative">
                  <IconComp
                    size={item.size}
                    strokeWidth={1.2}
                    className={`${item.color} drop-shadow-lg`}
                  />
                  <div className={`absolute inset-0 ${item.color} blur-sm opacity-30 animate-pulse`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Spacer for hero bottom */}
      <div className="h-16" />

      {/* Stats */}
      <section className="py-12 px-4 border-y border-border bg-gradient-to-r from-primary/5 via-accent/5 to-purple-500/5 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                <div className="font-display text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="font-display text-4xl font-bold text-foreground mt-3">
              Everything you need for the perfect trip
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className={`group relative bg-gradient-to-br ${f.bgGradient} border border-border rounded-2xl p-6 text-center overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:scale-105`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="relative font-display font-bold text-foreground mb-2 text-lg">{f.title}</h3>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-br from-card/50 via-primary/5 to-accent/5 border-y border-border">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="font-display text-4xl font-bold text-foreground mt-3">
              Plan your trip in 3 simple steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: MapPin, title: "Choose Destination", desc: "Enter where you want to go, your budget, and interests." },
              { step: "02", icon: Sparkles, title: "We Plan Your Trip", desc: "We create a complete day-by-day itinerary instantly." },
              { step: "03", icon: Plane, title: "Explore & Travel", desc: "View your plan on the map, save it, and start your adventure!" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className="font-display text-7xl font-extrabold bg-gradient-to-r from-primary/10 via-accent/10 to-purple-500/10 bg-clip-text text-transparent absolute -top-4 left-1/2 -translate-x-1/2">
                    {item.step}
                  </div>
                  <div className="relative pt-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg hover:shadow-xl transition-shadow">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display font-bold text-foreground text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Travel Highlights */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Experiences</span>
            <h2 className="font-display text-4xl font-bold text-foreground mt-3">
              Discover incredible journeys
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: "🏔️", title: "Mountain Treks", color: "from-emerald-500/20 via-green-400/15 to-teal-500/20", border: "border-emerald-500/30" },
              { emoji: "🏨", title: "Luxury Hotels", color: "from-amber-500/20 via-orange-400/15 to-yellow-500/20", border: "border-amber-500/30" },
              { emoji: "🚂", title: "Scenic Trains", color: "from-blue-500/20 via-cyan-400/15 to-sky-500/20", border: "border-blue-500/30" },
              { emoji: "🛕", title: "Sacred Temples", color: "from-orange-500/20 via-red-400/15 to-pink-500/20", border: "border-orange-500/30" },
              { emoji: "🌊", title: "Beach Getaways", color: "from-cyan-500/20 via-blue-400/15 to-indigo-500/20", border: "border-cyan-500/30" },
              { emoji: "🏜️", title: "Desert Safari", color: "from-yellow-600/20 via-amber-500/15 to-orange-600/20", border: "border-yellow-600/30" },
              { emoji: "🌿", title: "Nature Retreats", color: "from-green-500/20 via-emerald-400/15 to-lime-500/20", border: "border-green-500/30" },
              { emoji: "🎭", title: "Cultural Tours", color: "from-purple-500/20 via-violet-400/15 to-pink-500/20", border: "border-purple-500/30" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-6 text-center cursor-default hover:shadow-lg hover:shadow-primary/10 transition-all duration-300`}
              >
                <div className="text-4xl mb-3">{item.emoji}</div>
                <div className="font-display font-semibold text-foreground text-sm">{item.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-24 px-4 bg-gradient-to-br from-card/50 via-primary/5 to-accent/5 border-y border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">Curated</span>
              <h2 className="font-display text-4xl font-bold text-foreground mt-2">
                Popular Packages
              </h2>
              <p className="text-muted-foreground mt-2">Handpicked trips across India — ready to explore</p>
            </motion.div>
            <Link to="/packages">
              <Button variant="outline" className="gap-2 rounded-xl border-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.slice(0, 3).map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
              >
                <Link to="/packages" className="group block">
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-accent px-3 py-1.5 rounded-full shadow-lg border border-white/20">
                          {pkg.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display font-bold text-foreground text-lg">{pkg.title}</h3>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3.5 h-3.5 fill-primary text-primary" /> {pkg.rating}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{pkg.subtitle}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-sm text-muted-foreground">{pkg.duration}</span>
                        <span className="font-display font-extrabold text-primary text-lg">₹{pkg.price.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-primary to-violet-500 rounded-3xl p-12 sm:p-16 overflow-hidden shadow-2xl shadow-primary/25"
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/20 to-white/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/10 to-white/5 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-400/10 rounded-full blur-xl animate-pulse" />
            
            <div className="relative">
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-primary-foreground mb-4">
                Ready to explore?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
                Create your free travel plan now. No sign-up required. Your next adventure is just a click away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/plan">
                  <Button size="lg" variant="secondary" className="h-14 px-8 gap-2 rounded-2xl text-lg font-bold shadow-lg">
                    <Plane className="w-5 h-5" /> Plan My Trip <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/packages">
                  <Button size="lg" variant="ghost" className="h-14 px-8 gap-2 rounded-2xl text-lg font-bold text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/10">
                    <Hotel className="w-5 h-5" /> View Packages
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
