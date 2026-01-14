import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number | null;
  className?: string;
  showLabel?: boolean;
}

export function ConfidenceBadge({ confidence, className, showLabel = true }: ConfidenceBadgeProps) {
  if (confidence === null) {
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        'bg-slate-100 text-slate-600 border-slate-200',
        className
      )}>
        N/A
      </span>
    );
  }

  const getConfidenceClass = () => {
    if (confidence >= 90) return 'confidence-high';
    if (confidence >= 85) return 'confidence-medium';
    return 'confidence-low';
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      getConfidenceClass(),
      className
    )}>
      {confidence}%{showLabel && ` ${confidence >= 90 ? 'High' : confidence >= 85 ? 'Medium' : 'Low'}`}
    </span>
  );
}

export function ConfidenceBar({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;

  const getColor = () => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 85) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-sm font-medium text-muted-foreground w-12">
        {confidence}%
      </span>
    </div>
  );
}
