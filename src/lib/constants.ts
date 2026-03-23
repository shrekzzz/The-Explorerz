import { Utensils, Mountain, Landmark, Palette, Music, TreePine, ShoppingBag, Plane, Sparkles, Heart } from "lucide-react";

export const categoryIcons = {
  food: Utensils,
  adventure: Mountain,
  temples: Landmark,
  culture: Palette,
  nightlife: Music,
  nature: TreePine,
  shopping: ShoppingBag,
  transport: Plane,
  relaxation: Sparkles,
};

export const interestOptions = [
  { value: "food", label: "Food & Cuisine", icon: Utensils },
  { value: "adventure", label: "Adventure", icon: Mountain },
  { value: "temples", label: "Temples", icon: Landmark },
  { value: "culture", label: "Culture & Arts", icon: Palette },
  { value: "nightlife", label: "Nightlife", icon: Music },
  { value: "nature", label: "Nature", icon: TreePine },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "relaxation", label: "Relaxation", icon: Heart },
];
