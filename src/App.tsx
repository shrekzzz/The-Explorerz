import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "./components/SplashScreen";
import LoadingScreen from "./components/LoadingScreen";
import LandingPage from "./pages/LandingPage";
import PlanPage from "./pages/PlanPage";
import ResultsPage from "./pages/ResultsPage";
import SavedTripsPage from "./pages/SavedTripsPage";
import PackagesPage from "./pages/PackagesPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import ConsentFormPage from "./pages/ConsentFormPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasSeenLoading = sessionStorage.getItem('loading_shown');
    if (hasSeenLoading) {
      setIsLoading(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem('loading_shown', 'true');
    setIsLoading(false);
    
    // Commented out splash screen for now
    // const hasSeenSplash = sessionStorage.getItem('splash_shown');
    // if (!hasSeenSplash) {
    //   setShowSplash(true);
    // }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingScreen key="loading" onLoadingComplete={handleLoadingComplete} />
            ) : (
              <BrowserRouter key="app">
                <ScrollToTop />
                {/* Splash screen commented out for now */}
                {/* {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />} */}
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/plan" element={<PlanPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/saved" element={<SavedTripsPage />} />
                  <Route path="/packages" element={<PackagesPage />} />
                  <Route path="/packages/:id" element={<PackageDetailPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRoles={["ADMIN", "STAFF", "SUPERADMIN"]}>
                      <AdminPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/consent-form" element={<ConsentFormPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            )}
          </AnimatePresence>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
