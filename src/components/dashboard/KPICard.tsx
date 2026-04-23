import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: LucideIcon;
  variant?: "default" | "accent" | "success" | "warning" | "info";
  subtitle?: string;
}

const variantStyles = {
  default: "from-primary/10 to-primary/5",
  accent: "from-accent/10 to-accent/5",
  success: "from-success/10 to-success/5",
  warning: "from-warning/10 to-warning/5",
  info: "from-info/10 to-info/5",
};

const iconStyles = {
  default: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function KPICard({ title, value, change, icon: Icon, variant = "default", subtitle }: KPICardProps) {
  return (
    <div className="kpi-card group">
      <div className={cn("kpi-card-gradient bg-gradient-to-br", variantStyles[variant])} />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change && (
            <p className={change.positive ? "metric-change-positive" : "metric-change-negative"}>
              {change.positive ? "↑" : "↓"} {change.value} vs last period
            </p>
          )}
        </div>
        
        <div className={cn("rounded-xl p-3 transition-transform group-hover:scale-110", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
