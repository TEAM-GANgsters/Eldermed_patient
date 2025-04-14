import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import MediButton from "@/components/MediButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMedications } from "@/pages/Index";

// Helper function to format time to AM/PM
const formatTimeToAMPM = (time24: string) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

interface NavItemProps {
  icon: React.ReactElement;
  text: string;
  to: string;
  isActive: boolean;
}

const NavItem = ({ icon, text, to, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex flex-col items-center justify-center px-4 py-2 text-sm transition-colors duration-200",
      isActive
        ? "text-medical-teal font-medium"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <div
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full mb-1 transition-all duration-200",
        isActive
          ? "bg-medical-teal/10 text-medical-teal"
          : "bg-transparent hover:bg-secondary/5"
      )}
    >
      {icon}
    </div>
    <span>{text}</span>
  </Link>
);

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  time: z.string().min(1, "Time is required"),
});

type FormValues = z.infer<typeof formSchema>;

const NavBar = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "Once daily",
      time: "",
    },
  });
  
  const { addMedication } = useMedications();
  
  const onSubmit = (data: FormValues) => {
    // Format the time from 24h to AM/PM format using our helper function
    const formattedTime = formatTimeToAMPM(data.time);
    // Add the medication using the context function
    addMedication({
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      time: formattedTime,
      history: [] // Add missing required history property
    });
    
    // Close dialog and reset form
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center py-2 z-10">
        <NavItem
          icon={<Bell className="w-6 h-6" />}
          text="Reminders"
          to="/reminders"
          isActive={activeTab === "reminders"}
        />
        <NavItem
          icon={<Calendar className="w-6 h-6" />}
          text="Schedule"
          to="/schedule"
          isActive={activeTab === "schedule"}
        />
        <Button
          className="rounded-full bg-medical-teal text-white w-16 h-16 p-0 shadow-lg hover:bg-medical-teal/90"
          onClick={() => setIsDialogOpen(true)}
        >
          <span className="text-3xl">+</span>
        </Button>
        <NavItem
          icon={<MessageCircle className="w-6 h-6" />}
          text="Support"
          to="/support"
          isActive={activeTab === "support"}
        />
        <NavItem
          icon={<User className="w-6 h-6" />}
          text="Profile"
          to="/profile"
          isActive={activeTab === "profile"}
        />
      </nav>
      
      {/* Add Medicine Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-medical-teal">Add New Medication</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Lisinopril" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 10mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="Once weekly">Once weekly</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  type="button"
                >
                  Cancel
                </Button>
                <MediButton 
                  type="submit"
                  className="bg-medical-teal hover:bg-medical-teal/90"
                >
                  Add Medication
                </MediButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NavBar;
