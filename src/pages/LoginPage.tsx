import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, LogIn, Plane, Mountain, MapPin, Hotel,
  TrainFront, TreePine, Waves, Building2, CloudSun, Compass, Sparkles, Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const floatingIcons = [
  { Icon: Plane,      x: "6%",  y: "12%", size: 40, delay: 0,   duration: 6,   rotate: -15, color: "text-primary",    glow: "shadow-primary/40" },
  { Icon: Mountain,   x: "82%", y: "8%",  size: 48, delay: 0.4, duration: 7,   rotate: 10,  color: "text-emerald-500", glow: "shadow-emerald-500/40" },
  { Icon: TrainFront, x: "78%", y: "72%", size: 38, delay: 0.9, duration: 5.5, rotate: -8,  color: "text-amber-500",  glow: "shadow-amber-500/40" },
  { Icon: Hotel,      x: "10%", y: "68%", size: 34, delay: 1.4, duration: 6.5, rotate: 12,  color: "text-violet-500", glow: "shadow-violet-500/40" },
  { Icon: TreePine,   x: "88%", y: "42%", size: 32, delay: 0.7, duration: 5,   rotate: -5,  color: "text-green-500",  glow: "shadow-green-500/40" },
  { Icon: Waves,      x: "4%",  y: "42%", size: 36, delay: 1.9, duration: 7.5, rotate: 8,   color: "text-cyan-500",   glow: "shadow-cyan-500/40" },
  { Icon: Building2,  x: "48%", y: "78%", size: 30, delay: 1.1, duration: 6,   rotate: -10, color: "text-rose-500",   glow: "shadow-rose-500/40" },
  { Icon: CloudSun,   x: "58%", y: "6%",  size: 44, delay: 0.2, duration: 8,   rotate: 5,   color: "text-orange-400", glow: "shadow-orange-400/40" },
  { Icon: MapPin,     x: "28%", y: "82%", size: 28, delay: 1.7, duration: 5.5, rotate: -12, color: "text-red-500",    glow: "shadow-red-500/40" },
  { Icon: Compass,    x: "38%", y: "4%",  size: 26, delay: 2.3, duration: 6,   rotate: 20,  color: "text-sky-500",    glow: "shadow-sky-500/40" },
];

export default function LoginPage() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, user, isAuthenticated, logout }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { toast }  = useToast();
  const from       = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      toast({ title: "Welcome back!", description: "You've been logged in successfully." });
      const role = (loggedInUser as any)?.role;
      if (role === "SUPERADMIN" || role === "ADMIN" || role === "STAFF") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from === "/login" ? "/" : from, { replace: true });
      }
    } catch (error) {
      toast({ title: "Login Failed", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out", description: "You have been logged out successfully." });
    } catch (error) {
      toast({ title: "Logout Failed", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  // If already authenticated, show dashboard access
  if (isAuthenticated && user) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'STAFF';
    const isSuperAdmin = user.role === 'SUPERADMIN';
    const dashboardPath = (isSuperAdmin || isAdmin) ? '/admin' : '/';

    return (
      <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        {/* ── Left: Logo panel ── */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
          {/* Floating icons */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
                  <Icon size={size} strokeWidth={1.2} className={`${color} drop-shadow-lg`} />
                  <div className={`absolute inset-0 ${color} blur-sm opacity-25 animate-pulse`} />
                </div>
              </motion.div>
            ))}
          </div>
          {/* Ambient blobs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <Link to="/">
              <motion.img
                src="/logo.png"
                alt="DeshYatra"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="h-32 w-auto drop-shadow-2xl"
              />
            </Link>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-base"
            >
              Welcome back, {user.firstName} 🌏
            </motion.p>
          </motion.div>
        </div>

        {/* ── Right: Already logged in panel ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
          {/* Floating icons — mobile only */}
          <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden">
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
                  <Icon size={size} strokeWidth={1.2} className={`${color} drop-shadow-lg`} />
                  <div className={`absolute inset-0 ${color} blur-sm opacity-25 animate-pulse`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Logo — mobile only */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="lg:hidden text-center mb-8"
            >
              <Link to="/" className="inline-flex items-center justify-center">
                <motion.img
                  src="/logo.png"
                  alt="DeshYatra"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="h-14 w-auto drop-shadow-md"
                />
              </Link>
            </motion.div>

            {/* Already logged in card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-2xl shadow-primary/5"
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6 text-center"
              >
                <h1 className="font-display text-2xl font-bold text-foreground">Already Signed In</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Welcome back, {user.firstName} {user.lastName}
                </p>
                <p className="text-muted-foreground text-xs mt-1 capitalize">
                  Role: {user.role.toLowerCase()}
                </p>
              </motion.div>

              <div className="space-y-3">
                {/* Go to Dashboard Button */}
                {(isAdmin || isSuperAdmin) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Button
                      onClick={() => navigate(dashboardPath)}
                      className="w-full h-12 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                      asChild
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogIn className="w-4 h-4" />
                        Go to Admin Dashboard
                      </motion.button>
                    </Button>
                  </motion.div>
                )}

                {/* Continue to Home */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="w-full h-12 rounded-xl text-base font-semibold gap-2 transition-all"
                    asChild
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Continue to Home
                    </motion.button>
                  </Button>
                </motion.div>

                {/* Logout */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full h-12 rounded-xl text-base font-semibold gap-2 text-muted-foreground hover:text-foreground transition-all"
                    asChild
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Sign Out
                    </motion.button>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Back link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-center mt-5"
            >
              <Link to="/" className="text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Back to home
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  } else {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">

      {/* ── Left: Logo panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">

        {/* Floating icons — left side only */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
                <Icon size={size} strokeWidth={1.2} className={`${color} drop-shadow-lg`} />
                <div className={`absolute inset-0 ${color} blur-sm opacity-25 animate-pulse`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ambient blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <Link to="/">
            <motion.img
              src="/logo.png"
              alt="DeshYatra"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-32 w-auto drop-shadow-2xl"
            />
          </Link>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-base"
          >
            Welcome back, explorer 🌏
          </motion.p>
        </motion.div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">

        {/* Floating icons — mobile only (full screen) */}
        <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden">
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
                <Icon size={size} strokeWidth={1.2} className={`${color} drop-shadow-lg`} />
                <div className={`absolute inset-0 ${color} blur-sm opacity-25 animate-pulse`} />
              </div>
            </motion.div>
          ))}
        </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo — mobile only */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="lg:hidden text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center justify-center">
            <motion.img
              src="/logo.png"
              alt="DeshYatra"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-14 w-auto drop-shadow-md"
            />
          </Link>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-2xl shadow-primary/5"
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h1 className="font-display text-2xl font-bold text-foreground">Sign in</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter your credentials to continue</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <motion.div
                animate={{
                  boxShadow: focusedField === "email"
                    ? "0 0 0 3px hsl(var(--primary) / 0.15)"
                    : "0 0 0 0px transparent",
                }}
                transition={{ duration: 0.2 }}
                className="relative rounded-xl"
              >
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="email"
                  className="h-12 pl-10 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30 transition-all"
                />
              </motion.div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <motion.div
                animate={{
                  boxShadow: focusedField === "password"
                    ? "0 0 0 3px hsl(var(--primary) / 0.15)"
                    : "0 0 0 0px transparent",
                }}
                transition={{ duration: 0.2 }}
                className="relative rounded-xl"
              >
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30 pr-12 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showPassword ? "off" : "on"}
                      initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </motion.div>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                asChild
              >
                <motion.button
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Signing in...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </Button>
            </motion.div>
          </form>

          {/* Admin-only login — no public registration */}
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-center mt-5"
        >
          <Link to="/" className="text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Back to home
          </Link>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
}
}
