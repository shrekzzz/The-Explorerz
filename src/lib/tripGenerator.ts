import { TripPlan, TripFormData } from "@/types/trip";

const INTERESTS_DETAILS: Record<string, string> = {
  food: "local cuisine, street food, fine dining, food markets",
  adventure: "hiking, water sports, extreme activities, outdoor exploration",
  temples: "temples, shrines, religious sites, spiritual experiences",
  culture: "museums, art galleries, historical sites, local traditions",
  nightlife: "bars, clubs, live music, night markets",
  nature: "parks, beaches, mountains, wildlife, scenic viewpoints",
  shopping: "local markets, malls, boutiques, souvenirs",
  relaxation: "spas, wellness, beaches, quiet retreats",
};

export function generateMockTrip(data: TripFormData): TripPlan {
  const interestDescriptions = data.interests
    .map((i) => INTERESTS_DETAILS[i] || i)
    .join(", ");

  const days = Array.from({ length: data.days }, (_, i) => {
    const dayNum = i + 1;
    const isFirst = dayNum === 1;
    const isLast = dayNum === data.days;

    const activities = [
      {
        time: "09:00",
        title: isFirst ? `Arrival & Check-in at ${data.destination}` : `Morning ${data.interests[i % data.interests.length] || "exploration"}`,
        description: isFirst
          ? `Arrive at ${data.destination}, check into your hotel, and get settled.`
          : `Start day ${dayNum} exploring the best of ${data.destination}.`,
        location: {
          name: isFirst ? `${data.destination} Airport` : `${data.destination} ${["Old Town", "City Center", "Waterfront", "Hills", "Market District"][i % 5]}`,
          lat: 28.6139 + (Math.random() - 0.5) * 0.05,
          lng: 77.209 + (Math.random() - 0.5) * 0.05,
        },
        category: isFirst ? "transport" as const : (["food", "adventure", "culture", "nature", "shopping"] as const)[i % 5],
        cost: isFirst ? 0 : Math.round(data.budget * 0.02),
      },
      {
        time: "12:00",
        title: `Lunch at ${["The Local Kitchen", "Rooftop Bistro", "Street Food Lane", "Harbor Grill", "Garden Café"][i % 5]}`,
        description: `Enjoy authentic local cuisine featuring ${data.destination}'s best dishes.`,
        location: {
          name: `${["The Local Kitchen", "Rooftop Bistro", "Street Food Lane", "Harbor Grill", "Garden Café"][i % 5]}`,
          lat: 28.6139 + (Math.random() - 0.5) * 0.05,
          lng: 77.209 + (Math.random() - 0.5) * 0.05,
        },
        category: "food" as const,
        cost: Math.round(data.budget * 0.03),
      },
      {
        time: "14:30",
        title: isLast
          ? "Souvenir Shopping & Farewell"
          : `Afternoon ${["Temple Visit", "Nature Walk", "Cultural Tour", "Adventure Activity", "Art Gallery"][i % 5]}`,
        description: isLast
          ? `Pick up souvenirs and say goodbye to ${data.destination}.`
          : `Explore the ${["spiritual", "natural", "cultural", "thrilling", "artistic"][i % 5]} side of ${data.destination}.`,
        location: {
          name: `${data.destination} ${["Grand Temple", "National Park", "Museum", "Adventure Park", "Art District"][i % 5]}`,
          lat: 28.6139 + (Math.random() - 0.5) * 0.05,
          lng: 77.209 + (Math.random() - 0.5) * 0.05,
        },
        category: (["temples", "nature", "culture", "adventure", "shopping"] as const)[i % 5],
        cost: Math.round(data.budget * 0.04),
      },
      {
        time: "19:00",
        title: isLast
          ? `Departure from ${data.destination}`
          : `Evening at ${["Night Market", "Sunset Point", "Live Music Venue", "Waterfront", "Rooftop Bar"][i % 5]}`,
        description: isLast
          ? `Head to the airport for your departure. Safe travels!`
          : `Wind down the day at one of ${data.destination}'s best evening spots.`,
        location: {
          name: isLast ? `${data.destination} Airport` : `${["Night Market", "Sunset Point", "Live Music Venue", "Waterfront", "Rooftop Bar"][i % 5]}`,
          lat: 28.6139 + (Math.random() - 0.5) * 0.05,
          lng: 77.209 + (Math.random() - 0.5) * 0.05,
        },
        category: isLast ? "transport" as const : "nightlife" as const,
        cost: isLast ? 0 : Math.round(data.budget * 0.03),
      },
    ];

    return {
      day: dayNum,
      title: isFirst ? "Arrival Day" : isLast ? "Departure Day" : `Day ${dayNum} — Explore ${data.destination}`,
      activities,
    };
  });

  const accommodationCost = Math.round(data.budget * 0.35);
  const foodCost = Math.round(data.budget * 0.25);
  const transportCost = Math.round(data.budget * 0.15);
  const activitiesCost = Math.round(data.budget * 0.2);
  const totalCost = accommodationCost + foodCost + transportCost + activitiesCost;

  return {
    id: crypto.randomUUID(),
    destination: data.destination,
    days: data.days,
    budget: data.budget,
    interests: data.interests,
    createdAt: new Date().toISOString(),
    itinerary: days,
    budgetBreakdown: {
      accommodation: accommodationCost,
      food: foodCost,
      transport: transportCost,
      activities: activitiesCost,
      total: totalCost,
    },
    hotels: [
      {
        name: `${data.destination} Grand Hotel`,
        rating: 4.5,
        pricePerNight: Math.round(accommodationCost / data.days),
        location: {
          lat: 28.6139 + 0.01,
          lng: 77.209 + 0.01,
        },
      },
      {
        name: `${data.destination} Boutique Stay`,
        rating: 4.2,
        pricePerNight: Math.round((accommodationCost / data.days) * 0.7),
        location: {
          lat: 28.6139 - 0.01,
          lng: 77.209 - 0.01,
        },
      },
      {
        name: `The Backpacker's Nest`,
        rating: 4.0,
        pricePerNight: Math.round((accommodationCost / data.days) * 0.4),
        location: {
          lat: 28.6139 + 0.02,
          lng: 77.209 - 0.02,
        },
      },
    ],
  };
}
