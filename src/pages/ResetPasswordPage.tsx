import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Plane, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One special character (@$!%*?&)", test: (p: string) => /[@$!%*?&]/.test(p) },
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordStrength = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
  const isPasswordValid = passwordStrength === PASSWORD_REQUIREMENTS.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isPasswordValid) return;

    setIsSubmitting(true);
    try {
      await api.post("/account/reset-password", { token, password });
      setDone(true);
      toast({ title: "Password Reset! ✅", description: "You can now sign in with your new password." });
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
            <p className="text-muted-foreground mb-4">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password">
              <Button>Request New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <Plane className="w-8 h-8 text-primary" />
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              DeshYatra
            </span>
          </Link>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              {done ? "Password Reset! ✅" : "Set New Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {done ? "Redirecting to login..." : "Choose a strong password for your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-green-500" />
                </div>
                <Link to="/login">
                  <Button>Go to Login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {password && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength
                                ? passwordStrength <= 2 ? "bg-red-500"
                                : passwordStrength <= 4 ? "bg-yellow-500"
                                : "bg-green-500"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="space-y-1">
                        {PASSWORD_REQUIREMENTS.map((req) => (
                          <div key={req.label} className="flex items-center gap-2 text-xs">
                            <CheckCircle2
                              className={`w-3 h-3 ${
                                req.test(password)
                                  ? "text-green-500" : "text-muted-foreground/40"
                              }`}
                            />
                            <span className={
                              req.test(password)
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isSubmitting || !isPasswordValid}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Resetting...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
