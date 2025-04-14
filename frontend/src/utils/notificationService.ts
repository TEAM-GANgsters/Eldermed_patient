/**
 * Notification Service
 * 
 * Provides functions to handle browser notifications
 */

// Check if browser supports notifications
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Request permission for notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.log("This browser does not support notifications");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }
  
  return false;
};

// Send a notification immediately
export const sendNotification = (
  title: string, 
  body: string, 
  icon: string = '/favicon.ico',
  onClick?: () => void
): Notification | null => {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    console.log("Notifications are not supported or not permitted");
    return null;
  }
  
  try {
    const notification = new Notification(title, {
      body,
      icon
    });
    
    if (onClick) {
      notification.onclick = () => {
        window.focus();
        notification.close();
        onClick();
      };
    } else {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Schedule a notification for a future time
export const scheduleNotification = (
  title: string,
  body: string,
  triggerTime: string, // Format: "8:00 AM" or "14:30"
  options: {
    icon?: string;
    days?: string[];
    onClick?: () => void;
  } = {}
): Date | null => {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    console.log("Notifications are not supported or not permitted");
    return null;
  }
  
  // Calculate delay until the notification should trigger
  const now = new Date();
  const scheduledTime = new Date();
  
  try {
    // Check if time is in 12-hour or 24-hour format
    if (triggerTime.includes('AM') || triggerTime.includes('PM')) {
      // Parse the time string (e.g., "8:00 AM")
      const [timeStr, period] = triggerTime.split(' ');
      const [hoursStr, minutesStr] = timeStr.split(':');
      const hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr);
      
      // Convert to 24-hour format
      let hours24 = hours;
      if (period === 'PM' && hours < 12) hours24 += 12;
      if (period === 'AM' && hours === 12) hours24 = 0;
      
      scheduledTime.setHours(hours24, minutes, 0, 0);
    } else {
      // Parse 24-hour format (e.g., "14:30")
      const [hoursStr, minutesStr] = triggerTime.split(':');
      scheduledTime.setHours(parseInt(hoursStr), parseInt(minutesStr), 0, 0);
    }
    
    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime < now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    // Check if we should only schedule for specific days
    if (options.days && options.days.length > 0) {
      const dayMap: Record<string, number> = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
      };
      
      const currentDayOfWeek = scheduledTime.getDay();
      let daysToAdd = 0;
      let found = false;
      
      // Find the next day that matches our days array
      for (let i = 0; i < 7; i++) {
        const checkDay = (currentDayOfWeek + i) % 7;
        const dayName = Object.keys(dayMap).find(key => dayMap[key] === checkDay);
        
        if (dayName && options.days.includes(dayName)) {
          daysToAdd = i;
          found = true;
          break;
        }
      }
      
      if (found) {
        scheduledTime.setDate(scheduledTime.getDate() + daysToAdd);
      } else {
        // No matching day found
        return null;
      }
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    // Schedule the notification
    setTimeout(() => {
      sendNotification(title, body, options.icon, options.onClick);
    }, delay);
    
    console.log(`Notification scheduled for ${scheduledTime.toLocaleString()}`);
    return scheduledTime;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

// Cancel all scheduled notifications (if possible)
export const cancelAllNotifications = (): void => {
  // Browser notifications don't have a built-in way to cancel scheduled notifications
  // This would require keeping track of all setTimeout IDs and clearing them
  console.log("Canceling scheduled notifications is not directly supported");
};

// Test if notifications are working
export const testNotification = async (): Promise<boolean> => {
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    sendNotification(
      "Test Notification", 
      "Notifications are working correctly!",
      undefined,
      () => console.log("Test notification clicked")
    );
    return true;
  }
  
  return false;
}; 