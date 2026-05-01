import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setGetTokenFunction } from "@/lib/api";
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import LandingPage from "./pages/LandingPage";
import PlanPage from "./pages/PlanPage";
import ResultsPage from "./pages/ResultsPage";
import SavedTripsPage from "./pages/SavedTripsPage";
import PackagesPage from "./pages/PackagesPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import SharedTripPage from "./pages/SharedTripPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to initialize API token function
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token function for API calls
    setGetTokenFunction(getToken);
  }, [getToken]);

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInitializer>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/plan" element={<PlanPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/packages" element={<PackagesPage />} />
                <Route path="/packages/:id" element={<PackageDetailPage />} />
                <Route path="/trips/shared/:token" element={<SharedTripPage />} />

                {/* Protected routes */}
                <Route path="/saved" element={
                  <ProtectedRoute><SavedTripsPage /></ProtectedRoute>
                } />
                <Route path="/bookings" element={
                  <ProtectedRoute><MyBookingsPage /></ProtectedRoute>
                } />
                <Route path="/book/:packageId" element={
                  <ProtectedRoute><BookingPage /></ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute><AccountPage /></ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRoles={["ADMIN", "SUPERADMIN"]}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppInitializer>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
