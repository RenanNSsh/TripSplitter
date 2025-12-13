import { useEffect } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { logActivity, startPresenceHeartbeat } from "./lib/telemetry";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const stop = startPresenceHeartbeat();

    try {
      if (sessionStorage.getItem("trip-splitter-session-started") !== "1") {
        sessionStorage.setItem("trip-splitter-session-started", "1");
        void logActivity({ action: "session_start", entity: "session" });
      }
    } catch {
      void 0;
    }

    return () => {
      stop();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
