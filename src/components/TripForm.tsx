import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, DollarSign, Sparkles, ArrowRight, ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { interestOptions } from "@/lib/constants";
import { TripFormData } from "@/types/trip";

const steps = [
  { id: "destination", label: "Destination", icon: MapPin,      color: "from-sky-500 to-cyan-400" },
  { id: "days",        label: "Duration",    icon: Calendar,    color: "from-violet-500 to-purple-400" },
  { id: "budget",      label: "Budget",      icon: DollarSign,  color: "from-emerald-500 to-teal-400" },
  { id: "interests",   label: "Interests",   icon: Sparkles,    color: "from-amber-500 to-orange-400" },
];

const budgetPresets = [
  { label: "Budget",  value: 500,  emoji: "🎒" },
  { label: "Mid",     value: 1500, emoji: "✈️" },
  { label: "Comfort", value: 3000, emoji: "🏨" },
  { label: "Luxury",  value: 6000, emoji: "💎" },
];

const popularDestinations = ["Goa", "Rajasthan", "Kerala", "Manali", "Ladakh", "Varanasi"];

interface Props {
  onSubmit: (data: TripFormData) => void;
  initialData?: Partial<TripFormData>;
}

export default function TripForm({ onSubmit, initialData }: Props) {
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState(initialData?.destination || "");
  const [days, setDays] = useState(initialData?.days || 3);
  const [budget, setBudget] = useState(initialData?.budget || 1500);
  const [interests, setInterests] = useState<string[]>(initialData?.interests || []);

  const canNext = () => {
    if (step === 0) return destination.trim().length > 0;
    if (step === 1) return days > 0 && days <= 30;
    if (step === 2) return budget > 0;
    if (step === 3) return interests.length > 0;
    return false;
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit({ destination: destination.trim(), days, budget, interests });
  };

  const toggleInterest = (val: string) =>
    setInterests((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    done
                      ? `bg-gradient-to-br ${s.color} shadow-lg`
                      : active
                      ? `bg-gradient-to-br ${s.color} shadow-lg shadow-primary/30`
                      : "bg-muted border border-border"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${done || active ? "text-white" : "text-muted-foreground"}`} />
                </motion.div>
                <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: i < step ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22 }}
        >
          {/* ── Step 0: Destination ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">Where to?</h2>
                <p className="text-sm text-muted-foreground">Enter a city, region, or landmark.</p>
              </div>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Goa, Rajasthan, Manali..."
                  className="pl-11 h-14 text-base rounded-xl border-border/60 bg-background/50 focus:border-primary/60 focus:ring-primary/20 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && canNext() && next()}
                  autoFocus
                />
              </div>
              {/* Quick picks */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Popular</p>
                <div className="flex flex-wrap gap-2">
                  {popularDestinations.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDestination(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                        destination === d
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Days ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">How many days?</h2>
                <p className="text-sm text-muted-foreground">We'll craft a day-by-day plan for your trip.</p>
              </div>
              <div className="flex items-center justify-center gap-6 py-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDays(Math.max(1, days - 1))}
                  className="w-12 h-12 rounded-2xl border-2 border-border bg-card/50 flex items-center justify-center hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <Minus className="w-5 h-5" />
                </motion.button>
                <div className="text-center">
                  <motion.span
                    key={days}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-7xl font-extrabold text-primary block leading-none"
                  >
                    {days}
                  </motion.span>
                  <span className="text-sm text-muted-foreground mt-1 block">{days === 1 ? "day" : "days"}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDays(Math.min(30, days + 1))}
                  className="w-12 h-12 rounded-2xl border-2 border-border bg-card/50 flex items-center justify-center hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
              {/* Quick day presets */}
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                      days === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card/50 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {days} {days === 1 ? "day" : "days"} in{" "}
                <span className="text-foreground font-medium">{destination}</span>
              </p>
            </div>
          )}

          {/* ── Step 2: Budget ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">What's your budget?</h2>
                <p className="text-sm text-muted-foreground">Total budget for the entire trip (USD).</p>
              </div>
              {/* Presets */}
              <div className="grid grid-cols-2 gap-3">
                {budgetPresets.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setBudget(p.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      budget === p.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card/50 hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{p.label}</div>
                      <div className="text-xs text-muted-foreground">${p.value.toLocaleString()}</div>
                    </div>
                  </button>
                ))}
              </div>
              {/* Custom input */}
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="pl-11 h-12 text-base rounded-xl border-border/60 bg-background/50 focus:border-primary/60"
                  min={1}
                  onKeyDown={(e) => e.key === "Enter" && canNext() && next()}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">~${Math.round(budget / days)}/day</span>
                <span className="text-emerald-500 font-medium">
                  {budget < 800 ? "Budget trip 🎒" : budget < 2500 ? "Mid-range ✈️" : budget < 5000 ? "Comfortable 🏨" : "Luxury 💎"}
                </span>
              </div>
            </div>
          )}

          {/* ── Step 3: Interests ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">What excites you?</h2>
                <p className="text-sm text-muted-foreground">Pick your interests to personalize the itinerary.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((opt) => {
                  const active = interests.includes(opt.value);
                  const Icon = opt.icon;
                  return (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleInterest(opt.value)}
                      className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden ${
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10"
                          : "border-border bg-card/50 text-foreground hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId={`glow-${opt.value}`}
                          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-violet-500/10"
                        />
                      )}
                      <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary/20" : "bg-muted"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="relative font-medium text-sm">{opt.label}</span>
                      {active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                        >
                          <span className="text-white text-[10px] font-bold">✓</span>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {interests.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center text-muted-foreground"
                >
                  {interests.length} interest{interests.length > 1 ? "s" : ""} selected
                </motion.p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="gap-2 rounded-xl border-border/60 hover:border-primary/40"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
          <Button
            onClick={next}
            disabled={!canNext()}
            className="w-full h-12 gap-2 text-base rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25 disabled:opacity-40 disabled:shadow-none transition-all"
          >
            {step === 3 ? (
              <><Sparkles className="w-4 h-4" /> Generate Itinerary</>
            ) : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
