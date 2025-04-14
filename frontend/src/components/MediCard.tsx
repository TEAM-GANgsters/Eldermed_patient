
import React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Use Omit to exclude the 'title' property from HTMLAttributes
interface MediCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  gradient?: boolean;
  neumorphic?: boolean;
  important?: boolean;
}

const MediCard = ({ 
  title, 
  footer, 
  gradient = false, 
  neumorphic = false,
  important = false,
  className, 
  children, 
  ...props 
}: MediCardProps) => {
  return (
    <Card
      className={cn(
        "transition-all duration-300 overflow-hidden",
        gradient && "card-gradient border-0",
        neumorphic && "neumorphic border-0",
        important && "border-l-4 border-l-medical-purple",
        className
      )}
      {...props}
    >
      {title && (
        <CardHeader className="pb-2">
          {typeof title === "string" ? (
            <h3 className="text-xl font-semibold">{title}</h3>
          ) : (
            title
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};

export default MediCard;
