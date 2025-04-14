
import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Use Omit to exclude the 'size' property from ButtonProps
interface MediButtonProps extends Omit<ButtonProps, 'size'> {
  size?: "sm" | "default" | "lg" | "xl";
  pill?: boolean;
  neumorphic?: boolean;
}

const MediButton = ({ 
  className, 
  size = "default", 
  pill = false,
  neumorphic = false,
  children, 
  ...props 
}: MediButtonProps) => {
  const sizeClasses = {
    sm: "h-8 text-sm",
    default: "h-10",
    lg: "h-12 text-lg",
    xl: "h-16 text-xl px-8"
  };

  return (
    <Button
      className={cn(
        "transition-all duration-200",
        sizeClasses[size],
        pill && "rounded-full",
        neumorphic && !props.variant && "neumorphic hover:shadow-[8px_8px_16px_#dde6ee,-8px_-8px_16px_#ffffff] dark:hover:shadow-[6px_6px_12px_#1a242f,-6px_-6px_12px_#3e5871]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export default MediButton;
