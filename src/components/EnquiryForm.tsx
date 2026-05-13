import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User, Phone, Mail, IndianRupee, MessageSquare, X, Send, Users, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";

import { TravelPackage } from "@/lib/packages";

interface EnquiryFormProps {
  packageTitle: string;
  packagePrice: number;
  packageData?: TravelPackage;
  onClose: () => void;
}

export interface EnquiryData {
  name: string;
  phone: string;
  email: string;
  city: string;
  numberOfPeople: number;
  travelDate: Date | undefined;
  selectedRoute?: string;
  budgetRange: number[];
  remarks: string;
}

export default function EnquiryForm({ packageTitle, packagePrice, packageData, onClose }: EnquiryFormProps) {
  // Calculate budget range based on package price
  const minBudget = packagePrice;
  const maxBudget = packagePrice * 3; // 3x the package price as max
  const defaultMin = packagePrice;
  const defaultMax = packagePrice * 1.5; // 1.5x as default max

  const hasMultipleRoutes = packageData?.routes && packageData.routes.length > 1;

  const [formData, setFormData] = useState<EnquiryData>({
    name: "",
    phone: "",
    email: "",
    city: "",
    numberOfPeople: 1,
    travelDate: undefined,
    selectedRoute: hasMultipleRoutes ? packageData.routes[0].id : undefined,
    budgetRange: [defaultMin, defaultMax],
    remarks: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EnquiryData, string>>>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof EnquiryData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Enter valid 10-digit phone number";
    }
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter valid email address";
    }
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = "Number of people is required";
    }
    if (!formData.travelDate) newErrors.travelDate = "Travel date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Submit enquiry to API
      await api.post('/enquiries', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        packageTitle,
        packagePrice,
        numberOfPeople: formData.numberOfPeople,
        travelDate: formData.travelDate ? format(formData.travelDate, 'yyyy-MM-dd') : null,
        selectedRoute: formData.selectedRoute,
        budgetMin: formData.budgetRange[0],
        budgetMax: formData.budgetRange[1],
        remarks: formData.remarks,
      });

      toast.success('Enquiry sent successfully!', {
        description: 'Check your email for confirmation. Our team will contact you within 24 hours.',
      });

      onClose();
    } catch (error) {
      toast.error('Failed to send enquiry', {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBudget = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-3xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-accent/5 to-violet-500/10 border-b border-border/50 backdrop-blur-xl px-6 py-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Send Enquiry</h2>
              <p className="text-sm text-muted-foreground">{packageTitle}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Personal Details
            </h3>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className={cn(errors.name && "border-red-500")}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className={cn("pl-10", errors.phone && "border-red-500")}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className={cn("pl-10", errors.email && "border-red-500")}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Your City *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="From which city?"
                    className={cn("pl-10", errors.city && "border-red-500")}
                  />
                </div>
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <Label htmlFor="numberOfPeople">Number of People *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="numberOfPeople"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfPeople}
                    onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 1 })}
                    placeholder="How many people?"
                    className={cn("pl-10", errors.numberOfPeople && "border-red-500")}
                  />
                </div>
                {errors.numberOfPeople && <p className="text-xs text-red-500 mt-1">{errors.numberOfPeople}</p>}
              </div>
            </div>
          </div>

          {/* Travel Date */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              When are you planning to go?
            </h3>

            <div>
              <Label>Travel Date *</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.travelDate && "text-muted-foreground",
                      errors.travelDate && "border-red-500"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.travelDate ? format(formData.travelDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.travelDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, travelDate: date });
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.travelDate && <p className="text-xs text-red-500 mt-1">{errors.travelDate}</p>}
            </div>
          </div>

          {/* Route Selection */}
          {hasMultipleRoutes && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Select Your Preferred Route
              </h3>

              <div className="space-y-2">
                {packageData.routes!.map((route) => {
                  const isSelected = formData.selectedRoute === route.id;
                  const isExpanded = expandedRoute === route.id;
                  return (
                    <div
                      key={route.id}
                      className={cn(
                        "rounded-lg border-2 transition-all overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card"
                      )}
                    >
                      {/* Route Header */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, selectedRoute: route.id });
                          setExpandedRoute(isExpanded ? null : route.id);
                        }}
                        className="w-full text-left p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                            isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                          )}>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-foreground">{route.name}</div>
                          </div>
                          <ChevronRight className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        </div>
                      </button>

                      {/* Route Details (Expandable) */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border/50"
                        >
                          <div className="p-3 space-y-2 bg-muted/20">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Route Stops:</div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {route.locations.map((location, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-foreground px-2 py-1 rounded-md bg-background border border-border">
                                    {location}
                                  </span>
                                  {idx < route.locations.length - 1 && (
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </div>
                              ))}
                            </div>
                            {route.bestTime && (
                              <div className="text-xs text-muted-foreground pt-2">
                                <span className="font-medium">Best Time:</span> {route.bestTime}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget Range */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Budget Range (Per Person)
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Per person budget:</span>
                <span className="font-semibold text-foreground">
                  {formatBudget(formData.budgetRange[0])} - {formatBudget(formData.budgetRange[1])}
                </span>
              </div>

              <div className="px-2">
                <Slider
                  value={formData.budgetRange}
                  onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
                  min={minBudget}
                  max={maxBudget}
                  step={Math.max(1000, Math.floor((maxBudget - minBudget) / 100))}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground px-2">
                <span>{formatBudget(minBudget)}</span>
                <span className="text-center">Adjust per person</span>
                <span>{formatBudget(maxBudget)}</span>
              </div>

              {/* Total Budget Display */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Budget ({formData.numberOfPeople} {formData.numberOfPeople === 1 ? 'person' : 'people'}):</span>
                  <span className="text-lg font-bold text-primary">
                    {formatBudget(formData.budgetRange[0] * formData.numberOfPeople)} - {formatBudget(formData.budgetRange[1] * formData.numberOfPeople)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Remarks */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Special Remarks (Optional)
            </h3>

            <Textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Any special requirements, preferences, or questions..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <motion.div
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="flex-1"
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Enquiry
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
