import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary" | "accent";
}

export const ServiceCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  variant = "primary" 
}: ServiceCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return "border-secondary/20 hover:border-secondary/40 hover:bg-secondary/5";
      case "accent":
        return "border-accent/40 hover:border-accent/60 hover:bg-accent/10";
      default:
        return "border-primary/20 hover:border-primary/40 hover:bg-primary/5";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "secondary":
        return "text-secondary";
      case "accent":
        return "text-muted-foreground";
      default:
        return "text-primary";
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "secondary":
        return "secondary" as const;
      case "accent":
        return "outline" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <Card className={`cursor-pointer transition-all duration-200 ${getVariantStyles()}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-3 rounded-full bg-background ${getIconStyles()}`}>
            <Icon className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <Button 
            onClick={onClick}
            variant={getButtonVariant()}
            className="w-full mt-4"
          >
            Ejecutar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};