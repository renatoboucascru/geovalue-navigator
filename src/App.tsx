import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Screener from "./pages/Screener";
import SupplyChain from "./pages/SupplyChain";
import Portfolio from "./pages/Portfolio";
import Settings from "./pages/Settings";
import Signals from "./pages/Signals";
import PrivateBets from "./pages/PrivateBets";
import WhaleTracker from "./pages/WhaleTracker";
import PaperTrading from "./pages/PaperTrading";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/screener" element={<AppLayout><Screener /></AppLayout>} />
            <Route path="/supply-chain" element={<AppLayout><SupplyChain /></AppLayout>} />
            <Route path="/portfolio" element={<AppLayout><Portfolio /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="/signals" element={<AppLayout><Signals /></AppLayout>} />
            <Route path="/signals/private-bets" element={<AppLayout><PrivateBets /></AppLayout>} />
            <Route path="/signals/whale-tracker" element={<AppLayout><WhaleTracker /></AppLayout>} />
            <Route path="/paper-trading" element={<AppLayout><PaperTrading /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
