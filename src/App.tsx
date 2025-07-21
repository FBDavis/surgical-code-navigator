import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TutorialProvider } from "./components/TutorialManager";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import { Subscription } from "./pages/Subscription";
import { GamificationHub } from "./components/GamificationHub";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...');
  console.log('Index component:', Index);
  console.log('Auth component:', Auth);
  console.log('Messages component:', Messages);
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <TutorialProvider>
              <Toaster />
              <Sonner />
              <HashRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/new-case" element={<Index />} />
                  <Route path="/search-codes" element={<Index />} />
                  <Route path="/view-cases" element={<Index />} />
                  <Route path="/camera-schedule" element={<Index />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/resident-tracker" element={<Index />} />
                  <Route path="/settings" element={<Index />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/gamification" element={<GamificationHub />} />
                  <Route path="/auth" element={<Auth />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </HashRouter>
            </TutorialProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App component error:', error);
    return <div>Application Error: {error.message}</div>;
  }
};

export default App;
