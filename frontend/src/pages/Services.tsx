import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, MessageCircle, Languages, ScanLine, Brain, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediCard from "@/components/MediCard";
import GsapReveal from "@/components/GsapReveal";
import { cn } from "@/lib/utils";
import TranslatableText from "@/components/TranslatableText";
import { useChatContext } from "@/components/MedicalChatbot";
import Support from "./Support"; // Import the Support component (chatbot)

const Services = () => {
  const navigate = useNavigate();
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Service card data
  const services = [
    {
      id: "translation",
      title: "Translation",
      description: "Translate medication information, reminders, and app content into multiple languages.",
      icon: <Languages className="w-12 h-12 text-medical-teal" />,
      action: () => navigate('/translation')
    },
    {
      id: "ocr",
      title: "Prescription Scanner",
      description: "Scan your prescription or medication package to extract important information.",
      icon: <ScanLine className="w-12 h-12 text-medical-teal" />,
      action: () => navigate('/scan')
    },
    {
      id: "chatbot",
      title: "MediBot Assistant",
      description: "Ask medical and medication questions to our AI-powered assistant.",
      icon: <MessageCircle className="w-12 h-12 text-medical-teal" />,
      action: () => setShowChatbot(true)
    },
    {
      id: "medication",
      title: "Medication Database",
      description: "Access detailed information about medications, side effects and interactions.",
      icon: <Pill className="w-12 h-12 text-medical-teal" />,
      action: () => navigate('/medications')
    }
  ];
  
  const goBack = () => navigate(-1);
  
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <header className="flex justify-between items-center p-4 border-b flex-shrink-0">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 transform -rotate-90" />
          <span className="ml-2"><TranslatableText>Back</TranslatableText></span>
        </Button>
        <h1 className="text-xl font-bold"><TranslatableText>Integrated Services</TranslatableText></h1>
        <div className="w-10"></div> {/* For layout balance */}
      </header>
      
      {showChatbot ? (
        // Show the Support page content (chatbot) if showChatbot is true
        <Support />
      ) : (
        // Show the services grid
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <GsapReveal delay={0.1}>
            <h2 className="text-lg font-medium mb-2"><TranslatableText>Available Services</TranslatableText></h2>
            <p className="text-muted-foreground mb-6">
              <TranslatableText>Select a service to access additional features</TranslatableText>
            </p>
          </GsapReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <GsapReveal key={service.id} delay={0.1 * (index + 1)}>
                <MediCard 
                  className="p-6 cursor-pointer transition-all hover:shadow-lg"
                  onClick={service.action}
                >
                  <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                    <div className="rounded-full bg-medical-teal/10 p-4">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">
                        <TranslatableText>{service.title}</TranslatableText>
                      </h3>
                      <p className="text-muted-foreground">
                        <TranslatableText>{service.description}</TranslatableText>
                      </p>
                      <Button variant="ghost" className="mt-4 text-medical-teal">
                        <TranslatableText>Open</TranslatableText>
                      </Button>
                    </div>
                  </div>
                </MediCard>
              </GsapReveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Services; 