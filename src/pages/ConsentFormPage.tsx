import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle2, Circle, ChevronDown, FileText, Shield,
  User, Phone, MapPin, Users, AlertCircle, Upload, X,
  Plane, Mountain, TrainFront, Hotel, TreePine, Waves,
  Building2, CloudSun, Compass,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";

const floatingIcons = [
  { Icon: Plane,      x: "3%",  y: "8%",  size: 36, delay: 0,   duration: 6,   rotate: -15, color: "text-primary" },
  { Icon: Mountain,   x: "88%", y: "6%",  size: 44, delay: 0.4, duration: 7,   rotate: 10,  color: "text-emerald-500" },
  { Icon: TrainFront, x: "92%", y: "35%", size: 32, delay: 0.9, duration: 5.5, rotate: -8,  color: "text-amber-500" },
  { Icon: Hotel,      x: "2%",  y: "40%", size: 30, delay: 1.4, duration: 6.5, rotate: 12,  color: "text-violet-500" },
  { Icon: TreePine,   x: "90%", y: "62%", size: 28, delay: 0.7, duration: 5,   rotate: -5,  color: "text-green-500" },
  { Icon: Waves,      x: "1%",  y: "65%", size: 32, delay: 1.9, duration: 7.5, rotate: 8,   color: "text-cyan-500" },
  { Icon: Building2,  x: "88%", y: "85%", size: 26, delay: 1.1, duration: 6,   rotate: -10, color: "text-rose-500" },
  { Icon: CloudSun,   x: "4%",  y: "88%", size: 30, delay: 0.2, duration: 8,   rotate: 5,   color: "text-orange-400" },
  { Icon: Compass,    x: "92%", y: "15%", size: 24, delay: 2.3, duration: 6,   rotate: 20,  color: "text-sky-500" },
];

const TRAVEL_MODES = ["By Air", "By Train", "By Road", "Self-Drive"];

const MEAL_PREFS = ["Vegetarian", "Jain", "No Preference"];

const ROOM_TYPES = ["Single Occupancy", "Double Occupancy", "Triple Occupancy", "Dormitory"];

interface Package {
  id: string;
  title: string;
}

interface Traveller {
  name: string;
  age: string;
  gender: string;
  idType: string;
  idNumber: string;
  idProof: File | null;
  passportPhoto: File | null;
  phone: string;
  email: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const emptyTraveller = (): Traveller => ({
  name: "", age: "", gender: "", idType: "Aadhaar", idNumber: "", idProof: null, passportPhoto: null, phone: "", email: "",
});

// Validation functions
const validateAadhaar = (num: string): boolean => /^\d{12}$/.test(num);
const validatePAN = (num: string): boolean => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(num);
const validatePassport = (num: string): boolean => /^[A-Z]{1}[0-9]{7}$/.test(num);
const validateVoterID = (num: string): boolean => /^[A-Z]{3}[0-9]{7}$/.test(num);
const validateDrivingLicense = (num: string): boolean => /^[A-Z]{2}[0-9]{13}$/.test(num);
const validatePhone = (num: string): boolean => /^[6-9]\d{9}$/.test(num);
const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name: string): boolean => /^[a-zA-Z\s]{2,}$/.test(name);

const getIdValidationMessage = (idType: string): string => {
  switch (idType) {
    case 'Aadhaar': return '12 digits (e.g., 123456789012)';
    case 'PAN Card': return '10 characters (e.g., ABCDE1234F)';
    case 'Passport': return '8 characters (e.g., A1234567)';
    case 'Voter ID': return '10 characters (e.g., ABC1234567)';
    case 'Driving Licence': return '15 characters (e.g., MH0120190012345)';
    default: return '';
  }
};

const validateIdNumber = (idType: string, idNumber: string): boolean => {
  switch (idType) {
    case 'Aadhaar': return validateAadhaar(idNumber);
    case 'PAN Card': return validatePAN(idNumber);
    case 'Passport': return validatePassport(idNumber);
    case 'Voter ID': return validateVoterID(idNumber);
    case 'Driving Licence': return validateDrivingLicense(idNumber);
    default: return false;
  }
};

export default function ConsentFormPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  // ── Form state ──
  const [tourPackage, setTourPackage]     = useState("");
  const [travelDate, setTravelDate]       = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [travellers, setTravellers]       = useState<Traveller[]>([emptyTraveller()]);
  const [leadAddress, setLeadAddress]     = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [physicallyFit, setPhysicallyFit]   = useState<"Yes" | "No" | "">("");
  const [medicalCondition, setMedicalCondition] = useState<"Yes" | "No" | "">("");
  const [medicalConditionDetails, setMedicalConditionDetails] = useState("");
  const [medicalConditionSeverity, setMedicalConditionSeverity] = useState<"Mild" | "Moderate" | "Severe" | "">("");
  const [agreeRisk, setAgreeRisk]           = useState(false);
  const [agreePermission, setAgreePermission] = useState(false);
  const [agreeInstructions, setAgreeInstructions] = useState(false);
  const [agreeAdventure, setAgreeAdventure] = useState(false);
  const [agreeEmergency, setAgreeEmergency] = useState(false);
  const [passportPhoto, setPassportPhoto]   = useState<File | null>(null);

  // Fetch packages on mount
  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      // Fetch all packages using maximum allowed limit (50)
      const { data } = await api.get('/packages?limit=50');
      // API returns { success: true, data: [...packages], pagination: {...} }
      setPackages(data.data || []);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setPackagesLoading(false);
    }
  }

  const addTraveller = () => {
    if (travellers.length < 10) setTravellers([...travellers, emptyTraveller()]);
  };

  const removeTraveller = (i: number) => {
    if (travellers.length > 1) setTravellers(travellers.filter((_, idx) => idx !== i));
  };

  const updateTraveller = (i: number, field: keyof Traveller, value: string | File | null) => {
    const updated = [...travellers];
    updated[i] = { ...updated[i], [field]: value };
    setTravellers(updated);
    
    // Clear validation error for this field
    const errorKey = `traveller_${i}_${field}`;
    if (validationErrors[errorKey]) {
      const newErrors = { ...validationErrors };
      delete newErrors[errorKey];
      setValidationErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Validate each traveler
    travellers.forEach((t, i) => {
      if (!validateName(t.name)) {
        errors[`traveller_${i}_name`] = 'Name should contain only letters and spaces (min 2 characters)';
      }
      if (!t.age || parseInt(t.age) < 1 || parseInt(t.age) > 120) {
        errors[`traveller_${i}_age`] = 'Please enter a valid age (1-120)';
      }
      if (!t.gender) {
        errors[`traveller_${i}_gender`] = 'Please select gender';
      }
      if (!validatePhone(t.phone)) {
        errors[`traveller_${i}_phone`] = 'Phone must be 10 digits starting with 6-9';
      }
      if (!validateEmail(t.email)) {
        errors[`traveller_${i}_email`] = 'Please enter a valid email address';
      }
      if (!t.idNumber) {
        errors[`traveller_${i}_idNumber`] = 'ID number is required';
      } else if (!validateIdNumber(t.idType, t.idNumber)) {
        errors[`traveller_${i}_idNumber`] = `Invalid ${t.idType} format. Expected: ${getIdValidationMessage(t.idType)}`;
      }
      if (!t.idProof) {
        errors[`traveller_${i}_idProof`] = 'Please upload ID proof';
      }
      if (!t.passportPhoto) {
        errors[`traveller_${i}_passportPhoto`] = 'Please upload passport photo';
      }
    });
    
    // Validate address
    if (leadAddress.trim().length < 10) {
      errors.leadAddress = 'Please enter complete address (minimum 10 characters)';
    }
    
    // Validate emergency contact
    if (!validateName(emergencyName)) {
      errors.emergencyName = 'Name should contain only letters and spaces';
    }
    if (!validatePhone(emergencyPhone)) {
      errors.emergencyPhone = 'Phone must be 10 digits starting with 6-9';
    }
    if (!emergencyRelation) {
      errors.emergencyRelation = 'Please select relation';
    }
    
    // Validate package selection
    if (!tourPackage) {
      errors.tourPackage = 'Please select a tour package';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const allConsentsChecked = physicallyFit !== "" && medicalCondition !== "" &&
    (medicalCondition === "No" || (medicalConditionDetails.trim() !== "" && medicalConditionSeverity !== "")) &&
    agreeRisk && agreePermission && agreeInstructions && agreeAdventure && agreeEmergency && 
    termsChecked && privacyChecked && leadAddress.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting");
      return;
    }
    
    if (!allConsentsChecked) {
      toast.error("Please complete all required fields and accept all declarations");
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress("Starting submission...");
    console.log('=== CONSENT FORM SUBMISSION STARTED ===');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      // Get main traveler (first one)
      const mainTraveler = travellers[0];
      console.log('Main traveler:', { name: mainTraveler.name, email: mainTraveler.email });
      
      // Upload files to Cloudinary via backend with extended timeout
      setUploadProgress("Uploading passport photo...");
      console.log('Step 1: Starting passport photo upload');
      const photoStartTime = Date.now();
      
      let photoUrl = null, photoPublicId = null;
      if (mainTraveler.passportPhoto) {
        console.log('Passport photo details:', {
          name: mainTraveler.passportPhoto.name,
          size: `${(mainTraveler.passportPhoto.size / 1024 / 1024).toFixed(2)} MB`,
          type: mainTraveler.passportPhoto.type
        });
        
        const photoFormData = new FormData();
        photoFormData.append('image', mainTraveler.passportPhoto);
        photoFormData.append('folder', 'consent-forms/photos');
        
        try {
          const photoResponse = await api.post('/uploads/single', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000, // 120 seconds (2 minutes) for image upload
          });
          photoUrl = photoResponse.data.data.url;
          photoPublicId = photoResponse.data.data.publicId;
          const photoTime = Date.now() - photoStartTime;
          console.log(`✓ Passport photo uploaded successfully in ${photoTime}ms`);
          console.log('Photo URL:', photoUrl);
        } catch (error) {
          console.error('✗ Passport photo upload failed:', error);
          throw new Error('Failed to upload passport photo. Please try again.');
        }
      } else {
        console.log('No passport photo to upload');
      }
      
      setUploadProgress("Uploading ID proof...");
      console.log('Step 2: Starting ID proof upload');
      const idStartTime = Date.now();
      
      let idProofUrl = null, idProofPublicId = null;
      if (mainTraveler.idProof) {
        console.log('ID proof details:', {
          name: mainTraveler.idProof.name,
          size: `${(mainTraveler.idProof.size / 1024 / 1024).toFixed(2)} MB`,
          type: mainTraveler.idProof.type
        });
        
        const idFormData = new FormData();
        idFormData.append('image', mainTraveler.idProof);
        idFormData.append('folder', 'consent-forms/id-proofs');
        
        try {
          const idResponse = await api.post('/uploads/single', idFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000, // 120 seconds (2 minutes) for image upload
          });
          idProofUrl = idResponse.data.data.url;
          idProofPublicId = idResponse.data.data.publicId;
          const idTime = Date.now() - idStartTime;
          console.log(`✓ ID proof uploaded successfully in ${idTime}ms`);
          console.log('ID proof URL:', idProofUrl);
        } catch (error) {
          console.error('✗ ID proof upload failed:', error);
          throw new Error('Failed to upload ID proof. Please try again.');
        }
      } else {
        console.log('No ID proof to upload');
      }
      
      setUploadProgress("Preparing form data...");
      console.log('Step 3: Preparing form data');
      
      // Calculate approximate date of birth from age
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(mainTraveler.age || '25');
      const dateOfBirth = `${birthYear}-01-01`;
      
      // Parse address for city/state (simple split, can be improved)
      const addressParts = leadAddress.split(',').map(p => p.trim());
      const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : 'Unknown';
      const state = addressParts.length >= 1 ? addressParts[addressParts.length - 1] : 'Unknown';
      
      // Validate required fields
      if (!mainTraveler.name || !mainTraveler.email || !mainTraveler.phone) {
        console.error('Missing traveler details');
        toast.error("Please fill in all traveler details");
        return;
      }
      
      if (!emergencyName || !emergencyPhone || !emergencyRelation) {
        console.error('Missing emergency contact details');
        toast.error("Please fill in emergency contact details");
        return;
      }
      
      setUploadProgress("Submitting to server...");
      console.log('Step 4: Submitting form to server');
      const submitStartTime = Date.now();
      
      // Submit to backend
      const payload = {
        fullName: mainTraveler.name,
        email: mainTraveler.email,
        phone: mainTraveler.phone,
        dateOfBirth,
        gender: mainTraveler.gender,
        nationality: 'Indian',
        address: leadAddress,
        city,
        state,
        pincode: '400001', // Default Mumbai pincode
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        packageName: tourPackage,
        travelDate: new Date().toISOString().split('T')[0], // Current date as default
        numberOfTravelers: travellers.length,
        medicalConditions: medicalCondition === "Yes" ? medicalConditionDetails : null,
        allergies: null,
        medications: null,
        bloodGroup: null,
        medicalConditionSeverity: medicalCondition === "Yes" ? medicalConditionSeverity : null,
        photoUrl,
        photoPublicId,
        idProofUrl,
        idProofPublicId,
        idProofType: mainTraveler.idType === 'Driving Licence' ? 'Driving License' : mainTraveler.idType,
        idNumber: mainTraveler.idNumber,
        termsAccepted: termsChecked,
        privacyAccepted: privacyChecked,
        medicalConsent: agreeRisk && agreeEmergency,
        photoConsent: agreePermission,
        specialRequests: null,
        dietaryPreference: null,
      };
      
      console.log('Payload prepared:', {
        fullName: payload.fullName,
        email: payload.email,
        packageName: payload.packageName,
        hasPhoto: !!payload.photoUrl,
        hasIdProof: !!payload.idProofUrl,
      });
      
      try {
        await api.post('/consent-forms', payload, {
          timeout: 60000, // 60 seconds for form submission
        });
        const submitTime = Date.now() - submitStartTime;
        console.log(`✓ Form submitted successfully in ${submitTime}ms`);
        
        const totalTime = Date.now() - photoStartTime;
        console.log(`=== TOTAL SUBMISSION TIME: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s) ===`);
        
        setUploadProgress("Success!");
        setSubmitted(true);
        toast.success('Consent form submitted successfully! Check your email for confirmation.');
      } catch (error) {
        console.error('✗ Form submission failed:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response status:', error.response?.status);
          console.error('Response data:', error.response?.data);
          console.error('Request timeout:', error.code === 'ECONNABORTED');
        }
        throw error;
      }
    } catch (error) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Error details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('Request timed out');
          toast.error('Request timed out. Please check your internet connection and try again.', {
            description: 'The server took too long to respond. This might be due to slow internet or large file sizes.',
          });
        } else if (error.response?.status === 422) {
          console.error('Validation error:', error.response.data);
          toast.error('Validation failed', {
            description: getErrorMessage(error),
          });
        } else {
          toast.error('Failed to submit consent form', {
            description: getErrorMessage(error),
          });
        }
      } else {
        toast.error('Failed to submit consent form', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
      console.log('=== SUBMISSION PROCESS ENDED ===');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Floating icons on success screen */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {floatingIcons.map(({ Icon, x, y, size, delay, duration, rotate, color }, i) => (
            <motion.div key={i} className="absolute" style={{ left: x, top: y }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, y: [0, -18, 0, 12, 0], rotate: [rotate, rotate + 10, rotate - 5, rotate] }}
              transition={{ opacity: { delay, duration: 0.6 }, scale: { delay, duration: 0.6 }, y: { delay, duration, repeat: Infinity, ease: "easeInOut" }, rotate: { delay, duration: duration * 1.2, repeat: Infinity, ease: "easeInOut" } }}
            >
              <Icon size={size} strokeWidth={1.2} className={`${color} drop-shadow-lg opacity-40`} />
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-green-100 border-4 border-green-400 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Form Submitted!</h1>
          <p className="text-muted-foreground mb-2">
            Thank you for filling out the consent form. Our team will review your details and get in touch with you shortly.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            For any queries, contact us at{" "}
            <a href="mailto:the.explorerz.online@gmail.com" className="text-primary font-medium hover:underline">
              the.explorerz.online@gmail.com
            </a>
          </p>
          <Link to="/">
            <Button className="rounded-xl px-8 h-12">Back to Home</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">

      {/* ── Floating icons ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {floatingIcons.map(({ Icon, x, y, size, delay, duration, rotate, color }, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1, scale: 1,
              y: [0, -18, 0, 12, 0],
              rotate: [rotate, rotate + 10, rotate - 5, rotate],
            }}
            transition={{
              opacity: { delay, duration: 0.6 },
              scale:   { delay, duration: 0.6 },
              y:       { delay, duration, repeat: Infinity, ease: "easeInOut" },
              rotate:  { delay, duration: duration * 1.2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <div className="relative">
              <Icon size={size} strokeWidth={1.2} className={`${color} drop-shadow-lg opacity-40`} />
              <div className={`absolute inset-0 ${color} blur-sm opacity-15 animate-pulse`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Ambient blobs ── */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none animate-pulse z-0" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <div className="relative z-10 bg-transparent border-b border-border/40 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/">
              <motion.img
                src="/logo.png"
                alt="The Explorerz"
                whileHover={{ scale: 1.05 }}
                className="h-16 w-auto mx-auto mb-4 drop-shadow-md"
              />
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">Yatri Consent & Registration Form</h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-muted-foreground text-sm max-w-xl mx-auto"
            >
              Please fill in all details carefully. This information will be used to process your booking and ensure a safe journey.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Section 1: Tour Details ── */}
          <Section title="Tour Details" icon={<MapPin className="w-5 h-5" />} delay={0.1}>
            <div className="space-y-2">
              <Label>Tour Package *</Label>
              {packagesLoading ? (
                <div className="h-11 rounded-xl border border-input bg-background flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading packages...</span>
                </div>
              ) : (
                <SelectField
                  value={tourPackage}
                  onChange={setTourPackage}
                  options={[...packages.map(p => p.title), "Other"]}
                  placeholder="Select a package"
                  required
                />
              )}
            </div>
          </Section>

          {/* ── Section 3: Traveller Details ── */}
          <Section title="Yatri Details" icon={<Users className="w-5 h-5" />} delay={0.2}>
            <div className="space-y-4">
              {travellers.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-border rounded-2xl p-4 bg-muted/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">
                      Yatri {i + 1} {i === 0 && <span className="text-xs text-primary font-normal">(Lead Traveler)</span>}
                    </span>
                    {travellers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTraveller(i)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        placeholder="As per ID proof"
                        value={t.name}
                        onChange={(e) => updateTraveller(i, "name", e.target.value)}
                        required
                        className={`h-10 rounded-xl text-sm ${validationErrors[`traveller_${i}_name`] ? 'border-red-500' : ''}`}
                      />
                      {validationErrors[`traveller_${i}_name`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_name`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Age *</Label>
                      <Input
                        type="number"
                        placeholder="Age"
                        min={1}
                        max={120}
                        value={t.age}
                        onChange={(e) => updateTraveller(i, "age", e.target.value)}
                        required
                        className={`h-10 rounded-xl text-sm ${validationErrors[`traveller_${i}_age`] ? 'border-red-500' : ''}`}
                      />
                      {validationErrors[`traveller_${i}_age`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_age`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Gender *</Label>
                      <SelectField
                        value={t.gender}
                        onChange={(v) => updateTraveller(i, "gender", v)}
                        options={["Male", "Female", "Other"]}
                        placeholder="Select"
                        required
                        small
                        error={validationErrors[`traveller_${i}_gender`]}
                      />
                      {validationErrors[`traveller_${i}_gender`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_gender`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ID Type *</Label>
                      <SelectField
                        value={t.idType}
                        onChange={(v) => {
                          updateTraveller(i, "idType", v);
                          // Clear ID number when type changes
                          updateTraveller(i, "idNumber", "");
                        }}
                        options={["Aadhaar", "Passport", "Voter ID", "Driving Licence", "PAN Card"]}
                        placeholder="Select ID"
                        required
                        small
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone Number *</Label>
                      <Input
                        type="tel"
                        placeholder="10-digit number"
                        maxLength={10}
                        value={t.phone}
                        onChange={(e) => updateTraveller(i, "phone", e.target.value.replace(/\D/g, ''))}
                        required
                        className={`h-10 rounded-xl text-sm ${validationErrors[`traveller_${i}_phone`] ? 'border-red-500' : ''}`}
                      />
                      {validationErrors[`traveller_${i}_phone`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_phone`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email Address *</Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={t.email}
                        onChange={(e) => updateTraveller(i, "email", e.target.value)}
                        required
                        className={`h-10 rounded-xl text-sm ${validationErrors[`traveller_${i}_email`] ? 'border-red-500' : ''}`}
                      />
                      {validationErrors[`traveller_${i}_email`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_email`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">
                        ID Number * 
                        <span className="text-muted-foreground font-normal ml-1">
                          ({getIdValidationMessage(t.idType)})
                        </span>
                      </Label>
                      <Input
                        placeholder={`Enter ${t.idType} number`}
                        value={t.idNumber}
                        onChange={(e) => {
                          const value = t.idType === 'Aadhaar' 
                            ? e.target.value.replace(/\D/g, '') 
                            : e.target.value.toUpperCase();
                          updateTraveller(i, "idNumber", value);
                        }}
                        required
                        maxLength={t.idType === 'Aadhaar' ? 12 : t.idType === 'Driving Licence' ? 15 : undefined}
                        className={`h-10 rounded-xl text-sm ${validationErrors[`traveller_${i}_idNumber`] ? 'border-red-500' : ''}`}
                      />
                      {validationErrors[`traveller_${i}_idNumber`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_idNumber`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Upload ID Proof * <span className="text-muted-foreground font-normal">(Image or PDF, max 5MB)</span></Label>
                      <IdProofUpload
                        file={t.idProof}
                        onChange={(f) => updateTraveller(i, "idProof", f)}
                        error={validationErrors[`traveller_${i}_idProof`]}
                      />
                      {validationErrors[`traveller_${i}_idProof`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_idProof`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Passport Size Photo * <span className="text-muted-foreground font-normal">(Image only, max 10MB)</span></Label>
                      <IdProofUpload
                        file={t.passportPhoto}
                        onChange={(f) => updateTraveller(i, "passportPhoto", f)}
                        accept="image/*"
                        maxSize={10}
                        error={validationErrors[`traveller_${i}_passportPhoto`]}
                      />
                      {validationErrors[`traveller_${i}_passportPhoto`] && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[`traveller_${i}_passportPhoto`]}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Address for Lead Traveler */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Complete Address (Lead Traveler)
                </h3>
                <div className="space-y-1">
                  <Textarea
                    placeholder="House/Flat No., Street, Area, City, State, PIN Code"
                    value={leadAddress}
                    onChange={(e) => {
                      setLeadAddress(e.target.value);
                      if (validationErrors.leadAddress) {
                        const newErrors = { ...validationErrors };
                        delete newErrors.leadAddress;
                        setValidationErrors(newErrors);
                      }
                    }}
                    required
                    rows={3}
                    className={`rounded-xl resize-none text-sm ${validationErrors.leadAddress ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.leadAddress && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.leadAddress}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Please provide complete address including city, state, and PIN code
                  </p>
                </div>
              </div>

            </div>
          </Section>

          {/* ── Section 4: Health & Emergency ── */}
          <Section title="Health & Emergency Contact" icon={<AlertCircle className="w-5 h-5" />} delay={0.25}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Contact Name *</Label>
                <Input
                  placeholder="Full name"
                  value={emergencyName}
                  onChange={(e) => {
                    setEmergencyName(e.target.value);
                    if (validationErrors.emergencyName) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.emergencyName;
                      setValidationErrors(newErrors);
                    }
                  }}
                  required
                  className={`h-11 rounded-xl ${validationErrors.emergencyName ? 'border-red-500' : ''}`}
                />
                {validationErrors.emergencyName && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.emergencyName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact Phone *</Label>
                <Input
                  type="tel"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={emergencyPhone}
                  onChange={(e) => {
                    setEmergencyPhone(e.target.value.replace(/\D/g, ''));
                    if (validationErrors.emergencyPhone) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.emergencyPhone;
                      setValidationErrors(newErrors);
                    }
                  }}
                  required
                  className={`h-11 rounded-xl ${validationErrors.emergencyPhone ? 'border-red-500' : ''}`}
                />
                {validationErrors.emergencyPhone && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.emergencyPhone}
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Relation to Traveller *</Label>
                <SelectField
                  value={emergencyRelation}
                  onChange={(v) => {
                    setEmergencyRelation(v);
                    if (validationErrors.emergencyRelation) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.emergencyRelation;
                      setValidationErrors(newErrors);
                    }
                  }}
                  options={["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]}
                  placeholder="Select relation"
                  required
                  error={validationErrors.emergencyRelation}
                />
                {validationErrors.emergencyRelation && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.emergencyRelation}
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* ── Section 5: Consent ── */}
          <Section title="Consent & Declaration" icon={<Shield className="w-5 h-5" />} delay={0.3}>
            <div className="space-y-5">

              {/* Physically fit */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Are you physically fit for trekking (Kedarnath & Tungnath)? *</p>
                <div className="flex gap-4">
                  {(["Yes", "No"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="physicallyFit"
                        value={v}
                        checked={physicallyFit === v}
                        onChange={() => setPhysicallyFit(v)}
                        className="accent-primary w-4 h-4"
                      />
                      <span className="text-sm text-foreground">{v}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Medical condition */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Do you have any medical condition? *</p>
                <div className="flex gap-4">
                  {(["Yes", "No"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="medicalCondition"
                        value={v}
                        checked={medicalCondition === v}
                        onChange={() => {
                          setMedicalCondition(v);
                          if (v === "No") {
                            setMedicalConditionDetails("");
                            setMedicalConditionSeverity("");
                          }
                        }}
                        className="accent-primary w-4 h-4"
                      />
                      <span className="text-sm text-foreground">{v}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional: Medical condition details */}
              {medicalCondition === "Yes" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 bg-amber-50 border border-amber-200 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-2 text-amber-800 mb-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">Please provide details about your medical condition</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Medical Condition Details *</Label>
                    <Textarea
                      placeholder="Please describe your medical condition, any medications you're taking, and any special care requirements..."
                      value={medicalConditionDetails}
                      onChange={(e) => setMedicalConditionDetails(e.target.value)}
                      required
                      rows={4}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Severity Level *</Label>
                    <SelectField
                      value={medicalConditionSeverity}
                      onChange={(v) => setMedicalConditionSeverity(v as "Mild" | "Moderate" | "Severe")}
                      options={["Mild", "Moderate", "Severe"]}
                      placeholder="Select severity level"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      • Mild: Manageable with minimal intervention<br/>
                      • Moderate: Requires regular medication/monitoring<br/>
                      • Severe: Requires constant care/supervision
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="h-px bg-border" />

              {/* All Agreement checkboxes in one section */}
              <div className="space-y-4 bg-muted/30 rounded-2xl p-5 border border-border">
                <p className="text-sm font-medium text-foreground">Please read and agree to all the following:</p>
                
                <ConsentItem checked={agreeRisk} onChange={setAgreeRisk}
                  label="I confirm that I am participating in this trip at my own risk and I am responsible for my health and belongings." />
                <ConsentItem checked={agreePermission} onChange={setAgreePermission}
                  label="I confirm that I have taken permission from my parents/guardian/family to join this trip." />
                <ConsentItem checked={agreeInstructions} onChange={setAgreeInstructions}
                  label="I agree to follow all instructions given by the organizers during the trip." />
                <ConsentItem checked={agreeAdventure} onChange={setAgreeAdventure}
                  label="I understand that adventure activities (water sports, bungee jumping, pony, helicopter, etc.) are optional and at my own cost and risk." />
                <ConsentItem checked={agreeEmergency} onChange={setAgreeEmergency}
                  label="In case of emergency, I authorize the organizer to arrange medical assistance at my cost." />
                
                <div className="h-px bg-border my-3" />
                
                <ConsentItem checked={termsChecked} onChange={setTermsChecked}
                  label="I accept the Terms & Conditions of The Explorerz and understand the booking policies, cancellation rules, and liability terms." />
                <ConsentItem checked={privacyChecked} onChange={setPrivacyChecked}
                  label="I accept the Privacy Policy and consent to the collection and processing of my personal data for travel arrangements and communication purposes." />
              </div>

            </div>
          </Section>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Button
              type="submit"
              disabled={isSubmitting || !allConsentsChecked}
              className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Processing... Please wait
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Submit Consent Form
                </span>
              )}
            </Button>
            {isSubmitting && uploadProgress && (
              <div className="text-center mt-3 space-y-2">
                <p className="text-sm text-primary font-medium animate-pulse">
                  {uploadProgress}
                </p>
                <p className="text-xs text-amber-600">
                  ⏳ This may take up to 2 minutes. Please don't close this page.
                </p>
              </div>
            )}
            {!isSubmitting && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                Your data is secure and will only be used for travel processing purposes.
              </p>
            )}
          </motion.div>

        </form>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 text-xs text-muted-foreground border-t border-border bg-background/80 backdrop-blur-sm">
        © {new Date().getFullYear()} The Explorerz. All rights reserved. &nbsp;|&nbsp;
        <a href="mailto:the.explorerz.online@gmail.com" className="hover:text-primary transition-colors">
          the.explorerz.online@gmail.com
        </a>
      </div>
    </div>
  );
}

// ── Reusable Section wrapper ──────────────────────────────────────────────────
function Section({ title, icon, children, delay }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.4 }}
      className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

// ── Reusable Select ───────────────────────────────────────────────────────────
function SelectField({ value, onChange, options, placeholder, required, small, error }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  small?: boolean;
  error?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${small ? "h-10 text-sm" : "h-11 text-sm"} ${error ? 'border-red-500' : 'border-input'}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ── ID Proof Upload ──────────────────────────────────────────────────────────
function IdProofUpload({ file, onChange, accept = "image/*,application/pdf", maxSize = 5, error: validationError }: {
  file: File | null;
  onChange: (f: File | null) => void;
  accept?: string;
  maxSize?: number;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");

  const handle = (f: File) => {
    if (f.size > maxSize * 1024 * 1024) { setError(`File must be under ${maxSize}MB`); return; }
    if (accept === "image/*" && !f.type.startsWith("image/")) { setError("Only image files allowed"); return; }
    if (accept !== "image/*" && !['image/jpeg','image/png','image/webp','application/pdf'].includes(f.type)) {
      setError("Only image or PDF allowed"); return;
    }
    setError("");
    onChange(f);
  };

  return (
    <div className="space-y-1">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer transition-all duration-200 ${
          drag ? "border-primary bg-primary/5" :
          file ? "border-green-500/50 bg-green-500/5" :
          validationError ? "border-red-500 bg-red-50" :
          "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-xs text-green-600 font-medium truncate max-w-[180px]">{file.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Upload className="w-4 h-4" />
            <span className="text-xs">Drag & drop or <span className="text-primary font-medium">browse</span></span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}
function ConsentItem({ checked, onChange, label }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <motion.div
        animate={{ scale: checked ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.2 }}
        className="mt-0.5 shrink-0"
        onClick={() => onChange(!checked)}
      >
        {checked
          ? <CheckCircle2 className="w-5 h-5 text-primary" />
          : <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        }
      </motion.div>
      <span
        className={`leading-relaxed transition-colors ${checked ? "text-foreground" : "text-muted-foreground"}`}
        onClick={() => onChange(!checked)}
      >
        {label}
      </span>
    </label>
  );
}
