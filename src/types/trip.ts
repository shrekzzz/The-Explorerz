export interface TripFormData {
  destination: string;
  days: number;
  budget: number;
  interests: string[];
}

export interface ActivityLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  location: ActivityLocation;
  category: "food" | "adventure" | "temples" | "culture" | "nightlife" | "nature" | "shopping" | "transport" | "relaxation";
  cost: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  total: number;
}

export interface Hotel {
  name: string;
  rating: number;
  pricePerNight: number;
  location: {
    lat: number;
    lng: number;
  };
}

export interface TripPlan {
  id: string;
  destination: string;
  days: number;
  budget: number;
  interests: string[];
  createdAt: string;
  itinerary: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
  hotels: Hotel[];
}
