import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, CheckCircle, Bell, FileText, MessageCircle, X, Globe, Settings } from "lucide-react";
import GsapReveal from "@/components/GsapReveal";
import MediCard from "@/components/MediCard";
import MediButton from "@/components/MediButton";
import NavBar from "@/components/NavBar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import TranslatableText from "@/components/TranslatableText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Mock data for initial medications
const initialMedications = [
  {
    id: 1,
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    time: "8:00 AM",
    taken: true,
    history: [
      {
        date: format(new Date(), 'yyyy-MM-dd'),
        taken: true,
        skipped: false
      }
    ],
  },
  {
    id: 2,
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    time: "1:00 PM",
    taken: false,
    history: [],
  },
  {
    id: 3,
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily",
    time: "9:00 PM",
    taken: false,
    history: [],
  }
];

// Helper function to get current time
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Context for medications
import { createContext, useContext } from "react";

// Define the medication type
export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
  history: {
    date: string; // Format: YYYY-MM-DD
    taken: boolean;
    skipped: boolean;
  }[];
}

interface MedicationContextType {
  medications: Medication[];
  addMedication: (medication: Omit<Medication, "id" | "taken">) => void;
  updateMedication: (id: number, medication: Partial<Medication>) => void;
}

export const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  
  const addMedication = (newMed: Omit<Medication, "id" | "taken">) => {
    const newMedication: Medication = {
      ...newMed,
      id: medications.length ? Math.max(...medications.map(m => m.id)) + 1 : 1,
      taken: false,
      history: [],
    };
    
    // Sort medications by time when adding new one
    const updatedMedications = [...medications, newMedication].sort((a, b) => {
      // Convert times to comparable format (24-hour)
      const getTimeValue = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      
      return getTimeValue(a.time) - getTimeValue(b.time);
    });
    
    setMedications(updatedMedications);
  };
  
  const updateMedication = (id: number, updatedMed: Partial<Medication>) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, ...updatedMed } : med
    ));
  };
  
  return (
    <MedicationContext.Provider value={{ medications, addMedication, updateMedication }}>
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedications = () => {
  const context = useContext(MedicationContext);
  if (context === undefined) {
    throw new Error("useMedications must be used within a MedicationProvider");
  }
  return context;
};

const Index = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(33);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [greeting, setGreeting] = useState("Good morning");
  const { medications, updateMedication } = useMedications();
  const { toast } = useToast();

  // Add state for skip confirmation dialog
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [medicationToSkip, setMedicationToSkip] = useState<number | null>(null);

  // Add state for take medication confirmation dialog
  const [takeDialogOpen, setTakeDialogOpen] = useState(false);
  const [medicationToTake, setMedicationToTake] = useState<number | null>(null);

  // Add state for history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Update greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Update progress whenever medications change
  useEffect(() => {
    const takenCount = medications.filter(med => med.taken).length;
    const newProgress = medications.length > 0 
      ? Math.round((takenCount / medications.length) * 100) 
      : 0;
    setProgress(newProgress);
  }, [medications]);

  // Navigation functions
  const goToScanner = () => navigate("/scanner");
  const goToSupport = () => navigate("/support");
  const goToReminders = () => navigate("/reminders");
  const goToTranslation = () => navigate("/translation");
  const goToServices = () => navigate("/services");

  // Updated take medication flow
  const handleTakeMedication = (id: number) => {
    setMedicationToTake(id);
    setTakeDialogOpen(true);
  };

  // Handle confirmation of take
  const confirmTake = () => {
    if (medicationToTake !== null) {
      const medication = medications.find(med => med.id === medicationToTake);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      updateMedication(medicationToTake, {
        taken: true,
        history: [
          ...(medication?.history || []),
          { date: today, taken: true, skipped: false }
        ]
      });
      setTakeDialogOpen(false);
      
      toast({
        title: "Medication Taken",
        description: `Great job! You've taken ${medication?.name}.`,
        variant: "default",
        className: "border-medical-teal",
        duration: 3000,
      });
    }
  };

  // Updated skip medication flow
  const handleSkipMedication = (id: number) => {
    setMedicationToSkip(id);
    setSkipDialogOpen(true);
  };

  // Handle confirmation of skip
  const confirmSkip = () => {
    if (medicationToSkip !== null) {
      const medication = medications.find(med => med.id === medicationToSkip);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      updateMedication(medicationToSkip, {
        taken: true,
        history: [
          ...(medication?.history || []),
          { date: today, taken: false, skipped: true }
        ]
      });
      setSkipDialogOpen(false);
      
      toast({
        title: "Medication Skipped",
        description: `${medication?.name} has been marked as skipped.`,
        variant: "default",
        duration: 3000,
      });
    }
  };

  // Function to handle history button click
  const handleHistoryClick = (medication: Medication) => {
    setSelectedMedication(medication);
    setHistoryDialogOpen(true);
  };

  // Function to check if medication was taken on a specific date
  const getMedicationStatus = (date: Date) => {
    if (!selectedMedication) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const historyEntry = selectedMedication.history.find(h => h.date === dateStr);
    
    if (!historyEntry) return "no-record";
    if (historyEntry.skipped) return "skipped";
    if (historyEntry.taken) return "taken";
    return "missed";
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <GsapReveal animation="fade" duration={0.8}>
        <header className="px-6 pt-8 pb-4">
          <h1 className="text-3xl font-bold text-foreground">
            <TranslatableText>{greeting}</TranslatableText>, <span className="text-medical-teal">James</span>
          </h1>
          <div className="flex items-center mt-2 text-muted-foreground">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>Monday, April 4</span>
            <span className="mx-2">•</span>
            <Clock className="w-4 h-4 mr-2" />
            <span>{currentTime}</span>
          </div>
        </header>
      </GsapReveal>

      {/* Today's Progress */}
      <GsapReveal animation="slide" delay={0.2} duration={0.8} className="px-6 py-4">
        <MediCard gradient className="mb-6">
          <h2 className="font-semibold text-lg mb-2"><TranslatableText>Today's Progress</TranslatableText></h2>
          <Progress value={progress} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span><TranslatableText>{`${progress}% complete`}</TranslatableText></span>
            <span><TranslatableText>{`${medications.length} medications today`}</TranslatableText></span>
          </div>
        </MediCard>
      </GsapReveal>

      {/* Upcoming Medications */}
      <section className="px-6 py-2">
        <div className="flex justify-between items-center mb-4 ">
          <h2 className="font-semibold text-xl"><TranslatableText>Upcoming Medications</TranslatableText></h2>
          <button className="text-medical-teal text-sm font-medium"><TranslatableText>View All</TranslatableText></button>
        </div>
        
        {medications.length === 0 ? (
          <MediCard className="mb-4 text-center py-7 text-muted-foreground">
            <TranslatableText>No medications scheduled. Click the + button to add one.</TranslatableText>
          </MediCard>
        ) : (
          medications.map((med, index) => (
            !med.taken && (  // Only show medications that haven't been taken
              <GsapReveal key={med.id} animation="scale" delay={0.3 + (index * 0.1)} duration={0.6}>
                <MediCard 
                  neumorphic={!med.taken}
                  important={!med.taken && med.time === "1:00 PM"}
                  className="mb-4"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-blue-100 text-blue-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{med.name}</h3>
                          <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                        </div>
                        <div className="text-sm font-medium">
                          {med.time}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <MediButton 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleSkipMedication(med.id)}
                    >
                      <TranslatableText>Skip</TranslatableText>
                    </MediButton>
                    <MediButton 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleHistoryClick(med)}
                    >
                      <TranslatableText>History</TranslatableText>
                    </MediButton>
                    <MediButton 
                      variant="default" 
                      size="sm" 
                      className="flex-1 bg-medical-teal hover:bg-medical-teal/90"
                      onClick={() => handleTakeMedication(med.id)}
                    >
                      <TranslatableText>Take Now</TranslatableText>
                    </MediButton>
                  </div>
                </MediCard>
              </GsapReveal>
            )
          ))
        )}
      </section>

      {/* Quick Actions */}
      <section className="px-6 py-4">
        <h2 className="font-semibold text-xl mb-4"><TranslatableText>Quick Actions</TranslatableText></h2>
        <div className="grid grid-cols-3 gap-4">
          <GsapReveal animation="slide" delay={0.5} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToScanner}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-purple/10 text-medical-purple flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-medium"><TranslatableText>Scan Prescription</TranslatableText></h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={0.6} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToReminders}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-teal/10 text-medical-teal flex items-center justify-center mb-2">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-medium"><TranslatableText>Set Reminders</TranslatableText></h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={0.7} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToSupport}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-blue/10 text-medical-blue flex items-center justify-center mb-2">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="font-medium"><TranslatableText>Ask MediBot</TranslatableText></h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={0.8} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToServices}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-teal/10 text-medical-teal flex items-center justify-center mb-2">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="font-medium"><TranslatableText>Services</TranslatableText></h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={0.9} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToTranslation}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-purple/10 text-medical-purple flex items-center justify-center mb-2">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="font-medium"><TranslatableText>Translate</TranslatableText></h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={1.0} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-pink/10 text-medical-pink flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold">SOS</span>
                </div>
                <h3 className="font-medium"><TranslatableText>Emergency</TranslatableText></h3>
              </div>
            </MediCard>
          </GsapReveal>
        </div>
      </section>

      {/* Skip Confirmation Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-medical-teal">
              <TranslatableText>Skip Medication?</TranslatableText>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              <TranslatableText>Are you sure you want to skip this medication? This action will mark it as taken and remove it from the upcoming list.</TranslatableText>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
            <MediButton
              variant="outline"
              onClick={() => setSkipDialogOpen(false)}
            >
              <TranslatableText>Cancel</TranslatableText>
            </MediButton>
            <MediButton
              variant="default"
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmSkip}
            >
              <TranslatableText>Confirm Skip</TranslatableText>
            </MediButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Take Confirmation Dialog */}
      <Dialog open={takeDialogOpen} onOpenChange={setTakeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-medical-teal">
              <TranslatableText>Take Medication?</TranslatableText>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {medicationToTake && (
                <>
                  <TranslatableText>Are you ready to take</TranslatableText>{' '}
                  <span className="font-medium text-medical-teal">
                    {medications.find(med => med.id === medicationToTake)?.name}
                  </span>
                  ? <TranslatableText>This will mark it as taken and remove it from the upcoming list.</TranslatableText>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
            <MediButton
              variant="outline"
              onClick={() => setTakeDialogOpen(false)}
            >
              <TranslatableText>Not Yet</TranslatableText>
            </MediButton>
            <MediButton
              variant="default"
              className="bg-medical-teal hover:bg-medical-teal/90"
              onClick={confirmTake}
            >
              <TranslatableText>Yes, Take Now</TranslatableText>
            </MediButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[380px] p-0">
          <div className="p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-medical-teal">
                <TranslatableText>Medication History</TranslatableText>
              </DialogTitle>
              {selectedMedication && (
                <div className="mt-2">
                  <p className="text-xl font-semibold text-foreground">{selectedMedication.name}</p>
                  <p className="text-base text-muted-foreground">{selectedMedication.dosage} • {selectedMedication.frequency}</p>
                </div>
              )}
            </DialogHeader>
            
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border w-full"
                modifiers={{
                  taken: (date) => getMedicationStatus(date) === "taken",
                  skipped: (date) => getMedicationStatus(date) === "skipped",
                  missed: (date) => getMedicationStatus(date) === "missed",
                }}
                modifiersStyles={{
                  taken: {
                    backgroundColor: "rgb(134 239 172)", // green-200
                    color: "rgb(21 128 61)", // green-700
                  },
                  skipped: {
                    backgroundColor: "rgb(254 202 202)", // red-200
                    color: "rgb(185 28 28)", // red-700
                  },
                  missed: {
                    backgroundColor: "rgb(254 215 170)", // orange-200
                    color: "rgb(194 65 12)", // orange-700
                  },
                }}
              />

              <div className="flex justify-center gap-6 text-sm mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#4ADE80]"></div>
                  <span><TranslatableText>Taken</TranslatableText></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF9B9B]"></div>
                  <span><TranslatableText>Skipped</TranslatableText></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFB572]"></div>
                  <span><TranslatableText>Missed</TranslatableText></span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-4">
            <button
              onClick={() => setHistoryDialogOpen(false)}
              className="w-full py-4 text-center text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <TranslatableText>Close</TranslatableText>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation Bar */}
      <NavBar />
    </div>
  );
};

// Wrap the Index component with the MedicationProvider
const IndexWithMedicationProvider = () => (
  <MedicationProvider>
    <Index />
  </MedicationProvider>
);

export default IndexWithMedicationProvider;
