import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  children?: ReactNode;
}

export function KPICard({ title, value, icon: Icon, trend, className, children }: KPICardProps) {
  return (
    <div className={cn('kpi-card animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="kpi-value mt-1">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm mt-2',
              trend.positive ? 'text-green-600' : 'text-muted-foreground'
            )}>
              {trend.positive ? '↑' : ''} {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
