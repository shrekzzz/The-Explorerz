import { motion } from "framer-motion";
import { BedDouble, Utensils, Car, Ticket, PiggyBank } from "lucide-react";
import { BudgetBreakdown as BudgetBreakdownType } from "@/types/trip";

interface Props {
  breakdown: BudgetBreakdownType;
  totalBudget: number;
}

const items = [
  { key: "accommodation" as const, label: "Accommodation", icon: BedDouble },
  { key: "food" as const, label: "Food & Dining", icon: Utensils },
  { key: "transport" as const, label: "Transportation", icon: Car },
  { key: "activities" as const, label: "Activities & Tickets", icon: Ticket },
];

export default function BudgetBreakdownCard({ breakdown, totalBudget }: Props) {
  const isUnderBudget = breakdown.total <= totalBudget;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-primary" />
          Budget Breakdown
        </h3>
        <span
          className={`text-sm font-semibold px-3 py-1 rounded-full ${
            isUnderBudget
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {isUnderBudget ? "Under Budget ✓" : "Over Budget"}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const value = breakdown[item.key];
          const pct = Math.round((value / totalBudget) * 100);
          const Icon = item.icon;
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-foreground">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                </span>
                <span className="font-medium text-foreground">${value}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="font-display font-bold text-foreground">Total Estimated</span>
        <span className="font-display text-2xl font-bold text-primary">${breakdown.total}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-right">
        Budget: ${totalBudget}
      </p>
    </motion.div>
  );
}
