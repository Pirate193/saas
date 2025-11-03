import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "success" | "info" | "purple";
}

/**
 * Compact Stats Card - ClickUp Style
 * 
 * Designed to be small and compact by default (2x2 grid units)
 * Large centered number with title and subtitle
 * Can be expanded by user but maintains readability
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
}: StatsCardProps) {
  const variants = {
    default: "border-border",
    warning: "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
    success: "border-green-500 bg-green-50 dark:bg-green-950/20",
    info: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
    purple: "border-purple-500 bg-purple-50 dark:bg-purple-950/20",
  };

  const iconVariants = {
    default: "text-muted-foreground",
    warning: "text-orange-500",
    success: "text-green-500",
    info: "text-blue-500",
    purple: "text-purple-500",
  };

  const numberVariants = {
    default: "text-foreground",
    warning: "text-orange-600 dark:text-orange-400",
    success: "text-green-600 dark:text-green-400",
    info: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <Card className={cn(
      "border-2 h-full w-full flex flex-col drag-handle cursor-move transition-all hover:shadow-md",
      variants[variant]
    )}>
      {/* Compact Header */}
      <CardHeader className=" space-y-0 ">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
          <div className={cn( iconVariants[variant])}>{icon}</div>
        </div>
      </CardHeader>

      {/* Content - Centered number (ClickUp style) */}
      <CardContent className="flex-1 flex flex-col items-center justify-start ">
        {/* Large centered number */}
        <div className={cn(
          "font-bold leading-none mb-2",
          numberVariants[variant],
          // Responsive sizing - stays readable at all sizes
          "text-xl"
        )}>
          {value}
        </div>
        
        {/* Subtitle below number */}
        <p className="text-xs text-muted-foreground text-center leading-tight">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}