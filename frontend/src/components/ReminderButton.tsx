import { useState } from "react";
import { Plus, X, CheckCircle, Clock, Bell, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import MediCard from "@/components/MediCard";
import { useToast } from "@/components/ui/use-toast";
import TranslatableText from "@/components/TranslatableText";
import GsapReveal from "@/components/GsapReveal";
import { reminderApi } from "@/lib/api";

const DAYS_OF_WEEK = [
  { id: "Mon", label: "M" },
  { id: "Tue", label: "T" },
  { id: "Wed", label: "W" },
  { id: "Thu", label: "T" },
  { id: "Fri", label: "F" },
  { id: "Sat", label: "S" },
  { id: "Sun", label: "S" },
];

const ReminderButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [time, setTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [appNotification, setAppNotification] = useState(true);
  const [whatsappAlert, setWhatsappAlert] = useState(false);
  const [caregiverAlert, setCaregiverAlert] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const mapDaysToBackendFormat = (days: string[]) => {
    // No need for mapping since we're already using the full day names as IDs
    return days;
  };

  const handleSaveReminder = async () => {
    if (!medicationName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a medication name",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    if (whatsappAlert && !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please enter a phone number for WhatsApp alerts",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare data for backend - match the schema in reminder.model.js
      const reminderData = {
        medicationName: medicationName,
        daysOfWeek: selectedDays,
        time: time,
        appNotification: appNotification,
        whatsappAlert: whatsappAlert,
        phoneNumber: whatsappAlert ? phoneNumber : "",
        dosage: "As prescribed", // Default value
        instructions: "",
      };
      
      // Save to backend
      await reminderApi.createReminder(reminderData);

      toast({
        title: "Success",
        description: "Reminder added successfully" +
          (whatsappAlert ? " with WhatsApp notifications" : ""),
        className: "bg-medical-teal text-white",
      });
      
      // Reset form and close dialog
      setMedicationName("");
      setTime("08:00");
      setSelectedDays(["Mon", "Wed", "Fri"]);
      setPhoneNumber("");
      setWhatsappAlert(false);
      setCaregiverAlert(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save reminder:", error);
      toast({
        title: "Error",
        description: "Failed to save reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Add Button */}
      <Button
        onClick={toggleDialog}
        className="fixed bottom-24 right-8 rounded-full w-14 h-14 shadow-lg bg-medical-teal hover:bg-medical-teal/90 transition-all duration-300 z-40"
        aria-label="Add New Reminder"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Reminder Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GsapReveal animation="scale">
            <MediCard className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  <TranslatableText>Add New Reminder</TranslatableText>
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={toggleDialog}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Medication Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <TranslatableText>Medication Name</TranslatableText>
                  </label>
                  <Input 
                    placeholder="Enter medication name" 
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                  />
                </div>
                
                {/* Time */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <TranslatableText>Time</TranslatableText>
                  </label>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
                    <Input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                {/* Days */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <TranslatableText>Days</TranslatableText>
                  </label>
                  <div className="flex justify-between space-x-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                          selectedDays.includes(day.id)
                            ? "bg-medical-teal text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Alert Options */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    <TranslatableText>Alert Options</TranslatableText>
                  </label>
                  
                  {/* App Notification */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-medical-teal" />
                      <span className="text-sm font-medium">
                        <TranslatableText>App Notification</TranslatableText>
                      </span>
                    </div>
                    <Switch 
                      checked={appNotification} 
                      onCheckedChange={setAppNotification} 
                      className="data-[state=checked]:bg-medical-teal"
                    />
                  </div>
                  
                  {/* WhatsApp Alert */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        className="w-5 h-5 mr-2 text-green-600 fill-current"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="text-sm font-medium">
                        <TranslatableText>WhatsApp Alert</TranslatableText>
                      </span>
                    </div>
                    <Switch 
                      checked={whatsappAlert} 
                      onCheckedChange={setWhatsappAlert} 
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                  
                  {/* Phone Number Input (conditionally shown) */}
                  {whatsappAlert && (
                    <div className="mt-2 mb-3 pl-7">
                      <Input 
                        type="tel"
                        placeholder="+1 (123) 456-7890" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        <TranslatableText>Enter phone number with country code</TranslatableText>
                      </p>
                    </div>
                  )}
                  
                  {/* Caregiver Alert */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-5 h-5 mr-2 text-blue-600"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="text-sm font-medium">
                        <TranslatableText>Caregiver Alert</TranslatableText>
                      </span>
                    </div>
                    <Switch 
                      checked={caregiverAlert} 
                      onCheckedChange={setCaregiverAlert} 
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={toggleDialog}
                    disabled={isLoading}
                  >
                    <TranslatableText>Cancel</TranslatableText>
                  </Button>
                  <Button 
                    className="flex-1 bg-medical-teal hover:bg-medical-teal/90"
                    onClick={handleSaveReminder}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    <TranslatableText>Save Reminder</TranslatableText>
                  </Button>
                </div>
              </div>
            </MediCard>
          </GsapReveal>
        </div>
      )}
    </>
  );
};

export default ReminderButton; 