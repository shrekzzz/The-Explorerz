import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, DollarSign, Heart, Edit2, Send, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripFormData } from "@/types/trip";
import { interestOptions } from "@/lib/constants";

interface TripSummaryProps {
  data: TripFormData;
  onEdit: () => void;
  onSend: (data: TripFormData) => void;
}

export default function TripSummary({ data: initialData, onEdit: onEditAll, onSend: onSendPlan }: TripSummaryProps) {
  const [data, setData] = useState<TripFormData>(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const saveEdit = (field: string) => {
    if (field === "destination" && tempValue.trim()) {
      setData({ ...data, destination: tempValue.trim() });
    } else if (field === "days" && parseInt(tempValue) > 0) {
      setData({ ...data, days: parseInt(tempValue) });
    } else if (field === "budget" && parseInt(tempValue) > 0) {
      setData({ ...data, budget: parseInt(tempValue) });
    }
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const toggleInterest = (interest: string) => {
    setData({
      ...data,
      interests: data.interests.includes(interest)
        ? data.interests.filter((i) => i !== interest)
        : [...data.interests, interest],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/60 p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl"
    >
      {/* Header */}
      <div className="space-y-3 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20"
        >
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-violet-500 animate-pulse"></div>
          <span className="text-sm font-medium text-primary">Review Your Plan</span>
        </motion.div>
        <h2 className="font-display text-3xl font-bold bg-gradient-to-r from-slate-800 via-primary to-violet-600 bg-clip-text text-transparent">
          Trip Summary
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Perfect your itinerary before sending it to our travel experts
        </p>
      </div>

      {/* Plan Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-violet-500/5 to-indigo-500/5 border border-primary/10 p-6"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            Plan Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-medium text-foreground">{data.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium text-foreground">{data.days} days</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium text-foreground">₹{data.budget.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-muted-foreground">Interests:</span>
              <span className="font-medium text-foreground">{data.interests.length} selected</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Destination */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-3xl border border-sky-200/50 bg-gradient-to-br from-sky-50/80 to-blue-50/60 p-6 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 hover:border-sky-300/60"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sky-400/10 to-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative flex items-start gap-4 justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400/20 to-blue-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
                <MapPin className="w-6 h-6 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-1">Destination</div>
                {editingField === "destination" ? (
                  <div className="space-y-3">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="h-10 border-sky-200 focus:border-sky-400 focus:ring-sky-400/20"
                      placeholder="Enter destination"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit("destination")}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-200 hover:border-emerald-300 transition-colors"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xl font-bold text-slate-800 leading-tight">{data.destination}</div>
                )}
              </div>
            </div>
            {editingField !== "destination" && (
              <button
                onClick={() => startEdit("destination", data.destination)}
                className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-sky-500/10 border border-transparent hover:border-sky-200 transition-all duration-200"
              >
                <Edit2 className="w-4 h-4 text-sky-500" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Duration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="group relative overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-50/80 to-purple-50/60 p-6 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:border-violet-300/60"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-400/10 to-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative flex items-start gap-4 justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400/20 to-purple-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">Duration</div>
                {editingField === "days" ? (
                  <div className="space-y-3">
                    <Input
                      type="number"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="h-10 border-violet-200 focus:border-violet-400 focus:ring-violet-400/20"
                      placeholder="Days"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit("days")}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-200 hover:border-emerald-300 transition-colors"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-slate-800 leading-tight">{data.days} <span className="text-lg font-medium text-slate-600">days</span></div>
                )}
              </div>
            </div>
            {editingField !== "days" && (
              <button
                onClick={() => startEdit("days", data.days.toString())}
                className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-violet-500/10 border border-transparent hover:border-violet-200 transition-all duration-200"
              >
                <Edit2 className="w-4 h-4 text-violet-500" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Budget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="group relative overflow-hidden rounded-3xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-green-50/60 p-6 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:border-emerald-300/60"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative flex items-start gap-4 justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Budget</div>
                {editingField === "budget" ? (
                  <div className="space-y-3">
                    <Input
                      type="number"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="h-10 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      placeholder="Budget"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit("budget")}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-200 hover:border-emerald-300 transition-colors"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-slate-800 leading-tight">₹{data.budget.toLocaleString("en-IN")}</div>
                )}
              </div>
            </div>
            {editingField !== "budget" && (
              <button
                onClick={() => startEdit("budget", data.budget.toString())}
                className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 transition-all duration-200"
              >
                <Edit2 className="w-4 h-4 text-emerald-500" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

        {/* Interests Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="group relative overflow-hidden rounded-3xl border border-rose-200/50 bg-gradient-to-br from-rose-50/80 to-pink-50/60 p-6 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 hover:border-rose-300/60 sm:col-span-2"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-400/10 to-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400/20 to-pink-500/20 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Your Interests</div>
                <div className="text-sm text-slate-600">{data.interests.length} selected</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {interestOptions.map((option) => {
                const active = data.interests.includes(option.value);
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => toggleInterest(option.value)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-rose-500/20 to-pink-500/20 border-rose-300/60 text-rose-700 shadow-md shadow-rose-500/20"
                        : "bg-white/60 border-slate-200/60 text-slate-600 hover:border-rose-300/40 hover:bg-rose-50/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4 pt-6"
      >
        <Button
          onClick={onEditAll}
          variant="outline"
          className="flex-1 h-14 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-800 font-semibold gap-3 transition-all duration-200"
        >
          <Edit2 className="w-5 h-5" />
          Back to Form
        </Button>
        <Button
          onClick={() => onSendPlan(data)}
          className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-primary via-violet-500 to-indigo-600 hover:from-primary/90 hover:via-violet-500/90 hover:to-indigo-600/90 shadow-xl shadow-primary/30 font-semibold gap-3 transition-all duration-200 hover:shadow-2xl hover:shadow-primary/40"
        >
          <Send className="w-5 h-5" />
          Send Plan
        </Button>
      </motion.div>

      {/* Info message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center pt-4"
      >
        <p className="text-xs text-slate-500 bg-slate-50/50 rounded-full px-4 py-2 inline-block">
          ✨ We'll craft the perfect itinerary based on your preferences
        </p>
      </motion.div>
    </motion.div>
  );
}