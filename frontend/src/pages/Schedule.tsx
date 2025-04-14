import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowUp, 
  Calendar, 
  Clock, 
  Plus, 
  MapPin, 
  User, 
  FileText, 
  X, 
  CheckCircle, 
  Trash2, 
  CalendarClock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import GsapReveal from "@/components/GsapReveal";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, addDays, isSameDay, isAfter, isBefore, parseISO } from "date-fns";

// Event types for selection
const eventTypes = [
  { id: "checkup", name: "Routine Check-up", icon: User },
  { id: "test", name: "Medical Test", icon: FileText },
  { id: "appointment", name: "Doctor Appointment", icon: Calendar },
  { id: "report", name: "Report Collection", icon: FileText }
];

// Initial events data
const initialEvents = [
  {
    id: 1,
    title: "Annual Physical Exam",
    type: "checkup",
    date: "2023-11-20",
    time: "10:00",
    location: "City Health Clinic",
    description: "Annual wellness check with Dr. Smith",
    reminderEnabled: true
  },
  {
    id: 2,
    title: "Blood Test Results",
    type: "report",
    date: "2023-11-22",
    time: "14:30",
    location: "Memorial Hospital",
    description: "Collect results from last week's blood test",
    reminderEnabled: true
  },
  {
    id: 3,
    title: "Cardiology Appointment",
    type: "appointment",
    date: "2023-11-25",
    time: "09:00",
    location: "Heart Care Center",
    description: "Follow-up with Dr. Johnson about blood pressure medication",
    reminderEnabled: true
  }
];

const Schedule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState(initialEvents);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "appointment",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    location: "",
    description: "",
    reminderEnabled: true
  });

  const goBack = () => navigate(-1);

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setNewEvent(prev => ({ ...prev, [name]: checked }));
  };

  // Add new event
  const handleSaveEvent = () => {
    if (!newEvent.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event title",
        variant: "destructive",
      });
      return;
    }

    if (!newEvent.date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const newEventObj = {
      id: events.length + 1,
      ...newEvent
    };

    setEvents(prev => [...prev, newEventObj]);
    setShowAddEvent(false);
    setNewEvent({
      title: "",
      type: "appointment",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      location: "",
      description: "",
      reminderEnabled: true
    });

    toast({
      title: "Success",
      description: "Medical event added to your schedule",
      className: "bg-medical-teal text-white",
    });
  };

  // Delete event
  const handleDeleteEvent = () => {
    if (eventToDelete === null) return;
    
    const eventName = events.find(e => e.id === eventToDelete)?.title;
    
    setEvents(prev => prev.filter(event => event.id !== eventToDelete));
    setEventToDelete(null);
    
    toast({
      description: `"${eventName}" removed from your schedule`,
      className: "bg-destructive text-destructive-foreground",
    });
  };

  // Toggle reminder status
  const toggleReminderStatus = (id: number) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === id ? { ...event, reminderEnabled: !event.reminderEnabled } : event
      )
    );
    
    const event = events.find(e => e.id === id);
    const status = event?.reminderEnabled ? 'disabled' : 'enabled';
    
    toast({
      description: `Reminder for "${event?.title}" ${status}`,
      className: status === 'enabled' ? "bg-medical-teal text-white" : "bg-slate-700 text-white",
    });
  };

  // Date navigation
  const navigateDays = (days: number) => {
    setSelectedDate(prevDate => addDays(prevDate, days));
  };

  // Filter events based on selected date and view mode
  const getFilteredEvents = () => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      
      if (viewMode === "day") {
        return isSameDay(eventDate, selectedDate);
      } 
      
      if (viewMode === "week") {
        const startOfWeek = addDays(selectedDate, -selectedDate.getDay());
        const endOfWeek = addDays(startOfWeek, 6);
        return (
          (isAfter(eventDate, startOfWeek) || isSameDay(eventDate, startOfWeek)) &&
          (isBefore(eventDate, endOfWeek) || isSameDay(eventDate, endOfWeek))
        );
      }
      
      // Month view (simplified - actual month would need more careful calculation)
      const currentMonth = selectedDate.getMonth();
      const currentYear = selectedDate.getFullYear();
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).sort((a, b) => {
      // Sort by date and time
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.time.localeCompare(b.time);
    });
  };

  const filteredEvents = getFilteredEvents();

  // Get icon for event type
  const getEventIcon = (type: string) => {
    const eventType = eventTypes.find(et => et.id === type);
    const IconComponent = eventType?.icon || Calendar;
    return <IconComponent className="w-7 h-7 text-medical-teal" />;
  };

  return (
    <div className="min-h-screen pb-6">
      <header className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" onClick={goBack} className="text-base">
          <ArrowUp className="w-5 h-5 transform -rotate-90 mr-2" />
          <span>Back</span>
        </Button>
        <h1 className="text-xl font-bold">Medical Schedule</h1>
        <Button variant="ghost" onClick={() => setShowAddEvent(true)}>
          <Plus className="w-5 h-5" />
        </Button>
      </header>
      
      <div className="p-4">
        {/* Date selector and view controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDays(-1)}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="px-4 text-center">
              <h2 className="text-xl font-semibold">
                {viewMode === "day" && format(selectedDate, "MMMM d, yyyy")}
                {viewMode === "week" && `Week of ${format(addDays(selectedDate, -selectedDate.getDay()), "MMM d")}`}
                {viewMode === "month" && format(selectedDate, "MMMM yyyy")}
              </h2>
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDays(1)}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant={viewMode === "day" ? "default" : "outline"}
              className={`flex-1 sm:flex-initial ${viewMode === "day" ? "bg-medical-teal hover:bg-medical-teal/90" : ""}`}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button 
              variant={viewMode === "week" ? "default" : "outline"}
              className={`flex-1 sm:flex-initial ${viewMode === "week" ? "bg-medical-teal hover:bg-medical-teal/90" : ""}`}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button 
              variant={viewMode === "month" ? "default" : "outline"}
              className={`flex-1 sm:flex-initial ${viewMode === "month" ? "bg-medical-teal hover:bg-medical-teal/90" : ""}`}
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>
        </div>
        
        {/* Events list */}
        <div className="space-y-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <GsapReveal key={event.id} animation="slide" delay={0.1 * index}>
                <MediCard neumorphic className="p-5">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start">
                      <div className="w-14 h-14 rounded-full bg-medical-teal/20 flex items-center justify-center mr-4 flex-shrink-0">
                        {getEventIcon(event.type)}
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
                        
                        <div className="space-y-1 text-base">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{format(parseISO(event.date), "EEEE, MMMM d, yyyy")}</span>
                          </div>
                          
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{event.time}</span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.description && (
                            <div className="mt-2 text-sm">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0">
                      <div className="flex items-center">
                        <span className="mr-2 text-sm font-medium text-muted-foreground">
                          Reminder
                        </span>
                        <Switch 
                          checked={event.reminderEnabled} 
                          onCheckedChange={() => toggleReminderStatus(event.id)}
                          className="scale-125 data-[state=checked]:bg-medical-teal"
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => setEventToDelete(event.id)}
                      >
                        <Trash2 className="h-5 w-5 mr-1" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </MediCard>
              </GsapReveal>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CalendarClock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-xl mb-2">No events scheduled</h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                You don't have any medical events scheduled for this time period.
                Click the + button to add a new event.
              </p>
              <Button 
                className="mt-6 bg-medical-teal hover:bg-medical-teal/90 text-lg h-12 px-6"
                onClick={() => setShowAddEvent(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Medical Event
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GsapReveal animation="scale">
            <MediCard className="w-full max-w-3xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add Medical Event</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0" 
                  onClick={() => setShowAddEvent(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-base font-medium mb-2">Event Title</label>
                    <Input 
                      placeholder="Enter title for this event" 
                      name="title"
                      value={newEvent.title}
                      onChange={handleInputChange}
                      className="text-base h-12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium mb-2">Event Type</label>
                    <Select 
                      value={newEvent.type} 
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger className="text-base h-12">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.id} value={type.id} className="text-base">
                            <div className="flex items-center">
                              <type.icon className="w-5 h-5 mr-2" />
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium mb-2">Date</label>
                    <div className="flex items-center">
                      <Calendar className="w-6 h-6 mr-3 text-muted-foreground" />
                      <Input 
                        type="date" 
                        name="date"
                        value={newEvent.date}
                        onChange={handleInputChange}
                        className="flex-1 text-base h-12"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium mb-2">Time</label>
                    <div className="flex items-center">
                      <Clock className="w-6 h-6 mr-3 text-muted-foreground" />
                      <Input 
                        type="time" 
                        name="time"
                        value={newEvent.time}
                        onChange={handleInputChange}
                        className="flex-1 text-base h-12"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-base font-medium mb-2">Location</label>
                    <div className="flex items-center">
                      <MapPin className="w-6 h-6 mr-3 text-muted-foreground" />
                      <Input 
                        placeholder="Enter location" 
                        name="location"
                        value={newEvent.location}
                        onChange={handleInputChange}
                        className="flex-1 text-base h-12"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium mb-2">Description</label>
                    <Textarea 
                      placeholder="Enter additional details" 
                      name="description"
                      value={newEvent.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="text-base"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 mt-1">
                    <span className="text-base font-medium">Enable Reminder</span>
                    <Switch 
                      checked={newEvent.reminderEnabled}
                      onCheckedChange={(checked) => handleSwitchChange("reminderEnabled", checked)}
                      className="scale-125 data-[state=checked]:bg-medical-teal"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <Button 
                  variant="outline" 
                  className="text-base h-12 px-6"
                  onClick={() => setShowAddEvent(false)}
                >
                  Cancel
                </Button>
                <MediButton 
                  className="bg-medical-teal hover:bg-medical-teal/90 text-base h-12 px-6"
                  onClick={handleSaveEvent}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Save Event
                </MediButton>
              </div>
            </MediCard>
          </GsapReveal>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={eventToDelete !== null} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteEvent}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Schedule;
