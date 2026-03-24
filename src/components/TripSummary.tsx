import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, IndianRupee, Heart, Edit2, Send, X, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripFormData } from "@/types/trip";
import { interestOptions } from "@/lib/constants";

interface TripSummaryProps {
  data: TripFormData;
  onEdit: () => void;
  onSend: (data: TripFormData) => void;
}

const fields = [
  { key: "destination", label: "Destination", icon: MapPin,        color: "sky",     gradient: "from-sky-500 to-cyan-400" },
  { key: "days",        label: "Duration",    icon: Calendar,      color: "violet",  gradient: "from-violet-500 to-purple-400" },
  { key: "budget",      label: "Budget",      icon: IndianRupee,   color: "emerald", gradient: "from-emerald-500 to-teal-400" },
];

const colorMap: Record<string, { ring: string; bg: string; text: string; border: string }> = {
  sky:     { ring: "ring-sky-400",     bg: "bg-sky-500/10",     text: "text-sky-500",     border: "border-sky-500/30" },
  violet:  { ring: "ring-violet-400",  bg: "bg-violet-500/10",  text: "text-violet-500",  border: "border-violet-500/30" },
  emerald: { ring: "ring-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
};

export default function TripSummary({ data: initialData, onEdit: onEditAll, onSend: onSendPlan }: TripSummaryProps) {
  const [data, setData] = useState<TripFormData>(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  const startEdit = (field: string, value: string) => { setEditingField(field); setTempValue(value); };

  const saveEdit = (field: string) => {
    if (field === "destination" && tempValue.trim()) setData({ ...data, destination: tempValue.trim() });
    else if (field === "days" && parseInt(tempValue) > 0) setData({ ...data, days: parseInt(tempValue) });
    else if (field === "budget" && parseInt(tempValue) > 0) setData({ ...data, budget: parseInt(tempValue) });
    setEditingField(null);
  };

  const toggleInterest = (interest: string) =>
    setData({ ...data, interests: data.interests.includes(interest) ? data.interests.filter((i) => i !== interest) : [...data.interests, interest] });

  const displayValue = (key: string) => {
    if (key === "destination") return data.destination;
    if (key === "days") return `${data.days} days`;
    if (key === "budget") return `₹${data.budget.toLocaleString("en-IN")}`;
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-5"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Review Your Plan</span>
        </motion.div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Trip Summary</h2>
        <p className="text-sm text-muted-foreground">Review and edit before we craft your itinerary</p>
      </div>

      {/* Quick overview strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-muted/50 border border-border/40"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MapPin className="w-3.5 h-3.5 text-sky-500" /> {data.destination}
        </span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Calendar className="w-3.5 h-3.5 text-violet-500" /> {data.days} days
        </span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> {data.budget.toLocaleString("en-IN")}
        </span>
      </motion.div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {fields.map((f, i) => {
          const Icon = f.icon;
          const c = colorMap[f.color];
          const isEditing = editingField === f.key;
          return (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className={`group relative rounded-2xl border ${c.border} ${c.bg} p-4 transition-all duration-200 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{f.label}</span>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => startEdit(f.key, f.key === "destination" ? data.destination : f.key === "days" ? data.days.toString() : data.budget.toString())}
                    className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg ${c.bg} ${c.text} border ${c.border} transition-all`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <Input
                      type={f.key === "destination" ? "text" : "number"}
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="h-9 text-sm rounded-xl border-border/60 bg-background/80"
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(f.key); if (e.key === "Escape") setEditingField(null); }}
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => saveEdit(f.key)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/25 transition-colors">
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => setEditingField(null)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted text-muted-foreground border border-border/60 text-xs font-medium hover:bg-muted/80 transition-colors">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="value" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="font-display text-lg sm:text-xl font-bold text-foreground truncate">{displayValue(f.key)}</p>
                    {f.key === "budget" && <p className="text-xs text-muted-foreground mt-0.5">~₹{Math.round(data.budget / data.days).toLocaleString("en-IN")}/day</p>}
                    {f.key === "days" && <p className="text-xs text-muted-foreground mt-0.5">in {data.destination}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Interests */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Interests</span>
          <span className="ml-auto text-xs text-muted-foreground">{data.interests.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((opt) => {
            const active = data.interests.includes(opt.value);
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleInterest(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 ${
                  active
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-600 shadow-sm"
                    : "bg-card/60 border-border/50 text-muted-foreground hover:border-rose-500/30 hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {opt.label}
                {active && <Check className="w-3 h-3 ml-0.5" />}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 pt-1"
      >
        <Button
          onClick={onEditAll}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-border/60 hover:border-primary/40 gap-2 font-semibold"
        >
          <Edit2 className="w-4 h-4" /> Edit Form
        </Button>
        <Button
          onClick={() => onSendPlan(data)}
          disabled={data.interests.length === 0}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25 gap-2 font-semibold"
        >
          <Send className="w-4 h-4" /> Send Plan
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1"
      >
        <Sparkles className="w-3 h-3 text-primary" />
        Our team will craft the perfect itinerary based on your preferences
      </motion.p>
    </motion.div>
  );
}
