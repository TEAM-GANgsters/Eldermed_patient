import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowUp,
  User,
  FileText,
  Calendar,
  Heart,
  Activity,
  PlusCircle,
  Weight,
  Ruler,
  Clock,
  Edit2,
  Phone,
  Mail,
  Home,
  Users,
  ChevronRight,
  PillIcon,
  X,
  LogOut,
  Bell,
  ClipboardList,
  PhoneOutgoing,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import GsapReveal from "@/components/GsapReveal";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { reminderApi } from "@/lib/api";
import { useTranslation } from "@/components/TranslationProvider";
import TranslatableText from "@/components/TranslatableText";

// Mock data for the user profile
const userProfile = {
  name: "Margaret Johnson",
  age: 72,
  gender: "Female",
  birthDate: "1951-06-15",
  phone: "(555) 123-4567",
  email: "margaret.j@example.com",
  address: "123 Oak Lane, Westfield, CA 91234",
  profilePicture: "/profile-image.jpg",
  emergencyContact: {
    name: "David Johnson",
    relationship: "Son",
    phone: "(555) 987-6543",
  },
  vitals: {
    height: "5'4\"",
    weight: "142 lbs",
    bloodType: "O+",
    bloodPressure: "128/82",
    heartRate: "72 bpm",
    temperature: "98.6°F",
    lastUpdated: "2023-11-10",
  },
  allergies: [
    "Penicillin",
    "Sulfa drugs",
    "Peanuts",
  ],
  conditions: [
    "Hypertension",
    "Type 2 Diabetes",
    "Osteoarthritis",
  ],
  preferences: {
    whatsappEnabled: false,
    phoneNumber: "",
    emailNotifications: true,
    smsNotifications: false,
    language: "English",
  }
};

// Mock data for medical reports
const medicalReports = [
  {
    id: 1,
    title: "Annual Physical Examination",
    date: "2023-10-15",
    doctor: "Dr. Emily Chen",
    facility: "Westfield Medical Center",
    type: "Checkup",
    summary: "Overall health is stable. Blood pressure slightly elevated. Continue with current medication regimen.",
    documents: [
      { id: 1, name: "Physical Exam Report.pdf", size: "1.2 MB" },
      { id: 2, name: "Blood Work Results.pdf", size: "845 KB" },
    ],
  },
  {
    id: 2,
    title: "Cardiology Consultation",
    date: "2023-09-05",
    doctor: "Dr. Robert Williams",
    facility: "Heart Care Specialists",
    type: "Specialist",
    summary: "Echocardiogram shows normal heart function. Continue with current heart medication. Follow up in 6 months.",
    documents: [
      { id: 3, name: "Cardiology Report.pdf", size: "1.5 MB" },
      { id: 4, name: "Echocardiogram Results.pdf", size: "3.2 MB" },
    ],
  },
  {
    id: 3,
    title: "Diabetes Management",
    date: "2023-08-12",
    doctor: "Dr. Sarah Johnson",
    facility: "Diabetes Care Clinic",
    type: "Specialist",
    summary: "A1C levels at 6.8%, which is an improvement. Continue with diet and exercise plan. Adjusted medication dosage.",
    documents: [
      { id: 5, name: "Diabetes Check Report.pdf", size: "980 KB" },
      { id: 6, name: "Lab Results - A1C.pdf", size: "720 KB" },
    ],
  },
  {
    id: 4,
    title: "Orthopedic Evaluation",
    date: "2023-07-21",
    doctor: "Dr. Michael Thompson",
    facility: "Joint & Bone Center",
    type: "Specialist",
    summary: "Mild osteoarthritis in both knees. Recommended physical therapy twice weekly and pain management as needed.",
    documents: [
      { id: 7, name: "Orthopedic Evaluation.pdf", size: "1.8 MB" },
      { id: 8, name: "X-Ray Results - Knees.pdf", size: "4.2 MB" },
    ],
  },
];

// Mock data for medications
const medications = [
  {
    id: 1,
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    purpose: "Blood pressure",
    prescribedBy: "Dr. Emily Chen",
    startDate: "2022-03-15",
    instructions: "Take in the morning with food",
    refillDate: "2023-12-05",
    sideEffects: "Dizziness, dry cough",
    whatsappEnabled: true,
    reminder: {
      time: "8:00 AM",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    }
  },
  {
    id: 2,
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    purpose: "Diabetes management",
    prescribedBy: "Dr. Sarah Johnson",
    startDate: "2021-08-20",
    instructions: "Take with breakfast and dinner",
    refillDate: "2023-11-25",
    sideEffects: "Upset stomach, nausea",
    whatsappEnabled: false,
    reminder: {
      time: "1:00 PM",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    }
  },
  {
    id: 3,
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily",
    purpose: "Cholesterol",
    prescribedBy: "Dr. Robert Williams",
    startDate: "2022-01-10",
    instructions: "Take in the evening",
    refillDate: "2023-12-10",
    sideEffects: "Muscle pain, fatigue",
  },
  {
    id: 4,
    name: "Acetaminophen",
    dosage: "500mg",
    frequency: "As needed",
    purpose: "Pain relief",
    prescribedBy: "Dr. Michael Thompson",
    startDate: "2023-07-21",
    instructions: "Take for joint pain, not to exceed 4 tablets per day",
    refillDate: "2023-11-30",
    sideEffects: "Rare at recommended doses",
  },
];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translate } = useTranslation();
  const [activeTab, setActiveTab] = useState("info");
  const [expandedMedication, setExpandedMedication] = useState<number | null>(null);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  
  // New states for edit modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editVitalsOpen, setEditVitalsOpen] = useState(false);
  const [editConditionsOpen, setEditConditionsOpen] = useState(false);
  const [editAllergiesOpen, setEditAllergiesOpen] = useState(false);
  const [editEmergencyOpen, setEditEmergencyOpen] = useState(false);
  const [editPersonalOpen, setEditPersonalOpen] = useState(false);
  const [editNotificationsOpen, setEditNotificationsOpen] = useState(false);
  
  // States to store form values
  const [profile, setProfile] = useState(userProfile);
  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderDays, setReminderDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  // Function to handle edit completion with success message
  const handleEditSuccess = (section: string) => {
    toast({
      title: "Updated Successfully",
      description: `Your ${section} information has been updated.`,
      className: "bg-medical-teal text-white",
    });
  };

  // Add these handlers to the existing ones
  const toggleMedicationExpand = (id: number) => {
    setExpandedMedication(expandedMedication === id ? null : id);
  };

  const toggleReportExpand = (id: number) => {
    setExpandedReport(expandedReport === id ? null : id);
  };

  const goBack = () => navigate(-1);

  // Add this function to handle condition addition
  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setProfile({
        ...profile,
        conditions: [...profile.conditions, newCondition.trim()]
      });
      setNewCondition("");
      handleEditSuccess("medical conditions");
    }
  };

  // Add this function to handle allergy addition
  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, newAllergy.trim()]
      });
      setNewAllergy("");
      handleEditSuccess("allergies");
    }
  };

  // Add this function to handle condition removal
  const handleRemoveCondition = (index: number) => {
    setProfile({
      ...profile,
      conditions: profile.conditions.filter((_, i) => i !== index)
    });
    handleEditSuccess("medical conditions");
  };

  // Add this function to handle allergy removal
  const handleRemoveAllergy = (index: number) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter((_, i) => i !== index)
    });
    handleEditSuccess("allergies");
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      toast({
        description: "You have been logged out successfully",
        className: "bg-slate-700 text-white",
      });
      
      navigate("/");
    }
  };

  // New function to navigate to the reminders page
  const goToReminders = () => navigate("/reminders");

  // Add this function to handle WhatsApp toggle
  const toggleWhatsApp = (enabled) => {
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        whatsappEnabled: enabled
      }
    });
    
    // In a real app, this would call an API to update the user's preferences
    if (enabled) {
      toast({
        description: "WhatsApp notifications enabled for your account",
        className: "bg-green-500 text-white",
      });
    } else {
      toast({
        description: "WhatsApp notifications disabled",
        className: "bg-slate-700 text-white",
      });
    }
  };

  // Add this function to toggle selection of reminder days
  const toggleDay = (day: string) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day]);
    }
  };
  
  // Add this function to set up a new reminder for a medication
  const setupReminder = (medication) => {
    setSelectedMedication(medication);
    
    // Pre-populate with existing reminder data if available
    if (medication.reminder) {
      // Convert 12h format to 24h format for the input
      const timeParts = medication.reminder.time.match(/(\d+):(\d+) (\w+)/);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = timeParts[2];
        const period = timeParts[3];
        
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        setReminderTime(`${hours.toString().padStart(2, '0')}:${minutes}`);
      } else {
        setReminderTime("08:00");
      }
      
      setReminderDays(medication.reminder.days);
    } else {
      // Default values
      setReminderTime("08:00");
      setReminderDays(["Mon", "Wed", "Fri", "Sun"]);
    }
    
    setIsAddingReminder(true);
  };
  
  // Add this function to handle reminder submission
  const handleSubmitReminder = async () => {
    if (!selectedMedication) return;
    
    try {
      setIsSubmittingReminder(true);
      
      // Convert 24h time to 12h format
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      };
      
      const reminderData = {
        name: selectedMedication.name,
        dosage: selectedMedication.dosage,
        time: [formatTime(reminderTime)],
        days: reminderDays,
        frequency: selectedMedication.frequency,
        startDate: new Date(),
        notes: selectedMedication.instructions,
        whatsappEnabled: profile.preferences?.whatsappEnabled || false,
        phoneNumber: profile.preferences?.phoneNumber || profile.phone.replace(/\D/g, '')
      };
      
      // Call the API to create a reminder
      await reminderApi.createReminder(reminderData);
      
      // Show success message
      toast({
        title: "Reminder Created",
        description: `Reminder set for ${selectedMedication.name} at ${formatTime(reminderTime)}`,
        className: "bg-medical-teal text-white",
      });
      
      // Update the medication in local state to show it has a reminder
      const updatedMedications = medications.map(med => {
        if (med.id === selectedMedication.id) {
          return {
            ...med,
            reminder: {
              time: formatTime(reminderTime),
              days: reminderDays
            }
          };
        }
        return med;
      });
      
      // Close the modal
      setIsAddingReminder(false);
    } catch (error) {
      console.error("Failed to create reminder:", error);
      toast({
        title: "Error",
        description: "Failed to set up the reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  return (
    <div className="min-h-screen pb-8 bg-gray-50 dark:bg-gray-900">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 transform -rotate-90" />
          <TranslatableText>Back</TranslatableText>
        </Button>
        <h1 className="text-xl font-bold">
          <TranslatableText>Medical Profile</TranslatableText>
        </h1>
        <Button 
          variant="ghost" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-1" />
          <TranslatableText>Logout</TranslatableText>
        </Button>
      </header>

      <div className="p-4">
        {/* Profile Header with Avatar */}
        <MediCard className="p-5 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-medical-teal">
                <AvatarImage src={profile.profilePicture} alt={profile.name} />
                <AvatarFallback className="text-3xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-medical-teal"
                onClick={() => setEditProfileOpen(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                <Badge variant="secondary">{profile.age} years</Badge>
                <Badge variant="secondary">{profile.gender}</Badge>
                <Badge variant="secondary">{profile.vitals.bloodType}</Badge>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>
          </div>
        </MediCard>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <GsapReveal animation="fade" delay={0.1}>
            <MediCard 
              className="p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={goToReminders}
            >
              <div className="w-12 h-12 rounded-full bg-medical-teal/20 flex items-center justify-center mb-2">
                <Bell className="w-6 h-6 text-medical-teal" />
              </div>
              <h3 className="font-medium">
                <TranslatableText>Medication Reminders</TranslatableText>
              </h3>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="fade" delay={0.2}>
            <MediCard className="p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-medium">Health Tracker</h3>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="fade" delay={0.3}>
            <MediCard className="p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                <ClipboardList className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-medium">Appointments</h3>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="fade" delay={0.4}>
            <MediCard className="p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-medium">Caregivers</h3>
            </MediCard>
          </GsapReveal>
        </div>

        {/* Upcoming Medication Reminder */}
        <GsapReveal animation="fade" delay={0.5}>
          <MediCard className="p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Clock className="w-5 h-5 mr-2 text-medical-teal" />
                <TranslatableText>Next Medication</TranslatableText>
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex items-center"
                onClick={goToReminders}
              >
                <TranslatableText>View All</TranslatableText>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-medical-teal/20 flex items-center justify-center">
                <PillIcon className="w-7 h-7 text-medical-teal" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold">Lisinopril</h4>
                <p className="text-muted-foreground">Today at 8:00 AM</p>
              </div>
              <div>
                <MediButton 
                  className="bg-medical-teal hover:bg-medical-teal/90"
                  onClick={goToReminders}  
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <TranslatableText>Remind Me</TranslatableText>
                </MediButton>
              </div>
            </div>
          </MediCard>
        </GsapReveal>

        {/* Add this notification preferences card after the Personal Information card */}
        <GsapReveal animation="fade" delay={0.6}>
          <MediCard className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-medical-teal" />
                Notification Preferences
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setEditNotificationsOpen(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>App Notifications</span>
                </div>
                <Switch id="appNotifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <PhoneOutgoing className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>WhatsApp Notifications</span>
                </div>
                <Switch 
                  checked={profile.preferences?.whatsappEnabled || false}
                  onCheckedChange={toggleWhatsApp}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              {profile.preferences?.whatsappEnabled && (
                <div className="bg-gray-50 p-3 rounded-md mt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    WhatsApp notifications enabled for:
                  </p>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {profile.preferences.phoneNumber || profile.phone}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>Email Notifications</span>
                </div>
                <Switch 
                  id="emailNotifications"
                  checked={profile.preferences?.emailNotifications || false}
                  onCheckedChange={(checked) => {
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        emailNotifications: checked
                      }
                    });
                  }}
                />
              </div>
            </div>
          </MediCard>
        </GsapReveal>

        {/* Tabs for different sections */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="info" className="text-base">Basic Info</TabsTrigger>
            <TabsTrigger value="reports" className="text-base">Reports</TabsTrigger>
            <TabsTrigger value="medications" className="text-base">Medications</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="info" className="space-y-4">
            {/* Vital Statistics */}
            <GsapReveal animation="fade" delay={0.1}>
              <MediCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-medical-teal" />
                    Vital Statistics
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge>Updated {format(new Date(profile.vitals.lastUpdated), "MMM d, yyyy")}</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => setEditVitalsOpen(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Ruler className="w-4 h-4 mr-1" /> Height
                    </span>
                    <span className="text-lg font-medium">{profile.vitals.height}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Weight className="w-4 h-4 mr-1" /> Weight
                    </span>
                    <span className="text-lg font-medium">{profile.vitals.weight}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Activity className="w-4 h-4 mr-1" /> Blood Pressure
                    </span>
                    <span className="text-lg font-medium">{profile.vitals.bloodPressure}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Heart className="w-4 h-4 mr-1" /> Heart Rate
                    </span>
                    <span className="text-lg font-medium">{profile.vitals.heartRate}</span>
                  </div>
                </div>
              </MediCard>
            </GsapReveal>
            
            {/* Medical Conditions */}
            <GsapReveal animation="fade" delay={0.2}>
              <MediCard className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-medical-teal" />
                    Medical Conditions
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setEditConditionsOpen(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.conditions.map((condition, index) => (
                    <Badge key={index} variant="outline" className="text-base py-1 px-3">
                      {condition}
                    </Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => setEditConditionsOpen(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </MediCard>
            </GsapReveal>
            
            {/* Allergies */}
            <GsapReveal animation="fade" delay={0.3}>
              <MediCard className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-medical-teal" />
                    Allergies
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setEditAllergiesOpen(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50 text-red-800 border-red-200 text-base py-1 px-3">
                      {allergy}
                    </Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => setEditAllergiesOpen(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </MediCard>
            </GsapReveal>
            
            {/* Emergency Contact */}
            <GsapReveal animation="fade" delay={0.4}>
              <MediCard className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Users className="w-5 h-5 mr-2 text-medical-teal" />
                    Emergency Contact
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setEditEmergencyOpen(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-lg">{profile.emergencyContact.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">({profile.emergencyContact.relationship})</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-lg">{profile.emergencyContact.phone}</span>
                  </div>
                </div>
              </MediCard>
            </GsapReveal>
            
            {/* Additional Information */}
            <GsapReveal animation="fade" delay={0.5}>
              <MediCard className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-medical-teal" />
                    Personal Information
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setEditPersonalOpen(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">Date of Birth</span>
                    <span className="text-lg">{format(new Date(profile.birthDate), "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">Home Address</span>
                    <span className="text-lg">{profile.address}</span>
                  </div>
                </div>
              </MediCard>
            </GsapReveal>
          </TabsContent>

          {/* Medical Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">Medical History</h3>
              <Button className="bg-medical-teal hover:bg-medical-teal/90">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Report
              </Button>
            </div>

            {medicalReports.map((report) => (
              <GsapReveal key={report.id} animation="slide" delay={report.id * 0.1}>
                <MediCard className="p-4">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleReportExpand(report.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold">{report.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="bg-medical-teal/10 text-medical-teal">
                            {report.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(report.date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        expandedReport === report.id ? "rotate-90" : ""
                      )} />
                    </div>
                  </div>
                  
                  {expandedReport === report.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="mb-3">
                        <span className="text-sm text-muted-foreground">Doctor</span>
                        <p className="font-medium">{report.doctor}</p>
                      </div>
                      <div className="mb-3">
                        <span className="text-sm text-muted-foreground">Facility</span>
                        <p className="font-medium">{report.facility}</p>
                      </div>
                      <div className="mb-3">
                        <span className="text-sm text-muted-foreground">Summary</span>
                        <p>{report.summary}</p>
                      </div>
                      
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Documents</h5>
                        <div className="space-y-2">
                          {report.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                              <FileText className="w-5 h-5 mr-2 text-medical-teal" />
                              <div className="flex-1">
                                <div className="font-medium">{doc.name}</div>
                                <div className="text-xs text-muted-foreground">{doc.size}</div>
                              </div>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </MediCard>
              </GsapReveal>
            ))}
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">Current Medications</h3>
              <Button className="bg-medical-teal hover:bg-medical-teal/90">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </div>

            {medications.map((medication) => (
              <GsapReveal key={medication.id} animation="slide" delay={medication.id * 0.1}>
                <MediCard className="p-4">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleMedicationExpand(medication.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-medical-teal/20 flex items-center justify-center">
                          <PillIcon className="w-6 h-6 text-medical-teal" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold">{medication.name}</h4>
                          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1">
                            <span>{medication.dosage} • {medication.frequency}</span>
                            {medication.whatsappEnabled && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-1">
                                <PhoneOutgoing className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        expandedMedication === medication.id ? "rotate-90" : ""
                      )} />
                    </div>
                  </div>
                  
                  {expandedMedication === medication.id && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Purpose</span>
                        <p className="font-medium">{medication.purpose}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Prescribed By</span>
                        <p className="font-medium">{medication.prescribedBy}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Start Date</span>
                        <p className="font-medium">{format(new Date(medication.startDate), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Next Refill</span>
                        <p className="font-medium">{format(new Date(medication.refillDate), "MMM d, yyyy")}</p>
                      </div>
                      
                      {medication.reminder && (
                        <div className="md:col-span-2">
                          <span className="text-sm text-muted-foreground">Reminder Schedule</span>
                          <div className="flex items-center mt-1">
                            <Clock className="w-4 h-4 mr-2 text-medical-teal" />
                            <span className="font-medium">{medication.reminder.time}</span>
                            <span className="mx-2">•</span>
                            <span>
                              {medication.reminder.days.length === 7 
                                ? "Every day" 
                                : medication.reminder.days.join(", ")}
                            </span>
                          </div>
                          
                          <div className="flex mt-2 items-center">
                            <div className="flex items-center mr-4">
                              <Bell className="w-4 h-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">App Alert</span>
                              <Switch className="ml-2 scale-75" defaultChecked />
                            </div>
                            
                            <div className="flex items-center">
                              <PhoneOutgoing className="w-4 h-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">WhatsApp</span>
                              <Switch 
                                className="ml-2 scale-75 data-[state=checked]:bg-green-500" 
                                checked={medication.whatsappEnabled || false}
                                onCheckedChange={(checked) => {
                                  toast({
                                    description: `WhatsApp notifications ${checked ? 'enabled' : 'disabled'} for ${medication.name}`,
                                    className: checked ? "bg-green-500 text-white" : "bg-slate-700 text-white",
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="md:col-span-2">
                        <span className="text-sm text-muted-foreground">Instructions</span>
                        <p>{medication.instructions}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm text-muted-foreground">Possible Side Effects</span>
                        <p>{medication.sideEffects}</p>
                      </div>
                      
                      <div className="md:col-span-2 flex flex-wrap justify-end gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          className="flex items-center"
                          onClick={() => setupReminder(medication)}
                        >
                          <Bell className="w-4 h-4 mr-1" />
                          Set Reminders
                        </Button>
                        <Button variant="outline">Refill Request</Button>
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          Report Issues
                        </Button>
                      </div>
                    </div>
                  )}
                </MediCard>
              </GsapReveal>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="col-span-3 h-10 text-base"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="age" className="text-right">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                className="col-span-3 h-10 text-base"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Gender
              </Label>
              <RadioGroup 
                value={profile.gender}
                onValueChange={(value) => setProfile({...profile, gender: value})}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="col-span-3 h-10 text-base"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="col-span-3 h-10 text-base"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditProfileOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setEditProfileOpen(false);
                handleEditSuccess("profile");
              }}
              className="bg-medical-teal hover:bg-medical-teal/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vitals Modal */}
      <Dialog open={editVitalsOpen} onOpenChange={setEditVitalsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Vital Statistics</DialogTitle>
            <DialogDescription>
              Update your vital health information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="height" className="text-right">
                Height
              </Label>
              <Input
                id="height"
                value={profile.vitals.height}
                onChange={(e) => setProfile({
                  ...profile, 
                  vitals: {...profile.vitals, height: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
                placeholder="5'4&quot;"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight
              </Label>
              <Input
                id="weight"
                value={profile.vitals.weight}
                onChange={(e) => setProfile({
                  ...profile, 
                  vitals: {...profile.vitals, weight: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
                placeholder="142 lbs"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bloodType" className="text-right">
                Blood Type
              </Label>
              <Input
                id="bloodType"
                value={profile.vitals.bloodType}
                onChange={(e) => setProfile({
                  ...profile, 
                  vitals: {...profile.vitals, bloodType: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
                placeholder="O+"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bp" className="text-right">
                Blood Pressure
              </Label>
              <Input
                id="bp"
                value={profile.vitals.bloodPressure}
                onChange={(e) => setProfile({
                  ...profile, 
                  vitals: {...profile.vitals, bloodPressure: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
                placeholder="120/80"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="heartRate" className="text-right">
                Heart Rate
              </Label>
              <Input
                id="heartRate"
                value={profile.vitals.heartRate}
                onChange={(e) => setProfile({
                  ...profile, 
                  vitals: {...profile.vitals, heartRate: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
                placeholder="72 bpm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditVitalsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setEditVitalsOpen(false);
                // Update lastUpdated date
                setProfile({
                  ...profile,
                  vitals: {
                    ...profile.vitals,
                    lastUpdated: format(new Date(), "yyyy-MM-dd")
                  }
                });
                handleEditSuccess("vital statistics");
              }}
              className="bg-medical-teal hover:bg-medical-teal/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Conditions Modal */}
      <Dialog open={editConditionsOpen} onOpenChange={setEditConditionsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Medical Conditions</DialogTitle>
            <DialogDescription>
              Add or remove your medical conditions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label>Current Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {profile.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-md px-3 py-1">
                    <span>{condition}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-full hover:bg-red-100"
                      onClick={() => handleRemoveCondition(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add new condition"
                className="flex-1 h-10 text-base"
              />
              <Button 
                onClick={handleAddCondition} 
                className="bg-medical-teal hover:bg-medical-teal/90"
                disabled={!newCondition.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditConditionsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Allergies Modal */}
      <Dialog open={editAllergiesOpen} onOpenChange={setEditAllergiesOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Allergies</DialogTitle>
            <DialogDescription>
              Add or remove your allergies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label>Current Allergies</Label>
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center gap-1 bg-red-50 text-red-800 rounded-md px-3 py-1">
                    <span>{allergy}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-full hover:bg-red-200 text-red-800"
                      onClick={() => handleRemoveAllergy(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add new allergy"
                className="flex-1 h-10 text-base"
              />
              <Button 
                onClick={handleAddAllergy} 
                className="bg-medical-teal hover:bg-medical-teal/90"
                disabled={!newAllergy.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditAllergiesOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Emergency Contact Modal */}
      <Dialog open={editEmergencyOpen} onOpenChange={setEditEmergencyOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Emergency Contact</DialogTitle>
            <DialogDescription>
              Update your emergency contact information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ecName" className="text-right">
                Name
              </Label>
              <Input
                id="ecName"
                value={profile.emergencyContact.name}
                onChange={(e) => setProfile({
                  ...profile, 
                  emergencyContact: {...profile.emergencyContact, name: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ecRelation" className="text-right">
                Relationship
              </Label>
              <Input
                id="ecRelation"
                value={profile.emergencyContact.relationship}
                onChange={(e) => setProfile({
                  ...profile, 
                  emergencyContact: {...profile.emergencyContact, relationship: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ecPhone" className="text-right">
                Phone
              </Label>
              <Input
                id="ecPhone"
                value={profile.emergencyContact.phone}
                onChange={(e) => setProfile({
                  ...profile, 
                  emergencyContact: {...profile.emergencyContact, phone: e.target.value}
                })}
                className="col-span-3 h-10 text-base"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditEmergencyOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setEditEmergencyOpen(false);
                handleEditSuccess("emergency contact");
              }}
              className="bg-medical-teal hover:bg-medical-teal/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Personal Information Modal */}
      <Dialog open={editPersonalOpen} onOpenChange={setEditPersonalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Personal Information</DialogTitle>
            <DialogDescription>
              Update your personal details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dob" className="text-right">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={profile.birthDate}
                onChange={(e) => setProfile({...profile, birthDate: e.target.value})}
                className="col-span-3 h-10 text-base"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address" className="text-right pt-2">
                Address
              </Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="col-span-3 min-h-[80px] text-base"
                placeholder="Enter your home address"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditPersonalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setEditPersonalOpen(false);
                handleEditSuccess("personal information");
              }}
              className="bg-medical-teal hover:bg-medical-teal/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Notification Preferences Modal */}
      <Dialog open={editNotificationsOpen} onOpenChange={setEditNotificationsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Notification Preferences</DialogTitle>
            <DialogDescription>
              Manage how you receive notifications and alerts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="appNotifications" className="flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  App Notifications
                </Label>
                <Switch id="appNotifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsappNotifications" className="flex items-center">
                  <PhoneOutgoing className="w-4 h-4 mr-2" />
                  WhatsApp Notifications
                </Label>
                <Switch 
                  id="whatsappNotifications"
                  checked={profile.preferences?.whatsappEnabled || false}
                  onCheckedChange={(checked) => {
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        whatsappEnabled: checked
                      }
                    });
                  }}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              {profile.preferences?.whatsappEnabled && (
                <div className="pl-7">
                  <Label htmlFor="whatsappPhone" className="text-sm text-muted-foreground mb-1 block">
                    WhatsApp Phone Number
                  </Label>
                  <Input 
                    id="whatsappPhone"
                    placeholder="Enter phone number (e.g., 7400135663)"
                    value={profile.preferences?.phoneNumber || ""}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        phoneNumber: e.target.value
                      }
                    })}
                    type="tel"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your number without country code (App will add +91)
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Notifications
                </Label>
                <Switch 
                  id="emailNotifications"
                  checked={profile.preferences?.emailNotifications || false}
                  onCheckedChange={(checked) => {
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        emailNotifications: checked
                      }
                    });
                  }}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditNotificationsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setEditNotificationsOpen(false);
                handleEditSuccess("notification preferences");
              }}
              className="bg-medical-teal hover:bg-medical-teal/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Modal */}
      <Dialog open={isAddingReminder} onOpenChange={setIsAddingReminder}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Set Medication Reminder</DialogTitle>
            <DialogDescription>
              {selectedMedication && `Configure reminders for ${selectedMedication.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label className="block text-sm font-medium mb-1">Time</Label>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
                <Input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2">Days</Label>
              <div className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={reminderDays.includes(day) ? "default" : "outline"}
                    className={`w-10 h-10 p-0 ${
                      reminderDays.includes(day) 
                        ? "bg-medical-teal hover:bg-medical-teal/90" 
                        : ""
                    }`}
                    onClick={() => toggleDay(day)}
                  >
                    {day.substring(0, 1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2">Alert Options</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>App Notification</span>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PhoneOutgoing className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>WhatsApp Alert</span>
                  </div>
                  <Switch 
                    checked={profile.preferences?.whatsappEnabled || false}
                    disabled={!profile.preferences?.whatsappEnabled}
                  />
                </div>
                
                {profile.preferences?.whatsappEnabled && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    WhatsApp notifications will be sent to: {profile.preferences.phoneNumber || profile.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingReminder(false)}
              disabled={isSubmittingReminder}
            >
              Cancel
            </Button>
            <MediButton 
              className="bg-medical-teal hover:bg-medical-teal/90"
              onClick={handleSubmitReminder}
              disabled={isSubmittingReminder || reminderDays.length === 0}
            >
              {isSubmittingReminder ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Save Reminder
            </MediButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
