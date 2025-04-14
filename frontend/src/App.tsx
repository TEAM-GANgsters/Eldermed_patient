import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MedicalChatbot from "./components/MedicalChatbot";
import ReminderButton from "./components/ReminderButton";
import TranslationProvider from "./components/TranslationProvider";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Index from "./pages/Index";
import Scanner from "./pages/Scanner";
import Support from "./pages/Support";
import Reminders from "./pages/Reminders";
import Schedule from "./pages/Schedule";
import Translation from "./pages/Translation";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TranslationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageSwitcher />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/support" element={<Support />} />
            <Route path="/services" element={<Services />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/translation" element={<Translation />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Medical Chatbot will appear on all pages */}
          <MedicalChatbot />
          {/* Quick Reminder button will appear on all pages */}
          <ReminderButton />
        </BrowserRouter>
      </TooltipProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
