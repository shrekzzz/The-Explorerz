export interface TravelPackage {
  id: string;
  title: string;
  subtitle: string;
  category: "pilgrimage" | "trek" | "heritage" | "nature" | "adventure";
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  locations: string[];
  highlights: string[];
  bestTime: string;
  difficulty?: "Easy" | "Moderate" | "Difficult" | "Extreme";
  included: string[];
  status: "available" | "coming-soon";
}

export const packageCategories = [
  { value: "all", label: "All Packages" },
  { value: "pilgrimage", label: "Pilgrimage" },
  { value: "trek", label: "Treks" },
  { value: "heritage", label: "Heritage" },
  { value: "nature", label: "Nature" },
  { value: "adventure", label: "Adventure" },
];

export const travelPackages: TravelPackage[] = [
  {
    id: "char-dham",
    title: "Char Dham Yatra",
    subtitle: "The ultimate Hindu pilgrimage circuit",
    category: "pilgrimage",
    duration: "10-12 Days",
    price: 25000,
    rating: 4.8,
    reviews: 2340,
    image: "/Chardham-Temple.jpg",
    locations: ["Yamunotri", "Gangotri", "Kedarnath", "Badrinath"],
    highlights: [
      "Visit all four sacred shrines in Uttarakhand",
      "Helicopter option for Kedarnath",
      "Holy dip at Yamunotri & Gangotri",
      "Darshan at Badrinath Temple",
    ],
    bestTime: "May – June, Sep – Oct",
    included: ["Accommodation", "Meals", "Transport", "Guide", "Permits"],
    status: "available",
  },
  {
    id: "do-dham",
    title: "Do Dham Yatra",
    subtitle: "Kedarnath & Badrinath spiritual journey",
    category: "pilgrimage",
    duration: "6-7 Days",
    price: 15000,
    rating: 4.7,
    reviews: 1890,
    image: "https://images.unsplash.com/photo-1600100397608-e4b8e8e3e3fd?w=600&q=80",
    locations: ["Kedarnath", "Badrinath"],
    highlights: [
      "Trek to Kedarnath Temple (16 km)",
      "Visit Badrinath Temple & Mana Village",
      "Hot springs at Tapt Kund",
      "Scenic Chopta valley views",
    ],
    bestTime: "May – June, Sep – Oct",
    included: ["Accommodation", "Meals", "Transport", "Guide"],
    status: "available",
  },
  {
    id: "12-jyotirlinga",
    title: "12 Jyotirlinga Darshan",
    subtitle: "Complete circuit of all 12 sacred Shiva temples",
    category: "pilgrimage",
    duration: "18-21 Days",
    price: 55000,
    rating: 4.9,
    reviews: 980,
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&q=80",
    locations: [
      "Somnath", "Mallikarjuna", "Mahakaleshwar", "Omkareshwar",
      "Kedarnath", "Bhimashankar", "Kashi Vishwanath", "Trimbakeshwar",
      "Nageshwar", "Rameshwaram", "Grishneshwar", "Vaidyanath",
    ],
    highlights: [
      "Visit all 12 Jyotirlinga temples across India",
      "Air-conditioned travel between cities",
      "Special puja arrangements at each temple",
      "Experienced pandits accompanying the group",
    ],
    bestTime: "Oct – Mar",
    included: ["Accommodation", "Meals", "Flights", "Transport", "Puja", "Guide"],
    status: "coming-soon",
  },
  {
    id: "valley-of-flowers",
    title: "Valley of Flowers Trek",
    subtitle: "UNESCO World Heritage alpine meadow trek",
    category: "trek",
    duration: "6 Days",
    price: 12000,
    rating: 4.8,
    reviews: 1560,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    locations: ["Govindghat", "Ghangaria", "Valley of Flowers", "Hemkund Sahib"],
    highlights: [
      "Trek through 600+ species of wildflowers",
      "Visit Hemkund Sahib Gurudwara",
      "UNESCO World Heritage Site",
      "Stunning Himalayan panoramas",
    ],
    bestTime: "Jul – Sep",
    difficulty: "Moderate",
    included: ["Camping", "Meals", "Guide", "Permits", "Equipment"],
    status: "coming-soon",
  },
  {
    id: "kedarkantha",
    title: "Kedarkantha Trek",
    subtitle: "Best winter trek in India with summit climb",
    category: "trek",
    duration: "5 Days",
    price: 8500,
    rating: 4.7,
    reviews: 2100,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
    locations: ["Sankri", "Juda Ka Talab", "Kedarkantha Base Camp", "Kedarkantha Summit"],
    highlights: [
      "Summit at 12,500 ft with 360° views",
      "Snow-covered trails in winter",
      "Camp by frozen Juda Ka Talab lake",
      "Perfect for beginners",
    ],
    bestTime: "Dec – Apr",
    difficulty: "Easy",
    included: ["Camping", "Meals", "Guide", "Equipment", "Transport from Dehradun"],
    status: "coming-soon",
  },
  {
    id: "hampta-pass",
    title: "Hampta Pass Trek",
    subtitle: "Cross from lush Kullu to barren Spiti",
    category: "trek",
    duration: "5 Days",
    price: 9500,
    rating: 4.6,
    reviews: 1320,
    image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=80",
    locations: ["Manali", "Jobra", "Balu Ka Ghera", "Hampta Pass", "Chandratal"],
    highlights: [
      "Dramatic landscape change from green to desert",
      "Cross the pass at 14,100 ft",
      "Visit stunning Chandratal Lake",
      "River crossings and meadow camps",
    ],
    bestTime: "Jun – Oct",
    difficulty: "Moderate",
    included: ["Camping", "Meals", "Guide", "Equipment", "Transport"],
    status: "coming-soon",
  },
  {
    id: "roopkund",
    title: "Roopkund Trek",
    subtitle: "The mysterious skeleton lake trek",
    category: "trek",
    duration: "7 Days",
    price: 11000,
    rating: 4.5,
    reviews: 890,
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600&q=80",
    locations: ["Lohajung", "Didina", "Ali Bugyal", "Roopkund"],
    highlights: [
      "Trek to the mysterious skeleton lake at 15,700 ft",
      "Camp at Asia's largest alpine meadow – Ali Bugyal",
      "Panoramic views of Trishul & Nanda Ghunti",
      "Rich local Uttarakhandi culture",
    ],
    bestTime: "May – Jun, Sep – Oct",
    difficulty: "Difficult",
    included: ["Camping", "Meals", "Guide", "Equipment", "Permits"],
    status: "coming-soon",
  },
  {
    id: "golden-triangle",
    title: "Golden Triangle Tour",
    subtitle: "Delhi – Agra – Jaipur heritage circuit",
    category: "heritage",
    duration: "5-6 Days",
    price: 18000,
    rating: 4.6,
    reviews: 3200,
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",
    locations: ["Delhi", "Agra", "Jaipur"],
    highlights: [
      "Taj Mahal sunrise visit",
      "Amber Fort elephant ride",
      "Old Delhi heritage walk",
      "Jaipur's pink city markets",
    ],
    bestTime: "Oct – Mar",
    included: ["Hotels", "Breakfast", "AC Transport", "Guide", "Entry tickets"],
    status: "coming-soon",
  },
  {
    id: "kerala-backwaters",
    title: "Kerala Backwaters & Hills",
    subtitle: "God's own country – beaches, backwaters & tea gardens",
    category: "nature",
    duration: "7 Days",
    price: 22000,
    rating: 4.7,
    reviews: 1750,
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80",
    locations: ["Kochi", "Munnar", "Thekkady", "Alleppey", "Kovalam"],
    highlights: [
      "Houseboat stay on Alleppey backwaters",
      "Tea plantation walk in Munnar",
      "Periyar wildlife sanctuary",
      "Ayurvedic spa experience",
    ],
    bestTime: "Sep – Mar",
    included: ["Hotels", "Houseboat", "Meals", "Transport", "Guide"],
    status: "coming-soon",
  },
  {
    id: "ladakh-adventure",
    title: "Ladakh Adventure Expedition",
    subtitle: "Conquer the highest motorable passes",
    category: "adventure",
    duration: "8-10 Days",
    price: 28000,
    rating: 4.8,
    reviews: 2050,
    image: "https://images.unsplash.com/photo-1626015365107-00a5c4b39e2d?w=600&q=80",
    locations: ["Leh", "Nubra Valley", "Pangong Lake", "Khardung La", "Tso Moriri"],
    highlights: [
      "Drive over Khardung La (17,982 ft)",
      "Camp at Pangong Lake",
      "Double-humped camel ride at Hunder",
      "Visit ancient monasteries",
    ],
    bestTime: "Jun – Sep",
    difficulty: "Moderate",
    included: ["Hotels & Camps", "Meals", "Bike/SUV", "Permits", "Oxygen"],
    status: "coming-soon",
  },
  {
    id: "chadar-trek",
    title: "Chadar Frozen River Trek",
    subtitle: "Walk on the frozen Zanskar river",
    category: "adventure",
    duration: "9 Days",
    price: 35000,
    rating: 4.9,
    reviews: 650,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
    locations: ["Leh", "Tilat Sumdo", "Gyalpo", "Tibb Cave", "Nerak"],
    highlights: [
      "Walk on the frozen Zanskar River",
      "Camp in caves along the river",
      "Witness the frozen Nerak waterfall",
      "Extreme winter adventure experience",
    ],
    bestTime: "Jan – Feb",
    difficulty: "Extreme",
    included: ["Camping", "Meals", "Guide", "Equipment", "Permits", "Insurance"],
    status: "coming-soon",
  },
  {
    id: "rajasthan-royal",
    title: "Royal Rajasthan Circuit",
    subtitle: "Forts, palaces, deserts & vibrant culture",
    category: "heritage",
    duration: "9-10 Days",
    price: 30000,
    rating: 4.7,
    reviews: 1420,
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80",
    locations: ["Jaipur", "Jodhpur", "Jaisalmer", "Udaipur", "Pushkar"],
    highlights: [
      "Desert safari & camping in Jaisalmer",
      "Boat ride on Lake Pichola, Udaipur",
      "Mehrangarh Fort in Jodhpur",
      "Pushkar Brahma Temple visit",
    ],
    bestTime: "Oct – Mar",
    included: ["Heritage Hotels", "Breakfast", "AC Transport", "Guide", "Safari"],
    status: "coming-soon",
  },
];

import { getPackages as getStoredPackages, savePackage } from "./storage";

export function getTravelPackages(): TravelPackage[] {
  const stored = getStoredPackages();
  if (stored.length > 0) {
    return stored;
  }
  // Initialize with default packages
  travelPackages.forEach(pkg => savePackage(pkg));
  return travelPackages;
}
