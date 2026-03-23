import { motion } from "framer-motion";
import { Clock, DollarSign } from "lucide-react";
import { ItineraryDay, Activity } from "@/types/trip";
import { categoryIcons } from "@/lib/constants";

interface Props {
  itinerary: ItineraryDay[];
  onActivityClick?: (activity: Activity) => void;
}

export default function ItineraryTimeline({ itinerary, onActivityClick }: Props) {
  return (
    <div className="space-y-8">
      {itinerary.map((day, dayIdx) => (
        <motion.div
          key={day.day}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIdx * 0.15, duration: 0.4 }}
        >
          <h3 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {day.day}
            </span>
            {day.title}
          </h3>

          <div className="relative pl-8 space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

            {day.activities.map((activity, actIdx) => {
              const Icon = categoryIcons[activity.category] || Clock;
              return (
                <motion.div
                  key={actIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIdx * 0.15 + actIdx * 0.08, duration: 0.3 }}
                  onClick={() => onActivityClick?.(activity)}
                  className="relative bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[25px] top-5 w-3 h-3 rounded-full bg-primary border-2 border-card" />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {activity.time}
                        </span>
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="font-display font-semibold text-foreground text-sm">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        {activity.location.name}
                      </p>
                    </div>
                    {activity.cost > 0 && (
                      <span className="text-xs font-medium text-success flex items-center gap-0.5 shrink-0">
                        <DollarSign className="w-3 h-3" />
                        {activity.cost}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
