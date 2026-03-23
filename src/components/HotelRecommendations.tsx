import { motion } from "framer-motion";
import { Star, BedDouble, DollarSign } from "lucide-react";
import { Hotel } from "@/types/trip";

interface Props {
  hotels: Hotel[];
}

export default function HotelRecommendations({ hotels }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
        <BedDouble className="w-5 h-5 text-primary" />
        Hotel Recommendations
      </h3>

      <div className="space-y-3">
        {hotels.map((hotel, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div>
              <h4 className="font-medium text-sm text-foreground">{hotel.name}</h4>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-accent fill-accent" />
                <span className="text-xs text-muted-foreground">{hotel.rating}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />
                {hotel.pricePerNight}
              </span>
              <span className="text-xs text-muted-foreground">per night</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
